-- Add RLS policies for crypto_listings to allow admin access
CREATE POLICY "Admins can create crypto listings" 
ON public.crypto_listings 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update crypto listings" 
ON public.crypto_listings 
FOR UPDATE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete crypto listings" 
ON public.crypto_listings 
FOR DELETE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all crypto listings" 
ON public.crypto_listings 
FOR SELECT 
TO authenticated
USING (is_admin());