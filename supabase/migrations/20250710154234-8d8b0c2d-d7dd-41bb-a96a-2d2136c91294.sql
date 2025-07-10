-- Add missing get_user_subscription_details function
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