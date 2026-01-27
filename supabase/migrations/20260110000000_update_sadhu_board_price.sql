-- Update Sadhu Board price to $229 CAD as per client requirements
-- This ensures the price is correct even if the seed was run with different values

UPDATE public.products 
SET price_cad = 229.00, 
    price_usd = 167.17 -- Approximate USD equivalent at 0.73 rate
WHERE slug = 'sadhu-board' AND is_active = true;

-- Verify the update
DO $$
DECLARE
  updated_price NUMERIC;
BEGIN
  SELECT price_cad INTO updated_price 
  FROM public.products 
  WHERE slug = 'sadhu-board' AND is_active = true;
  
  IF updated_price IS NULL THEN
    RAISE EXCEPTION 'Sadhu Board product not found';
  END IF;
  
  IF updated_price != 229.00 THEN
    RAISE EXCEPTION 'Price update failed. Expected 229.00, got %', updated_price;
  END IF;
  
  RAISE NOTICE 'Sadhu Board price successfully updated to $229 CAD';
END $$;
