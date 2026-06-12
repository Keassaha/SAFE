# Derisier Law — Checklist de livraison concierge

> Pilote SAFE n°1, mode concierge. Document opérationnel pour l'équipe SAFE.
> Dernière vérification automatisée : 2026-05-05 — `npm run verify:derisier` → 39/39 PASS.

---

## 1. État de configuration

| Domaine | Valeur cible (audit) | État |
| --- | --- | --- |
| Cabinet ID | `derisier-law-on-2026` | OK |
| Nom légal | Derisier Law | OK |
| Email contact cabinet | info@derisierlaw.com | OK |
| Province | ON | OK |
| Plan | `cabinet` | OK |
| Prix mensuel cible | **149 $/mois** | OK (`config.currentOffer.monthlyPrice = 149`) |
| Langue UI | EN | OK (`config.locale = en` + `modules.intake.language = en`) |
| Pratiques | real_estate + immigration | OK (`disciplines = ["immobilier", "immigration"]`) |
| Mode facturation | flat_fee / bimonthly | OK |
| Conformité | LSO By-Law 9 / FINTRAC / PIPEDA | OK |
| Volume mensuel | 1–5 dossiers | OK |
| Timeline client | immediately | OK |
| Priorités onboarding | trust_noncompliant, case_tracking, slow_billing | OK |

### Fidéicommis

| Élément | État |
| --- | --- |
| `config.trustBanking.enabled` | true |
| `config.trustBanking.accountCount` | 1 |
| `config.trustBanking.accounts[0].label` | Derisier Law Trust Account |
| `config.trustBanking.accounts[0].bank` | **To confirm** |
| `config.trustBanking.accounts[0].accountNumber` | **TO-CONFIRM-DERISIER-TRUST** |
| `config.trustBanking.accounts[0].currency` | CAD |
| `config.trustBanking.accounts[0].reconciliation` | never (état actuel chez Derisier) |
| `config.trustBanking.regulator` | LSO Bylaw 9 |
| `TrustAccount` (ledger Prisma) | 0 row — **attendu** (créé à la première écriture trust sur un dossier) |

> **Rappel doctrine** : dans ce repo, `TrustAccount` est un *ledger* par client/dossier, pas un compte bancaire. Le compte bancaire fidéicommis (1 seul chez Derisier) vit dans `Cabinet.config.trustBanking`.

### Sidebar / accès applicatif

`CabinetInterface.ongletsActifs` = `["dashboard", "gestion", "finances", "outils", "parametres"]` — **les 5 IDs sont alignés avec les top-level NAV_ITEMS** de [components/layout/SidebarNav.tsx](components/layout/SidebarNav.tsx#L68-L146).

`CabinetInterface.ongletsMasques` = `["employees"]` — masque l'écran "Employees" RH (volume trop faible pour Derisier ; l'assistante est gérée comme `User` directement).

Modules visibles confirmés pour Derisier :

| Module sidebar | Sous-rubrique | Route | Accessible Derisier |
| --- | --- | --- | --- |
| Dashboard | — | `/tableau-de-bord` | oui |
| Practice | Clients | `/clients` | oui |
| Practice | Matters | `/dossiers` | oui |
| Practice | Assistant queue | `/gestion/assistante` | oui (admin_cabinet + assistante) |
| Practice | Employees | `/employees` | **masqué** (intentionnel) |
| Finances | Billing | `/facturation` | oui |
| Finances | Accounting | `/comptabilite` | oui |
| Finances | Trust accounts | `/comptes` | oui |
| Finances | Task register (forfait) | `/temps` | oui — relabellisé "Services & fees" |
| Tools | Édition | `/edition` | oui |
| Tools | Reports | `/rapports` | oui |
| Tools | SAFE Import | `/import` | oui |
| Settings | — | `/parametres` | oui |

Toutes les pages cibles existent dans `app/(app)/`.

---

## 2. Identifiants de test

| Rôle | Email | Mot de passe par défaut |
| --- | --- | --- |
| `admin_cabinet` (Me Marjorie-Alexandra Derisier) | info@derisierlaw.com | `DerisierLaw2026!` |
| `assistante` (Aaliyah) | aaliyah@derisierlaw.com | `Assistant2026!` |

