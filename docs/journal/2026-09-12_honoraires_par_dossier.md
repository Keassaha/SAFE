# 2026-09-12 — Honoraires à facturer : un dossier, une facture, et un seuil qui se règle

Hors file du cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md` : ouvert sur
un constat du CEO le soir même, pas sur le rang suivant. Le CEO a tranché la maille
(« par dossier »), a vu l'image, a dit oui. Le code a suivi dans la même session.

## Écran : `/facturation`, section « Honoraires à facturer »   Ouvert le : 2026-09-12

### Ce que le CEO a constaté, mot pour mot
- 2026-09-12 · « je vois dans le registre de temps qu'il y a plusieurs temps non
  facturés mais qu'il y a plusieurs factures qui ne sont pas créées, je ne vois qu'une
  seule option, ce qui n'est pas normal. Pour chaque temps, l'option dans facturation
  d'avoir une facture doit apparaître, avec la possibilité de fixer un seuil de
  facturation. »
- 2026-09-12 · « par dossier, montre-moi la maquette du premier écran »
- 2026-09-12 · « Oui, on met à exécution »

### Mesures avant
- Écarts (design-audit, perRoute) : `/facturation` **20**, `/parametres/facture` 19,
  `/facturation/temps-non-facture` 6, `/facturation/honoraires/[clientId]` 13.
- **Une ligne par client.** L'API additionnait toutes les fiches d'un client dans une
  seule ligne, un seul bouton. Sur la base locale : 24 clients, 210 fiches libres,
  55 dossiers, **24 lignes affichées**. Un client aux trois dossiers voyait une option.
- **Aucune action par fiche** dans le registre de temps : une étiquette « Non facturé »,
  pas de bouton. La seule sortie était le bouton d'en-tête vers la section par client.
- **Un lien mort** sur `/facturation/temps-non-facture` : chaque « Facturer » ouvrait
  une facture vierge, quel que soit le dossier cliqué.
- **Le seuil gravé dans le code** : 100 $ dans `lib/invoice-calculations.ts`, appliqué
  à l'écran (bouton désactivé) et au serveur (création refusée). Aucun cabinet ne
  pouvait le changer ni le mettre à zéro.
- **Les débours réels absents** : la section lisait `Expense`, table que rien ne
  remplit. Les `DeboursDossier` n'atteignaient une facture que par « facturer tout
  le dossier ».
- Le chemin fin existait, caché : la vue détail d'un client permet de cocher des
  fiches une à une, et la page « nouvelle facture » accepte déjà une liste de fiches.
  Deux clics de profondeur, et toujours une facture par action.

### Proposition
- Ce qui change :
  1. **Une ligne par dossier, un bouton par ligne.** Le regroupement vit dans un
     module pur et testé, `lib/billing/honoraires-par-dossier.ts`.
  2. **Le client reste lisible** : une rangée grise le nomme, compte ses dossiers,
     additionne leurs totaux, et offre en un lien « Une seule facture pour les N
     dossiers », qui est l'ancien comportement.
  3. **Le seuil se lit et se règle.** Sous le titre : « Un dossier se propose dès que
     son total atteint 100,00 $ · Modifier le seuil ». Réglage dans
     Paramètres › Facturation, `Cabinet.config.seuilFacturation`, zéro pour tout
     proposer. Le même réglage sert à la section, au détail client et à la création
     d'un brouillon côté serveur.
  4. **Un dossier sous le seuil reste visible**, en gris, avec la mention « sous le
     seuil », au lieu d'être bloqué sans explication.
  5. **Les débours de dossier** entrent dans la ligne et se présélectionnent avec les
     fiches (`deboursIds` accepté par la page « nouvelle facture »).
  6. **La fiche la plus ancienne** passe en ambre après 90 jours, le seuil de
     « dormant » déjà utilisé par « Temps non facturé ».
  7. **Le lien de « Temps non facturé »** emporte le client et les fiches du dossier.
  8. La barre du registre prend la grammaire commune : recherche, client, avocat,
     période, compte. Le filtre client se fait côté écran, parce que côté API
     `clientId` bascule la réponse en détail.
- Ce qui ne change pas, exprès : la fenêtre « nouvelle facture », le calcul des
  taxes, la vue détail par client avec ses cases à cocher, le registre des factures,
  la route de création `client-billables`.
- Images :
  - proposition : `captures/2026-09-12_honoraires_par_dossier_proposition.png`
  - après, écran réel : `captures/2026-09-12_honoraires_par_dossier_apres.png`
  - après, réglage : `captures/2026-09-12_seuil_facturation_apres.png`
- Validation : **2026-09-12, « Oui, on met à exécution »**, image acceptée telle quelle.

### Livraison
- API `app/api/facturation/honoraires/route.ts` : lignes par dossier, `DeboursDossier`
  chargés, `seuil` rendu dans la liste et le détail.
- Vue `HonorairesAFacturerView.tsx` réécrite sur `RegistreFeuille`, `RowMenu`,
  `usePaginationLocale`. La prop `embedded` disparaît : la route autonome redirige
  depuis le 2026-09-10, le code non intégré était mort.
- `lib/cabinet-config.ts` : `seuilFacturation`, `getSeuilFacturation`,
  `SEUIL_FACTURATION_DEFAUT` ; `lib/services/billing/seuil-facturation.ts` pour le
  serveur ; `invoice-service.ts` lit le cabinet et non la constante.
- Paramètres › Facturation : `SeuilFacturationForm.tsx` + action
  `updateSeuilFacturation` (fusion de config, journal d'audit).
- `nouvelle/page.tsx` : `deboursIds`. `unbilled-time.ts` : `timeEntryIds` par dossier.
- Libellés FR et EN.
- Tests : `lib/billing/__tests__/honoraires-par-dossier.test.ts` (3 cas : maille,
  tri, seuil à zéro, brouillon non compté comme libre, fiche sans dossier). 343 tests
  verts sur les dossiers touchés, typecheck vert, lint vert.

### Mesures après
| | Avant | Après |
|---|---:|---:|
| Écarts `/facturation` | 20 | **17** |
| Écarts `/facturation/temps-non-facture` | 6 | **5** |
| Écarts `/parametres/facture` | 19 | 19 |
| Écarts nouveaux, partout | | 0 (total 956 → 954) |
| Lignes de la section, base locale | 24 (par client) | 55 (par dossier) |
| Boutons de facture pour un client à 3 dossiers | 1 | 3 + 1 lien « une seule facture » |
| Seuil réglable par le cabinet | non | oui, zéro accepté |
| Lien « Facturer » de Temps non facturé qui présélectionne | 0 sur 2 | 2 sur 2 |

Vérifié sur le serveur local avec le cabinet de démonstration : le clic sur
« Préparer la facture » ouvre la nouvelle facture avec la fiche du dossier cochée et
son montant ; aucune erreur console hors avertissements de préchargement des polices,
déjà présents.

## Ce que je n'ai pas pu vérifier
- Un client à plusieurs dossiers sur l'écran réel : le cabinet de démonstration local
  n'a que deux dossiers à facturer, un par client. La rangée « Une seule facture pour
  les N dossiers » est testée par le module, pas vue à l'écran.
- Le rendu en anglais.
- Le registre de temps lui-même n'a pas reçu de bouton par fiche : le lot `/temps`
  du même jour ne le prévoyait pas. À ouvrir seulement si le CEO le redemande, la
  maille validée étant le dossier.
