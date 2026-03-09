-- SAFE Module A — Cases and CaseTeamMembers

CREATE TYPE case_lifecycle_status AS ENUM (
  'ouverture',
  'en_cours',
  'en_attente',
  'cloture',
  'archive'
);

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Case identification
  reference TEXT NOT NULL,
  titre TEXT NOT NULL,
  type_affaire TEXT,
  numero_dossier TEXT,

  -- Tribunal information
  tribunal TEXT,
  tribunal_cour TEXT,
  chambre TEXT,
  no_dossier_tribunal TEXT,
  juge TEXT,
  tribunal_info JSONB DEFAULT '{}',

  -- Lifecycle
  status case_lifecycle_status NOT NULL DEFAULT 'ouverture',
  date_ouverture DATE NOT NULL DEFAULT CURRENT_DATE,
  date_cloture DATE,
  retention_jusqua DATE,

  -- Sensitive (restrict via RLS)
  description_confidentielle_encrypted BYTEA,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(cabinet_id, reference)
);

CREATE INDEX idx_cases_cabinet ON cases(cabinet_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_cabinet_status ON cases(cabinet_id, status);
CREATE INDEX idx_cases_reference ON cases(cabinet_id, reference);

-- Case team assignments
CREATE TYPE case_team_role AS ENUM ('avocat_responsable', 'avocat', 'assistant', 'stagiaire', 'autre');

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

-- Case history / activities (case history)
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
CREATE INDEX idx_case_activities_occurred ON case_activities(occurred_at DESC);

-- Case documents (linked documents)
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

COMMENT ON TABLE case_activities IS 'Case history and activity log';
COMMENT ON TABLE case_documents IS 'Document metadata; files stored in Supabase Storage';
