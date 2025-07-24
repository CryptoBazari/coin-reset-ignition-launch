-- Clear existing Glassnode data to make room for daily data
-- This will allow us to populate with daily data instead of monthly data

-- Clear existing Glassnode price history data (keeping CoinMarketCap data)
DELETE FROM price_history_36m WHERE data_source = 'glassnode';

-- Clear existing Glassnode cointime metrics to refresh with daily-based calculations  
DELETE FROM cointime_metrics WHERE data_source = 'glassnode';

-- Add index for better performance with daily data queries
CREATE INDEX IF NOT EXISTS idx_price_history_data_source_date 
ON price_history_36m(data_source, coin_id, price_date DESC);

-- Add index for CAGR calculations on Glassnode data
CREATE INDEX IF NOT EXISTS idx_price_history_glassnode_coin_date 
ON price_history_36m(coin_id, price_date) 
WHERE data_source = 'glassnode';