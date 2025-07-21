-- First standardize existing data
UPDATE coins SET basket = 'bitcoin' WHERE LOWER(basket::text) = 'bitcoin';
UPDATE coins SET basket = 'blue_chip' WHERE LOWER(basket::text) = 'blue chip';
UPDATE coins SET basket = 'small_cap' WHERE basket IS NULL OR basket::text NOT IN ('bitcoin', 'blue_chip');

-- Create new enum with standardized values
ALTER TYPE basket_type RENAME TO basket_type_old;
CREATE TYPE basket_type AS ENUM ('bitcoin', 'blue_chip', 'small_cap');

-- Update tables to use new enum
ALTER TABLE coins ALTER COLUMN basket TYPE basket_type USING 
  CASE 
    WHEN LOWER(basket::text) = 'bitcoin' THEN 'bitcoin'::basket_type
    WHEN LOWER(basket::text) LIKE '%blue%' THEN 'blue_chip'::basket_type
    ELSE 'small_cap'::basket_type
  END;

ALTER TABLE assumptions ALTER COLUMN basket TYPE basket_type USING 
  CASE 
    WHEN LOWER(basket::text) = 'bitcoin' THEN 'bitcoin'::basket_type
    WHEN LOWER(basket::text) LIKE '%blue%' THEN 'blue_chip'::basket_type
    ELSE 'small_cap'::basket_type
  END;

-- Set defaults
ALTER TABLE coins ALTER COLUMN basket SET DEFAULT 'small_cap'::basket_type;

-- Clean up
DROP TYPE basket_type_old;