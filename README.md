# SAFE — Système Automatisé de Facturation et d'Exploitation

Plateforme SaaS pour la gestion des dossiers juridiques, des heures travaillées, de la facturation et des paiements pour petits cabinets d'avocats canadiens (1 à 5 avocats).

## Stack

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes, Server Actions
- **Base de données** : PostgreSQL avec Prisma
- **Auth** : NextAuth.js (Credentials + JWT), rôles : admin_cabinet, avocat, assistante, comptabilite

## Démarrage

1. **Installation**

```bash
npm install
```

2. **Variables d'environnement**

Copiez `.env.example` vers `.env` et ajustez si besoin :

- `DATABASE_URL` : URL PostgreSQL (ex. Neon, Vercel Postgres, Supabase). Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le déploiement sur Vercel.
- `NEXTAUTH_SECRET` : secret pour les sessions (générer avec `openssl rand -base64 32`)
- `NEXTAUTH_URL` : URL de l'app (ex. `http://localhost:3000` ; en prod ex. `https://votre-app.vercel.app`)

3. **Base de données**

```bash
npx prisma generate
npx prisma migrate deploy
```
(Requiert une base PostgreSQL et `DATABASE_URL` dans `.env`.)

4. **Lancement**

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Créez un compte via **Créer un compte** (premier utilisateur = administrateur du cabinet).

## Fonctionnalités MVP

- **Auth** : Inscription (création cabinet + admin), connexion, déconnexion
- **Clients** : CRUD, liste et fiche détail
- **Dossiers** : CRUD, liaison client, statut actif/clôturé
- **Fiches de temps** : CRUD, liaison dossier / utilisateur, calcul montant
- **Facturation** : Création facture à partir des fiches de temps, numérotation, lignes manuelles, PDF
- **Paiements** : Enregistrement des paiements, mise à jour du solde facture
- **Tableau de bord** : KPIs (CA, encaissements, créances, dossiers actifs), graphique revenus par mois
- **Rapports** : Filtres année / client / avocat, revenus par client et par avocat

## Rôles et permissions

- **Administrateur** : Accès complet (paramètres cabinet, utilisateurs, tout le reste).
- **Avocat** : Fiches de temps, lecture clients/dossiers/factures.
- **Assistante** : Clients, dossiers, fiches de temps, facturation (création/brouillons).
- **Comptabilité** : Facturation, paiements, rapports ; lecture sur le reste.

Les liens du menu latéral sont filtrés selon le rôle. Les actions serveur vérifient `cabinetId` pour l’isolation multi-tenant.

## Structure du projet

- `app/` : Routes (landing, auth, app protégée)
- `components/` : UI, layout, formulaires par module
- `lib/` : DB (Prisma), auth, validations (Zod), utils
- `prisma/` : Schéma et migrations

## Commandes utiles

- `npm run dev` : serveur de développement
- `npm run build` : build production
- `npm run db:studio` : interface Prisma Studio pour la base
- `npm run db:migrate` : créer une migration
