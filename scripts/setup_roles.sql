-- SQL to Automate User Approvals based on Role & Helper Functions

-- 1. Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is 'admin' or 'tenant', auto-confirm email and set status to Active
  IF new.raw_user_meta_data->>'role' IN ('admin', 'tenant') THEN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{status}',
          '"Active"'
        )
    WHERE id = new.id;
  
  -- If role is 'manager', ensure status is Pending (managed by App logic already but enforcing here)
  ELSIF new.raw_user_meta_data->>'role' = 'manager' THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb), 
          '{status}', 
          '"Pending"'
        )
    WHERE id = new.id;
  END IF;
  
  -- Insert into profiles table immediately if not handled by Supabase auto-auth
  INSERT INTO public.profiles (id, email, role, status, full_name, created_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'role',
    COALESCE(new.raw_user_meta_data->>'status', 'Pending'),
    new.raw_user_meta_data->>'full_name',
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status; -- Sync status

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Define RPC function for Admin Dashboard to Approve Users
CREATE OR REPLACE FUNCTION public.approve_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{status}', '"Active"')
  WHERE id = target_id;
  
  -- Update profiles table
  UPDATE public.profiles
  SET status = 'Active'
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Define RPC function to Delete Users
CREATE OR REPLACE FUNCTION public.delete_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = target_id; -- Delete profile first
  DELETE FROM auth.users WHERE id = target_id;      -- Delete auth user
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Retroactively approve existing admins
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{status}', '"Active"')
WHERE raw_user_meta_data->>'role' = 'admin';
