-- SAFE Module A — Run all migrations in one go (Supabase Dashboard → SQL Editor)
-- Execute this file if you don't use Supabase CLI.

-- ========== 1. Extensions & tenant ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS cabinets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin_cabinet', 'avocat', 'assistante', 'comptabilite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS cabinet_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'avocat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cabinet_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cabinet_members_cabinet ON cabinet_members(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_members_user ON cabinet_members(user_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip inet,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_cabinet ON audit_log(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ========== 2. Clients ==========
DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('personne_physique', 'personne_morale');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('actif', 'inactif', 'en_attente', 'archive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  type_client client_type NOT NULL DEFAULT 'personne_morale',
  raison_sociale TEXT NOT NULL,
  prenom TEXT,
  nom TEXT,
  nas_encrypted BYTEA,
  date_naissance DATE,
  email TEXT,
  telephone TEXT,
  telephone_secondaire TEXT,
  adresse_ligne1 TEXT,
  adresse_ligne2 TEXT,
  ville TEXT,
  province TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'CA',
  num_registre_entreprise TEXT,
  neq TEXT,
  avocat_conseil_externe TEXT,
  informations_legales JSONB DEFAULT '{}',
  date_verification_identite TIMESTAMPTZ,
  methode_verification_identite TEXT,
  statut_verification_identite TEXT,
  billing_config JSONB DEFAULT '{}',
  taux_horaire_default DECIMAL(12,2),
  devise TEXT DEFAULT 'CAD',
  conditions_paiement TEXT,
  consentement_collecte_at TIMESTAMPTZ,
  finalites_consentement JSONB,
  retention_jusqua DATE,
  internal_notes_encrypted BYTEA,
  notes_plain TEXT,
  alerts JSONB DEFAULT '[]',
  alert_until DATE,
  status client_status NOT NULL DEFAULT 'actif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_cabinet ON clients(cabinet_id);
CREATE INDEX idx_clients_cabinet_raison ON clients(cabinet_id, raison_sociale);
CREATE INDEX idx_clients_cabinet_status ON clients(cabinet_id, status);

-- ========== 3. Cases & team ==========
DO $$ BEGIN
  CREATE TYPE case_lifecycle_status AS ENUM ('ouverture', 'en_cours', 'en_attente', 'cloture', 'archive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  titre TEXT NOT NULL,
  type_affaire TEXT,
  numero_dossier TEXT,
  tribunal TEXT,
  tribunal_cour TEXT,
  chambre TEXT,
  no_dossier_tribunal TEXT,
  juge TEXT,
  tribunal_info JSONB DEFAULT '{}',
  status case_lifecycle_status NOT NULL DEFAULT 'ouverture',
  date_ouverture DATE NOT NULL DEFAULT CURRENT_DATE,
  date_cloture DATE,
  retention_jusqua DATE,
  description_confidentielle_encrypted BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cabinet_id, reference)
);
CREATE INDEX idx_cases_cabinet ON cases(cabinet_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_cabinet_status ON cases(cabinet_id, status);

DO $$ BEGIN
  CREATE TYPE case_team_role AS ENUM ('avocat_responsable', 'avocat', 'assistant', 'stagiaire', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE case_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role case_team_role NOT NULL DEFAULT 'avocat',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  notes TEXT,
  UNIQUE(case_id, user_id)
);
CREATE INDEX idx_case_team_members_case ON case_team_members(case_id);
CREATE INDEX idx_case_team_members_user ON case_team_members(user_id);

CREATE TABLE case_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_case_activities_case ON case_activities(case_id);
CREATE INDEX idx_case_activities_cabinet ON case_activities(cabinet_id);

CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  checksum TEXT,
  uploaded_by UUID NOT NULL,
  retention_jusqua DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_case_documents_case ON case_documents(case_id);
CREATE INDEX idx_case_documents_cabinet ON case_documents(cabinet_id);

-- ========== 4. Identity documents & billing ==========
DO $$ BEGIN
  CREATE TYPE identity_document_type AS ENUM ('piece_identite', 'permis_conduire', 'passeport', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE identity_verification_status AS ENUM ('en_attente', 'verifie', 'refuse');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE identity_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  document_type identity_document_type NOT NULL,
  status identity_verification_status NOT NULL DEFAULT 'en_attente',
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  method TEXT,
  storage_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_identity_documents_client ON identity_documents(client_id);
CREATE INDEX idx_identity_documents_cabinet ON identity_documents(cabinet_id);

CREATE TABLE billing_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  total_heures DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_fees DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_disbursements DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_taxes DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_invoiced DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id)
);
CREATE INDEX idx_billing_summary_case ON billing_summary(case_id);
CREATE INDEX idx_billing_summary_cabinet ON billing_summary(cabinet_id);

