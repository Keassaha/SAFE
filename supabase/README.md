# SAFE Module A — Supabase migrations

Migrations PostgreSQL pour le Module A (Registre clients & Dossiers) avec :

- **Multi-tenant** : `cabinet_id` sur toutes les tables métier ; RLS par cabinet.
- **RBAC** : rôles `admin_cabinet`, `avocat`, `assistante`, `comptabilite` via `cabinet_members`.
- **Chiffrement** : champs sensibles en `BYTEA` (`nas_encrypted`, `internal_notes_encrypted`, `description_confidentielle_encrypted`) à chiffrer en application (ou avec Supabase Vault).
- **Audit** : table `audit_log` et triggers sur `clients`, `cases`, `case_documents`, `identity_documents`.

## Tables

| Table | Description |
|-------|-------------|
| `cabinets` | Tenants (cabinets) |
| `cabinet_members` | Utilisateurs × cabinet × rôle |
| `clients` | Clients (identité, contact, juridique, vérification, facturation, notes, alertes, statut) |
| `cases` | Dossiers (identification, tribunal, statut, dates) |
| `case_team_members` | Équipe par dossier |
| `case_activities` | Historique / activités du dossier |
| `case_documents` | Métadonnées des documents (fichiers dans Storage) |
| `identity_documents` | Pièces d’identité et statut de vérification |
| `billing_summary` | Synthèse financière par dossier |
| `audit_log` | Piste d’audit (Loi 25, Barreau) |

## Appliquer les migrations

**Option A — Dashboard Supabase (sans CLI)**  
Ouvrir le **SQL Editor** du projet Supabase, coller le contenu de `run-all-migrations.sql` et exécuter. Tout le schéma Module A sera créé en une fois.

**Option B — Supabase CLI (projet lié)**  
```bash
npx supabase link   # une fois, avec project ref + password
npm run supabase:push
# ou : supabase db push
```

**Option C — Fichiers un par un**  
Exécuter dans l’ordre dans le SQL Editor :

1. `migrations/20250304000001_extensions_and_tenant.sql`
2. `migrations/20250304000002_clients.sql`
3. `migrations/20250304000003_cases_and_team.sql`
4. `migrations/20250304000004_identity_documents_billing.sql`
5. `migrations/20250304000005_rls_and_audit_triggers.sql`

## JWT et `current_cabinet_id()`

Pour que RLS utilise le bon cabinet, soit :

- définir le claim personnalisé `cabinet_id` dans le JWT (après login / sélection du cabinet),  
- soit laisser la fonction utiliser le premier `cabinet_id` trouvé dans `cabinet_members` pour `auth.uid()`.
