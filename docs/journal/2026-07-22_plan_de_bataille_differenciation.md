# Plan de bataille — différenciation SAFE

**Date de départ** : 2026-07-22
**Source** : [audit produit 2026-07-22](2026-07-22_audit_produit_differenciation_conformite.md)
**Nature** : plan à suivre à la lettre. Ordre non négociable. Une étape à la fois.

---

## Le contrat (règle du jeu)

1. **Une étape à la fois, dans l'ordre.** On ne touche pas à l'étape N+1 tant que l'étape N n'est pas cochée « terminé ».
2. **Terminé = à l'écran.** Une étape n'est pas finie parce que le code est écrit. Elle est finie quand le comportement est visible et vérifié dans l'app.
3. **Anti-éparpillement.** Toute idée, envie, ou nouveau chantier qui surgit en cours de route va dans la section « Buffer capturé » en bas de ce fichier. Il n'entre PAS dans le plan tant que le plan n'est pas terminé. Claude a mandat de refuser tout écart et de renvoyer l'idée au buffer.
4. **Pas de saut de file.** Même si une étape plus loin semble plus excitante, on ne la fait pas avant son tour.
5. Le plan est terminé quand les cinq étapes sont cochées. Pas avant.

---

## Étape 1 — Rebrancher l'IA en production

**Pourquoi** : votre différenciateur numéro un (import Interac, résumé de dossier, classification) est silencieusement éteint en prod parce que `ANTHROPIC_API_KEY` n'y est pas. Meilleur ratio effort/impact de tout l'audit.

**Ce qu'il faut faire** :
- Poser `ANTHROPIC_API_KEY` dans les variables d'environnement Vercel (production).
- Redéployer.

**Définition de terminé** :
- La variable apparaît dans l'environnement Production de Vercel.
- Un test en prod: une fonctionnalité IA (résumé de dossier OU import de preuve) produit un vrai résultat, pas un fallback vide.

**Qui fait quoi** : Claude prépare et exécute la commande, le CEO valide le résultat à l'écran.

**Statut** : ✅ terminé (2026-07-22)

**Constat** : l'audit se trompait. `ANTHROPIC_API_KEY` était déjà en production Vercel (posée 47 j avant) et valide. Variable serveur lue au runtime, pas besoin de redéploiement. Vérifié à l'écran : le résumé de dossier IA produit un vrai résultat en prod.

---

## Étape 2 — Agenda au niveau « assez bon »

**Pourquoi** : c'est le seul trou de table stakes éliminatoire. Un cabinet vérifie « est-ce que je vois mon calendrier » en trois secondes. Aujourd'hui, non. Le backend (`CalendarEvent`, actions CRUD) existe déjà, donc c'est surtout de l'interface.

**Ce qu'il faut faire** :
- Une vue calendrier visuelle (mois, et au minimum une liste des événements à venir).
- Créer / voir / modifier / supprimer un événement depuis cette vue.
- Lien avec dossier et client déjà présent en modèle, à exposer.

**Périmètre à ne PAS dépasser** (anti-sur-ingénierie) : pas d'intégration Google/Outlook, pas de vue semaine/jour sophistiquée, pas de récurrence complexe. On vise « assez bon », pas parfait.

**Définition de terminé** :
- Le CEO ouvre l'app, voit un calendrier avec des événements, en crée un et le voit apparaître.

**Statut** : ✅ code fait et vérifié à l'écran en local (2026-07-22). Reste à déployer. Flux complet prouvé : menu Pratique > Agenda > calendrier > création d'un événement > apparaît (compteur + case du jour + panneau). Événement test supprimé après vérification.

**Constat** : l'audit se trompait à nouveau. Le calendrier existait déjà, complet et au design de la maison (`SafetrackCalendar` : vue mois, création par clic, couleurs par type, panneau du jour), rendu sur `/gestion/lextrack`. Le vrai trou était la découvrabilité : aucune entrée de menu n'y menait. De plus, le menu réellement affiché vient de `components/layout/Header.tsx` (nav du haut), pas de `SidebarNav.tsx`. Correctif : ajout d'une entrée « Agenda » dans le groupe Pratique de `Header.tsx` (+ traductions FR/EN `navAgenda`) et, par cohérence, dans `SidebarNav.tsx`. Vérifié à l'écran en local : le menu Pratique montre Agenda, le clic ouvre le calendrier, zéro erreur.

---

## Étape 3 — Rendre le readiness visible et fusionner les deux scores

**Pourquoi** : le moteur de conformité (le moat) est bâti mais invisible au cabinet. Et il y a deux scores divergents dans le produit, source de confusion. Rendre le readiness visible = activer un moteur déjà construit et en faire une preuve de vente.

