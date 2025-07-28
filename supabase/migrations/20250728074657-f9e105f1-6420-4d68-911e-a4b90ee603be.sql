-- Fix security issue: Add search_path to function
CREATE OR REPLACE FUNCTION clean_expired_npv_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM npv_cache WHERE expires_at < now();
END;
$$;