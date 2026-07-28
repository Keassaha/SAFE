-- Révocation de sessions JWT (audit de sécurité 2026-07-28, §M1).
--
-- Les sessions SAFE sont des JWT de 30 jours dont `role` et `cabinetId` étaient
-- figés à la connexion. Une rétrogradation de rôle, une désactivation d'employé
-- ou une réinitialisation de mot de passe n'invalidait donc aucune session
-- existante : jusqu'à 30 jours d'accès résiduel avec les anciens droits.
--
-- `sessionsValidFrom` sert de marqueur : tout jeton émis avant cette date est
-- refusé au prochain contrôle (voir lib/auth.ts, callback `jwt`).
--
-- Additive et nullable : aucune session en cours n'est cassée par la migration.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionsValidFrom" TIMESTAMP(3);
