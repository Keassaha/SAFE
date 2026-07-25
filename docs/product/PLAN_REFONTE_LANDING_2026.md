# Plan de refonte de la landing SAFE (structure 2026, adaptée)

Date : 2026-07-21
Source d'inspiration : structure SaaS 2026 fournie par le CEO (hero → preuve → problème/solution →
fonctionnalités → démo → témoignages → pricing → FAQ → CTA final) + principes UX (réciprocité,
aversion à la perte, question facile avant décision difficile, goal gradient, defaults intelligents).

> Principe directeur : on adopte la **colonne vertébrale** et les **principes UX**, on rejette les
> tactiques qui exigeraient d'inventer des chiffres, de tutoyer, ou de simuler un funnel qu'on n'a pas.
> Sinon on défait la passe crédibilité qu'on vient de livrer.

---

## A. Ce qu'on NE suit PAS aveuglément (les collisions avec la réalité SAFE)

1. **Titre chiffré « Récupérez 8 h/semaine ».** On vient de retirer ce chiffre non sourcé. Le
   remettre dans le hero serait un recul direct. → On garde un titre orienté résultat mais **honnête**,
   sans nombre invérifiable.
2. **Preuve sociale « logos de cabinets » / « X cabinets utilisent SAFE ».** En préchauffage, une
   seule cliente réelle. Pas de faux logos ni de compteur gonflé (intégrité + audience d'avocats). →
   Preuve sociale **honnête** : conformité, données au Canada, construit en public, fondateur nommé,
   et au plus **un** témoignage réel (Me Derisier) si elle consent.
3. **« Automatisez 75 % de votre facturation ».** Même problème, chiffre inventé. → Bénéfices
   concrets mais qualitatifs.
4. **Section « timeline d'essai gratuit, jour 1/5/7, premier prélèvement ».** SAFE n'a pas d'essai
   self-serve avec carte de crédit. Le funnel SAFE, c'est **audit gratuit → diagnostic → plan**. →
   La « timeline » devient celle de l'audit, pas d'un trial. C'est déjà notre mécanique de réciprocité.
5. **Voix « tu ».** Règle dure : « vous » partout. Non négociable.
6. **« Pas de navigation dans le hero ».** Débattable pour SAFE (audience qui compare, cycle long).
   On garde une navbar sobre, mais on renforce le CTA unique dominant.

---

## B. La séquence cible, section par section (actuel → cible)

Ordre actuel de la home : Hero → ProblemSection → NotYourFault → VirtualEmployees → PourLadjointe →
FeaturesGrid → ProduitEnVrai → Objections → ProcessTimeline → PricingGrid → FoundingOffer → FinalCta.

| # | Section cible | État SAFE | Action |
|---|---|---|---|
| 1 | **Hero** orienté résultat, visuel produit réel, CTA unique dominant | `Hero.tsx` | Affiner le titre (résultat honnête), garder capture réelle, CTA audit dominant, vidéo en lien secondaire discret |
| 2 | **Preuve immédiate** (bandeau sous le hero) | Repères dans le hero seulement | **Ajouter** un bandeau sobre : Conçu au Québec · Conforme B-1 r.5 · Données au Canada · Construit en public. Un témoignage réel si dispo |
| 3 | **Problème → Solution** | `ProblemSection` + `NotYourFault` | Garder (déjà fort). C'est notre aversion à la perte, à garder honnête (pas de peur du Barreau) |
| 4 | **Positionnement copilote** (différenciateur SAFE, absent du gabarit générique) | `VirtualEmployees` + `PourLadjointe` | **Garder**, c'est votre angle unique (adjointe = wedge bottom-up). Resserrer |
| 5 | **Fonctionnalités bento, bénéfices mesurables** | `FeaturesGrid` | Recentrer côté client (retirer « La solution / installe un système »), bénéfices concrets mais honnêtes |
| 6 | **Démo / aperçu** | `ProduitEnVrai` (captures réelles) + page `/demo` | Garder les captures réelles. Option : mini-démo interactive (vous avez déjà `demoKit`/`NavetteDemo`) |
| 7 | **Témoignages / cas** | **Manquant** (préchauffage) | **Ajouter** au plus un témoignage réel (Me Derisier, avec accord) OU un bloc « construit en public » honnête à la place |
| 8 | **Pricing** | `PricingGrid` + `FoundingOffer` | Mener avec les prix **99 / 149** (P1), le funnel = audit d'abord, offre fondatrice ensuite. Pas de « trial timeline » |
| 9 | **FAQ / objections** | `Objections` (home) + FAQ (/tarification) | Garder, ajouter 2 objections manquantes : sécurité des données financières, intégration bancaire |
| 10 | **CTA final** | `FinalCta` (déjà réécrit en assurance) | Garder, ajouter un signal de confiance honnête |

---

## C. Les principes UX mappés à SAFE (le vrai apport des vidéos)

- **Réciprocité** → l'audit gratuit EST le cadeau value-first. Le mettre en CTA unique dominant. On
  peut ajouter un mini « calculateur de temps » **sans promettre de chiffre** (il révèle une fourchette
  à partir des réponses du cabinet, pas une promesse marketing).
- **Aversion à la perte** → nommer le coût de l'inaction (heures non facturées, trésorerie immobilisée,
  risque d'inspection), déjà fait dans ProblemSection. Honnête, pas alarmiste.
- **Question facile avant décision difficile** → premier geste = « Faire mon audit gratuit » (aucun
  engagement), jamais « Acheter ». Déjà le cas, à renforcer comme CTA unique.
- **Goal gradient** → le questionnaire d'audit ne doit jamais démarrer à 0 % de progression. À vérifier
  dans `AuditForm.tsx`.
- **Defaults intelligents** → pré-cocher les choix les plus courants dans l'audit (province Québec,
  facturation horaire) pour réduire l'effort.

---

## D. Plan d'exécution en phases

**Phase 1 — Crédibilité (FAIT).** Requalification des chiffres, ton du CTA, marque unifiée.

**Phase 2 — Hero + preuve immédiate.**
- Affiner le titre du hero (résultat honnête, à valider).
- Ajouter le bandeau de preuve sobre sous le hero.
- CTA audit dominant, vidéo en secondaire discret.

**Phase 3 — Pricing / offre (P1 déjà identifié).**
- `/tarification` et `PricingGrid` mènent avec 99 / 149.
- Funnel audit partout, « Nous contacter » aligné.
- Offre fondatrice reléguée et honorée (cliente #1).

**Phase 4 — Fonctionnalités + copilote.**
- Recentrer `FeaturesGrid` côté client.
- Resserrer `VirtualEmployees` + `PourLadjointe`.

**Phase 5 — Preuve sociale + démo.**
- Bloc témoignage réel (Me Derisier) ou « construit en public ».
- Option mini-démo interactive.

**Phase 6 — Objections + goal gradient.**
- Ajouter 2 objections (sécurité financière, intégration bancaire).
- Progression de l'audit qui ne démarre pas à 0 %, defaults intelligents.

**Phase 7 — Technique.**
- Mobile-first vérifié, LCP ≤ 2,5 s, formulaires courts (3 champs), message-match SEO.

---

## E. Décisions requises avant de lancer la Phase 2

1. **Titre du hero** : honnête orienté résultat (recommandé) vs remettre un chiffre.
2. **Témoignage** : a-t-on l'accord de Me Derisier pour une citation nommée, ou on part sur « construit
   en public » sans témoignage tant que le préchauffage dure ?
3. **Confirmer** qu'on garde l'audit comme wedge (pas de trial self-serve). Recommandé : oui.