Mots de passe surchargeables via `DERISIER_ADMIN_PASSWORD` / `DERISIER_ASSISTANT_PASSWORD` lors du seed.

> **À régénérer** : remettre des mots de passe aléatoires forts juste avant la livraison réelle au cabinet, et les transmettre via le canal de remise convenu (pas par email en clair).

---

## 3. Points validés (39/39)

Catalogue complet du `npm run verify:derisier` :

- Cabinet existe, nom + plan + email corrects.
- `config` valide JSON ; `locale=en`, `province=ON`, `currentOffer.monthlyPrice=149`.
- `trustBanking` complet (label, bank "To confirm", currency CAD).
- `CabinetInterface` présente : ongletsActifs alignés, employees masqué, disciplines ok.
- Modules cohérents : facturation `forfait`, fideicommis `bylaw9-lso`, fintrac actif, pipeda actif, subscriptions targetPriceMonthly=149.
- 2 utilisateurs, rôles admin_cabinet + assistante.
- `ForfaitService` ≥ 8 lignes (10), incluant IMMO-ACHAT, IMMO-VENTE, IMM-EE, IMM-PARR, IMM-TRAV.
- `DeboursType` ≥ 7 (9 actuels), `DeboursTemplate` ≥ 10 (17 actuels).
- 0 client, 0 dossier et 0 facture opérationnels avant livraison (données test retirées).
- 0 ledger `TrustAccount` (attendu).

---

## 4. Points à confirmer avec Derisier

| Donnée | Valeur actuelle (placeholder) | Source à mettre à jour |
| --- | --- | --- |
| Adresse postale du cabinet | `null` | `Cabinet.adresse` |
| Téléphone du cabinet | `null` | `Cabinet.telephone` |
| Site web | `null` | (champ à ajouter ou config) |
| Banque du compte fidéicommis | "To confirm" | `Cabinet.config.trustBanking.accounts[0].bank` |
| Numéro/transit du compte fidéicommis | "TO-CONFIRM-DERISIER-TRUST" | `Cabinet.config.trustBanking.accounts[0].accountNumber` (ajouter `transit`/`institution` au besoin) |
| Nom complet de l'assistante | "Aaliyah" (prénom seulement) | `User.nom` pour `aaliyah@derisierlaw.com` |
| Email définitif assistante | aaliyah@derisierlaw.com | confirmer ou remplacer |
| Méthodes de paiement réellement acceptées | cheque, wire, bank_draft, credit_card, interac, cash (audit) | `config.paymentMethods` |
| Première liste de dossiers à importer | aucune (base opérationnelle vide) | import via `/import` ou seed manuel |
| Domaine email pour envoi de factures | non configuré | `config.envoiFactureClient` + DNS / domaine SAFE |
| Logo cabinet | non | upload via `/parametres` |
| Numéros de TVQ/HST | non saisis | `/parametres` (HST 13 % par défaut) |

---

## 5. Actions avant la démo

1. **Rejouer le seed canonique** — `npm run seed:derisier:audit` (idempotent, vérifié 2× sans duplication).
2. **Lancer la vérification** — `npm run verify:derisier` ; attendre 39/39 PASS.
3. **Tester le login** sur l'environnement de démo avec `info@derisierlaw.com` puis `aaliyah@derisierlaw.com`. Vérifier que la sidebar affiche bien les 5 sections (Dashboard, Practice, Finances, Tools, Settings) et que "Employees" est absent.
4. **Vérifier la langue EN** sur les écrans suivants au minimum :
   - Dashboard
   - Clients (vide ou avec données placeholder)
   - Matters (vide, prêt pour les vrais dossiers)
   - Billing → Verification, Follow-up
   - Trust accounts (`/comptes`)
   - Settings
