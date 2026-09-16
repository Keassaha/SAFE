# 2026-09-16 — Exercices précédents, et ce qui sort de SAFE

Onze commits. Deux chantiers : finir la reprise d'historique commencée la veille et la
fondre dans SAFE Import, puis reprendre un audit de sécurité mené en parallèle et
trancher ce que SAFE a le droit d'envoyer à une IA externe.

## Ce que vous avez demandé

D'abord de finir la priorité 2 du chantier de la veille, sans attendre la vraie facture
de Me Dadié qui la bloquait depuis deux jours.

Puis, en cours de route, de renommer « Entrée d'un client », ce qui a ouvert une
meilleure idée que la vôtre et la mienne réunies : **jumeler la reprise à SAFE Import**.
Une porte, deux moyens. D'une facture importée, SAFE devait reconstituer la fiche de
temps, la fiche de débours, la facture, le statut de paiement, **et la comptabilité**.
Avec un espace de correction, justification obligatoire à chaque fois, là où SAFE ne le
permet normalement pas.

Enfin, de reprendre le travail de sécurité laissé en plan par une session parallèle, et
de décider moi-même jusqu'où va le principe « ce n'est pas sécuritaire ».

## Ce que j'ai trouvé

**Trois des quatre mécanismes nécessaires existaient déjà.** Les écritures au journal
datent déjà à la vraie date passée : il suffisait de les appeler. La contrepassation
d'une écriture de module métier a déjà son chemin de service. Le patron « neutraliser
puis rejouer » est écrit et testé depuis le mois d'août. Il manquait surtout de les
brancher.

**Un défaut sérieux, qui datait de la veille.** Le moteur de taxes recalculait le total
d'une facture reprise et contredisait le papier : 596,64 $ mesurés pour une facture de
528,00 $. Je l'avais vu la veille et je l'avais pris pour un comportement normal. C'en
est un, mais pas ici : une reprise **consigne** ce qui a été facturé, elle ne le
recalcule pas.

**Le résumé de dossier envoie le dossier entier.** En allant vérifier ce que chaque
fonction d'IA transmet, celle-là s'est détachée : texte intégral de chaque pièce, notes,
procédures, jugements. Les trois autres n'envoient qu'une seule pièce comptable.

## Ce que ça donne

**Une facture déposée reconstitue tout.** Client et dossier créés au besoin, facture et
ses lignes, heures marquées facturées pour ne jamais ressortir en facturation, débours
sur la fiche du dossier, encaissement, et trois écritures au journal à leurs vraies
dates passées. Vérifié en base : total 528,00 $ comme le papier, débours passé en
recouvré, écritures aux 3 avril, 10 avril et 2 mai.

**SAFE Import est devenu la porte unique.** « Importer des documents » et « Exercices
précédents » côte à côte, l'onglet réservé à qui peut créer des clients, les anciens
liens qui tombent juste.

**L'espace de correction.** Montant, date, statut de paiement, et la nature d'une ligne
qui bascule d'honoraire à débours. Rien n'est réécrit : l'écriture d'origine ne bouge
pas, son effet est neutralisé, la version corrigée est réinscrite, et votre raison reste
attachée à la correction. Éprouvé : correction de 528 $ à 600 $, solde du journal juste,
et inversion des deux natures d'une même facture.

**La sécurité.** Le cloisonnement documentaire entre avocats d'un même cabinet est
corrigé et committé. Et un seul fichier dit maintenant ce qui sort de SAFE : la
classification automatique et le résumé de dossier sont coupés, les trois lectures de
pièces restent permises et refusables cabinet par cabinet. Un refus ne se déguise plus
en panne.

2 265 tests verts. Migration appliquée à la base locale, dérive refermée.

## Ce que je n'ai pas pu vérifier

**L'écran de correction n'a jamais tourné dans un navigateur.** La coquille de
l'application était en cours de modification par la session parallèle et l'hydratation de
`/import` était cassée : les boutons s'affichaient sans répondre. Le service, lui, est
éprouvé contre la base. À reprendre.

**L'extraction n'a toujours pas vu une vraie facture de Me Dadié.** Tout a été éprouvé
sur des factures synthétiques, propres et tapées à la machine. Un scan de travers, une
facture manuscrite ou un tableau à trois colonnes reste à voir.

**Le mot de passe retiré des journaux n'est pas tourné.** Le sortir du fichier ne le sort
ni de l'historique Git ni des clones.

**Rien n'est déployé.** L'ordre de mise en service est écrit :
rotation du secret, sauvegarde indépendante vérifiée, restauration d'essai, **puis**
seulement la migration.

## État du CEO

_(à remplir)_
