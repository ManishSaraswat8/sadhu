-- Add additional fields to profiles table for sign-up
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update sync_user_profile function to include new fields
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, date_of_birth, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL),
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data->>'address', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    email = NEW.email,
    phone_number = COALESCE(NEW.raw_user_meta_data->>'phone_number', profiles.phone_number),
    date_of_birth = CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE 
      ELSE profiles.date_of_birth 
    END,
    address = COALESCE(NEW.raw_user_meta_data->>'address', profiles.address),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
