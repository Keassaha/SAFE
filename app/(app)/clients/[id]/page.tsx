import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { DocumentsSection } from "@/components/documents/DocumentsSection";
import { IdentityVerificationSection } from "@/components/clients/IdentityVerificationSection";
import {
  canViewSensitiveFields,
  canEditBillingTrust,
} from "@/lib/auth/permissions";
import { ClientProfile } from "@/components/clients/registry/ClientProfile";
import { ClientQuickActions } from "@/components/clients/registry/ClientQuickActions";
import type { ClientProfileData } from "@/components/clients/registry/ClientProfile";
import type { ActivityItem } from "@/components/clients/registry/ClientHistoryTab";
import type { UserRole } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { error, edit } = await searchParams;
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  const [
    client,
    documents,
    verifications,
    dossiers,
    invoiceStats,
    timeEntriesForClient,
  ] = await Promise.all([
    prisma.client.findFirst({
      where: { id, cabinetId },
    }),
    prisma.document.findMany({
      where: { clientId: id, dossierId: null, cabinetId },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { nom: true } } },
    }),
    prisma.clientIdentityVerification.findMany({
      where: { clientId: id, client: { cabinetId } },
      include: { document: true },
      orderBy: { date: "desc" },
    }),
    prisma.dossier.findMany({
      where: { clientId: id, cabinetId },
      orderBy: { dateOuverture: "desc" },
    }),
    prisma.invoice.aggregate({
      where: { clientId: id, cabinetId },
      _sum: { montantTotal: true, montantPaye: true },
      _count: true,
    }),
    prisma.timeEntry.findMany({
      where: { clientId: id, cabinetId },
      include: {
        user: { select: { nom: true } },
        dossier: { select: { id: true, intitule: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!client) notFound();

  const t = await getTranslations("clients");
  const tc = await getTranslations("common");

  const canEditSensitive = canViewSensitiveFields(role as UserRole, {
    userId,
  });
  const totalBilled = invoiceStats._sum.montantTotal ?? 0;
  const totalReceived = invoiceStats._sum.montantPaye ?? 0;
  const paymentCount = await prisma.payment.count({
    where: { cabinetId, invoice: { clientId: id, cabinetId } },
  });

  const invoices = await prisma.invoice.findMany({
    where: { clientId: id, cabinetId },
    orderBy: { dateEmission: "desc" },
    include: {
      payments: true,
      dossier: { select: { id: true, intitule: true } },
    },
  });
  const transactions: Array<{ date: Date; label: string; amount: number }> = [];
  for (const inv of invoices) {
    transactions.push({
      date: inv.dateEmission,
      label: t("invoiceLabel", { number: inv.numero }),
      amount: inv.montantTotal,
    });
    for (const pay of inv.payments) {
      transactions.push({
        date: pay.datePaiement,
        label: t("paymentLabel", { number: inv.numero }),
        amount: pay.montant,
      });
    }
  }
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const dossierIds = dossiers.map((d) => d.id);

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      cabinetId,
      OR: [
        { entityType: "Client", entityId: id },
        ...(dossierIds.length > 0
          ? [{ entityType: "Dossier", entityId: { in: dossierIds } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { nom: true } } },
  });
  const activityItems: ActivityItem[] = auditLogs.map((log) => {
    const actionLabel =
      log.action === "create"
        ? t("creation")
        : log.action === "update"
          ? t("modification")
          : log.action === "delete"
            ? t("deletion")
            : log.action;
    const who = log.user?.nom ? ` ${t("by", { name: log.user.nom })}` : "";
    return {
      id: log.id,
      date: log.createdAt,
      action: log.action,
      label: `${actionLabel}${who}`,
      entityType: log.entityType,
    };
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueInvoicesCount = await prisma.invoice.count({
    where: {
      clientId: id,
      cabinetId,
      dateEcheance: { lt: now },
      statut: { not: "payee" },
    },
  });

  const timeEntriesFinancial = timeEntriesForClient.map((e) => ({
    id: e.id,
    date: e.date,
    description: e.description,
    dureeMinutes: e.dureeMinutes,
    montant: e.montant,
    userNom: e.user.nom,
    dossierIntitule: e.dossier?.intitule ?? null,
    dossierId: e.dossierId,
  }));

  const invoicesFinancial = invoices.map((inv) => ({
    id: inv.id,
    numero: inv.numero,
    dateEmission: inv.dateEmission,
    dateEcheance: inv.dateEcheance,
    montantTotal: inv.montantTotal,
    balanceDue: inv.balanceDue,
    statut: inv.statut,
    dossierIntitule: inv.dossier?.intitule ?? null,
    dossierId: inv.dossierId,
    paymentsCount: inv.payments.length,
  }));

  const profileData: ClientProfileData = {
    id: client.id,
    typeClient: client.typeClient,
    status: client.status,
    raisonSociale: client.raisonSociale,
    prenom: client.prenom,
    nom: client.nom,
    email: client.email,
    telephone: client.telephone,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    province: client.province,
    postalCode: client.postalCode,
    country: client.country,
    langue: client.langue,
    createdAt: client.createdAt,
    notesConfidentielles: canEditSensitive ? client.notesConfidentielles : null,
    trustAccountBalance: client.trustAccountBalance,
    trustAccountId: client.trustAccountId,
    allowTrustPayments: client.allowTrustPayments,
    lastTrustTransactionDate: client.lastTrustTransactionDate,
    conflictChecked: client.conflictChecked,
    conflictCheckDate: client.conflictCheckDate,
    conflictNotes: client.conflictNotes,
    identityVerified: client.identityVerified,
    verificationDate: client.verificationDate ?? client.dateVerificationIdentite,
    cases: dossiers.map((d) => ({
      id: d.id,
      reference: d.reference,
      numeroDossier: d.numeroDossier,
      intitule: d.intitule,
      statut: d.statut,
      type: d.type,
    })),
    totalBilled,
    totalReceived,
    balanceDue: totalBilled - totalReceived,
    invoiceCount: invoiceStats._count,
    paymentCount,
    retainerSigned: client.retainerSigned,
    documentRefs: client.documentRefs,
    overdueInvoicesCount,
    verificationIdentiteHref: routes.clientVerificationIdentite(id),
    transactions,
    activityItems,
    timeEntriesFinancial,
    invoicesFinancial,
  };

  const showForm = edit === "1";
  const canEditBilling = canEditBillingTrust(role as UserRole);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          client.typeClient === "personne_physique" && (client.prenom || client.nom)
            ? [client.nom, client.prenom].filter(Boolean).join(", ")
            : client.raisonSociale
        }
        backHref={routes.clients}
        backLabel={t("backToClients")}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <ClientQuickActions
              email={client.email}
              telephone={client.telephone}
              clientId={id}
              clientName={
                client.typeClient === "personne_physique" && (client.prenom || client.nom)
                  ? [client.nom, client.prenom].filter(Boolean).join(", ")
                  : client.raisonSociale
              }
            />
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                client.status === "actif"
                  ? "bg-status-success-bg text-status-success"
                  : client.status === "inactif"
                    ? "bg-status-warning-bg text-status-warning"
                    : "bg-neutral-200 text-neutral-muted"
              }`}
            >
              {client.status === "actif"
                ? t("statusActive")
                : client.status === "inactif"
                  ? t("statusInactive")
                  : t("statusArchived")}
            </span>
            <Link
              href={routes.dossiers + `?clientId=${id}`}
              className="text-sm font-medium text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              {t("viewFullMatter")}
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link href={routes.clientVerificationIdentite(id)}>
              <Button variant="secondary">{t("identityVerification")}</Button>
            </Link>
          </div>
        }
      />

      {showForm ? (
        <Card>
          <CardHeader title={t("editInfo")} />
          <CardContent>
            <ClientForm
              client={client}
              error={error === "invalid" ? tc("invalidData") : undefined}
              canEditSensitive={canEditSensitive}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-safe bg-white border border-neutral-border shadow-[var(--safe-shadow-md)] overflow-hidden">
          <div className="p-6 border-b border-neutral-border">
            <ClientProfile
              data={profileData}
              canEditBilling={canEditBilling}
            />
          </div>
        </div>
      )}

      {!showForm && (
        <Card className="mt-4">
          <CardHeader title={t("identityVerification")} />
          <CardContent>
            <IdentityVerificationSection
              clientId={client.id}
              verifications={verifications}
              canManage={role === "admin_cabinet" || role === "assistante"}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
