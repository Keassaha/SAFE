# Taux de l'avocat pré-rempli automatiquement à la saisie de temps

**Date** : 2026-07-08
**Type** : feature (câblage, aucune migration)

## Demande CEO
« Le taux d'un avocat doit être directement enregistré automatiquement mais modifiable, de sorte à éviter des erreurs de saisie. »

## Constat
Le champ `User.defaultHourlyRate` existait déjà (peuplé à l'invitation depuis la rémunération) et `Dossier.tauxHoraire` aussi, mais **aucun des deux ne remontait jusqu'au formulaire de saisie de temps**. Le taux était retapé à la main à chaque entrée (chrono initialisé à 0), source d'erreurs.

## Ce qui a été buildé
Câblage sur 4 fichiers, sans toucher le schéma :

- `app/api/temps/context/route.ts` : le contexte renvoie désormais `defaultHourlyRate` (users) et `tauxHoraire` (dossiers).
- `lib/hooks/useTemps.ts` : type de retour de `useTempsContext` élargi.
- `components/temps/TimeEntryFormModal.tsx` :
  - pré-remplissage automatique du taux à l'ouverture et au changement d'avocat/dossier ;
  - cascade de résolution : **taux du dossier (négocié) → sinon taux de l'avocat sélectionné** ;
  - verrou `rateManuallyEdited` : dès que l'utilisateur tape un taux à la main, l'auto-remplissage ne l'écrase plus (et une entrée existante avec un taux est considérée verrouillée) ;
  - mention discrète « Pré-rempli à partir du taux de l'avocat, modifiable. »
- `messages/fr.json` / `messages/en.json` : clé `timer.form.rateAutofillHint`.

Couvre les 3 points d'entrée du formulaire (page Temps, tableau, chrono global) car tous tirent du même contexte.

## Décisions
- **Priorité dossier > avocat** : un taux négocié au dossier prime sur le taux par défaut de l'avocat (cohérent avec la logique de facturation « override au dossier »).
- Le champ reste un input normal, toujours modifiable. L'auto-remplissage ne fait que fixer la valeur dérivée.

## Vérifié
- `tsc --noEmit` : 0 erreur.
- fr.json + en.json : JSON valide.
- Preuve visuelle **non faite** : tous les ports dev (3001, 3010) occupés par d'autres chats. À valider à l'écran.

## Parking lot (pas fait, à décider)
- Filet côté serveur : dans `POST /api/temps`, si `tauxHoraire` = 0 et facturable, retomber sur `user.defaultHourlyRate`/`dossier.tauxHoraire` avant de rejeter. Défense en profondeur, non demandé.
- UI pour éditer le taux par défaut d'un avocat après l'onboarding (aujourd'hui fixé seulement à l'invitation).
