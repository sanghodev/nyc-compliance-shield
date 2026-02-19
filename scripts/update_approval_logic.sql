-- 1. Create a better approve_user function that also Confirms Email
CREATE OR REPLACE FUNCTION public.approve_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update auth.users metadata (set status to Active, and confirm email)
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{status}', '"Active"')
  WHERE id = target_id;
  
  -- Update public.profiles table
  UPDATE public.profiles
  SET status = 'Active'
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify admin exists (just in case)
DO $$
BEGIN
  -- We don't need to do anything here, just ensuring the script runs without syntax error
  NULL;
END $$;
