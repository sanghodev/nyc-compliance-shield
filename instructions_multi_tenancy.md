# Multi-Tenancy Implementation Instructions

To ensure each manager has their own isolated database (properties, contractors, etc.), please follow these steps:

## 1. Apply Schema Changes
Run the SQL script `scripts/isolate_data.sql` in your Supabase SQL Editor.
This script will:
- Add `manager_id` column to `properties` and `contractors` tables.
- Enable RLS (Row Level Security).
- Add policies so managers only see their own data.

## 2. Updated Code
I have already updated `src/app/page.tsx` to automatically attach your User ID to any new Contractor you create. (Properties were already doing this).

## 3. Existing Data Note
- **Existing Properties/Contractors**: Will have `manager_id` as `NULL`. They will disappear from the dashboard for all managers (except potentially Admins if we added an Admin policy, currently strict for Managers).
- **To Assign Legacy Data**: If you want to claim existing properties for your account, run this SQL:
  ```sql
  UPDATE public.properties SET manager_id = 'YOUR_USER_ID' WHERE manager_id IS NULL;
  UPDATE public.contractors SET manager_id = 'YOUR_USER_ID' WHERE manager_id IS NULL;
  ```
  (You can find your User ID in the `auth.users` table or the Profile section).

## 4. Verify
1. Log in as the new manager (e.g., Jimmy).
2. The dashboard should be empty (0 Properties, 0 Contractors).
3. Add a new Property. It should appear.
4. Log out and log in as a different manager. They should NOT see Jimmy's property.
