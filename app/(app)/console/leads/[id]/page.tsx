import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { LogActivityForm } from "@/components/console/LogActivityForm";

const STAGE_LABELS: Record<string, string> = {
  AWARENESS: "Awareness", ENGAGED: "Engagé", CONTACTED: "Contacté",
  CONVERSING: "Conversation", LEAD_MAGNET_SENT: "Lead magnet envoyé",
  AUDIT_PROPOSED: "Audit proposé", AUDIT_SCHEDULED: "Audit planifié",
  AUDIT_COMPLETED: "Audit complété", CONSULTATION_PHASE2: "Consultation Phase 2",
  READY_TO_SIGN: "Prêt à signer", SIGNED: "Signé",
  ACTIVATION_IN_PROGRESS: "Activation", LIVE: "Live", AMBASSADOR: "Ambassadeur",
};
const SOURCE_LABELS: Record<string, string> = {
  LINKEDIN_DM_WARM: "LinkedIn DM tiède", LINKEDIN_DM_COLD: "LinkedIn DM froid",
  LINKEDIN_POST: "LinkedIn post", SEO_ORGANIC: "SEO organique",
  SEO_LOCAL_BUSINESS: "SEO local", REFERRAL: "Referral", AUDIT_GRATUIT: "Audit gratuit",
  EMAIL: "Email", FACEBOOK_GROUP: "Facebook", RECRUITMENT_AGENCY: "Agence recrutement",
  OFFLINE: "Offline",
};
const STATUT_LABELS: Record<string, string> = {
  NURTURE_ONLY: "Nurturing seul", QUALIFIED_AUDIT: "Qualifié pour audit",
  ACTIVE_CUSTOMER: "Client actif", CHURNED: "Perdu", PAUSED: "En pause",
};
const ROLE_LABELS: Record<string, string> = {
  AVOCAT_PROPRIETAIRE: "Avocat propriétaire", AVOCAT_ASSOCIE: "Avocat associé",
  ADJOINT_JURIDIQUE: "Adjoint juridique", COMPTABLE_INTERNE: "Comptable interne",
  MANAGER_CABINET: "Manager cabinet", PARTENAIRE_STRATEGIQUE: "Partenaire stratégique",
};
const ADKAR_LABELS: Record<string, string> = {
  NON_INITIE: "Non initié", SENSIBILISE: "Sensibilisé", CONVAINCU: "Convaincu",
  MAITRISE: "Maîtrise", AMBASSADEUR: "Ambassadeur",
};
const TAILLE_LABELS: Record<string, string> = {
  SOLO: "Solo", DEUX_CINQ: "2-5 avocats", SIX_DIX: "6-10 avocats",
  ONZE_VINGT: "11-20 avocats", VINGT_UN_CINQUANTE: "21-50 avocats", PLUS_CINQUANTE: "50+ avocats",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-100 text-emerald-800"
    : score >= 40 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-700";
  return <span className={`inline-flex items-center rounded px-2.5 py-1 text-sm font-semibold ${color}`}>Score {score}</span>;
}
function StageBadge({ stage }: { stage: string }) {
  const isLive = stage === "LIVE" || stage === "AMBASSADOR";
  const isClosing = ["SIGNED", "ACTIVATION_IN_PROGRESS", "READY_TO_SIGN"].includes(stage);
  const color = isLive ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : isClosing ? "bg-blue-100 text-blue-800 border-blue-200"
    : "bg-zinc-100 text-zinc-700 border-zinc-200";
  return <span className={`inline-flex items-center rounded border px-2.5 py-1 text-sm font-medium ${color}`}>{STAGE_LABELS[stage] ?? stage}</span>;
}
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-900">{value ?? "—"}</span>
    </div>
  );
}
function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}
function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function ConsoleLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      cabinet: { select: { id: true, nom: true, email: true } },
      championInterne: true,
      contacts: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { date: "desc" }, take: 50 },
      tasks: {
        where: { statut: { in: ["A_FAIRE", "EN_COURS"] } },
        orderBy: [{ priorite: "asc" }, { dateEcheance: "asc" }],
      },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.raisonSociale}
        description={`${lead.province} ${lead.ville ?? ""} · ${TAILLE_LABELS[lead.tailleCabinet] ?? lead.tailleCabinet}`}
        backHref="/console/leads"
        backLabel="Tous les cabinets"
      />

      <div className="flex flex-wrap items-center gap-3">
        <StageBadge stage={lead.stageLead} />
        <ScoreBadge score={lead.score} />
        <span className="inline-flex items-center rounded border border-zinc-200 px-2.5 py-1 text-sm text-zinc-700">
          {STATUT_LABELS[lead.statutLead] ?? lead.statutLead}
        </span>
        <span className="text-sm text-zinc-500">
          via {SOURCE_LABELS[lead.sourceLead] ?? lead.sourceLead}
        </span>
        {lead.cabinet && (
          <Link
            href={`/clients`}
            className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Voir comme {lead.cabinet.nom} →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardContent className="space-y-1 px-6 py-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Profil cabinet
              </h2>
              <InfoRow label="Province" value={lead.province} />
              <InfoRow label="Ville" value={lead.ville} />
              <InfoRow label="Taille" value={TAILLE_LABELS[lead.tailleCabinet]} />
              <InfoRow label="Domaines de pratique" value={lead.domainesPratique.join(", ")} />
              <InfoRow label="Mode facturation" value={lead.modeFacturation ?? "—"} />
              <InfoRow label="Logiciel actuel" value={lead.logicielActuel ?? "Inconnu"} />
              <InfoRow label="Fidéicommis" value={lead.aTrustAccounting ? "Oui" : "Non"} />
              <InfoRow label="Avocats estimés" value={lead.nbAvocatsEstime} />
              <InfoRow label="Date d'ajout" value={formatDate(lead.createdAt)} />
              {lead.convertedAt && (
                <InfoRow label="Converti le" value={formatDate(lead.convertedAt)} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 px-6 py-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Scoring détaillé
              </h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Firmographique</span>
                  <span className="tabular-nums">{lead.scoreFirmographique} / 40</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Engagement</span>
                  <span className="tabular-nums">{lead.scoreEngagement} / 40</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Enrichissement</span>
                  <span className="tabular-nums">{lead.scoreEnrichissement} / 20</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{lead.score} / 100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {lead.tags && lead.tags.length > 0 && (
            <Card>
              <CardContent className="space-y-2 px-6 py-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="px-6 py-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Contacts ({lead.contacts.length})
              </h2>
              {lead.contacts.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Aucun contact identifié. Ajoutez le décideur et le champion interne pour activer le scoring bottom-up.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {lead.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start justify-between py-3">
                      <div>
                        <div className="font-medium text-zinc-900">
                          {contact.prenom} {contact.nom}
                          {contact.estDecideur && (
                            <span className="ml-2 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-blue-800">Décideur</span>
                          )}
                          {contact.estChampionInterne && (
                            <span className="ml-1 inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-800">Champion</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {ROLE_LABELS[contact.roleCrm] ?? contact.roleCrm}
                          {contact.titre && ` · ${contact.titre}`}
                        </div>
                        {contact.email && <div className="mt-1 text-xs text-zinc-600">{contact.email}</div>}
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <div>ADKAR : <span className="text-zinc-700">{ADKAR_LABELS[contact.awareness]}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {lead.tasks.length > 0 && (
            <Card>
              <CardContent className="px-6 py-5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                  Tâches ouvertes ({lead.tasks.length})
                </h2>
                <div className="divide-y divide-zinc-100">
                  {lead.tasks.map((task) => (
                    <div key={task.id} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-900">{task.titre}</span>
                        <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          task.priorite === "HAUTE" ? "bg-red-100 text-red-800"
                          : task.priorite === "BASSE" ? "bg-zinc-100 text-zinc-600"
                          : "bg-amber-100 text-amber-800"}`}>
                          {task.priorite}
                        </span>
                      </div>
                      {task.dateEcheance && (
                        <div className="mt-1 text-xs text-zinc-500">Échéance : {formatDate(task.dateEcheance)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="px-6 py-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Timeline ({lead.activities.length} activité{lead.activities.length > 1 ? "s" : ""})
              </h2>
              <div className="mb-4">
                <LogActivityForm leadId={lead.id} />
              </div>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Aucune activité enregistrée. Logguez votre premier DM, call ou note pour démarrer le scoring engagement.
                </p>
              ) : (
                <ul className="space-y-3">
                  {lead.activities.map((activity) => (
                    <li key={activity.id} className="flex gap-3 border-l-2 border-zinc-200 pl-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-zinc-900">{activity.type.replace(/_/g, " ")}</span>
                          <span className="text-[10px] uppercase tracking-wide text-zinc-500">{activity.direction}</span>
                        </div>
                        {activity.sujet && <div className="text-sm text-zinc-700">{activity.sujet}</div>}
                        {activity.contenu && (
                          <div className="mt-1 text-xs text-zinc-600">
                            {activity.contenu.slice(0, 200)}{activity.contenu.length > 200 ? "…" : ""}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-zinc-500">{formatDateTime(activity.date)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {lead.notesPrivees && (
            <Card>
              <CardContent className="px-6 py-5">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">Notes privées</h2>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{lead.notesPrivees}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
