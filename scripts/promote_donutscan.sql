-- Run this in Supabase SQL Editor to promote your user to Super Admin

-- 1. Update the role in auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
)
WHERE email = 'donutscan@gmail.com';

-- 2. Update the role in profiles table (if you have one)
UPDATE public.profiles
SET role = 'admin', status = 'Active'
WHERE email = 'donutscan@gmail.com';

-- 3. Confirm email just in case
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'donutscan@gmail.com';
