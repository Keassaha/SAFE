import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { LogActivityForm } from "@/components/console/LogActivityForm";
import { AddContactForm } from "@/components/console/AddContactForm";
import { getCabinetSubscriptionState } from "@/lib/services/subscription-state";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import { PLANS, type PlanKey } from "@/lib/stripe";

/**
 * Fiche cabinet riche — Console SAFE Inc.
 * Spec : docs/product/CONSOLE_CONSULTANT_REFACTOR_v1.md (chantier 2).
 *
 * Sections : Profil · Audit · Pratique & rémunération · Abonnement ·
 *            Conformité · Contacts · Timeline · Activation & accès.
 *
 * Page canonique du détail cabinet. /console/leads/[id] y redirige.
 */

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
const FACTURATION_LABELS: Record<string, string> = {
  HORAIRE: "À l'heure", FORFAIT: "Forfait", MIXTE: "Mixte",
};
const VOLUME_LABELS: Record<string, string> = {
  MOINS_100K: "Moins de 100 k$/an", CENT_500K: "100 à 500 k$/an",
  CINQ_CENT_1M: "500 k$ à 1 M$/an", PLUS_1M: "Plus de 1 M$/an",
};

function money(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}
function planLabel(plan: string): string {
  return plan in PLANS ? PLANS[plan as PlanKey].name : plan;
}
function planMonthly(plan: string): number {
  return plan in PLANS ? PLANS[plan as PlanKey].price / 100 : 0;
}
function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}
function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-si-verified/10 text-si-verified"
    : score >= 40 ? "bg-si-amber/[0.13] text-si-amber-ink" : "bg-si-canvas text-si-ink";
  return <span className={`inline-flex items-center rounded px-2.5 py-1 text-sm font-semibold ${color}`}>Score {score}</span>;
}
function StageBadge({ stage }: { stage: string }) {
  const isLive = stage === "LIVE" || stage === "AMBASSADOR";
  const isClosing = ["SIGNED", "ACTIVATION_IN_PROGRESS", "READY_TO_SIGN"].includes(stage);
  const color = isLive ? "bg-si-verified/10 text-si-verified border-si-verified/30"
    : isClosing ? "bg-si-forest/[0.06] text-si-forest border-si-forest/20"
    : "bg-si-canvas text-si-ink border-si-line";
  return <span className={`inline-flex items-center rounded border px-2.5 py-1 text-sm font-medium ${color}`}>{STAGE_LABELS[stage] ?? stage}</span>;
}
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs uppercase tracking-wide text-si-muted">{label}</span>
      <span className="text-sm text-si-ink">{value ?? "—"}</span>
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-si-muted">{children}</h2>;
}

