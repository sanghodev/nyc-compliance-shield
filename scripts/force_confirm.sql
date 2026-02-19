-- Generic Script to Force Confirm User & Reset Password
-- Usage: Replace 'target@email.com' with the user's email

-- 1. Ensure pgcrypto extension is active for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update the user
DO $$
DECLARE
  target_email TEXT := 'jimmy.yang3324@gmail.com'; -- Change this email!
  new_password TEXT := 'ChangeMe123!';
BEGIN
  -- Update auth user status & confirm email & set password
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    encrypted_password = crypt(new_password, gen_salt('bf')),
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{status}', 
      '"Active"'
    )
  WHERE email = target_email;

  -- Update profiles status
  UPDATE public.profiles
  SET 
    status = 'Active'
  WHERE email = target_email;
  
  RAISE NOTICE 'User % confirmed and password reset to %', target_email, new_password;
END $$;
