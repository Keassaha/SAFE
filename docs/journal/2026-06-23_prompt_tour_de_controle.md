# 2026-06-23 — Prompt « tour de contrôle » pour Claude design

## Demandé par le CEO
Un prompt clair, à coller dans Claude design, pour concevoir la tour de contrôle : le tableau de bord unique depuis lequel piloter le business « simplement et efficacement ».

## Produit
Un prompt autoporteur (ne dépend pas de l'accès au repo), ancré sur l'identité visuelle adoptée et le périmètre Console v1.1 :
- Tokens réels (forêt `#0B1F19` / soft `#16312A`, albâtre `#EFF2ED`, surface `#FBFCFA`, encre `#1F2A24`, muet `#5A665F`, vérifié `#2E7D5B`, ambre `#B07A1C`).
- Polices : Instrument Serif (titres/voix), Geist (UI), Geist Mono (chiffres).
- Coque : rail de navigation à gauche, logo sceau, dashboard orienté priorité (priorité unique → « Ensuite » → indicateurs calmes).
- 6 volets : Marketing/prospection, Clients, Support, Comptabilité, Facturation, Contenu.
- Garde-fou phase préchauffage intégré : bandeau « jour X / 90 », KPIs conversations + engagement mis en avant, pas de MRR pipeline.
- Règles d'écriture brand appliquées au prompt : vouvoiement, pas de jargon, pas de tirets longs en milieu de phrase.

## Décidé / cadré
- Livrable visé par défaut : maquette interactive haute fidélité (un écran, données de démo crédibles), variante adoptable car même socle technique que SAFE.
- Option laissée au CEO : basculer le livrable vers React/Next réel (mêmes tokens) si on veut sauter l'étape maquette.

## Sources
- `docs/SAFE_IDENTITE_VISUELLE.md` (adopté)
- `docs/journal/2026-06-22_design_adopte_safe_interface.md`
- `docs/product/CRM_SPEC_v1.md` (section v1.1, « tour de contrôle » 7 modules)

## v2 (même session) — prompt enrichi après critique
Le CEO a demandé « qu'est-ce qui manque ». Trous identifiés et repliés dans une v2 :
- Les trois états à concevoir : journée chargée, journée calme (affirmé, pas un vide), surcharge.
- Verdict de santé en une ligne tout en haut (« Votre entreprise va bien aujourd'hui »).
- Vocabulaire d'action depuis l'accueil : Faire, Reporter, Déléguer, Ignorer.
- « Pourquoi cette priorité » : demi-ligne de justification sous le titre.
- Contexte d'usage : matin, mobile d'abord, lecture en moins d'une minute.
- Anti-exemples (négatif) : pas de badges rouges, pas de graphiques à interpréter, pas de vanité.
- Données de démo concrètes imposées (Dérisier, fidéicommis en retard 3 j, 2 450 $ juin, billet #2).
- Contraste AA exigé.
Volontairement exclu pour protéger « simple et efficace » : écrans intérieurs, filtres, préférences, second niveau de nav.

## Prochaine action
CEO colle la v2 dans Claude design, génère les trois états, puis on juge un critère : verdict de santé + priorité du jour lisibles en 2 s. Ensuite on décide maquette vs adoption code.
