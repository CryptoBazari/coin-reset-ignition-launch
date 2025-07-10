-- Add missing get_user_subscription_details function (fixed)
CREATE OR REPLACE FUNCTION public.get_user_subscription_details(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;