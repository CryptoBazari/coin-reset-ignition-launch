
-- Add Glass Node support fields to coins table
ALTER TABLE public.coins 
ADD COLUMN glass_node_supported BOOLEAN DEFAULT FALSE,
ADD COLUMN glass_node_asset_name TEXT,
ADD COLUMN premium_metrics_available BOOLEAN DEFAULT FALSE,
ADD COLUMN last_glass_node_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN glass_node_data_quality INTEGER DEFAULT 0;

-- Update existing coins with Glass Node support info
UPDATE public.coins 
SET glass_node_supported = TRUE,
    glass_node_asset_name = CASE 
        WHEN coin_id = 'bitcoin' THEN 'BTC'
        WHEN coin_id = 'ethereum' THEN 'ETH'  
        WHEN coin_id = 'solana' THEN 'SOL'
        WHEN coin_id = 'cardano' THEN 'ADA'
        WHEN coin_id = 'chainlink' THEN 'LINK'
        ELSE NULL
    END,
    premium_metrics_available = TRUE
WHERE coin_id IN ('bitcoin', 'ethereum', 'solana', 'cardano', 'chainlink');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_coins_glass_node_supported 
ON public.coins(glass_node_supported, premium_metrics_available);
