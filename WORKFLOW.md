# Workflow — committer & déployer sans problème

> Guide de référence pour faire évoluer SAFE sans rien casser ni rien perdre.
> Pensé pour travailler avec les **flèches bleues** de VS Code (pas le terminal).

---

## 1. Le workflow quotidien (les flèches bleues)

À chaque fois que tu veux sauvegarder / mettre en ligne ton travail :

1. **Tu codes / modifies.**
2. Ouvre le panneau **Source Control** (icône des branches à gauche, ou `Ctrl+Maj+G`).
3. **Vérifie ce que tu vas committer** : ne coche (Stage) que les fichiers que tu veux vraiment. *Ne fais pas « Stage All » à l'aveugle* — c'est comme ça qu'on embarque du code à moitié fait par erreur.
4. Écris un **petit message** en haut (ex. « ajout page X », « fix bouton Y »).
5. Clique **✓ Commit**.
6. Clique **Sync Changes** (les **flèches bleues circulaires**) → ça pousse vers GitHub → **Vercel déploie tout seul**.

### Lire l'état (barre du bas, à gauche)
- **Nom de la branche** : où tu es.
- **↑ N** (flèche haut) : N commits à envoyer (pas encore poussés).
- **↓ N** (flèche bas) : N commits à récupérer.
- **Plus de flèche** = tout est synchronisé. 

---

## 2. Les 3 règles d'or

### Règle 1 — Committe souvent (ne jamais perdre de travail)
Un commit = une sauvegarde permanente dans git. **Dès qu'un bout marche, commit.**
> Du travail non commité peut disparaître (reset, switch de branche, mauvaise manip). Du travail commité, **jamais**.

### Règle 2 — Travaille sur une branche, pas direct sur `main`
Pour tout ce qui n'est pas trivial : crée une branche. `main` reste **toujours propre et déployable**.
- Source Control → `...` (menu) → **Branch → Create Branch** → un nom (ex. `feat/relances-auto`).
- Tu fusionnes dans `main` seulement quand c'est **vérifié**.

### Règle 3 — Ne pousse sur `main` que si « ça build »
**Pousser sur `main` = déploiement en production.** Si le code a une erreur, le déploiement **échoue**.
> Avant de pousser sur main : regarde l'onglet **Problems** de VS Code. S'il est **rouge**, on corrige d'abord. S'il est **vide/vert**, tu peux y aller.

---

## 3. Checklist avant de pousser sur `main`

- [ ] L'onglet **Problems** de VS Code est vide (pas d'erreur rouge).
- [ ] Je n'ai coché (Stage) **que** les fichiers que je veux déployer.
- [ ] Mon message de commit dit ce que ça fait.
- [ ] (Si gros changement) j'ai testé que l'app démarre / la page s'affiche.

Si tu hésites → demande, ou pousse d'abord sur une branche.

---

## 4. En cas de pépin

### J'ai l'impression d'avoir perdu du travail
Rien n'est perdu si c'était commité. Dans le terminal :
```bash
git reflog
```
Ça liste tout l'historique récent (même les branches/commits « disparus »). On retrouve presque toujours.

### Mon déploiement Vercel est rouge (échec)
- Va sur le **dashboard Vercel → Deployments** → clique le déploiement rouge → onglet **Building** : il dit quel fichier / quelle erreur bloque.
- En général : une erreur TypeScript. On la corrige, on re-commit, on re-sync.

### Ma branche est en désordre
Ne force rien. Demande de l'aide avant de faire `reset --hard` ou `push --force` (ce sont les commandes qui font perdre du travail).

---

## 5. Secrets — règles dures (sécurité)

- Les clés / mots de passe vont **uniquement** dans `.env.local` (en local) et dans **Vercel → Environment Variables** (en prod). `.env.local` est dans `.gitignore` → jamais sur git. ✅
- **Ne colle JAMAIS une clé/mot de passe dans un chat** et **ne screenshote jamais** `.env.local` ni la page de variables Vercel avec les valeurs visibles. Si ça arrive : **révoque et régénère** la clé.
- Format d'une ligne : `MA_CLE=valeur` (pas d'espaces autour du `=`, pas de guillemets).
- Après avoir modifié `.env.local` : **enregistre le fichier** + **redémarre `npm run dev`**.

---

## 6. Quelques commandes de secours (terminal)

| Besoin | Commande |
|---|---|
| Voir l'état | `git status` |
| Voir l'historique | `git log --oneline -10` |
| Retrouver du travail perdu | `git reflog` |
| Sur quelle branche je suis | `git branch --show-current` |
| Vérifier qu'une variable est posée (sans la révéler) | `grep -c MA_CLE .env.local` |

> En cas de doute sur une commande qui modifie l'historique (`reset`, `rebase`, `push --force`, `checkout`) : **demande d'abord**. Ces commandes-là sont celles qui peuvent faire mal.

---

*Le principe : committer souvent + brancher pour le risqué + ne pousser sur `main` que du vert. Avec ça, les flèches bleues passent toujours.*