5. **Régénérer des mots de passe forts** (Admin + Assistante) avant remise au client ; ne pas livrer les défauts `DerisierLaw2026!`.
6. **Vérifier qu'aucune donnée de test "Cabinet de démo"** n'apparaît dans les listings (clients, dossiers, factures). Si présentes, scoper la requête sur le `cabinetId = derisier-law-on-2026` ou nettoyer côté tenant.
7. **Préparer le scénario de démo** : montrer la création d'un dossier real_estate + d'un dossier immigration, montrer les forfaits préchargés, montrer le ledger trust qui se crée à la 1ʳᵉ entrée.
8. **Imprimer une page d'accompagnement** (1 pager) avec le résumé : plan Cabinet 149 $/mois, 2 utilisateurs, conformité LSO/FINTRAC/PIPEDA, fidéicommis configurable.

---

## 6. Actions après la démo

1. **Collecter** les valeurs "À confirmer" listées en section 4 (adresse, téléphone, banque, transit, etc.).
2. **Mettre à jour** `Cabinet.adresse`, `Cabinet.telephone`, et `Cabinet.config.trustBanking.accounts[0]` (bank, accountNumber, ajouter `transit`/`institution` si utile). Ne pas oublier de re-runner `verify:derisier` après.
3. **Importer la première vague de dossiers** réels via `/import` ou un script ad hoc (à scoper sur `cabinetId = derisier-law-on-2026`).
4. **Configurer l'envoi de factures** — domaine email, signature, gabarit.
5. **Activer la réconciliation fidéicommis** (`modules.fideicommis.reconciliation = "mensuelle"` est déjà configuré, mais l'état actuel `currentState = "never"` doit être corrigé après la première reconciliation réelle).
6. **Saisir les numéros HST/TVH** dans `/parametres`.
7. **Suivi** : prévoir un point hebdomadaire les 4 premières semaines pour ajuster forfaits, débours, et templates à la pratique réelle de Derisier.
8. **Documenter** dans `docs/DERISIER_ACTIVATION_STATUS.md` la date de mise en prod, le nombre d'utilisateurs actifs et les 3 premiers dossiers importés.

---

## 7. Risques connus à monitorer pendant la démo

- **Pas d'UI lecteur de `config.trustBanking`** : le lawyer ne *voit* pas l'écran "compte bancaire fidéicommis du cabinet" ; les métadonnées sont stockées pour usage concierge. Si la question vient en démo, expliquer que c'est géré par concierge en phase 1.
- **Pas d'UI lecteur de `config.currentOffer.monthlyPrice`** : aucune page client n'affiche aujourd'hui le prix mensuel à 149 $ depuis la config cabinet. Le prix vient des pages marketing (`components/marketing/Pricing.tsx`) ou des emails Stripe — pas du tenant.
- **Bundle library désaligné** : `lib/configuration/bundles.ts` utilise des IDs de nav legacy (`tableau-de-bord`, `documents`, `conformite`) qui ne matchent **pas** les vrais IDs de [SidebarNav.tsx](components/layout/SidebarNav.tsx). N'utiliser ce module qu'à titre informatif tant qu'il n'a pas été aligné. Le seed Derisier (`scripts/rebuild-derisier-from-audit.mjs`) court-circuite ce module et écrit les bons IDs (`dashboard`, `gestion`, `finances`, `outils`, `parametres`).
- **Seed legacy** : `lib/seeds/create-derisier-cabinet.ts` contient lui aussi des IDs de nav legacy. Ne pas le rejouer ; la source de vérité est `scripts/rebuild-derisier-from-audit.mjs`.
- **Mots de passe par défaut** : ne pas livrer le cabinet sans avoir régénéré les passwords.
- **Données placeholder visibles** : "To confirm" / "TO-CONFIRM-DERISIER-TRUST" dans la config — invisible côté UI client aujourd'hui (cf. premier point), donc OK pour démo, à corriger en post-démo.
- **Reset password / forgot password** : tester le flow avant démo si les emails sortent vers une vraie adresse.

---

## 8. Commandes de référence

```bash
# Reconstruction idempotente depuis l'audit canonique
npm run seed:derisier:audit

# Vérification automatisée (read-only, 37 checks)
npm run verify:derisier

# Type-check (doit être silencieux)
npx tsc --noEmit -p tsconfig.json
```

---

**Verdict : Derisier est livrable** sous réserve de la collecte post-démo (adresse, banque, transit, mots de passe forts) et des points de vigilance ci-dessus.
