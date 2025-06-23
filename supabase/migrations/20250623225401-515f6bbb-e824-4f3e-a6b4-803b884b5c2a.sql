
-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop all custom functions with CASCADE to handle any other dependencies
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_portfolio_metrics() CASCADE;

-- Drop all existing tables (in correct order to handle foreign key dependencies)
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.quiz_results CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.crypto_list CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop all custom types/enums
DROP TYPE IF EXISTS public.difficulty_level CASCADE;
DROP TYPE IF EXISTS public.news_type CASCADE;
DROP TYPE IF EXISTS public.subscription_status CASCADE;
DROP TYPE IF EXISTS public.subscription_type CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
