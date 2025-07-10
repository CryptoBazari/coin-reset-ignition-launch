-- Add subscription management functions and enhancements

-- Function to extend user subscription
CREATE OR REPLACE FUNCTION public.extend_user_subscription(target_user_id UUID, additional_days INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to cancel user subscription
CREATE OR REPLACE FUNCTION public.cancel_user_subscription(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to get subscription time remaining
CREATE OR REPLACE FUNCTION public.get_subscription_time_remaining(target_user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
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
$$;

-- Function to cleanup expired payments (24 hour timeout)
CREATE OR REPLACE FUNCTION public.cleanup_expired_payments()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to cleanup expired subscriptions
CREATE OR REPLACE FUNCTION public.cleanup_expired_subscriptions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to get detailed user subscription info for admin
CREATE OR REPLACE FUNCTION public.get_user_subscription_details(target_user_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT JSON_BUILD_OBJECT(
        'user_id', target_user_id,
        'subscriptions', (
            SELECT JSON_AGG(
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
            )
            FROM user_subscriptions us
            LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = target_user_id
            ORDER BY us.created_at DESC
        ),
        'payments', (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', cp.id,
                    'amount', cp.amount,
                    'status', cp.status,
                    'created_at', cp.created_at,
                    'verified_at', cp.verified_at,
                    'transaction_hash', cp.transaction_hash
                )
            )
            FROM crypto_payments cp
            WHERE cp.user_id = target_user_id
            ORDER BY cp.created_at DESC
        )
    ) as result
    WHERE public.is_admin();
$$;

-- Add payment timeout tracking
ALTER TABLE crypto_payments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- Update existing payments to have expiration dates
UPDATE crypto_payments 
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;