-- ========== 5. RLS & triggers ==========
CREATE OR REPLACE FUNCTION public.current_cabinet_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'cabinet_id')::uuid,
    (SELECT cabinet_id FROM cabinet_members WHERE user_id = auth.uid() LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_cabinet_role()
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM cabinet_members WHERE user_id = auth.uid() AND cabinet_id = public.current_cabinet_id() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid UUID; uid UUID; old_j JSONB; new_j JSONB; row_id UUID; row_cabinet_id UUID;
BEGIN
  uid := auth.uid(); cid := public.current_cabinet_id();
  IF TG_OP = 'DELETE' THEN old_j := to_jsonb(OLD); new_j := NULL; row_id := OLD.id; row_cabinet_id := (OLD).cabinet_id;
  ELSIF TG_OP = 'UPDATE' THEN old_j := to_jsonb(OLD); new_j := to_jsonb(NEW); row_id := NEW.id; row_cabinet_id := (NEW).cabinet_id;
  ELSE old_j := NULL; new_j := to_jsonb(NEW); row_id := NEW.id; row_cabinet_id := (NEW).cabinet_id; END IF;
  INSERT INTO audit_log (cabinet_id, user_id, entity_type, entity_id, action, old_data, new_data)
  VALUES (COALESCE(cid, row_cabinet_id), uid, TG_TABLE_NAME, row_id, TG_OP, old_j, new_j);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;

ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cabinets_select ON cabinets;
CREATE POLICY cabinets_select ON cabinets FOR SELECT USING (id IN (SELECT cabinet_id FROM cabinet_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS cabinet_members_select ON cabinet_members;
DROP POLICY IF EXISTS cabinet_members_insert ON cabinet_members;
DROP POLICY IF EXISTS cabinet_members_update ON cabinet_members;
CREATE POLICY cabinet_members_select ON cabinet_members FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY cabinet_members_insert ON cabinet_members FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id() AND public.current_cabinet_role() = 'admin_cabinet');
CREATE POLICY cabinet_members_update ON cabinet_members FOR UPDATE USING (cabinet_id = public.current_cabinet_id());

DROP POLICY IF EXISTS clients_select ON clients;
DROP POLICY IF EXISTS clients_insert ON clients;
DROP POLICY IF EXISTS clients_update ON clients;
DROP POLICY IF EXISTS clients_delete ON clients;
CREATE POLICY clients_select ON clients FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY clients_insert ON clients FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id() AND public.current_cabinet_role() IN ('admin_cabinet', 'assistante'));
CREATE POLICY clients_update ON clients FOR UPDATE USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY clients_delete ON clients FOR DELETE USING (cabinet_id = public.current_cabinet_id() AND public.current_cabinet_role() = 'admin_cabinet');

DROP POLICY IF EXISTS cases_select ON cases;
DROP POLICY IF EXISTS cases_insert ON cases;
DROP POLICY IF EXISTS cases_update ON cases;
DROP POLICY IF EXISTS cases_delete ON cases;
CREATE POLICY cases_select ON cases FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY cases_insert ON cases FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id() AND public.current_cabinet_role() IN ('admin_cabinet', 'assistante', 'avocat'));
CREATE POLICY cases_update ON cases FOR UPDATE USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY cases_delete ON cases FOR DELETE USING (cabinet_id = public.current_cabinet_id());

