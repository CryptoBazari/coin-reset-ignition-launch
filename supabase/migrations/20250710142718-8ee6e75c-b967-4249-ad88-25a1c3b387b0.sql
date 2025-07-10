-- Add RLS policies for admin users to manage news articles

-- Allow admins to create news articles
CREATE POLICY "Admins can create news articles" 
ON public.news 
FOR INSERT 
WITH CHECK (public.is_admin());

-- Allow admins to update news articles
CREATE POLICY "Admins can update news articles" 
ON public.news 
FOR UPDATE 
USING (public.is_admin());

-- Allow admins to delete news articles
CREATE POLICY "Admins can delete news articles" 
ON public.news 
FOR DELETE 
USING (public.is_admin());

-- Allow admins to view all news articles (published and unpublished)
CREATE POLICY "Admins can view all news articles" 
ON public.news 
FOR SELECT 
USING (public.is_admin());