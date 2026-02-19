-- Fix jimmy.yang3324@gmail.com manager access
-- This ensures the user is Active and confirmed.

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'jimmy.yang3324@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Approve auth user
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{status}', '"Active"')
    WHERE id = target_user_id;

    -- Approve profile
    UPDATE public.profiles
    SET status = 'Active', role = 'manager'
    WHERE id = target_user_id;
    
    RAISE NOTICE 'User approved: %', target_user_id;
  ELSE
    RAISE NOTICE 'User not found - please create account first via Admin Panel';
  END IF;
END $$;
