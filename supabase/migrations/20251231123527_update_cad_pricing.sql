-- Update CAD pricing for session types and packages
-- Based on new pricing structure provided

-- First, modify session_packages to support session-type-specific packages
-- Remove the unique constraint on session_count to allow multiple packages
ALTER TABLE public.session_packages DROP CONSTRAINT IF EXISTS session_packages_session_count_key;

-- Add columns to link packages to session types (optional, for filtering)
-- We'll use the name to identify the package type for now
ALTER TABLE public.session_packages 
ADD COLUMN IF NOT EXISTS session_type_id UUID REFERENCES public.session_types(id),
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_type TEXT CHECK (session_type IN ('standing', 'laying'));

-- Update session_types CAD prices
-- 1:1 Classes
UPDATE public.session_types 
SET price_cad = 55.00, price_usd = 40.15
WHERE duration_minutes = 20 AND session_type = 'standing' AND is_group = false;

UPDATE public.session_types 
SET price_cad = 100.00, price_usd = 73.00
WHERE duration_minutes = 45 AND session_type = 'standing' AND is_group = false;

UPDATE public.session_types 
SET price_cad = 130.00, price_usd = 94.90
WHERE duration_minutes = 60 AND session_type = 'standing' AND is_group = false;

-- Group Classes
UPDATE public.session_types 
SET price_cad = 48.00, price_usd = 35.04
WHERE duration_minutes = 20 AND session_type = 'standing' AND is_group = true;

UPDATE public.session_types 
SET price_cad = 90.00, price_usd = 65.70
WHERE duration_minutes = 45 AND session_type = 'standing' AND is_group = true;

UPDATE public.session_types 
SET price_cad = 120.00, price_usd = 87.60
WHERE duration_minutes = 60 AND session_type = 'standing' AND is_group = true;

-- Laying classes (1:1 and Group) - same as standing for now
UPDATE public.session_types 
SET price_cad = 100.00, price_usd = 73.00
WHERE duration_minutes = 45 AND session_type = 'laying' AND is_group = false;

UPDATE public.session_types 
SET price_cad = 90.00, price_usd = 65.70
WHERE duration_minutes = 45 AND session_type = 'laying' AND is_group = true;

-- Note: Packages are currently generic. The pricing structure shows packages tied to specific session types:
-- 1:1 45min Standard: 5=$470, 10=$910
-- 1:1 60min Expert: 5=$590, 10=$1,150
-- Group 45min Standard: 5=$420, 10=$810
-- Group 60min Expert: 5=$550, 10=$1,080
-- 1:1 Laying 45min Standard: 5=$470, 10=$910
-- Group Laying 45min Standard: 5=$420, 10=$810
--
-- For now, we'll update the generic packages to match the most common (45min Standard 1:1)
-- A future migration can add session-type-specific packages if needed

-- Get session type IDs for linking packages
DO $$
DECLARE
  v_45min_standard_1to1_id UUID;
  v_60min_expert_1to1_id UUID;
  v_45min_standard_group_id UUID;
  v_60min_expert_group_id UUID;
  v_45min_standard_1to1_laying_id UUID;
  v_45min_standard_group_laying_id UUID;
BEGIN
  -- Get session type IDs
  SELECT id INTO v_45min_standard_1to1_id FROM public.session_types 
    WHERE duration_minutes = 45 AND session_type = 'standing' AND is_group = false LIMIT 1;
  
  SELECT id INTO v_60min_expert_1to1_id FROM public.session_types 
    WHERE duration_minutes = 60 AND session_type = 'standing' AND is_group = false LIMIT 1;
  
  SELECT id INTO v_45min_standard_group_id FROM public.session_types 
    WHERE duration_minutes = 45 AND session_type = 'standing' AND is_group = true LIMIT 1;
  
  SELECT id INTO v_60min_expert_group_id FROM public.session_types 
    WHERE duration_minutes = 60 AND session_type = 'standing' AND is_group = true LIMIT 1;
  
  SELECT id INTO v_45min_standard_1to1_laying_id FROM public.session_types 
    WHERE duration_minutes = 45 AND session_type = 'laying' AND is_group = false LIMIT 1;
  
  SELECT id INTO v_45min_standard_group_laying_id FROM public.session_types 
    WHERE duration_minutes = 45 AND session_type = 'laying' AND is_group = true LIMIT 1;

  -- Update existing generic packages to 45min Standard 1:1 pricing
  UPDATE public.session_packages 
  SET price_cad = 470.00, price_usd = 343.10, 
      name = '5 Session Package - 45min Standard 1:1',
      session_type_id = v_45min_standard_1to1_id,
      is_group = false,
      session_type = 'standing'
  WHERE session_count = 5 AND name = '5 Session Package';

  UPDATE public.session_packages 
  SET price_cad = 910.00, price_usd = 664.30,
      name = '10 Session Package - 45min Standard 1:1',
      session_type_id = v_45min_standard_1to1_id,
      is_group = false,
      session_type = 'standing'
  WHERE session_count = 10 AND name = '10 Session Package';

  -- Add new package entries for different session types
  -- 1:1 60min Expert packages
  INSERT INTO public.session_packages (name, session_count, price_cad, price_usd, session_type_id, is_group, session_type) VALUES
    ('5 Session Package - 60min Expert 1:1', 5, 590.00, 430.70, v_60min_expert_1to1_id, false, 'standing'),
    ('10 Session Package - 60min Expert 1:1', 10, 1150.00, 839.50, v_60min_expert_1to1_id, false, 'standing')
  ON CONFLICT DO NOTHING;

  -- Group 45min Standard packages
  INSERT INTO public.session_packages (name, session_count, price_cad, price_usd, session_type_id, is_group, session_type) VALUES
    ('5 Session Package - 45min Standard Group', 5, 420.00, 306.60, v_45min_standard_group_id, true, 'standing'),
    ('10 Session Package - 45min Standard Group', 10, 810.00, 591.30, v_45min_standard_group_id, true, 'standing')
  ON CONFLICT DO NOTHING;

  -- Group 60min Expert packages
  INSERT INTO public.session_packages (name, session_count, price_cad, price_usd, session_type_id, is_group, session_type) VALUES
    ('5 Session Package - 60min Expert Group', 5, 550.00, 401.50, v_60min_expert_group_id, true, 'standing'),
    ('10 Session Package - 60min Expert Group', 10, 1080.00, 788.40, v_60min_expert_group_id, true, 'standing')
  ON CONFLICT DO NOTHING;

  -- 1:1 Laying 45min Standard packages
  INSERT INTO public.session_packages (name, session_count, price_cad, price_usd, session_type_id, is_group, session_type) VALUES
    ('5 Session Package - 45min Standard 1:1 Laying', 5, 470.00, 343.10, v_45min_standard_1to1_laying_id, false, 'laying'),
    ('10 Session Package - 45min Standard 1:1 Laying', 10, 910.00, 664.30, v_45min_standard_1to1_laying_id, false, 'laying')
  ON CONFLICT DO NOTHING;

  -- Group Laying 45min Standard packages
  INSERT INTO public.session_packages (name, session_count, price_cad, price_usd, session_type_id, is_group, session_type) VALUES
    ('5 Session Package - 45min Standard Group Laying', 5, 420.00, 306.60, v_45min_standard_group_laying_id, true, 'laying'),
    ('10 Session Package - 45min Standard Group Laying', 10, 810.00, 591.30, v_45min_standard_group_laying_id, true, 'laying')
  ON CONFLICT DO NOTHING;
END $$;

