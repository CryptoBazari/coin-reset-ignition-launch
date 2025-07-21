-- Convert basket column to text first
ALTER TABLE coins ALTER COLUMN basket TYPE TEXT;
ALTER TABLE assumptions ALTER COLUMN basket TYPE TEXT;

-- Drop the old enum
DROP TYPE basket_type;

-- Update the text values to standardized format
UPDATE coins SET basket = 'bitcoin' WHERE LOWER(basket) LIKE '%bitcoin%';
UPDATE coins SET basket = 'blue_chip' WHERE LOWER(basket) LIKE '%blue%chip%' OR LOWER(basket) = 'blue chip';
UPDATE coins SET basket = 'small_cap' WHERE basket IS NULL OR basket NOT IN ('bitcoin', 'blue_chip');

UPDATE assumptions SET basket = 'bitcoin' WHERE LOWER(basket) LIKE '%bitcoin%';
UPDATE assumptions SET basket = 'blue_chip' WHERE LOWER(basket) LIKE '%blue%chip%' OR LOWER(basket) = 'blue chip';
UPDATE assumptions SET basket = 'small_cap' WHERE basket IS NULL OR basket NOT IN ('bitcoin', 'blue_chip');

-- Create the new enum
CREATE TYPE basket_type AS ENUM ('bitcoin', 'blue_chip', 'small_cap');

-- Convert back to enum
ALTER TABLE coins ALTER COLUMN basket TYPE basket_type USING basket::basket_type;
ALTER TABLE assumptions ALTER COLUMN basket TYPE basket_type USING basket::basket_type;

-- Set defaults
ALTER TABLE coins ALTER COLUMN basket SET DEFAULT 'small_cap'::basket_type;