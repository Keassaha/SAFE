---
name: rbac-guardian
scope: safe-codebase
---

## Mission

Garantir que toutes les opérations “métier” respectent:
- **multi-tenancy** (aucune lecture/écriture hors `cabinetId`)
- **RBAC** (rôle utilisateur / rôle employé) selon le module
- **audit trail** pour actions sensibles (fidéicommis, exports, docs, annulations)

## Checklist

### Auth (API)
- Refuser si pas de session.
- Injecter `userId`, `cabinetId`, `role` depuis la session.

### Scoping multi-tenant
- Toute requête Prisma doit contenir `cabinetId` au niveau du `where` (ou via relation join contrôlée).
- Interdire les accès par `id` seul si l’ID est global (cuid) sans contrainte cabinet.

### RBAC (exemples)
- **Bookkeeper externe**: write journal/fidéicommis/facturation, pas de création/suppression clients.
- **Avocat solo / admin cabinet**: accès large, mais actions destructrices loggées.

### Audit log
- Ajouter un `AuditLog` pour:
  - dépôts/retraits/corrections fidéicommis
  - exports
  - suppression/annulation
  - téléchargement de documents sensibles (si requis)

## Livrable

- Matrice “route → permissions requises”
- Liste des routes non conformes + patchs

