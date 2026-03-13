
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Admin can do everything
CREATE POLICY admin_all_profiles ON profiles FOR ALL TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can read their own profile
CREATE POLICY user_read_own_profile ON profiles FOR SELECT TO authenticated USING (
    auth.uid() = id
);

-- Users can update their own profile (limited fields should be handled by app logic or further column-level RLS)
CREATE POLICY user_update_own_profile ON profiles FOR UPDATE TO authenticated USING (
    auth.uid() = id
);

-- 2. PROPERTIES POLICIES
-- Admin can do everything
CREATE POLICY admin_all_properties ON properties FOR ALL TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Managers can read/update properties they manage
CREATE POLICY manager_all_own_properties ON properties FOR ALL TO authenticated USING (
    manager_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Tenants can read properties they are associated with
CREATE POLICY tenant_read_assigned_property ON properties FOR SELECT TO authenticated USING (
    id = (SELECT property_id FROM profiles WHERE id = auth.uid())
);

-- 3. REQUESTS POLICIES
-- Admin can do everything
CREATE POLICY admin_all_requests ON requests FOR ALL TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Tenants can read/create their own requests
CREATE POLICY tenant_all_own_requests ON requests FOR ALL TO authenticated USING (
    tenant_id = auth.uid()
);

-- Managers can read/update requests for their properties
CREATE POLICY manager_all_property_requests ON requests FOR ALL TO authenticated USING (
    property_id IN (SELECT id FROM properties WHERE manager_id = auth.uid())
);

-- 4. DOCUMENTS POLICIES
-- Admin can do everything
CREATE POLICY admin_all_documents ON documents FOR ALL TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Managers can read/write documents for their properties
CREATE POLICY manager_all_property_documents ON documents FOR ALL TO authenticated USING (
    property_id IN (SELECT id FROM properties WHERE manager_id = auth.uid())
);

-- Tenants can read documents for their property (if shared)
CREATE POLICY tenant_read_property_documents ON documents FOR SELECT TO authenticated USING (
    property_id = (SELECT property_id FROM profiles WHERE id = auth.uid())
);
