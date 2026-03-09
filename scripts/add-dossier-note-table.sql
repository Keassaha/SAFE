-- Création de la table DossierNote (à exécuter si prisma db push échoue à cause d'autres contraintes)
-- SQLite: sqlite3 prisma/dev.db < scripts/add-dossier-note-table.sql

CREATE TABLE IF NOT EXISTS "DossierNote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dossierId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DossierNote_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DossierNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DossierNote_dossierId_idx" ON "DossierNote"("dossierId");
CREATE INDEX IF NOT EXISTS "DossierNote_createdById_idx" ON "DossierNote"("createdById");
