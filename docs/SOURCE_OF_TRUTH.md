# SAFE - Source of Truth

Ce document fixe la source de verite par couche pour eviter les doublons flottants et les histoires contradictoires.

## Regle simple

- `repo SAFE` (`/Users/Bookkeeping/SAAS - SAFE 02`) = code produit, schama Prisma, tests, scripts, docs techniques du repo.
- `Delivery Syst` (`/Users/Bookkeeping/Desktop/Delivery Syst`) = pipeline de delivery client, knowledge base, phases client, activation.
- `SAFE Inc.` (`/Users/Bookkeeping/Desktop/SAFE Inc.`) = business, legal, operations, pricing, financement, marketing corporate.

## Ce qui doit vivre ou

### Repo SAFE

- Code applicatif `app/`, `components/`, `lib/`, `prisma/`
- Migrations, seeds, scripts d'exploitation
- Documentation technique qui aide a coder ou deployer
- Statuts de consolidation qui concernent l'etat du produit

### Delivery Syst

- Prompts et templates des phases 1 a 3
- Knowledge base metier et reglementaire
- Dossiers clients `clients/<client-id>/`
- Documents d'activation et de review post-delivery

### SAFE Inc.

- Contrats, financier, operations, droit, marketing, CRM, subventions
- Documents business ou corporate qui ne pilotent pas directement le code

## Doublons a traiter comme copies non autoritaires

Ces chemins existent dans le workspace mais ne doivent plus servir de source de verite:

- `.agents/Delivery Syst/`
- `SAFE Inc./`

Ils sont ignores par Git pour eviter qu'une copie locale se remette a diverger du dossier maitre.

## Regles d'entretien

1. Si un document pilote le build ou le code, il doit etre dans le repo SAFE.
2. Si un document pilote un deploiement client, il doit etre dans `Delivery Syst`.
3. Si un document sert la vente, les operations ou le corporate, il doit etre dans `SAFE Inc.`.
4. On ne copie pas un dossier entier dans le repo pour "l'avoir sous la main". On y fait plutot reference par chemin.
5. Quand un document devient obsolete, on le met a jour ou on l'archive explicitement. On ne laisse pas deux versions se contredire.
