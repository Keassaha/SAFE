# Banc d'essai de l'éditeur

Page de mise au point du comportement clavier de TipTap.

Le dossier porte un préfixe `_` : le routeur de Next.js l'ignore, donc cette
page **n'est plus une route** et n'entre plus dans la construction de
production. Elle y expédiait auparavant l'éditeur complet, soit 234 kB de
premier chargement pour 0,8 kB de code propre, et restait atteignable par
n'importe quel compte authentifié.

Pour s'en resservir localement, renommer temporairement le dossier en `test`.
