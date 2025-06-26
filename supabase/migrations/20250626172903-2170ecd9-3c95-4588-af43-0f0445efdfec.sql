
-- Add RLS policies for virtual_coins table to allow users to create and read coins
CREATE POLICY "Anyone can view virtual coins" 
  ON public.virtual_coins 
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "Anyone can create virtual coins" 
  ON public.virtual_coins 
  FOR INSERT 
  TO public
  WITH CHECK (true);
