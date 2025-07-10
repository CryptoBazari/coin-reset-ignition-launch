-- Create storage buckets for news, learning, and crypto images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('news-images', 'news-images', true),
  ('learning-images', 'learning-images', true),
  ('crypto-images', 'crypto-images', true);

-- Storage policies for news images
CREATE POLICY "Anyone can view news images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'news-images');

CREATE POLICY "Admins can upload news images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'news-images' AND public.is_admin());

CREATE POLICY "Admins can update news images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'news-images' AND public.is_admin());

CREATE POLICY "Admins can delete news images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'news-images' AND public.is_admin());

-- Storage policies for learning images
CREATE POLICY "Anyone can view learning images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'learning-images');

CREATE POLICY "Admins can upload learning images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'learning-images' AND public.is_admin());

CREATE POLICY "Admins can update learning images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'learning-images' AND public.is_admin());

CREATE POLICY "Admins can delete learning images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'learning-images' AND public.is_admin());

-- Storage policies for crypto images
CREATE POLICY "Anyone can view crypto images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'crypto-images');

CREATE POLICY "Admins can upload crypto images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'crypto-images' AND public.is_admin());

CREATE POLICY "Admins can update crypto images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'crypto-images' AND public.is_admin());

CREATE POLICY "Admins can delete crypto images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'crypto-images' AND public.is_admin());