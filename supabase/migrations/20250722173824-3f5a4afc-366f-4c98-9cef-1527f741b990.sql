-- Create glassnode_cache table for caching API responses
CREATE TABLE public.glassnode_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.glassnode_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for caching system
CREATE POLICY "System can manage cache" 
ON public.glassnode_cache 
FOR ALL 
USING (true);

-- Create unique index on cache_key
CREATE UNIQUE INDEX idx_glassnode_cache_key ON public.glassnode_cache(cache_key);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_glassnode_cache_updated_at
BEFORE UPDATE ON public.glassnode_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();