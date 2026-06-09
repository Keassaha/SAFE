# Autorisations Claude Code — mode auto

> Décision CEO, 2026-06-09. Claude Code ne demande plus d'autorisation pour le travail courant.

## Ce qui a été décidé

Le CEO autorise Claude Code à poursuivre son travail **sans demander de confirmation à chaque étape**.
Choix retenu : **mode `auto`** (pas le bypass total), pour garder un filet de sécurité.

## Comportement concret

- **Ne demande plus rien** pour le travail courant : lecture de fichiers, édition de code, commandes shell sûres, recherche.
- **S'arrête encore** pour les actions vraiment destructrices ou irréversibles (ex. `rm -rf`, `git push --force`, suppression de base de données, opérations hors périmètre du projet). C'est volontaire : le filet de sécurité reste actif.
- Si une demande apparaît malgré tout, c'est que l'action est jugée à risque. La valider en conscience.

## Où c'est configuré

Fichier : `.claude/settings.json` (settings projet, partagé).

```json
{
  "permissions": {
    "defaultMode": "auto"
  },
  "skipAutoPermissionPrompt": true
}
```

- `permissions.defaultMode: "auto"` — active le mode auto par défaut à chaque session.
- `skipAutoPermissionPrompt: true` — supprime le dialogue d'opt-in du mode auto (sinon il s'affiche une fois).

> Important : un simple fichier `.md` ne suffit pas à désactiver les demandes d'autorisation. Le vrai levier est `settings.json` ci-dessus. Ce `.md` ne fait que documenter la décision.

## Revenir en arrière

- Repasser en mode normal (Claude redemande) : mettre `"defaultMode": "default"` dans `.claude/settings.json`, ou lancer la commande `/config`.
- Aller plus loin (ne JAMAIS rien demander, même destructeur) : mettre `"defaultMode": "bypassPermissions"`. Déconseillé, aucun filet de sécurité.
- Revoir / éditer les règles à tout moment : commande `/permissions` ou `/hooks` dans Claude Code.

---

**Dernière mise à jour** : 2026-06-09
