# 2026-07-30 — Audit réglementaire d'inspection (Barreau QC + LSO)

## Ce qui a été fait

Audit complet de SAFE contre les deux textes primaires, lus intégralement cette session :
- **RLRQ c. B-1, r. 5**, art. 1 à 87, à jour au 1er avril 2026 (LegisQuébec, texte officiel)
- **LSO By-Law 9**, art. 1 à 24 (PDF officiel LSO) + guide d'application « Summary of By-Law 9 Record Keeping Requirements »

Rapport : [docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md](../compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md)

## Décisions et constats structurants

1. **Scores** : Barreau QC 48/100 · LSO 42/100 · global 45/100 · **NON PRÊT** pour une inspection réelle (2 « oui » sur 25 documents qu'un inspecteur demanderait).
2. **Le pivot est le rapport comptable mensuel de l'art. 41** (QC) / comparaison mensuelle du par. 18(8) (ON). Il n'existe pas. C'est le seul livrable qui décide d'une inspection.
3. **Dette de conception la plus lourde** : SAFE ne modélise pas le **compte bancaire en fidéicommis**. `TrustAccount` est un sous-compte client/dossier. Les art. 36, 41(7), 42, 62-68 QC et le par. 18(8)ii ON sont structurellement inatteignables sans `TrustBankAccount`.
4. **Trois défauts de code exploitables aujourd'hui** :
   - `createTrustWithdrawal` ne vérifie **pas le statut de la facture** → une facture brouillon permet de sortir des fonds client (art. 56(2) QC / par. 9(1)3 ON).
   - `RetraitForm.tsx` offre le mode `ESPECES` → art. 57 QC l'interdit.
   - `createTrustCorrection` n'a ni verrou ni garde de non-négativité.
5. **La 3ᵉ voie du rapprochement est décorative** : `soldeParDossier` est stocké mais jamais comparé (`ecart = soldeRapproche − soldeRegistre` seulement).
6. **La règle des espèces est fausse dans les deux sens** : sur-blocage (aucune des 6 exceptions de l'art. 69 QC / 5 de l'art. 6 ON) et sous-blocage (pas d'**agrégation par dossier**, exigée par l'art. 4(1) ON).
7. **L'attestation signée est plus large que le contrôle réel** — exposition juridique pour l'avocate et pour SAFE. À réduire ou à élargir le contrôle.

## Corrections à porter au registre interne

`lib/compliance/rules.ts` contient **8 entrées erronées ou imprécises**, détaillées au §0.3 du rapport. Notamment :
- **TR-QC-12** : aucun audit CPA indépendant n'est imposé par B-1 r. 5. Question fermée.
- **TR-QC-11** : le « RAP » n'existe pas sous ce nom. L'objet réel est le **rapport comptable annuel de l'art. 42**, sur demande du directeur de l'inspection professionnelle, dans les 30 jours.
- **TR-ON-05** : citation imprécise. L'art. 7(1) dit « **immediately** » ; l'art. 1(3) est une présomption limitée aux par. 9(1)(2)(3) et art. 14.
- **CASH-01** : le mot **« agrégé »** manque, et les exceptions ne sont pas modélisées.

## Roadmap retenue

7 lots, **13 à 18 semaines**. Lot 0 (correctifs immédiats) tient en 3 à 5 jours et retire les deux fautes les plus lourdes.

## À faire hors code (phase 7, à lancer en parallèle)

- Obtenir du Barreau les **formulaires prescrits** des art. 41, 42, 51, 64.
- Obtenir la liste des institutions ayant une entente au sens de **B-1 r. 10** (art. 50).
- Faire relire le rapport mensuel généré par un inspecteur retraité ou un CPA en comptabilité juridique.
- Valider le Form 9A auprès du service Spot Audit du LSO.

## Livrable de suite produit le même jour

[docs/compliance/PROGRAMME_INSPECTION_READY.md](../compliance/PROGRAMME_INSPECTION_READY.md) — spécification exécutable de mise en conformité totale.

- **13 chantiers** (CH-00 à CH-12), chacun autoportant : schéma Prisma, services, validations, écrans, tests, définition de terminé
- **Matrice de traçabilité** : 61 obligations QC + 44 ON + 8 défauts de code = **113 points, tous affectés à un chantier**. Aucun point hors périmètre.
- **6 écarts promesse ↔ produit** identifiés (P-1 à P-6) à partir de la copie publique réelle. Le plus grave : `HomePage.tsx:429` affirme que SAFE compare « les soldes par dossier » — la 3ᵉ voie n'est jamais comparée. CH-00 ferme ça en 3 jours.
- **10 principes de conception non négociables** (PR-1 à PR-10) + 7 automatisations formellement interdites, à porter dans `AGENTS.md`
- **8 dépendances externes** (E-1 à E-8) à lancer dès la semaine 1, dont les formulaires prescrits du Comité exécutif du Barreau (art. 41, 42, 51, 64)
- Jalon commercial **J3 à la semaine 8** : le rapport mensuel s'imprime et se signe

## Différenciateur produit identifié

Le registre de conformité **sourcé, versionné et refusant de s'afficher sans source** (`lib/compliance/rules.ts`, doctrine ADR-011) est une position que personne n'occupe sur le marché. Il est aujourd'hui **éteint** (`COMPLIANCE_RULES_ENABLED` défaut off) et partiellement faux. Allumé, corrigé et branché, c'est un argument de vente unique.
