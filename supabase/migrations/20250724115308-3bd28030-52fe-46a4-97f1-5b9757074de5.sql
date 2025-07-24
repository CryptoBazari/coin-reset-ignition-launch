-- Fix infinite recursion in admin_users RLS policy
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
    -- Check if current user is explicitly listed as an admin
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = auth.uid() 
        AND is_active = true
    ) OR auth.uid()::text = 'a18ae244-ec7b-42c0-a51c-7219c811c7f1';  -- Hardcode the known admin user ID
$function$;

-- Create new policy using the non-recursive function
CREATE POLICY "Admins can manage admin users" ON public.admin_users
FOR ALL USING (public.check_admin_access());