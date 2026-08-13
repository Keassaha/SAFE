import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditionDashboard } from "@/components/edition/EditionDashboard";

/**
 * Titres de civilité à retirer avant de saluer quelqu'un par son prénom.
 * `nom` vaut « Me Camille Roy » pour une avocate : prendre le premier mot
 * affichait « Bonjour Me. », ce qui n'est le prénom de personne.
 */
const CIVILITES = new Set([
  "me",
  "me.",
  "mtre",
  "mtre.",
  "maitre",
  "maître",
  "m.",
  "mme",
  "mme.",
  "dr",
  "dr.",
  "dre",
  "dre.",
]);

function prenomUsuel(nomComplet: string | null | undefined): string {
  const jetons = (nomComplet ?? "").trim().split(/\s+/).filter(Boolean);
  const sansCivilite = jetons.filter((j) => !CIVILITES.has(j.toLowerCase()));
  return sansCivilite[0] ?? jetons[0] ?? "Maître";
}

export default async function EditionPage() {
  const session = await requireCabinetAndUser();
  if (!session) notFound();

  const { cabinetId, userId } = session;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    user,
    totalDocs,
    docsThisWeek,
    drafts,
    finalDocs,
    workSessionsThisMonth,
    recent,
    activeSessions,
    activeDossiers,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { nom: true } }),
    prisma.richDocument.count({ where: { cabinetId, isArchived: false } }),
    prisma.richDocument.count({
      where: { cabinetId, isArchived: false, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.richDocument.count({
      where: { cabinetId, isArchived: false, statut: "brouillon" },
    }),
    prisma.richDocument.count({
      where: { cabinetId, isArchived: false, statut: "final" },
    }),
    prisma.workSession.aggregate({
      where: {
        cabinetId,
        startedAt: { gte: startOfMonth },
        dureeMinutes: { not: null },
      },
      _sum: { dureeMinutes: true },
    }),
    prisma.richDocument.findMany({
      where: { cabinetId, isArchived: false },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        titre: true,
        type: true,
        statut: true,
        updatedAt: true,
        dossierId: true,
        client: { select: { raisonSociale: true } },
        dossier: { select: { intitule: true } },
      },
    }),
    prisma.workSession.findMany({
      where: { cabinetId, userId, statut: "en_cours" },
      include: {
        richDocument: { select: { id: true, titre: true, dossierId: true } },
        dossier: { select: { id: true, intitule: true } },
        client: { select: { raisonSociale: true } },
      },
      take: 5,
    }),
    prisma.dossier.findMany({
      where: { cabinetId, statut: { not: "cloture" } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        intitule: true,
        numeroDossier: true,
        // `clientId` alimente la création de document : l'API la réclame, et
        // sans lui l'accueil ne pouvait pas créer, seulement lister.
        clientId: true,
        client: { select: { raisonSociale: true } },
        _count: { select: { richDocuments: { where: { isArchived: false } } } },
      },
    }),
  ]);

  const minutes = workSessionsThisMonth._sum.dureeMinutes ?? 0;
  const hoursThisMonth = Math.round((minutes / 60) * 10) / 10;

  return (
    <EditionDashboard
      stats={{
        totalDocs,
        docsThisWeek,
        drafts,
        finalDocs,
        hoursThisMonth,
      }}
      recent={recent.map((r) => ({
        id: r.id,
        titre: r.titre,
        type: r.type,
        statut: r.statut,
        updatedAt: r.updatedAt.toISOString(),
        dossierId: r.dossierId,
        clientNom: r.client?.raisonSociale ?? null,
        dossierIntitule: r.dossier?.intitule ?? null,
      }))}
      activeSessions={activeSessions.map((s) => ({
        id: s.id,
        startedAt: s.startedAt.toISOString(),
        docId: s.richDocument?.id ?? null,
        docTitre: s.richDocument?.titre ?? null,
        dossierId: s.richDocument?.dossierId ?? s.dossier?.id ?? null,
        dossierIntitule: s.dossier?.intitule ?? null,
        clientNom: s.client?.raisonSociale ?? null,
      }))}
      userName={prenomUsuel(user?.nom)}
      dossiers={activeDossiers.map((d) => ({
        id: d.id,
        intitule: d.intitule,
        numeroDossier: d.numeroDossier,
        clientId: d.clientId,
        clientNom: d.client?.raisonSociale ?? null,
        docsCount: d._count.richDocuments,
      }))}
    />
  );
}
