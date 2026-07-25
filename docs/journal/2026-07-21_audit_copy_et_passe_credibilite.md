# Audit copy complet + passe crédibilité (P0)

Date : 2026-07-21

## Contexte

Le CEO veut améliorer le copywriting de toutes les pages et l'offre. Décisions prises en séance :
- Prix publics 99 / 149 conservés. Offre fondatrice publique conservée, mais cliente #1
  à honorer d'abord (démarche relationnelle, hors code).
- Chiffres et garanties : requalifier en qualitatif prudent (préchauffage, une seule cliente).
- Ton du grand CTA : passer de la peur du Barreau à l'assurance tranquille.
- Marque : « SAFE » (majuscules) + domaine « safecabinet.ca » partout.

## Méthode

Audit copy complet d'abord (deux relevés verbatim en parallèle : sections d'accueil + pages
autonomes), puis réécriture par ordre de levier. Carte de priorités : P0 crédibilité et règles
dures, P1 cohérence de l'offre, P2 polish.

## Passe P0 livrée (crédibilité + règles dures + marque)

**Requalification des chiffres non sourcés :**
- `ProblemSection.tsx` : « 1 sur 3 » et « un cabinet solo sur trois... » → « 1 écart » +
  formulation qualitative (« beaucoup de cabinets solos seraient en peine de fournir... »).
- `TarificationContent.tsx` : barre de preuve « 5 h récupérées » → « Des heures d'administration
  récupérées » ; garantie 02 « 5 h/semaine au jour 60 » → « Performance mesurée, ou on continue
  avec vous » (plus de nombre-promesse, plus d'em-dash).
- `app/audit-gratuit/page.tsx` : « 8 h/sem libérées » → « Des heures d'administration libérées » ;
  « Conformité Barreau assurée » → « Vos obligations Barreau suivies » (n'assure plus la conformité).
- `lib/tarification.ts` : « recouvrement moyen +28 % » et « 6 à 12 h récupérées » → formulations
  qualitatives.
- `TarificationDashboardWidget.tsx` : « 6 à 12 heures par semaine » → qualitatif.

**Ton du CTA final** (`FinalCta.tsx`, présent sur accueil, fonctionnalités, à propos) :
« avant que votre Barreau ne le découvre » → « noir sur blanc, avant qu'on vous le demande ».
Retrait de « pour vous remettre à jour d'ici 30 jours ».

**Règle « pas de tiret long en milieu de phrase »** (violations corrigées) :
- `TarificationContent.tsx` garantie 02, `app/demo/page.tsx`, `TarificationDashboardWidget.tsx`.

**Cohérence de marque :**
- Nom « Safe » → « SAFE » dans `AuditForm.tsx` (7 occurrences FR/EN).
- Prénom « Jérémy » → « Jérémie » dans `AuditChat.tsx` (2 occurrences, aligné sur a-propos + courriel).
- Domaine « safe-juridique.ca/.com » → « safecabinet.ca » dans `demo/page.tsx` et `AuditReportPDF.tsx`.
- Jargon « plateforme » retiré du pied de page du PDF d'audit ; « workflows » → « flux de travail ».

## Vérifié
- Greps de contrôle : plus aucune occurrence des chiffres/domaines/nom corrigés.
- Typecheck sans erreur sur les fichiers touchés.
- Composants morts repérés (non importés) : `landing/Solution.tsx`, `landing/AgentsIA.tsx`,
  `landing/FAQ.tsx` (leurs tirets ne s'affichent pas ; candidats à suppression).

## Reste à faire
- P1 : /tarification doit mener avec les prix (99/149) plutôt qu'avec l'offre fondatrice ;
  CTA « Nous contacter » → tunnel audit partout ; FeaturesGrid « La solution / installe un
  système » à recentrer côté client.
- P2 : « pour être fiable, il faut être SAFE » (anglicisme), répétition du motif « en ordre »,
  chiffres fictifs du mockup démo.
- Confirmer que les garanties conservées (activation 30 j ou compensation, 30 jours remboursé)
  sont réellement tenues.
