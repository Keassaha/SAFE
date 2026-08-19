/**
 * SAFE — Constantes partagées de la collecte de pièces.
 *
 * Module FEUILLE : aucune importation, donc lisible aussi bien par une action serveur
 * que par un écran client. Deux raisons de ne pas le fondre ailleurs :
 *
 *   - un fichier « use server » ne peut exporter que des fonctions asynchrones, et une
 *     constante y casse TOUT le module d'actions, pas seulement la ligne fautive ;
 *   - le service des pièces attendues importe Prisma, qui n'a rien à faire dans le
 *     paquet envoyé au navigateur.
 *
 * L'écran et le serveur doivent refuser un motif au même endroit. Deux nombres qui
 * divergent, et le bouton s'active sur un motif que le serveur rejettera.
 */

/** Longueur minimale d'un motif de remplacement. Alignée sur les motifs comptables. */
export const MOTIF_REMPLACEMENT_MIN = 10;
