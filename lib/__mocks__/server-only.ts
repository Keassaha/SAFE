/**
 * Substitut de test pour le paquet `server-only`.
 *
 * `server-only` n'exporte rien : c'est un marqueur dont l'unique rôle est de faire
 * échouer le build Next.js quand un module serveur est importé depuis un composant
 * client. Sous vitest, tout s'exécute déjà côté Node, donc le marqueur n'a pas
 * d'objet — mais son absence du `node_modules` faisait échouer le CHARGEMENT de
 * tout fichier de test touchant un module ainsi marqué.
 *
 * Aliasé dans vitest.config.ts. Ne remplace rien en production : le vrai paquet
 * (ou son absence) continue de gouverner le build Next.
 */
export {};
