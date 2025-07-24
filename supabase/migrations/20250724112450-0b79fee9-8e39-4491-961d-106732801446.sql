-- Enable RLS on critical tables that are missing it
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assumptions table
CREATE POLICY "Anyone can view assumptions" ON public.assumptions
FOR SELECT USING (true);

CREATE POLICY "System can manage assumptions" ON public.assumptions
FOR ALL USING (is_admin());

-- Create RLS policies for benchmarks table
CREATE POLICY "Anyone can view benchmarks" ON public.benchmarks
FOR SELECT USING (true);

CREATE POLICY "System can manage benchmarks" ON public.benchmarks
FOR ALL USING (is_admin());

-- Create RLS policies for coins table
CREATE POLICY "Anyone can view coins" ON public.coins
FOR SELECT USING (true);

CREATE POLICY "System can manage coins" ON public.coins
FOR ALL USING (is_admin());

-- Create RLS policies for market_sentiment table
CREATE POLICY "Anyone can view market sentiment" ON public.market_sentiment
FOR SELECT USING (true);

CREATE POLICY "System can manage market sentiment" ON public.market_sentiment
FOR ALL USING (is_admin());

-- Create RLS policies for portfolio_allocations table
CREATE POLICY "Users can view their own allocations" ON public.portfolio_allocations
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own allocations" ON public.portfolio_allocations
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own allocations" ON public.portfolio_allocations
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all allocations" ON public.portfolio_allocations
FOR ALL USING (is_admin());

-- Fix database function security by updating search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = user_uuid AND is_active = true
    );
$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_subscriptions
        WHERE user_id = user_uuid 
        AND status = 'active'
        AND expires_at > now()
    );
$function$;