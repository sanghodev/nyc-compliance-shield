-- Health Check & Cleanup: Identify and clean orphaned properties
-- Run this in Supabase SQL Editor

-- 1. Find properties whose manager no longer exists in auth.users
SELECT id, address, manager_id 
FROM public.properties 
WHERE manager_id NOT IN (SELECT id FROM auth.users)
   OR manager_id IS NULL;

-- 2. Find properties that might be causing duplicates but have no active manager
-- (Uncomment to actually delete them after verifying step 1)
/*
DELETE FROM public.properties 
WHERE manager_id NOT IN (SELECT id FROM auth.users)
   OR manager_id IS NULL;
*/

-- 3. Fix delete_user RPC to be more robust (add more logging/diagnostics if possible)
-- Actually, let's ensure the foreign key is properly set with CASCADE to avoid manual cleanup issues
-- ALTER TABLE public.properties 
-- DROP CONSTRAINT IF EXISTS properties_manager_id_fkey,
-- ADD CONSTRAINT properties_manager_id_fkey 
-- FOREIGN KEY (manager_id) REFERENCES auth.users(id) ON DELETE CASCADE;
