# 2026-07-30 — CH-00 livré : garde-fous fidéicommis et troisième voie

Premier chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Objet : tenir la promesse publique et fermer les failles exploitables identifiées à
l'[audit du même jour](../compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md).

## Ce qui n'est plus possible

Sept opérations que le code autorisait ce matin et qui sont refusées ce soir, chacune
avec son article et sa porte de sortie :

| Opération | Article |
|---|---|
| Retirer des honoraires sur une facture **brouillon** | art. 56(2) B-1 r.5 / s. 9(1)3 By-Law 9 |
| Retirer sur une facture **jamais envoyée** | idem |
| Retirer **plus que le solde dû** de la facture | art. 56(2), 59 / s. 9(1)3, 9(3) |
| Retirer **avant la date d'émission** de la facture | art. 56(2) |
| Retirer **en espèces** d'un compte général | art. 57 / s. 11 |
| Retirer **sans motif réglementaire** | art. 56 / s. 9(1) |
| Passer une correction qui rend un dossier **débiteur** | art. 59-60 / s. 9(3), 14 |

## La promesse, redevenue vraie

`HomePage.tsx:429` annonce que SAFE compare « le relevé bancaire, le registre du
fidéicommis **et les soldes par dossier** ». La troisième voie était calculée,
stockée, et jamais confrontée : `ecart = soldeRapproche − soldeRegistre`, point.

Désormais `ecartCartesClients` compare la somme des cartes-clients au registre, et
bloque la certification. Les deux voies internes sont dérivées du **registre
append-only**, plus du cache `TrustAccount.currentBalance` — comparer un cache à un
autre cache ne prouvait rien.

Cas attrapé qui passait avant : la banque concorde parfaitement, mais une écriture
est rattachée au mauvais dossier. L'argent d'un client est au mauvais endroit et
tous les totaux tombent juste.

## Décisions de conception

- **Chaque refus cite son article et propose une action de remplacement.** Nouveau
  module `lib/services/fideicommis/errors.ts` : 16 codes stables, article QC, article
  ON, message et remède bilingues, province-aware. Un garde-fou sans porte de sortie
  pousse au contournement, ce qui est pire que de laisser passer.
- **L'attestation n'affirme que ce qui a été vérifié.** L'ancien texte faisait signer
  « conformément au Règlement B-1, r. 5 » alors que le système ne contrôlait que
  l'écart bancaire. Le texte est maintenant généré depuis la liste des contrôles
  réellement exécutés, et se termine par « cette attestation porte sur les seuls
  éléments énumérés ci-dessus ».
- **Un rapprochement certifié est immuable.** L'`upsert` remettait `certifiedAt` à
  null : une re-saisie effaçait silencieusement une signature.
- **Les refus sont journalisés.** Un inspecteur veut voir la tentative bloquée, pas
  son absence.

## Découverte en implémentant

`issueInvoice` pose `sentAt: now` et `statut: "envoyee"` **au moment de l'émission**,
sans envoi réel. Le contrôle « facture envoyée » vérifie donc une date qui n'atteste
pas la transmission au client. Défaut **préexistant**, rendu visible par le chantier,
pas introduit par lui. Chantier de découplage `issuedAt` / `sentAt` à faire avant
CH-03, qui devra citer la date d'envoi dans le rapport mensuel.

## Livré

- `lib/services/fideicommis/errors.ts` (nouveau)
- `trust-transaction-service.ts` — verrou partagé dépôt / retrait / correction, garde
  de non-négativité, validation de facture, motif obligatoire
- `reconciliation-service.ts` — troisième voie, immuabilité, attestation vérifiée
- Migration additive `20260730120000_ch00_trust_compliance_guards` (appliquée en local)
- `RetraitForm`, schémas zod, routes API, hook, i18n FR/EN
- `ch00-withdrawal-guards.test.ts` — 19 tests d'interdiction ; `reconciliation-certify.test.ts` réécrit — 8 tests

**Vérification** : `tsc --noEmit` propre, 789 tests verts. Un fichier échoue sur un
`import "server-only"` non installé (`lib/dossiers/parties-sync.ts`, commit a300a7d) —
défaut préexistant, sans lien.

## Reste à faire dans CH-00

Le patch du registre `lib/compliance/rules.ts` (§7 du programme, 8 entrées erronées)
est reporté au chantier CH-12, où le registre sera allumé et branché.
