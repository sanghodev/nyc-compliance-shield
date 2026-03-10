-- Migration: Add Company Name to Profiles
-- 1. Add company_name column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Update handle_new_user trigger function to sync company_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Insert into Profiles
  INSERT INTO public.profiles (id, email, role, full_name, company_name, status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'company_name',
    'Pending'
  );
  
  -- 2. If Tenant with Property ID (from access code), insert into Tenants table
  IF (new.raw_user_meta_data->>'role' = 'tenant' AND new.raw_user_meta_data->>'property_id' IS NOT NULL) THEN
      BEGIN
        INSERT INTO public.tenants (id, property_id, unit_number, status, created_at)
        VALUES (
            new.id, 
            (new.raw_user_meta_data->>'property_id')::bigint, 
            'N/A', -- Will need to be updated by tenant later
            'Pending',
            now()
        );
      EXCEPTION WHEN OTHERS THEN
        -- Ignore error if tenant insert fails, user still created
        null;
      END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create or Update update_company_profile RPC
CREATE OR REPLACE FUNCTION public.update_company_profile(
    target_id UUID,
    new_name TEXT,
    new_company_name TEXT,
    new_tier TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 1. Update profiles table
    UPDATE public.profiles
    SET 
        full_name = new_name,
        company_name = new_company_name,
        membership_tier = new_tier
    WHERE id = target_id;

    -- 2. Update auth.users metadata to keep session in sync
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    COALESCE(raw_user_meta_data, '{}'::jsonb),
                    '{full_name}',
                    to_jsonb(new_name)
                ),
                '{company_name}',
                to_jsonb(new_company_name)
            ),
            '{membership_tier}',
            to_jsonb(new_tier)
        )
    WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. One-time sync: Update existing profiles from auth metadata
UPDATE public.profiles p
SET company_name = u.raw_user_meta_data->>'company_name'
FROM auth.users u
WHERE p.id = u.id AND p.company_name IS NULL AND u.raw_user_meta_data->>'company_name' IS NOT NULL;
