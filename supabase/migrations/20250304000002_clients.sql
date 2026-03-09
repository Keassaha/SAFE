-- SAFE Module A — Clients
-- Multi-tenant; sensitive fields stored for application-level or Vault encryption

CREATE TYPE client_type AS ENUM ('personne_physique', 'personne_morale');
CREATE TYPE client_status AS ENUM ('actif', 'inactif', 'en_attente', 'archive');

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,

  -- Personal identity (sensitive — encrypt at application layer or use Vault)
  type_client client_type NOT NULL DEFAULT 'personne_morale',
  raison_sociale TEXT NOT NULL,
  prenom TEXT,
  nom TEXT,
  nas_encrypted BYTEA,
  date_naissance DATE,

  -- Contact details
  email TEXT,
  telephone TEXT,
  telephone_secondaire TEXT,
  adresse_ligne1 TEXT,
  adresse_ligne2 TEXT,
  ville TEXT,
  province TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'CA',

  -- Legal information
  num_registre_entreprise TEXT,
  neq TEXT,
  avocat_conseil_externe TEXT,
  informations_legales JSONB DEFAULT '{}',

  -- Identity verification
  date_verification_identite TIMESTAMPTZ,
  methode_verification_identite TEXT,
  statut_verification_identite TEXT,

  -- Billing configuration
  billing_config JSONB DEFAULT '{}',
  taux_horaire_default DECIMAL(12,2),
  devise TEXT DEFAULT 'CAD',
  conditions_paiement TEXT,

  -- Loi 25 / consent
  consentement_collecte_at TIMESTAMPTZ,
  finalites_consentement JSONB,
  retention_jusqua DATE,

  -- Internal notes (sensitive — restrict access via RLS)
  internal_notes_encrypted BYTEA,
  notes_plain TEXT,

  -- Alerts
  alerts JSONB DEFAULT '[]',
  alert_until DATE,

  -- Status
  status client_status NOT NULL DEFAULT 'actif',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_cabinet ON clients(cabinet_id);
CREATE INDEX idx_clients_cabinet_raison ON clients(cabinet_id, raison_sociale);
CREATE INDEX idx_clients_cabinet_status ON clients(cabinet_id, status);
CREATE INDEX idx_clients_email ON clients(cabinet_id, email) WHERE email IS NOT NULL;

COMMENT ON COLUMN clients.nas_encrypted IS 'Encrypt with pgcrypto or application layer before insert';
COMMENT ON COLUMN clients.internal_notes_encrypted IS 'Sensitive notes; encrypt at application layer';
