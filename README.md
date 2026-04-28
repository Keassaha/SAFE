# SAFE

SAFE est une plateforme SaaS de gestion de cabinet juridique orientee operations, facturation et conformite. Le repo courant contient l'application produit. Le pipeline client et les documents business vivent hors repo.

## Source de verite

- Code produit: ce repo
- Delivery client: `/Users/Bookkeeping/Desktop/Delivery Syst`
- Business SAFE Inc.: `/Users/Bookkeeping/Desktop/SAFE Inc.`

Le detail est documente dans [docs/SOURCE_OF_TRUTH.md](/Users/Bookkeeping/SAAS%20-%20SAFE%2002/docs/SOURCE_OF_TRUTH.md:1).

## Etat actuel

Le projet n'est plus un MVP simple. Le code couvre deja:

- auth et gestion multi-cabinet
- clients, dossiers et permissions par role
- facturation, paiements, notes de credit et suivi
- fiducie, rapprochement et conformite
- edition documentaire, PDF, upload et versions
- import, rapports, comptabilite, employes et parametres
- onboarding, audit gratuit et configuration par `CabinetInterface`

Le cabinet Derisier est le cas d'activation le plus avance. Son statut consolide est suivi dans [docs/DERISIER_ACTIVATION_STATUS.md](/Users/Bookkeeping/SAAS%20-%20SAFE%2002/docs/DERISIER_ACTIVATION_STATUS.md:1).

## Stack

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- Backend: Route Handlers Next.js, Server Actions, NextAuth
- Data: PostgreSQL + Prisma
- Integrations presentes ou prevues: Supabase, Stripe, Resend, Anthropic

## Demarrage local

1. Installer les dependances:

```bash
npm install
```

2. Copier `.env.example` vers `.env` et renseigner au minimum:

- `DATABASE_URL`
- `DIRECT_URL` si tu utilises une URL de migration separee
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=http://localhost:3001`

3. Generer Prisma puis appliquer les migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

4. Lancer l'app:

```bash
npm run dev
```

L'app tourne sur `http://localhost:3001`.

## Scripts utiles

- `npm run dev` : serveur local
- `npm run build` : build production
- `npm run test:run` : tests unitaires
- `npm run db:generate` : regenere Prisma Client
- `npm run db:migrate` : cree une migration locale
- `npm run db:studio` : ouvre Prisma Studio

## Notes d'exploitation

- Les copies flottantes `SAFE Inc./` et `.agents/Delivery Syst/` dans le workspace ne sont pas autoritaires et sont ignorees par Git.
- La build locale n'a plus besoin d'aller chercher de fonts Google pour compiler.
- `IMPLEMENTATION_SUMMARY.md` sert maintenant de statut de consolidation, pas de roadmap fictive.
