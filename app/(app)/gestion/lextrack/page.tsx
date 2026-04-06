import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LexTrackBoard } from "@/components/gestion/LexTrackBoard";
import { SafetrackCalendar } from "@/components/gestion/SafetrackCalendar";
import { SafetrackDossierGrid } from "@/components/gestion/SafetrackDossierGrid";
import {
  dossierActeToTask,
  usersToLawyers,
} from "@/lib/gestion/lexTrackMap";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { ListChecks, Clock, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface PageProps {
  searchParams: Promise<{ dossierId?: string }>;
}

export default async function GestionPlanificationPage({ searchParams }: PageProps) {
  const { cabinetId } = await requireCabinetAndUser();
  const params = await searchParams;
  const dossierId = params.dossierId ?? null;

  if (!dossierId) {
    const [dossiers, allActes, calendarEvents, clients, users, dossiersList] = await Promise.all([
      prisma.dossier.findMany({
        where: { cabinetId },
        take: 50,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          intitule: true,
          numeroDossier: true,
          reference: true,
          type: true,
          client: { select: { raisonSociale: true } },
          actesLexTrack: {
            select: { id: true, status: true, deadline: true, title: true },
          },
        },
      }),
      prisma.dossierActe.findMany({
        where: { dossier: { cabinetId } },
        select: {
          id: true,
          title: true,
          deadline: true,
          status: true,
          dossierId: true,
          dossier: {
            select: { numeroDossier: true, reference: true, intitule: true },
          },
        },
        orderBy: { deadline: "asc" },
      }),
      prisma.calendarEvent.findMany({
        where: { cabinetId },
        include: {
          client: { select: { id: true, raisonSociale: true } },
          dossier: { select: { id: true, intitule: true, numeroDossier: true } },
          assignee: { select: { id: true, nom: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.client.findMany({
        where: { cabinetId, status: "actif" },
        select: { id: true, raisonSociale: true },
        orderBy: { raisonSociale: "asc" },
      }),
      prisma.user.findMany({
        where: { cabinetId },
        select: { id: true, nom: true, role: true },
        orderBy: { nom: "asc" },
      }),
      prisma.dossier.findMany({
        where: { cabinetId, statut: { in: ["actif", "ouvert"] } },
        select: { id: true, intitule: true, numeroDossier: true, clientId: true },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    ]);

    const today = new Date();

    const allActesList = dossiers.flatMap((d) => d.actesLexTrack);
    const totalActes = allActesList.length;
    const actesEnCours = allActesList.filter((a) => a.status === "inprogress").length;
    const actesTermines = allActesList.filter((a) => a.status === "done").length;
    const actesUrgents = allActesList.filter(
      (a) => a.status !== "done" && new Date(a.deadline) < today
    ).length;

    const deadlineEvents = allActes.map((a) => ({
      id: a.id,
      title: a.title,
      deadline: a.deadline.toISOString(),
      status: a.status,
      dossierLabel: `${a.dossier.numeroDossier ?? a.dossier.reference ?? ""} — ${a.dossier.intitule}`,
      dossierId: a.dossierId,
    }));

    const serializedCalendarEvents = calendarEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      status: e.status,
      date: e.date.toISOString(),
      startTime: e.startTime,
      endTime: e.endTime,
      allDay: e.allDay,
      location: e.location,
      clientId: e.clientId,
      clientName: e.client?.raisonSociale ?? null,
      dossierId: e.dossierId,
      dossierLabel: e.dossier ? `${e.dossier.numeroDossier ?? ""} — ${e.dossier.intitule}` : null,
      assigneeId: e.assigneeId,
      assigneeName: e.assignee?.nom ?? null,
    }));

    const tg = await getTranslations("gestion");
    const tm = await getTranslations("matters");

    const summaryCards = [
      { title: tg("events"), value: calendarEvents.length, icon: CalendarDays, accent: "text-blue-600" },
      { title: tm("inProgress"), value: actesEnCours, icon: Clock, accent: "text-amber-600" },
      { title: tm("urgentOverdue"), value: actesUrgents, icon: AlertTriangle, accent: actesUrgents > 0 ? "text-red-600" : "text-neutral-400" },
      { title: tg("completed"), value: actesTermines, icon: CheckCircle2, accent: "text-emerald-600" },
    ];

    const dossierItems = dossiers.map((d) => {
      const actes = d.actesLexTrack;
      const total = actes.length;
      const done = actes.filter((a) => a.status === "done").length;
      const enCours = actes.filter((a) => a.status === "inprogress").length;
      const progressPct = total ? Math.round((done / total) * 100) : 0;
      const enRetard = actes.filter(
        (a) => a.status !== "done" && new Date(a.deadline) < today
      ).length;

      return {
        id: d.id,
        numeroDossier: d.numeroDossier,
        reference: d.reference,
        intitule: d.intitule,
        type: d.type,
        clientName: d.client?.raisonSociale ?? null,
        total,
        done,
        enCours,
        enRetard,
        progressPct,
        href: routes.gestionLexTrackDossier(d.id),
      };
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Planification</h1>
          <p className="mt-1 text-sm text-white/70">
            Agenda, suivi des dossiers et échéances. Cliquez sur un dossier pour ouvrir le tableau de production.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map(({ title, value, icon: Icon, accent }) => (
            <div key={title} className="rounded-safe border border-neutral-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
                </div>
                <div className="w-8 h-8 rounded-safe-sm bg-neutral-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-neutral-400" aria-hidden />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar + Events */}
        <SafetrackCalendar
          deadlines={deadlineEvents}
          calendarEvents={serializedCalendarEvents}
          dossierBaseUrl="/gestion/lextrack"
          clients={clients}
          users={users}
          dossiers={dossiersList}
        />

        {/* Dossier grid */}
        {dossiers.length === 0 ? (
          <div className="rounded-safe border border-neutral-border bg-white p-6 text-center">
            <p className="text-sm text-neutral-500">
              Aucun dossier.{" "}
              <Link href={routes.dossierNouveau()} className="text-primary-700 hover:underline font-medium">Créer un dossier</Link>
            </p>
          </div>
        ) : (
          <SafetrackDossierGrid dossiers={dossierItems} />
        )}
      </div>
    );
  }

  const [dossier, actes, cabinetAvocats] = await Promise.all([
    prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId },
      include: { client: { select: { raisonSociale: true } } },
    }),
    prisma.dossierActe.findMany({
      where: { dossierId, dossier: { cabinetId } },
      include: { assignee: true },
      orderBy: [{ phase: "asc" }, { sortOrder: "asc" }, { deadline: "asc" }],
    }),
    prisma.user.findMany({
      where: { cabinetId, role: "avocat" },
      select: { id: true, nom: true, role: true },
    }),
  ]);

  if (!dossier) {
    return (
      <div className="rounded-safe border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        Dossier introuvable.{" "}
        <Link href={routes.gestionLexTrack} className="underline">Retour</Link>
      </div>
    );
  }

  const lawyers =
    actes.length > 0
      ? usersToLawyers(actes.map((a) => a.assignee).filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i))
      : usersToLawyers(cabinetAvocats);
  const tasks = actes.map((a) => dossierActeToTask(a));
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="h-full min-h-0 -m-4 md:-m-6">
      <LexTrackBoard
        dossierId={dossierId}
        dossierTitle={dossier.intitule}
        dossierRef={dossier.numeroDossier ?? dossier.reference ?? undefined}
        lawyers={lawyers}
        tasks={tasks}
        todayStr={todayStr}
      />
    </div>
  );
}