DROP POLICY IF EXISTS case_team_members_select ON case_team_members;
DROP POLICY IF EXISTS case_team_members_insert ON case_team_members;
DROP POLICY IF EXISTS case_team_members_update ON case_team_members;
DROP POLICY IF EXISTS case_team_members_delete ON case_team_members;
CREATE POLICY case_team_members_select ON case_team_members FOR SELECT USING (EXISTS (SELECT 1 FROM cases c WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()));
CREATE POLICY case_team_members_insert ON case_team_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM cases c WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()));
CREATE POLICY case_team_members_update ON case_team_members FOR UPDATE USING (EXISTS (SELECT 1 FROM cases c WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()));
CREATE POLICY case_team_members_delete ON case_team_members FOR DELETE USING (EXISTS (SELECT 1 FROM cases c WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()));

DROP POLICY IF EXISTS case_activities_select ON case_activities;
DROP POLICY IF EXISTS case_activities_insert ON case_activities;
CREATE POLICY case_activities_select ON case_activities FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_activities_insert ON case_activities FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id());

DROP POLICY IF EXISTS case_documents_select ON case_documents;
DROP POLICY IF EXISTS case_documents_insert ON case_documents;
DROP POLICY IF EXISTS case_documents_update ON case_documents;
DROP POLICY IF EXISTS case_documents_delete ON case_documents;
CREATE POLICY case_documents_select ON case_documents FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_documents_insert ON case_documents FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_documents_update ON case_documents FOR UPDATE USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_documents_delete ON case_documents FOR DELETE USING (cabinet_id = public.current_cabinet_id());

DROP POLICY IF EXISTS identity_documents_select ON identity_documents;
DROP POLICY IF EXISTS identity_documents_insert ON identity_documents;
DROP POLICY IF EXISTS identity_documents_update ON identity_documents;
CREATE POLICY identity_documents_select ON identity_documents FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY identity_documents_insert ON identity_documents FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id());
CREATE POLICY identity_documents_update ON identity_documents FOR UPDATE USING (cabinet_id = public.current_cabinet_id());

DROP POLICY IF EXISTS billing_summary_select ON billing_summary;
DROP POLICY IF EXISTS billing_summary_all ON billing_summary;
CREATE POLICY billing_summary_select ON billing_summary FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY billing_summary_all ON billing_summary FOR ALL USING (cabinet_id = public.current_cabinet_id());

DROP POLICY IF EXISTS audit_log_select ON audit_log;
CREATE POLICY audit_log_select ON audit_log FOR SELECT USING (cabinet_id = public.current_cabinet_id());

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
DROP TRIGGER IF EXISTS cases_updated_at ON cases;
DROP TRIGGER IF EXISTS case_documents_updated_at ON case_documents;
DROP TRIGGER IF EXISTS identity_documents_updated_at ON identity_documents;
DROP TRIGGER IF EXISTS billing_summary_updated_at ON billing_summary;
DROP TRIGGER IF EXISTS cabinets_updated_at ON cabinets;
DROP TRIGGER IF EXISTS cabinet_members_updated_at ON cabinet_members;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER case_documents_updated_at BEFORE UPDATE ON case_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER identity_documents_updated_at BEFORE UPDATE ON identity_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER billing_summary_updated_at BEFORE UPDATE ON billing_summary FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cabinets_updated_at BEFORE UPDATE ON cabinets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cabinet_members_updated_at BEFORE UPDATE ON cabinet_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS clients_audit ON clients;
DROP TRIGGER IF EXISTS cases_audit ON cases;
DROP TRIGGER IF EXISTS case_documents_audit ON case_documents;
DROP TRIGGER IF EXISTS identity_documents_audit ON identity_documents;
CREATE TRIGGER clients_audit AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER cases_audit AFTER INSERT OR UPDATE OR DELETE ON cases FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER case_documents_audit AFTER INSERT OR UPDATE OR DELETE ON case_documents FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER identity_documents_audit AFTER INSERT OR UPDATE OR DELETE ON identity_documents FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
