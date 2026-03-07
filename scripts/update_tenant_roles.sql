-- 1. Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS property_id BIGINT REFERENCES public.properties(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit TEXT;

-- 2. Update trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm emails for admin and tenant
  IF new.raw_user_meta_data->>'role' IN ('admin', 'tenant') THEN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{status}',
          '"Active"'
        )
    WHERE id = new.id;
  
  -- Enforce manager status as Pending
  ELSIF new.raw_user_meta_data->>'role' = 'manager' THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb), 
          '{status}', 
          '"Pending"'
        )
    WHERE id = new.id;
  END IF;
  
  -- Insert into profiles table immediately
  INSERT INTO public.profiles (
    id, email, role, status, full_name, created_at, membership_tier, property_id, unit
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'role',
    COALESCE(new.raw_user_meta_data->>'status', 'Pending'),
    new.raw_user_meta_data->>'full_name',
    now(),
    new.raw_user_meta_data->>'membership_tier',
    (new.raw_user_meta_data->>'property_id')::BIGINT,
    new.raw_user_meta_data->>'unit'
  )
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status,
      property_id = EXCLUDED.property_id,
      unit = EXCLUDED.unit;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
