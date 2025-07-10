-- Add function to manually activate user subscriptions by admin
CREATE OR REPLACE FUNCTION public.activate_user_subscription(
    target_user_id UUID,
    plan_id UUID,
    custom_duration_months INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;