/** Parse JSON sûr → objet plat. */
function safeJson(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export default async function ConsoleClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      cabinet: { select: { id: true, nom: true, email: true, plan: true } },
      championInterne: true,
      contacts: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { date: "desc" }, take: 50 },
      auditSubmission: {
        select: { id: true, status: true, scoreGlobal: true, scores: true, createdAt: true },
      },
    },
  });

  if (!lead) notFound();

  // Données produit (uniquement si le cabinet est provisionné)
  const cabinetId = lead.cabinet?.id ?? null;
  const isProvisioned = Boolean(cabinetId) && lead.cabinet?.nom !== "SAFE";
  const [subscription, trust, cabinetUsers] = await Promise.all([
    cabinetId ? getCabinetSubscriptionState(cabinetId).catch(() => null) : Promise.resolve(null),
    cabinetId ? getTrustReconciliationStatus(cabinetId).catch(() => null) : Promise.resolve(null),
    cabinetId
      ? prisma.user.findMany({
          where: { cabinetId },
          select: { id: true, nom: true, email: true, role: true },
          orderBy: { createdAt: "asc" },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const auditScores = safeJson(lead.auditSubmission?.scores);
  const subPlan = subscription?.plan ?? lead.cabinet?.plan ?? null;
  const mrr = subscription?.active && !subscription.isTrialing && subPlan ? planMonthly(String(subPlan)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.raisonSociale}
        description={`${lead.province} ${lead.ville ?? ""} · ${TAILLE_LABELS[lead.tailleCabinet] ?? lead.tailleCabinet}`}
        backHref="/console/clients"
        backLabel="Tous les clients"
      />

      <div className="flex flex-wrap items-center gap-3">
        <StageBadge stage={lead.stageLead} />
        <ScoreBadge score={lead.score} />
        <span className="inline-flex items-center rounded border border-si-line px-2.5 py-1 text-sm text-si-ink">
          {STATUT_LABELS[lead.statutLead] ?? lead.statutLead}
        </span>
        <span className="text-sm text-si-muted">via {SOURCE_LABELS[lead.sourceLead] ?? lead.sourceLead}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Colonne gauche : profil + scoring + audit ──────────── */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardContent className="space-y-1 px-6 py-5">
              <SectionTitle>Profil cabinet</SectionTitle>
              <InfoRow label="Province" value={lead.province} />
              <InfoRow label="Ville" value={lead.ville} />
              <InfoRow label="Taille" value={TAILLE_LABELS[lead.tailleCabinet]} />
              <InfoRow label="Domaines de pratique" value={lead.domainesPratique.join(", ") || "—"} />
              <InfoRow label="Site web" value={lead.siteWeb ?? "—"} />
              <InfoRow label="Date d'ajout" value={formatDate(lead.createdAt)} />
              {lead.convertedAt && <InfoRow label="Converti le" value={formatDate(lead.convertedAt)} />}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1 px-6 py-5">
              <SectionTitle>Pratique & rémunération</SectionTitle>
              <InfoRow
                label="Mode de facturation"
                value={lead.modeFacturation ? (FACTURATION_LABELS[lead.modeFacturation] ?? lead.modeFacturation) : "—"}
              />
              <InfoRow label="Volume de facturation" value={lead.volumeFacturation ? (VOLUME_LABELS[lead.volumeFacturation] ?? lead.volumeFacturation) : "—"} />
              <InfoRow label="Avocats estimés" value={lead.nbAvocatsEstime ?? "—"} />
              <InfoRow label="Adjoints estimés" value={lead.nbAdjointsEstime ?? "—"} />
              <InfoRow label="Logiciel actuel" value={lead.logicielActuel ?? "Inconnu"} />
              <InfoRow label="Fidéicommis" value={lead.aTrustAccounting ? "Oui" : "Non"} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 px-6 py-5">
              <SectionTitle>Audit gratuit</SectionTitle>
              {lead.auditSubmission ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-si-muted">Score d'audit</span>
                    <span className="text-2xl font-semibold text-si-verified">
                      {lead.auditSubmission.scoreGlobal ?? "—"}
                      <span className="text-sm text-si-muted"> / 100</span>
                    </span>
                  </div>
                  {auditScores && (
                    <div className="space-y-1 border-t border-si-line pt-2 text-sm">
                      {Object.entries(auditScores).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize text-si-muted">{k.replace(/_/g, " ")}</span>
                          <span className="tabular-nums">{typeof v === "number" ? v : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <InfoRow label="Statut audit" value={lead.auditSubmission.status} />
                  <InfoRow label="Soumis le" value={formatDate(lead.auditSubmission.createdAt)} />
                  <Link
                    href={`/audit/${lead.auditSubmission.id}`}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-si-verified hover:underline"
                  >
                    Voir le rapport d'audit →
                  </Link>
                </>
              ) : (
                <p className="text-sm text-si-muted">Aucun audit gratuit lié à ce cabinet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 px-6 py-5">
              <SectionTitle>Scoring CRM</SectionTitle>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-si-muted">Firmographique</span><span className="tabular-nums">{lead.scoreFirmographique} / 40</span></div>
                <div className="flex justify-between"><span className="text-si-muted">Engagement</span><span className="tabular-nums">{lead.scoreEngagement} / 40</span></div>
                <div className="flex justify-between"><span className="text-si-muted">Enrichissement</span><span className="tabular-nums">{lead.scoreEnrichissement} / 20</span></div>
                <div className="mt-2 flex justify-between border-t border-si-line pt-2 font-semibold"><span>Total</span><span className="tabular-nums">{lead.score} / 100</span></div>
              </div>
            </CardContent>
          </Card>

          {lead.tags.length > 0 && (
            <Card>
              <CardContent className="space-y-2 px-6 py-5">
                <SectionTitle>Tags</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded bg-si-canvas px-2 py-0.5 text-xs text-si-ink">{tag}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Colonne droite : abonnement + conformité + activation + relation ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Abonnement */}
          <Card>
            <CardContent className="px-6 py-5">
              <SectionTitle>Abonnement</SectionTitle>
              {!isProvisioned ? (
                <p className="text-sm text-si-muted">Cabinet non encore provisionné dans SAFE. Aucun abonnement actif.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoRow label="Plan" value={subPlan ? planLabel(String(subPlan)) : "—"} />
                  <InfoRow
                    label="Statut"
                    value={
                      subscription?.isTrialing ? "Essai"
                        : subscription?.active ? "Actif"
                        : (subscription?.status ?? "Inactif")
                    }
                  />
                  <InfoRow label="MRR" value={mrr > 0 ? money(mrr) : "—"} />
                  <InfoRow label="Renouvellement" value={formatDate(subscription?.currentPeriodEnd)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conformité (Audits fusionné ici, D2) */}
          {isProvisioned && (
            <Card>
              <CardContent className="px-6 py-5">
                <SectionTitle>Conformité fidéicommis</SectionTitle>
                {!trust || !trust.hasTrustActivity ? (
                  <p className="text-sm text-si-muted">Aucune activité fidéicommis enregistrée pour ce cabinet.</p>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid flex-1 grid-cols-2 gap-4">
                      <InfoRow label="Période attendue" value={trust.expectedPeriode} />
                      <InfoRow label="Dernière conciliation" value={trust.lastCertifiedPeriode ?? "Jamais"} />
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        trust.isOverdue
                          ? "bg-[#B84A3E]/10 text-[#B84A3E]"
                          : trust.hasNeverReconciled
                            ? "bg-si-amber/[0.13] text-si-amber-ink"
                            : "bg-si-verified/10 text-si-verified"
                      }`}
                    >
                      {trust.isOverdue
                        ? `En retard de ${trust.daysOverdue} j`
                        : trust.hasNeverReconciled
                          ? "Jamais réconcilié"
                          : "À jour"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activation & accès */}
          <Card>
            <CardContent className="px-6 py-5">
              <SectionTitle>Activation & accès</SectionTitle>
              {isProvisioned ? (
                <div className="space-y-3">
                  <p className="text-sm text-si-verified">
                    Cabinet provisionné dans SAFE ({cabinetUsers.length} accès).
                  </p>
                  {cabinetUsers.length > 0 && (
                    <ul className="divide-y divide-si-line rounded-md border border-si-line">
                      {cabinetUsers.map((u) => (
                        <li key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-si-ink">{u.nom || u.email}</span>
                          <span className="rounded bg-si-canvas px-2 py-0.5 text-[10px] uppercase tracking-wide text-si-muted">
                            {u.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-si-muted">
                    Ce cabinet n'a pas encore d'accès SAFE. L'activation crée le cabinet et invite l'avocat et son adjoint.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-si-verified/60 px-4 py-2 text-sm font-medium text-si-surface"
                    title="Flux d'activation en cours de câblage (chantier suivant)"
                  >
                    Activer le cabinet & créer les accès
                    <span className="rounded bg-si-surface/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">bientôt</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardContent className="px-6 py-5">
              <SectionTitle>Contacts ({lead.contacts.length})</SectionTitle>
              {lead.contacts.length === 0 ? (
                <p className="text-sm text-si-muted">
                  Aucun contact identifié. Ajoutez le décideur et le champion interne pour activer le scoring bottom-up.
                </p>
              ) : (
                <div className="divide-y divide-si-line">
                  {lead.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start justify-between py-3">
                      <div>
                        <div className="font-medium text-si-ink">
                          {contact.prenom} {contact.nom}
                          {contact.estDecideur && <span className="ml-2 inline-flex items-center rounded bg-si-forest/[0.06] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-si-forest">Décideur</span>}
                          {contact.estChampionInterne && <span className="ml-1 inline-flex items-center rounded bg-si-verified/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-si-verified">Champion</span>}
                        </div>
                        <div className="text-xs text-si-muted">
                          {ROLE_LABELS[contact.roleCrm] ?? contact.roleCrm}{contact.titre && ` · ${contact.titre}`}
                        </div>
                        {contact.email && <div className="mt-1 text-xs text-si-muted">{contact.email}</div>}
                      </div>
                      <div className="text-right text-xs text-si-muted">
                        ADKAR : <span className="text-si-ink">{ADKAR_LABELS[contact.awareness]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3"><AddContactForm leadId={lead.id} /></div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="px-6 py-5">
              <SectionTitle>Timeline ({lead.activities.length} activité{lead.activities.length > 1 ? "s" : ""})</SectionTitle>
              <div className="mb-4"><LogActivityForm leadId={lead.id} /></div>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-si-muted">Aucune activité enregistrée. Logguez votre premier DM, appel ou note.</p>
              ) : (
                <ul className="space-y-3">
                  {lead.activities.map((activity) => (
                    <li key={activity.id} className="flex gap-3 border-l-2 border-si-line pl-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-si-ink">{activity.type.replace(/_/g, " ")}</span>
                          <span className="text-[10px] uppercase tracking-wide text-si-muted">{activity.direction}</span>
                        </div>
                        {activity.sujet && <div className="text-sm text-si-ink">{activity.sujet}</div>}
                        {activity.contenu && (
                          <div className="mt-1 text-xs text-si-muted">{activity.contenu.slice(0, 200)}{activity.contenu.length > 200 ? "…" : ""}</div>
                        )}
                        <div className="mt-1 text-xs text-si-muted">{formatDateTime(activity.date)}</div>
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
                <SectionTitle>Notes privées</SectionTitle>
                <p className="whitespace-pre-wrap text-sm text-si-ink">{lead.notesPrivees}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
