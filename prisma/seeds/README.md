# prisma/seeds/

Scripts de provisioning idempotents pour environnements dev et prod.

## safe-inc.mjs — Provisioning Cabinet SAFE (dog food)

Crée ou met à jour le Cabinet `SAFE` qui est utilisé par SAFE Inc. elle-même comme client de son propre produit (stratégie dog food, ADR-006).

### Usage

```bash
SAFE_ADMIN_EMAIL="jeremie@safecabinet.ca" \
SAFE_ADMIN_PASSWORD="<password_fort>" \
SAFE_ADMIN_NOM="Jérémie" \
node prisma/seeds/safe-inc.mjs
```

### Variables d'environnement

| Variable | Obligatoire | Défaut | Notes |
|----------|-------------|--------|-------|
| `SAFE_ADMIN_PASSWORD` | OUI | aucun | Minimum 12 caractères |
| `SAFE_ADMIN_EMAIL` | non | `jeremie@safecabinet.ca` | Email du compte CEO |
| `SAFE_ADMIN_NOM` | non | `Jérémie` | Nom affiché |

### Modules activés

- Tableau de bord, Clients, Facturation, Comptabilité, Documents, Gestion, Rapports

### Modules désactivés

- Fidéicommis (pas applicable SaaS)
- Conformité Barreau (pas applicable)
- Dossiers juridiques (pas applicable)
- Navette interne (pas applicable solo)
- Temps (mode forfait, pas horaire)

### Garde-fou

Le script est **idempotent** : peut être rejoué autant de fois que nécessaire. Si le Cabinet ou le User existent déjà, ils sont mis à jour, pas dupliqués.

### Workflow recommandé

1. **Dev local d'abord** : tester sur la base de dev
2. **Vérifier le résultat** : login, navigation, modules visibles
3. **Prod ensuite** : exécuter avec `DATABASE_URL` pointant prod

### Après provisioning

Steps manuels à faire via l'UI SAFE :

1. Login sur `/connexion`
2. `/gestion/parametres-cabinet` : compléter adresse, téléphone, logo
3. `/clients` : créer le premier Client (= cliente actuelle de SAFE Inc.)
4. `/facturation` : émettre la première facture
5. `/comptabilite` : configurer le plan comptable de base
