-- Fix all remaining database functions to have proper search_path
CREATE OR REPLACE FUNCTION public.extend_user_subscription(target_user_id uuid, additional_days integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    current_subscription user_subscriptions%ROWTYPE;
    new_expires_at TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Only admins can extend subscriptions
    IF NOT public.is_admin() THEN
        RETURN JSON_BUILD_OBJECT('success', FALSE, 'error', 'Access denied: Admin required');
    END IF;

    -- Get current active subscription
    SELECT * INTO current_subscription
    FROM user_subscriptions
    WHERE user_id = target_user_id
    AND status = 'active'
    ORDER BY expires_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('success', FALSE, 'error', 'No active subscription found for user');
    END IF;

    -- Calculate new expiration date
    new_expires_at := COALESCE(current_subscription.expires_at, NOW()) + (additional_days || ' days')::INTERVAL;

    -- Update subscription
    UPDATE user_subscriptions
    SET expires_at = new_expires_at,
        updated_at = NOW()
    WHERE id = current_subscription.id;

    result := JSON_BUILD_OBJECT(
        'success', TRUE,
        'subscription_id', current_subscription.id,
        'new_expires_at', new_expires_at,
        'additional_days', additional_days
    );

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_user_subscription(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    current_subscription user_subscriptions%ROWTYPE;
    result JSON;
BEGIN
    -- Only admins can cancel subscriptions
    IF NOT public.is_admin() THEN
        RETURN JSON_BUILD_OBJECT('success', FALSE, 'error', 'Access denied: Admin required');
    END IF;

    -- Get current active subscription
    SELECT * INTO current_subscription
    FROM user_subscriptions
    WHERE user_id = target_user_id
    AND status = 'active'
    ORDER BY expires_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('success', FALSE, 'error', 'No active subscription found for user');
    END IF;

    -- Cancel subscription
    UPDATE user_subscriptions
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = current_subscription.id;

    result := JSON_BUILD_OBJECT(
        'success', TRUE,
        'subscription_id', current_subscription.id,
        'cancelled_at', NOW()
    );

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_subscription_time_remaining(target_user_id uuid DEFAULT auth.uid())
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT CASE
        WHEN us.expires_at IS NULL THEN
            JSON_BUILD_OBJECT('has_subscription', FALSE, 'time_remaining', NULL)
        WHEN us.expires_at > NOW() THEN
            JSON_BUILD_OBJECT(
                'has_subscription', TRUE,
                'expires_at', us.expires_at,
                'days_remaining', EXTRACT(DAYS FROM (us.expires_at - NOW())),
                'hours_remaining', EXTRACT(HOURS FROM (us.expires_at - NOW())),
                'status', us.status,
                'plan_name', sp.name
            )
        ELSE
            JSON_BUILD_OBJECT('has_subscription', FALSE, 'expired', TRUE, 'expired_at', us.expires_at)
    END as result
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = target_user_id
    AND us.status = 'active'
    ORDER BY us.expires_at DESC
    LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_payments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark payments as expired if they're older than 24 hours and still pending
    UPDATE crypto_payments
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    RETURN JSON_BUILD_OBJECT(
        'success', TRUE,
        'expired_payments', expired_count,
        'cleaned_at', NOW()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_subscriptions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark subscriptions as expired if they've passed their expiration date
    UPDATE user_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
    AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    RETURN JSON_BUILD_OBJECT(
        'success', TRUE,
        'expired_subscriptions', expired_count,
        'cleaned_at', NOW()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_subscription_details(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    result JSON;
BEGIN
    -- Only admins can view user details
    IF NOT public.is_admin() THEN
        RETURN JSON_BUILD_OBJECT('error', 'Access denied: Admin required');
    END IF;

    SELECT JSON_BUILD_OBJECT(
        'user_id', target_user_id,
        'subscriptions', (
            SELECT COALESCE(JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', us.id,
                    'status', us.status,
                    'starts_at', us.starts_at,
                    'expires_at', us.expires_at,
                    'created_at', us.created_at,
                    'plan', JSON_BUILD_OBJECT(
                        'name', sp.name,
                        'duration_months', sp.duration_months,
                        'price_usdt', sp.price_usdt,
                        'price_btc', sp.price_btc
                    )
                )
            ), '[]'::JSON)
            FROM user_subscriptions us
            LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = target_user_id
            ORDER BY us.created_at DESC
        ),
        'payments', (
            SELECT COALESCE(JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', cp.id,
                    'amount', cp.amount,
                    'status', cp.status,
                    'created_at', cp.created_at,
                    'verified_at', cp.verified_at,
                    'transaction_hash', cp.transaction_hash
                )
            ), '[]'::JSON)
            FROM crypto_payments cp
            WHERE cp.user_id = target_user_id
            ORDER BY cp.created_at DESC
        )
    ) INTO result;

    RETURN JSON_BUILD_OBJECT('result', result);
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_user_subscription(target_user_id uuid, plan_id uuid, custom_duration_months integer DEFAULT NULL::integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    selected_plan subscription_plans%ROWTYPE;
    duration_months INTEGER;
    new_starts_at TIMESTAMP WITH TIME ZONE;
    new_expires_at TIMESTAMP WITH TIME ZONE;
    subscription_id UUID;
    result JSON;
BEGIN
    -- Only admins can activate subscriptions
    IF NOT public.is_admin() THEN
        RETURN JSON_BUILD_OBJECT('success', FALSE, 'error', 'Access denied: Admin required');
    END IF;

    -- Get the selected plan
    SELECT * INTO selected_plan
    FROM subscription_plans
    WHERE id = plan_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('success', FALSE, 'error', 'Invalid or inactive subscription plan');
    END IF;

    -- Use custom duration if provided, otherwise use plan duration
    duration_months := COALESCE(custom_duration_months, selected_plan.duration_months);

    -- Set subscription dates
    new_starts_at := NOW();
    new_expires_at := new_starts_at + (duration_months || ' months')::INTERVAL;

    -- Cancel any existing active subscriptions for this user
    UPDATE user_subscriptions
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE user_id = target_user_id 
    AND status = 'active';

    -- Create new active subscription
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        starts_at,
        expires_at
    ) VALUES (
        target_user_id,
        plan_id,
        'active',
        new_starts_at,
        new_expires_at
    ) RETURNING id INTO subscription_id;

    result := JSON_BUILD_OBJECT(
        'success', TRUE,
        'subscription_id', subscription_id,
        'plan_name', selected_plan.name,
        'duration_months', duration_months,
        'starts_at', new_starts_at,
        'expires_at', new_expires_at
    );

    RETURN result;
END;
$function$;