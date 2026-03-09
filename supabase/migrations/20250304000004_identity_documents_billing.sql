-- SAFE Module A — IdentityDocuments and BillingSummary

CREATE TYPE identity_document_type AS ENUM (
  'piece_identite',
  'permis_conduire',
  'passeport',
  'autre'
);

CREATE TYPE identity_verification_status AS ENUM (
  'en_attente',
  'verifie',
  'refuse'
);

-- Identity documents (per client; links to optional file in Storage)
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

-- Billing summary (financial tracking per case)
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

COMMENT ON TABLE identity_documents IS 'Identity verification records and linked documents (Loi 25, Barreau)';
COMMENT ON TABLE billing_summary IS 'Aggregated financial tracking per case; synced from time entries and invoices';
