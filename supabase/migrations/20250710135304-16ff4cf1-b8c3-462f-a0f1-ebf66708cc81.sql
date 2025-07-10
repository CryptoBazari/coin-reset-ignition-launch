-- Clear all user data to allow fresh signup
-- Delete user-related data first to avoid foreign key issues
DELETE FROM public.admin_users;
DELETE FROM public.user_subscriptions;
DELETE FROM public.virtual_transactions;
DELETE FROM public.virtual_assets;
DELETE FROM public.virtual_portfolios;
DELETE FROM public.user_portfolios;
DELETE FROM public.crypto_payments;
DELETE FROM public.investment_analyses;

-- Clear auth users (this will cascade to any remaining references)
DELETE FROM auth.users;