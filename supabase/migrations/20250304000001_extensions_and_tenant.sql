-- SAFE Module A — Extensions & multi-tenant base
-- Supabase PostgreSQL

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema for app (optional; can use public with tenant_id everywhere)
-- We use public with cabinet_id as tenant discriminator to align with existing plan.

-- Tenants (cabinets) — optional if you already have auth.organizations or a tenants table
CREATE TABLE IF NOT EXISTS cabinets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles enum for RBAC
CREATE TYPE app_role AS ENUM (
  'admin_cabinet',
  'avocat',
  'assistante',
  'comptabilite'
);

-- Cabinet members (links Supabase auth.users to cabinet + role)
CREATE TABLE IF NOT EXISTS cabinet_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'avocat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cabinet_id, user_id)
);

CREATE INDEX idx_cabinet_members_cabinet ON cabinet_members(cabinet_id);
CREATE INDEX idx_cabinet_members_user ON cabinet_members(user_id);

-- Audit log table (used by triggers and application)
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

CREATE INDEX idx_audit_log_cabinet ON audit_log(cabinet_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

COMMENT ON TABLE audit_log IS 'Immutable audit trail for Loi 25 and Barreau compliance';
