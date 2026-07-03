# 2026-07-02 — Doctrine de développement dérivée de la vision

## Contexte
Le CEO a mis en pause le plan correctif issu de l'évaluation de maturité (7/10) et demande :
du point de vue de la vision et de la philosophie SAFE, comment continuer à développer
l'application et la rendre toujours plus efficace. Réponse construite par relecture
parallèle des 5 corpus fondateurs (positionnement, produit/catalogue, moteur audit→bundle→config,
doctrine compta/delivery, journal des 5 dernières semaines).

## Les invariants (la constitution SAFE, déjà écrite)
1. **Copilote du copilote** : l'adjointe prépare, l'avocate décide. Toute feature arme
   l'adjointe (contrôle, visibilité, statut), jamais ne la remplace.
2. **Protection avant productivité** : SAFE protège le permis d'exercice. « Difficile à
   mal utiliser » > complet. Le produit vend une émotion : « rien n'est oublié ».
3. **Config, pas code** : « on assemble du catalogue, pas du code ». Onboarder un cabinet
   = produire un manifeste, pas écrire du code. Custom explicite, jamais glissé au standard.
4. **L'humain valide** : l'IA et la capture suggèrent, ne jugent jamais. Fidéicommis
   jamais automatisé. File de validation 1 clic, pas d'écriture directe.
5. **Audit-grade par défaut** : append-only, correction par écriture inverse, idempotence,
   AuditLog. « Jamais conforme sans preuve. »
6. **Doctrine = spec** : tout concept s'écrit dans la doctrine avant d'être codé.
   Le code qui diverge est un bug.
7. **Silence par défaut** (TDAH) : digest > alertes, une seule nextAction, jamais notifier
   un manquant non actionnable.
8. **Ne jamais survendre** : captures réelles, formulations prudentes, le copy suit le code.

## Le diagnostic méta (convergence des 4 rapports de tensions)
**Le moteur est en avance sur l'écran, et l'écran est en avance sur la mise en service.**
Pattern récurrent « moteur livré, jamais branché » : export QB/Xero/Sage testé mais appelé
nulle part, alertes anti-erreurs jamais affichées, profil A/B/C/D qui ne pilote pas l'UI,
verrouillage de période invisible, taxonomie configurée non consommée par le formulaire
dossier, flag CATALOG_DRIVEN_NAV éteint depuis le 7 juin, ADR-009 dormant. Et en bout de
chaîne : prod non redéployable (split-brain Supabase). La valeur existe, elle n'atteint
pas l'utilisatrice.

## La doctrine de développement (5 règles)
1. **Brancher avant de bâtir.** Le critère de « terminé » devient : visible et actionnable
   à l'écran par l'adjointe. Épuiser le stock de moteur-sans-bouton avant toute capacité neuve.
2. **Filtre des 3 questions** pour toute nouvelle feature : (a) est-ce que ça arme
   l'adjointe ? (b) est-ce que ça protège le permis ? (c) est-ce que ça se pilote par
   config ? 0/3 = refus. 1+/3 = candidat, prioriser les 3/3.
3. **La boucle Dérisier → config → catalogue.** Chaque irritant réel de la cliente devient
   un paramètre de bundle (ou un custom explicite), jamais du sur-mesure silencieux.
   L'efficacité vient de la généralisation, pas de l'accumulation.
4. **Le terrain avant les audits.** 5 semaines de journal sans une seule citation de
   Dérisier/Aaliyah. Reprendre la règle de phase : instrumenter l'usage réel, capturer
   chiffres et citations, laisser le terrain choisir le prochain chantier.
5. **Une décision d'écriture avant chaque chantier.** Spec courte ou ADR le jour même,
   flag éteint par défaut, parité testée, migrations additives, Dérisier sanctuarisée.

## Découvertes urgentes annexes (hors code)
- **Constitution en péril** : POSITIONNEMENT_copilote_avocat_assistant.md et
  PLAN_CAPTURE_PASSIVE_MULTI_TIERS.md n'existent QUE dans des worktrees jetables
  (.claude/worktrees/). À rapatrier dans le repo principal, sinon risque de perte matérielle.
- **Doctrines divergentes à trancher (décisions CEO, pas du code)** :
  (a) KB compta du pipeline (partie double obligatoire, avril) vs doctrine v2 (mono-axe,
  juin) : le prochain delivery lira la KB périmée ; (b) deux modèles de prix concurrents
  (tiers capture passive 49/149/349 vs setup+149 fondateur 50$) ; (c) catalogue d'outils
  vs ongletsActifs des bundles : deux mécanismes de composition du menu non arbitrés.

## Idée post (content-bank inexistant dans le repo, noter ici)
« Le moteur était prêt depuis 3 semaines. Il manquait le bouton. » Post build-in-public
sur la différence entre coder de la valeur et la mettre en service ; hook honnête,
customer-centric (l'adjointe ne voit que l'écran).
