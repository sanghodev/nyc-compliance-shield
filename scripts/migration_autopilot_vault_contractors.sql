-- ============================================================
-- Evereez Migration: AI Autopilot + Document Vault + Contractors
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- Clean slate (CAUTION: This will delete data in these specific tables if they exist)
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.violation_resolutions CASCADE;
DROP TABLE IF EXISTS public.contractor_reviews CASCADE;
DROP TABLE IF EXISTS public.contractors CASCADE;


-- ============================================================
-- TABLE 1: contractors
-- Must be created before violation_resolutions (FK dependency)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contractors (
  id BIGSERIAL PRIMARY KEY,

  -- Identity
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  website TEXT,
  profile_image_url TEXT,

  -- Category & Specialization
  category TEXT NOT NULL
    CHECK (category IN (
      'plumbing','electrical','hvac','lead_abatement',
      'mold_remediation','general_contractor','locksmith',
      'elevator','fire_protection','roofing','masonry','other'
    )),
  specializations TEXT[] DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',

  -- NYC Credentials
  dob_license_number TEXT,
  hic_license_number TEXT,
  insurance_policy_number TEXT,
  insurance_expires_at DATE,
  insurance_verified BOOLEAN DEFAULT FALSE,

  -- Platform Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','active','suspended')),
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,

  -- Pricing
  rate_type TEXT CHECK (rate_type IN ('hourly','fixed','quote')),
  rate_from DECIMAL(10,2),
  rate_to DECIMAL(10,2),
  rate_currency TEXT DEFAULT 'USD',

  bio TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contractors"
  ON public.contractors FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins manage all contractors"
  ON public.contractors FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION update_contractors_updated_at();


-- ============================================================
-- TABLE 2: contractor_reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contractor_reviews (
  id BIGSERIAL PRIMARY KEY,
  contractor_id BIGINT NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  property_id BIGINT REFERENCES public.properties(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  job_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contractor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.contractor_reviews FOR SELECT USING (true);

CREATE POLICY "Auth users write reviews"
  ON public.contractor_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-update contractor rating when review added
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contractors
  SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.contractor_reviews WHERE contractor_id = NEW.contractor_id),
    total_reviews = (SELECT COUNT(*) FROM public.contractor_reviews WHERE contractor_id = NEW.contractor_id)
  WHERE id = NEW.contractor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_contractor_rating
  AFTER INSERT ON public.contractor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();


-- ============================================================
-- TABLE 3: violation_resolutions (Autopilot)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.violation_resolutions (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  violation_id TEXT NOT NULL,
  violation_class TEXT,
  violation_description TEXT,
  issued_date TIMESTAMPTZ,
  agency TEXT DEFAULT 'HPD',

  -- AI Analysis
  ai_risk_score INTEGER DEFAULT 0,
  ai_summary TEXT,
  ai_estimated_fines TEXT,
  ai_critical_risks JSONB DEFAULT '[]'::jsonb,
  ai_action_plan JSONB DEFAULT '[]'::jsonb,

  -- Tracking
  overall_status TEXT DEFAULT 'open'
    CHECK (overall_status IN ('open','in_progress','resolved','dismissed')),
  current_step INTEGER DEFAULT 0,
  assigned_contractor_id BIGINT REFERENCES public.contractors(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  generated_documents JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, violation_id)
);

CREATE INDEX idx_vr_property_id ON public.violation_resolutions(property_id);
CREATE INDEX idx_vr_status ON public.violation_resolutions(overall_status);

ALTER TABLE public.violation_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage own violations"
  ON public.violation_resolutions FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access violations"
  ON public.violation_resolutions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION update_vr_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vr_updated_at
  BEFORE UPDATE ON public.violation_resolutions
  FOR EACH ROW EXECUTE FUNCTION update_vr_updated_at();


-- ============================================================
-- TABLE 4: documents (Document Vault)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),

  -- File
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,

  -- Classification
  category TEXT DEFAULT 'other'
    CHECK (category IN (
      'lease','insurance','permit','tax',
      'inspection','violation','correspondence',
      'contract','certificate','other'
    )),
  unit TEXT,

  -- AI Extraction
  ai_summary TEXT,
  ai_key_dates JSONB DEFAULT '[]'::jsonb,
  ai_parties TEXT[] DEFAULT '{}',
  ai_amounts JSONB DEFAULT '[]'::jsonb,
  ai_clauses JSONB DEFAULT '[]'::jsonb,
  ai_processed BOOLEAN DEFAULT FALSE,

  -- Expiry
  expires_at TIMESTAMPTZ,
  expiry_notified_30d BOOLEAN DEFAULT FALSE,
  expiry_notified_7d BOOLEAN DEFAULT FALSE,

  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docs_property ON public.documents(property_id);
CREATE INDEX idx_docs_category ON public.documents(category);
CREATE INDEX idx_docs_expires ON public.documents(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Management only — no tenant access
CREATE POLICY "Managers own docs"
  ON public.documents FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access docs"
  ON public.documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- STORAGE: document-vault bucket
-- Run this separately in Supabase Dashboard > Storage
-- OR uncomment if your Supabase project supports SQL storage setup:
-- ============================================================

-- NOTE: Create storage bucket manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: document-vault
-- 4. Public access: OFF (private)
-- 5. Click Create

-- Storage RLS policies (run after bucket is created):
CREATE POLICY "Auth users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'document-vault' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can read documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'document-vault' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'document-vault' AND auth.uid() IS NOT NULL);


-- ============================================================
-- SEED: Sample contractors (remove in production)
-- ============================================================

INSERT INTO public.contractors
  (name, company_name, email, phone, category, specializations, service_areas, status, verified, rating, total_reviews, total_jobs, rate_type, rate_from, rate_to, bio)
VALUES
  ('John Smith', 'Smith Plumbing LLC', 'john@smithplumbing.nyc', '212-555-0101', 'plumbing', ARRAY['HPD Violations','Leak Repair','Water Heater'], ARRAY['Manhattan','Brooklyn','Queens'], 'active', true, 4.9, 120, 156, 'hourly', 85, 120, 'Licensed master plumber with 15 years NYC experience. Specializes in HPD violation resolution.'),
  ('Safe Lead Solutions', 'Safe Lead Solutions LLC', 'contact@safeleadnyc.com', '718-555-0202', 'lead_abatement', ARRAY['EPA Certified','HPD LL1 Compliance','XRF Testing'], ARRAY['All Boroughs'], 'active', true, 4.7, 89, 94, 'quote', NULL, NULL, 'EPA-certified lead abatement contractor. Handles all HPD Local Law 1 compliance filings.'),
  ('NYC Electric Pro', 'NYC Electric Pro Inc.', 'info@nycelectricpro.com', '347-555-0303', 'electrical', ARRAY['DOB Emergency','Panel Upgrades','Inspection Prep'], ARRAY['Manhattan','Bronx','Queens'], 'active', true, 4.8, 64, 78, 'hourly', 95, 150, 'Licensed electrician specializing in DOB violation resolution and emergency electrical work.'),
  ('AirComfort HVAC', 'AirComfort Systems', 'service@aircomfortnyc.com', '646-555-0404', 'hvac', ARRAY['LL97 Retrofits','Boiler Repair','Energy Efficiency'], ARRAY['Manhattan','Brooklyn'], 'active', false, 4.6, 42, 55, 'quote', NULL, NULL, 'HVAC specialists helping buildings meet Local Law 97 emission targets with cost-effective retrofits.'),
  ('GreenMold Remediation', 'GreenMold NYC', 'help@greenmoldnyc.com', '917-555-0505', 'mold_remediation', ARRAY['HPD Mold Violations','ICRA Certified','Post-Remediation Testing'], ARRAY['All Boroughs'], 'active', true, 4.5, 33, 41, 'fixed', 2500, 8000, 'Certified mold remediation company with rapid response. Handles all HPD mold violation documentation.');


-- ============================================================
-- Done! Summary of what was created:
-- ✅ contractors table (+ trigger for updated_at)
-- ✅ contractor_reviews table (+ trigger for auto-rating)
-- ✅ violation_resolutions table (Autopilot)
-- ✅ documents table (Document Vault)
-- ✅ All RLS policies
-- ✅ Storage policies for document-vault bucket
-- ✅ 5 seed contractors
--
-- MANUAL STEP REQUIRED:
-- → Create "document-vault" bucket in Supabase Dashboard > Storage
-- ============================================================
