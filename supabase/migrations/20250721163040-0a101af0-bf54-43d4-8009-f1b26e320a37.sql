-- Fix basket_type enum to accept correct values
ALTER TYPE basket_type RENAME TO basket_type_old;

CREATE TYPE basket_type AS ENUM ('bitcoin', 'blue-chip', 'small-cap');

-- Update coins table to use new enum
ALTER TABLE coins ALTER COLUMN basket DROP DEFAULT;
ALTER TABLE coins ALTER COLUMN basket TYPE basket_type USING basket::text::basket_type;
ALTER TABLE coins ALTER COLUMN basket SET DEFAULT 'small-cap'::basket_type;

-- Update assumptions table
ALTER TABLE assumptions ALTER COLUMN basket DROP DEFAULT;
ALTER TABLE assumptions ALTER COLUMN basket TYPE basket_type USING basket::text::basket_type;

-- Drop old enum
DROP TYPE basket_type_old;

-- Update existing coins with proper basket values based on market cap
UPDATE coins SET basket = 'bitcoin' WHERE coin_id = 'bitcoin';
UPDATE coins SET basket = 'blue-chip' WHERE coin_id IN ('ethereum', 'bnb', 'solana', 'xrp', 'usdc', 'dogecoin', 'cardano', 'tron', 'avax', 'chainlink', 'sui', 'stellar', 'hedera', 'bch', 'ton', 'polkadot', 'usdt', 'hyperliquid');
UPDATE coins SET basket = 'small-cap' WHERE basket IS NULL OR coin_id NOT IN ('bitcoin', 'ethereum', 'bnb', 'solana', 'xrp', 'usdc', 'dogecoin', 'cardano', 'tron', 'avax', 'chainlink', 'sui', 'stellar', 'hedera', 'bch', 'ton', 'polkadot', 'usdt', 'hyperliquid');