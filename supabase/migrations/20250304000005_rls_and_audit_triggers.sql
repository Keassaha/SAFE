-- SAFE Module A — Row Level Security and audit triggers

-- Helper: current user's cabinet (JWT claim 'cabinet_id' or first membership)
CREATE OR REPLACE FUNCTION public.current_cabinet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'cabinet_id')::uuid,
    (SELECT cabinet_id FROM cabinet_members WHERE user_id = auth.uid() LIMIT 1)
  );
$$;

-- Helper: current user's role in current cabinet
CREATE OR REPLACE FUNCTION public.current_cabinet_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM cabinet_members
  WHERE user_id = auth.uid() AND cabinet_id = public.current_cabinet_id()
  LIMIT 1;
$$;

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Audit trigger: write to audit_log
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid UUID;
  uid UUID;
  old_j JSONB;
  new_j JSONB;
  row_id UUID;
  row_cabinet_id UUID;
BEGIN
  uid := auth.uid();
  cid := public.current_cabinet_id();
  IF TG_OP = 'DELETE' THEN
    old_j := to_jsonb(OLD);
    new_j := NULL;
    row_id := OLD.id;
    row_cabinet_id := (OLD).cabinet_id;
  ELSIF TG_OP = 'UPDATE' THEN
    old_j := to_jsonb(OLD);
    new_j := to_jsonb(NEW);
    row_id := NEW.id;
    row_cabinet_id := (NEW).cabinet_id;
  ELSE
    old_j := NULL;
    new_j := to_jsonb(NEW);
    row_id := NEW.id;
    row_cabinet_id := (NEW).cabinet_id;
  END IF;
  INSERT INTO audit_log (cabinet_id, user_id, entity_type, entity_id, action, old_data, new_data)
  VALUES (
    COALESCE(cid, row_cabinet_id),
    uid,
    TG_TABLE_NAME,
    row_id,
    TG_OP,
    old_j,
    new_j
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Enable RLS on all tenant tables
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

-- Cabinets: user can see cabinets they are member of
CREATE POLICY cabinets_select ON cabinets
  FOR SELECT USING (
    id IN (SELECT cabinet_id FROM cabinet_members WHERE user_id = auth.uid())
  );

-- Cabinet members: see same cabinet's members
CREATE POLICY cabinet_members_select ON cabinet_members
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY cabinet_members_insert ON cabinet_members
  FOR INSERT WITH CHECK (
    cabinet_id = public.current_cabinet_id()
    AND public.current_cabinet_role() = 'admin_cabinet'
  );
CREATE POLICY cabinet_members_update ON cabinet_members
  FOR UPDATE USING (cabinet_id = public.current_cabinet_id());

-- Clients: tenant isolation + role-based (admin/assistante full; avocat/compta read)
CREATE POLICY clients_select ON clients
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY clients_insert ON clients
  FOR INSERT WITH CHECK (
    cabinet_id = public.current_cabinet_id()
    AND public.current_cabinet_role() IN ('admin_cabinet', 'assistante')
  );
CREATE POLICY clients_update ON clients
  FOR UPDATE USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY clients_delete ON clients
  FOR DELETE USING (
    cabinet_id = public.current_cabinet_id()
    AND public.current_cabinet_role() = 'admin_cabinet'
  );

-- Cases: tenant isolation
CREATE POLICY cases_select ON cases
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY cases_insert ON cases
  FOR INSERT WITH CHECK (
    cabinet_id = public.current_cabinet_id()
    AND public.current_cabinet_role() IN ('admin_cabinet', 'assistante', 'avocat')
  );
CREATE POLICY cases_update ON cases
  FOR UPDATE USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY cases_delete ON cases
  FOR DELETE USING (cabinet_id = public.current_cabinet_id());

-- Case team members: via case ownership
CREATE POLICY case_team_members_select ON case_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()
    )
  );
CREATE POLICY case_team_members_insert ON case_team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()
    )
  );
CREATE POLICY case_team_members_update ON case_team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()
    )
  );
CREATE POLICY case_team_members_delete ON case_team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_team_members.case_id AND c.cabinet_id = public.current_cabinet_id()
    )
  );

-- Case activities
CREATE POLICY case_activities_select ON case_activities
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_activities_insert ON case_activities
  FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id());

-- Case documents
CREATE POLICY case_documents_select ON case_documents
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_documents_insert ON case_documents
  FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_documents_update ON case_documents
  FOR UPDATE USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY case_documents_delete ON case_documents
  FOR DELETE USING (cabinet_id = public.current_cabinet_id());

-- Identity documents
CREATE POLICY identity_documents_select ON identity_documents
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY identity_documents_insert ON identity_documents
  FOR INSERT WITH CHECK (cabinet_id = public.current_cabinet_id());
CREATE POLICY identity_documents_update ON identity_documents
  FOR UPDATE USING (cabinet_id = public.current_cabinet_id());

-- Billing summary
CREATE POLICY billing_summary_select ON billing_summary
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());
CREATE POLICY billing_summary_all ON billing_summary
  FOR ALL USING (cabinet_id = public.current_cabinet_id());

-- Audit log: read-only for same cabinet
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (cabinet_id = public.current_cabinet_id());

-- Apply updated_at triggers
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER case_documents_updated_at BEFORE UPDATE ON case_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER identity_documents_updated_at BEFORE UPDATE ON identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER billing_summary_updated_at BEFORE UPDATE ON billing_summary
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit triggers (key tables)
CREATE TRIGGER clients_audit AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER cases_audit AFTER INSERT OR UPDATE OR DELETE ON cases
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER case_documents_audit AFTER INSERT OR UPDATE OR DELETE ON case_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER identity_documents_audit AFTER INSERT OR UPDATE OR DELETE ON identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- updated_at for cabinets and cabinet_members
CREATE TRIGGER cabinets_updated_at BEFORE UPDATE ON cabinets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cabinet_members_updated_at BEFORE UPDATE ON cabinet_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
