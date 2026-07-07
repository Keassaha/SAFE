# Échantillons de reçus (corpus de calibrage extraction de dépense)

> Corpus pour calibrer `lib/ai/extract-expense-receipt.ts` (lot R1, prérequis de R2-R4 de
> [SPEC_IMPORT_RECU_DEPENSE](../SPEC_IMPORT_RECU_DEPENSE.md)).
> Constitué le 2026-07-06. Uniquement des **datasets de reçus réels** (recherche académique /
> Hugging Face), avec **labels de vérité-terrain**. Aucun fichier ne vient d'un site de
> « générateur de reçus » (outillage de fausses notes de frais) : écartés volontairement.

## Mise au point : « entraîner » vs « calibrer »

Votre extracteur, c'est **Claude vision** (pas un modèle que vous entraînez). Ce corpus ne sert donc
**pas** à fine-tuner. Il sert à :
1. **Mesurer** la précision de l'extraction (lancer l'extracteur sur chaque reçu, comparer au label).
2. **Régler le prompt** et attraper les régressions.
3. Servir de **jeu de tests** reproductible pour R1 → R4.

C'est plus solide qu'« un vrai reçu » unique : on obtient un taux de réussite chiffré, pas une impression.

## Format : images, pas PDF (et c'est voulu)

Un vrai reçu de commerce est un **ticket thermique photographié**, presque jamais un PDF. L'extracteur
gère nativement les images (`buildMediaBlock` accepte png/jpeg/webp/gif ET pdf). Ces `.jpg` sont donc
des intrants **plus réalistes** qu'un PDF propre.

## Contenu du corpus (70 reçus réels + labels)

| Dossier | Source | Nb | Nature | Label fourni |
|---|---|---|---|---|
| `sroie/` | ICDAR-2019 SROIE (concours OCR de référence) | 30 | Commerces de détail, EN | `company`, `date`, `address`, `total` |
| `varie-marchands/` | HF `docjay131/receipts-ocr-dataset` | 40 | Restos + retail US (Walmart, McDonald's, Panda Express, Pizza Hut, WinCo…) | JSON riche : `merchantName`, `date`, `time`, `items[]`, prix |

Chaque reçu `X.jpg` a son label `X.json` (vérité-terrain) à côté.

## LE MANQUE QUI COMPTE (à combler par le CEO)

Aucun de ces reçus n'est **canadien** : ni **TPS/TVQ**, ni français. Or le split TPS/TVQ est
justement votre différenciateur (la spec exige de lire les taxes *imprimées*, jamais de les calculer).

Ce corpus calibre le **squelette** (lire marchand / date / total / n° de reçu). Il **ne calibre pas**
le cœur québécois. Pour ça, un seul bon intrant : une quinzaine de **vrais reçus québécois**
photographiés (Bureau en Gros, Jean Coutu, Metro, SAAQ, un resto, essence, stationnement…), montrant
TPS et TVQ ventilées. C'est le « vrai reçu » que la spec R1 réclame au CEO, et le plus rentable à réunir.

## Comment s'en servir (harnais de calibrage suggéré)

Petit script (à écrire quand la clé API est posée) :
1. Pour chaque `*.jpg` : lire le buffer, appeler `extractExpenseReceipt({ buffer, mimeType })`.
2. Comparer `fournisseur`/`date`/`montantTtc` extraits au label `*.json`.
3. Sortir un tableau : reçu | attendu | extrait | ✓/✗ + un taux global.
→ objectif R1 : « JSON correct sur un reçu réel, champ illisible signalé », mais mesuré sur 70 cas.

Blocage connu : `ANTHROPIC_API_KEY` absente des `.env` — l'extracteur renvoie `null` sans elle.

## Sources
- SROIE (ICDAR 2019) : https://github.com/zzzDavid/ICDAR-2019-SROIE — jeu complet ~626 reçus + labels.
- docjay131/receipts-ocr-dataset : https://huggingface.co/datasets/docjay131/receipts-ocr-dataset — 230 reçus, JSON via Gemini.
- Pour scaler : CORD (~11 000 reçus) https://huggingface.co/datasets/naver-clova-ix/cord-v2 · CORU (~20 000) https://huggingface.co/datasets/abdoelsayed/CORU
