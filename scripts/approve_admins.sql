-- Run this in your Supabase SQL Editor to approve your Super Admin account
-- It confirms the email and sets status to 'Active' for any user with role 'admin'

UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{status}', 
    '"Active"'
  )
WHERE raw_user_meta_data->>'role' = 'admin';
