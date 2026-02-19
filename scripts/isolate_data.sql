-- Enable RLS and isolate data by Manager ID

-- 1. PROPERTIES
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Remove old loose policies
DROP POLICY IF EXISTS "Enable read access for all" ON public.properties;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.properties;

-- Create strict policies
CREATE POLICY "Manager view own properties" ON public.properties
FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Manager insert own properties" ON public.properties
FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Manager update own properties" ON public.properties
FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Manager delete own properties" ON public.properties
FOR DELETE USING (manager_id = auth.uid());


-- 2. CONTRACTORS
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contractors;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.contractors;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.contractors;

-- Create strict policies
CREATE POLICY "Manager view own contractors" ON public.contractors
FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Manager insert own contractors" ON public.contractors
FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Manager update own contractors" ON public.contractors
FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Manager delete own contractors" ON public.contractors
FOR DELETE USING (manager_id = auth.uid());


-- 3. REQUESTS (Complex: Tenant sees own, Manager sees property's requests)
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Enable read access for all" ON public.requests;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.requests;
DROP POLICY IF EXISTS "Enable update for all" ON public.requests;

-- Policy: Tenants view own
CREATE POLICY "Users view own requests" ON public.requests
FOR SELECT USING (tenant_id = auth.uid());

-- Policy: Managers view requests for their properties
CREATE POLICY "Managers view property requests" ON public.requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = public.requests.property_id
    AND p.manager_id = auth.uid()
  )
);

-- Policy: Tenants Insert
CREATE POLICY "Tenants create requests" ON public.requests
FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Policy: Managers Update (e.g. status)
CREATE POLICY "Managers update requests" ON public.requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = public.requests.property_id
    AND p.manager_id = auth.uid()
  )
);

-- 4. PROFILES (Keep as is, user fetches own profile)
-- Profiles usually strictly 1:1 with auth.uid(), already enforced in setup_schema.ts