**Ce qu'il faut faire** :
- Exposer le readiness 14 domaines au cabinet sur `/conformite`, en vert/jaune/rouge par domaine.
- Détail derrière le score fiducie (solde par dossier, écart, prochaine échéance).
- Retirer / fusionner le second score (6 vérifications) pour n'en garder qu'un.
- Derrière le flag `COMPLIANCE_DASHBOARD_V2`.

**Définition de terminé** :
- Le CEO ouvre `/conformite` et voit un seul tableau de bord, avec l'état des 14 domaines et le détail fiducie.

**Statut** : ✅ code fait et vérifié à l'écran en local (2026-07-22). Reste à déployer + poser le flag en prod.

**Réalisé** : nouvelle vue `components/conformite/ReadinessOverview.tsx` (score « Prêt pour l'inspection » + 14 domaines vert/jaune/rouge, actionnables en premier, lien « Corriger » par domaine). Page `/conformite` recâblée : readiness en tête, ancien tableau opérationnel gardé en section « Points opérationnels » dessous, le tout derrière le flag `COMPLIANCE_DASHBOARD_V2`. Namespace i18n `conformite` (FR/EN) ajouté. Vérifié à l'écran (cabinet test, score 78 %, 14 domaines, 0 erreur).

**Affinages faits (2026-07-25, à la demande du CEO)** :
- Détail fiducie « solde par dossier » : nouveau panneau `components/conformite/TrustDetailPanel.tsx` (total + solde par dossier lisible + prochain rapprochement), alimenté par un nouveau service `getTrustBalancesByDossier`. Vérifié à l'écran avec une transaction test (5 000 $), puis nettoyée.
- Widget opérationnel entièrement localisé FR/EN (`ComplianceDashboard` + clés `conformite.*`) ; les libellés d'incidents traduits par id (repli serveur conservé). Vérifié : plus aucune chaîne anglaise codée en dur.

**Nuance vérifiée** : l'anglais résiduel visible sur le cabinet test (« Trust Reconciliation », « Compliance Reports », en-tête) vient de la copie réglementaire liée à la province (cabinet test = Ontario/LSO). `getTrustRegulatorCopy` a une branche QC entièrement française : pour un cabinet québécois la page est intégralement en français. Seule vraie chaîne anglaise hors périmètre : la bannière globale « URGENT » (composant `TrustReconciliationBanner`, app chrome).

---

## Étape 4 — Dossier d'inspection en un clic

**Pourquoi** : c'est la feature signature. Elle incarne « SAFE protège votre avenir » et aucun concurrent local ne la fait. Elle transforme la conformité de constat en livrable.

**Ce qu'il faut faire** :
- Un bouton qui génère un paquet daté « prêt pour l'inspection » : état de conformité, historique des rapprochements, preuves, piste d'audit.
- Export PDF ou paquet téléchargeable.

**Définition de terminé** :
- Le CEO clique, obtient un document qu'il pourrait remettre à un inspecteur du Barreau.

**Statut** : ✅ code fait et vérifié à l'écran en local (2026-07-25). Reste à déployer (avec étapes 2-3) + flag prod.

**Réalisé** : bouton « Générer le dossier d'inspection » sur `/conformite` (V2) → route `app/api/conformite/dossier-inspection/route.ts` qui agrège readiness (14 domaines) + rapport annuel de rapprochements fidéicommis + extrait du journal d'audit + identité cabinet, et rend un PDF via `components/conformite/InspectionDossierPDF.tsx` (react-pdf, réutilise letterhead + tokens). Libellés province-aware (FR pour cabinet QC, EN pour ON). Vérifié : route renvoie un vrai PDF (`%PDF`, en-têtes de téléchargement), et rendu visuel confirmé (4 sections propres, qualité document). Réutilise `generateReportData`, `getCabinetReadiness`, `prisma.auditLog`, `getTrustRegulatorCopy` — aucune nouvelle source de données.

**Hors v1 (buffer)** : archiver/stocker le PDF (champ `TrustComplianceReport.pdfUrl` inutilisé), joindre les pièces justificatives réelles, journal d'audit complet (v1 = 60 dernières entrées), plage de dates configurable. Note : les libellés de preuve par domaine viennent du moteur (FR uniquement) — mineur pour un cabinet EN.

---

## Étape 5 — Trancher les 8 questions au Barreau

**Pourquoi** : ces zones INCERTAIN bloquent l'imposition des garde-fous secondaires (déclaration espèces 30 j, FINTRAC bloquant, conflits bloquant, rétention). C'est un travail de fond du CEO, pas du code.

**Les 8 questions** (référence `docs/compliance/QUESTIONS_BARREAU.md`) :
1. RAP (Rapport annuel sur la pratique) : contenu exact et délai de dépôt.
2. Audit annuel par CPA indépendant : obligatoire ou non.
3. Vérification de conflits d'intérêts QC : article précis du Code de déontologie.
4. Vérification de conflits d'intérêts ON : Rules 3.4, texte complet.
5. Loi 25 : articles précis, seuil et délai de notification à la CAI.
6. Régime FINTRAC propre aux avocats (distinct des courtiers).
7. Plafond espèces : périmètre exact (exceptions, agrégation par mandat).
8. Mention TPS/TVQ sur facture : à partir de quel montant.

**Définition de terminé** :
- Chaque question a une réponse sourcée, consignée dans `QUESTIONS_BARREAU.md`.

**Qui fait quoi** : action CEO (peut avancer en parallèle des étapes code 2-4, mais reste une étape à cocher).

**Statut** : 🟡 recherche faite (2026-07-25), clôture dépend du CEO + Barreau. Réponses sourcées consignées dans `docs/compliance/QUESTIONS_BARREAU.md` (section « Réponses de recherche »). Résolues (confiance haute) : délai QC (aucun), FINTRAC ne s'applique PAS aux avocats (CSC 2015), no-cash 7500 + exceptions, n° TPS/TVQ dès 30 $, ON 25 j. Partielles : conflits QC (art. 72-73), Loi 25 (⚠ « 72 h » = RGPD, pas Loi 25), conflits ON (r. 3.4). Ouvertes (vraie question Barreau) : délai du Rapport comptable annuel (Q-BARREAU-02), audit CPA obligatoire ou non (Q-BARREAU-03). **Découverte** : SAFE impose des vérifications FINTRAC aux avocats alors que FINTRAC ne s'y applique pas — cadrage à revoir (les règles d'identification des ordres, elles, s'appliquent). Rien codé sans validation CEO.

---

## Buffer capturé (tout ce qui surgit hors plan va ici)

- Localiser la bannière globale « URGENT — Trust account never reconciled » (`components/layout/TrustReconciliationBanner.tsx`) : encore en anglais codé en dur, visible sur toutes les pages. Hors périmètre étape 3 (app chrome).

---

## Journal d'avancement

- 2026-07-22 : plan créé à partir de l'audit produit.
- 2026-07-22 : Étape 1 terminée. Clé IA déjà en prod et valide (audit erroné), résumé de dossier vérifié à l'écran. Passage à l'étape 2 (agenda).
- 2026-07-22 : Étape 2 terminée (code). Le calendrier existait déjà mais était orphelin. Ajout de l'entrée « Agenda » dans le vrai menu (Header.tsx) + traductions. Flux complet vérifié à l'écran en local. Reste : déploiement (décision CEO).
- 2026-07-22 : Étape 3 bâtie (code). Readiness 14 domaines exposé sur `/conformite` (vue `ReadinessOverview`, score « Prêt pour l'inspection », flag `COMPLIANCE_DASHBOARD_V2`), opérationnel gardé en section secondaire. Vérifié à l'écran (score 78 %). 2 affinages au buffer. Reste : déploiement + flag en prod. À déployer avec étape 2.
- 2026-07-25 : Étape 3 complétée. Les 2 affinages (détail fiducie par dossier + widget opérationnel bilingue) faits et vérifiés à l'écran. Nuance : anglais résiduel = copie réglementaire province (QC = français). Reste au buffer : bannière globale « URGENT » à localiser. Reste à déployer (avec étape 2) + flag prod.
- 2026-07-25 : Étape 4 complétée. Dossier d'inspection PDF en un clic sur `/conformite` (route + InspectionDossierPDF + bouton). Vérifié à l'écran (PDF valide, rendu 4 sections). Reste à déployer + flag prod. 4 étapes sur 5 bâties ; reste l'étape 5 (questions Barreau, devoir CEO).
- 2026-07-25 : Déploiement prod NON fait (décision voie 1). L'arbre de travail contenait 135 fichiers non commités (re-skin design en cours, inachevé) entremêlés avec conformité+agenda dans des fichiers partagés — impossible d'isoler « 2+3 » proprement, et déployer aurait poussé le re-skin inachevé en prod. Choix CEO : commiter l'état pour tout sauvegarder, garder la prod pour quand la branche release sera cohérente. Commit `c456e4c` sur `release/2026-06-11-compta-admin-derisier`. Flag `COMPLIANCE_DASHBOARD_V2` à poser en prod au moment du déploiement.
