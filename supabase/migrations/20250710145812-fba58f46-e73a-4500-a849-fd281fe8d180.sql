-- Drop existing policies if they exist and recreate admin policies for learning_courses
DROP POLICY IF EXISTS "Admins can create learning courses" ON public.learning_courses;
DROP POLICY IF EXISTS "Admins can update learning courses" ON public.learning_courses;
DROP POLICY IF EXISTS "Admins can delete learning courses" ON public.learning_courses;
DROP POLICY IF EXISTS "Admins can view all learning courses" ON public.learning_courses;

-- Create admin policies for learning_courses
CREATE POLICY "Admins can create learning courses" 
ON public.learning_courses 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update learning courses" 
ON public.learning_courses 
FOR UPDATE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete learning courses" 
ON public.learning_courses 
FOR DELETE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all learning courses" 
ON public.learning_courses 
FOR SELECT 
TO authenticated
USING (is_admin());