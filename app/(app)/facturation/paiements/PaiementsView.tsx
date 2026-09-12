"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionsSection } from "@/components/comptabilite/ActionsSection";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { MotifAnnulationModal } from "@/components/comptabilite/MotifAnnulationModal";
import type { JournalCorrectionMotive } from "@prisma/client";
import { PaiementFormModal } from "@/components/facturation/PaiementFormModal";
import { ImportPreuveModal } from "@/components/facturation/ImportPreuveModal";
import { PaiementAllocationModal } from "@/components/facturation/PaiementAllocationModal";
import {
  PaiementsTable,
  libelleClientPaiement,
  type PaiementRangee,
} from "@/components/facturation/PaiementsTable";
import type { ClientCreditBalance } from "@/lib/services/billing/overpayment-service";
import {
  RegistreAucunResultat,
  RegistreBarreOutils,
  RegistreFeuille,
  RegistrePagination,
  registreChampClass,
  registreSelectClass,
  usePaginationLocale,
} from "@/components/ui/registre";

/** Ce que la liste déroulante du registre laisse passer. */
type FiltrePaiements = "tous" | "a_allouer" | "alloues" | "annules";

interface FacturationPaiementsViewProps {
  cabinetId: string;
  /** Masque le lien "Retour à la vue d'ensemble" quand la vue est intégrée dans /comptabilite */
  embeddedInComptabilite?: boolean;
  /**
   * Droit d'écrire (`canManageInvoices`). À `false`, la vue reste complète en
   * lecture mais ne propose aucune action : ni saisie, ni import de preuve, ni
   * allocation, ni demande de remboursement. L'avocat lit les encaissements
   * depuis `canViewBilling` sans pouvoir les toucher.
   */
  canWrite?: boolean;
}

type PaymentRow = PaiementRangee;

export function FacturationPaiementsView({
  cabinetId,
  embeddedInComptabilite,
  canWrite = true,
}: FacturationPaiementsViewProps) {
  const t = useTranslations("billingUi");
  const tf = useTranslations("facturation");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formModalOpen, setFormModalOpen] = useState(false);
  /* Facture sur laquelle ouvrir le formulaire, quand on arrive du Suivi. */
  const [factureInitiale, setFactureInitiale] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<FiltrePaiements>("tous");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationPayment, setAllocationPayment] = useState<{
    id: string;
    montant: number;
    allocatedAmount: number;
    unallocatedAmount: number;
    clientId: string | null;
  } | null>(null);
  const [annulationCible, setAnnulationCible] = useState<PaymentRow | null>(null);
  const [annulationSubmitting, setAnnulationSubmitting] = useState(false);
  const [annulationError, setAnnulationError] = useState<string | null>(null);
  const [refundClient, setRefundClient] = useState<ClientCreditBalance | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const { data, isLoading, isError: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ["facturation", "paiements"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/paiements");
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const { data: contextData } = useQuery({
    queryKey: ["facturation", "paiements", "context"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/paiements/context");
      if (!res.ok) throw new Error("Erreur chargement contexte");
      return res.json();
    },
    enabled: formModalOpen || allocationModalOpen || importModalOpen,
  });

  const { data: surData, isError: creditsError, refetch: refetchSurpaiements } = useQuery({
    queryKey: ["facturation", "surpaiements"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/surpaiements");
      if (!res.ok) throw new Error("Erreur chargement surpaiements");
      return res.json();
    },
  });
  const creditClients = (surData?.clients ?? []) as ClientCreditBalance[];
  const money = (amount: number) => formatCurrency(amount, "CAD", locale);
  const displayDate = (date: string) => formatCalendarDate(date, locale);

  const payments = (data?.payments ?? []) as PaymentRow[];

  /* Recherche et filtre se font ici, sur la liste déjà chargée : elle est
     bornée à 200 lignes par l'API, et un aller-retour serveur pour taper trois
     lettres ferait clignoter le registre. */
  const paymentsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return payments.filter((p) => {
      if (filtre === "a_allouer" && !(p.unallocatedAmount > 0 && p.allocationStatus !== "REVERSED")) return false;
      if (filtre === "alloues" && p.allocationStatus !== "ALLOCATED") return false;
      if (filtre === "annules" && p.allocationStatus !== "REVERSED") return false;
      if (!q) return true;
      return (
        libelleClientPaiement(p.client).toLowerCase().includes(q) ||
        (p.invoice?.numero ?? "").toLowerCase().includes(q)
      );
    });
  }, [payments, recherche, filtre]);
  // Paginé par 20, comme tous les registres du produit.
  const pagePaiements = usePaginationLocale(paymentsFiltres);
  // Paiements orphelins : argent reçu mais non encore alloué à une facture.
  const unallocatedPayments = payments.filter(
    (p) => p.unallocatedAmount > 0 && p.allocationStatus !== "REVERSED",
  );
  const unallocatedTotal = unallocatedPayments.reduce((s, p) => s + p.unallocatedAmount, 0);
  const clients = contextData?.clients ?? [];
	  const invoices = contextData?.invoices ?? [];

  const clientLabel = libelleClientPaiement;

  const openCreate = (invoiceId: string | null = null) => {
    setFormMode("create");
    setEditingPaymentId(null);
    setFactureInitiale(invoiceId);
    setFormModalOpen(true);
  };

  /* Le Suivi des factures envoie ici avec `?invoiceId=` depuis le 2026-06 et
     l'écran l'ignorait : l'adjointe retapait le client et la facture qu'elle
     venait de quitter. Le formulaire s'ouvre maintenant dessus, une fois, puis
     l'adresse est nettoyée pour qu'un rechargement ne le rouvre pas. */
  const invoiceIdDemande = searchParams.get("invoiceId");
  useEffect(() => {
    if (!invoiceIdDemande || !canWrite) return;
    openCreate(invoiceIdDemande);
    router.replace(routes.facturationPaiements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceIdDemande, canWrite]);

  const openEdit = (id: string) => {
    setFormMode("edit");
    setEditingPaymentId(id);
    setFormModalOpen(true);
  };

  const openAllocation = (p: PaymentRow) => {
    setAllocationPayment({
      id: p.id,
      montant: p.montant,
      allocatedAmount: p.allocatedAmount,
      unallocatedAmount: p.unallocatedAmount,
      clientId: p.client?.id ?? p.clientId ?? null,
    });
    setAllocationModalOpen(true);
  };

  async function handleAnnulerPaiement(
    motifCode: JournalCorrectionMotive,
    motifTexte: string | null,
  ) {
    if (!annulationCible) return;
    setAnnulationSubmitting(true);
    setAnnulationError(null);
    try {
      const res = await fetch(`/api/facturation/paiements/${annulationCible.id}/annuler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motifCode, motifTexte }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || t("reversePaymentError"));
      }
      setAnnulationCible(null);
      // Le solde dû des factures rouvertes a bougé : les deux listes se rechargent.
      await Promise.all([refetchPayments(), refetchSurpaiements()]);
    } catch (e) {
      setAnnulationError(e instanceof Error ? e.message : t("reversePaymentError"));
    } finally {
      setAnnulationSubmitting(false);
    }
  }

  async function handleRequestRefund() {
    if (!refundClient) return;
    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const res = await fetch("/api/facturation/surpaiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: refundClient.clientId, note: refundNote || undefined }),
      });
      if (!res.ok) throw new Error("Refund request failed");
      setRefundClient(null);
      setRefundNote("");
      await refetchSurpaiements();
    } catch {
      setRefundError(t("refundError"));
    } finally {
      setRefundSubmitting(false);
    }
  }

  const actions = canWrite ? (
    <ActionsSection embarque={embeddedInComptabilite} className="flex flex-wrap items-center gap-2">
      {/* Le lien « payeurs tiers » mène à une page gardée par
          `canManageInvoices` : il rebondirait sans le filtre `canWrite`. */}
      <Link
        href={routes.parametresPayeursTiers}
        className="min-h-tap inline-flex items-center px-2 text-[13px] text-si-muted hover:text-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
      >
        {t("managePayers")}
      </Link>
      <Button type="button" variant="secondary" onClick={() => setImportModalOpen(true)} className="shrink-0">
        {t("importProof")}
      </Button>
      <Button type="button" variant="primary" onClick={() => openCreate()} className="shrink-0">
        {t("newPayment")}
      </Button>
    </ActionsSection>
  ) : null;

  return (
    <div className="space-y-6">
      {/* Un titre et sa phrase. L'écran s'ouvrait sur un lien de retour et une
          barre de boutons : rien ne disait où on était. Intégré dans la
          Comptabilité, l'onglet porte déjà le titre. Demande CEO du 2026-09-12. */}
      {embeddedInComptabilite ? (
        actions ? <div className="flex justify-end">{actions}</div> : null
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            variant="dashboard"
            title={t("paymentsTitle")}
            description={t("paymentsIntro")}
            backHref={routes.facturation}
            backLabel={tf("returnTo", { label: tf("billingAndFollowUp") })}
          />
          {actions ? <div className="pb-4">{actions}</div> : null}
        </div>
      )}

      {creditsError ? (
        <p className="border-l-2 border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error" role="alert">
          {t("creditsLoadError")}
        </p>
      ) : null}

      {/* Le registre passe premier : c'est lui qu'on vient voir. Le bandeau
          ambre « paiements non alloués » devient un compteur-filtre dans sa
          barre, à côté du compte total. */}
      <RegistreFeuille ariaLabel={t("recentPayments")}>
        <RegistreBarreOutils
          recherche={
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("searchPayments")}
              aria-label={t("searchPayments")}
              className={`${registreChampClass} w-full px-3`}
            />
          }
          filtres={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtre}
                onChange={(e) => setFiltre(e.target.value as FiltrePaiements)}
                aria-label={t("status")}
                className={registreSelectClass}
              >
                <option value="tous">{t("filterAllPayments")}</option>
                <option value="a_allouer">{t("filterToAllocate")}</option>
                <option value="alloues">{t("filterAllocated")}</option>
                <option value="annules">{t("filterReversed")}</option>
              </select>
              {unallocatedPayments.length > 0 ? (
                <button
                  type="button"
                  aria-pressed={filtre === "a_allouer"}
                  onClick={() => setFiltre(filtre === "a_allouer" ? "tous" : "a_allouer")}
                  className="safe-zoom-menu inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-si-amber/40 bg-status-warning-bg px-2.5 text-[13px] font-medium text-si-amber-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                >
                  {t("toAllocateChip", { count: unallocatedPayments.length, amount: money(unallocatedTotal) })}
                </button>
              ) : null}
              <span className="text-[13px] text-si-muted">{t("paymentsCount", { count: paymentsFiltres.length })}</span>
            </div>
          }
        />
        {isLoading ? (
          <p className="px-6 py-10 text-center text-sm text-si-muted" role="status">
            {t("loading")}
          </p>
        ) : paymentsError ? (
          <div className="py-10 text-center" role="alert">
            <p className="text-sm text-status-error">{t("paymentsLoadError")}</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => void refetchPayments()}>
              {t("retry")}
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <RegistreAucunResultat message={t("noPayments")} />
        ) : paymentsFiltres.length === 0 ? (
          <RegistreAucunResultat message={t("noPaymentsMatch")} />
        ) : (
          <>
            <PaiementsTable
              rangees={pagePaiements.tranche}
              canWrite={canWrite}
              onModifier={openEdit}
              onAllouer={openAllocation}
              onAnnuler={(p) => {
                setAnnulationError(null);
                setAnnulationCible(p);
              }}
            />
            <RegistrePagination
              totalCount={pagePaiements.total}
              currentPage={pagePaiements.page}
              resume={tc("paginationRange", {
                start: pagePaiements.debut + 1,
                end: pagePaiements.fin,
                total: pagePaiements.total,
              })}
              labelPage={tc("paginationPage", {
                current: pagePaiements.page,
                total: pagePaiements.totalPages,
              })}
              labelPrecedent={tc("previous")}
              labelSuivant={tc("next")}
              onPageChange={pagePaiements.setPage}
            />
          </>
        )}
      </RegistreFeuille>

      {/* Les soldes créditeurs : rares, donc sous le registre, en une ligne par
          client. Ils occupaient une carte entière au-dessus du tableau. */}
      {creditClients.length > 0 && (
        <section aria-label={t("creditsLineTitle")} className="border-t border-si-line pt-4">
          <p className="text-[13px] text-si-ink">
            <span className="font-medium">{t("creditsLineTitle")}</span>
            <span className="text-si-muted"> · {t("creditsLineSub", { count: creditClients.length })}</span>
          </p>
          <ul className="mt-1 divide-y divide-si-line2">
            {creditClients.map((c) => (
              <li key={c.clientId} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span className="text-[13px] text-si-muted">
                  <span className="text-si-ink">{c.label}</span>
                  {" · "}
                  <span className="font-mono tabular-nums text-si-amber-ink">{money(c.creditBalance)}</span>
                  {" "}
                  {t("creditsApplies")}
                </span>
                {c.refundRequested ? (
                  <span className="text-xs font-medium text-si-amber-ink">{t("refundRequestedBadge")}</span>
                ) : canWrite ? (
                  <Button
                    type="button"
                    variant="tertiary"
                    className="shrink-0"
                    onClick={() => {
                      setRefundError(null);
                      setRefundNote("");
                      setRefundClient(c);
                    }}
                  >
                    {t("requestRefund")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sans droit d'écriture, plus rien ne peut ouvrir ces modales : on ne les
          monte pas. Effet de bord voulu, la requête de contexte
          (`/api/facturation/paiements/context`) n'est jamais déclenchée, et cette
          route reste donc fermée à la lecture seule. */}
      {canWrite && (
      <>
      <PaiementFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingPaymentId(null);
          setFactureInitiale(null);
        }}
        mode={formMode}
        paymentId={editingPaymentId}
        initialInvoiceId={factureInitiale}
        clients={clients}
        invoices={invoices}
        onSuccess={() => setFormModalOpen(false)}
      />

      <ImportPreuveModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        clients={clients}
        invoices={invoices}
        onSuccess={() => setImportModalOpen(false)}
      />

      <PaiementAllocationModal
        open={allocationModalOpen}
        onClose={() => {
          setAllocationModalOpen(false);
          setAllocationPayment(null);
        }}
        paymentId={allocationPayment?.id ?? ""}
        paymentSummary={
          allocationPayment
            ? {
                montant: allocationPayment.montant,
                allocatedAmount: allocationPayment.allocatedAmount,
                unallocatedAmount: allocationPayment.unallocatedAmount,
                clientId: allocationPayment.clientId,
              }
            : undefined
        }
        invoices={invoices}
        onSuccess={() => setAllocationModalOpen(false)}
      />

      <MotifAnnulationModal
        open={annulationCible !== null}
        onClose={() => {
          setAnnulationCible(null);
          setAnnulationError(null);
        }}
        onConfirm={handleAnnulerPaiement}
        title={t("reversePaymentTitle")}
        intro={t("reversePaymentIntro")}
        cible={
          annulationCible
            ? `${displayDate(annulationCible.datePaiement)} · ${clientLabel(annulationCible.client)} · ${money(annulationCible.montant)}`
            : null
        }
        submitting={annulationSubmitting}
        error={annulationError}
      />

      <Modal
        open={Boolean(refundClient)}
        onClose={() => setRefundClient(null)}
        title={t("refundModalTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-si-muted">{t("refundModalIntro")}</p>
          {refundClient && (
            <p className="text-sm text-si-ink">
              {refundClient.label} :{" "}
              <span className="font-mono tabular-nums text-si-amber-ink">
                {money(refundClient.creditBalance)}
              </span>
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm text-si-ink">{t("refundNoteLabel")}</label>
            <textarea
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              rows={3}
              className="min-h-tap w-full rounded-lg border border-si-line bg-si-surface px-3 py-2 text-sm focus:border-si-verified focus:ring-2 focus:ring-si-verified/25"
            />
          </div>
          <p className="text-xs text-si-muted">{t("refundManualNotice")}</p>
          {refundError && <p className="text-sm text-status-error">{refundError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setRefundClient(null)}>
              {t("refundCancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={refundSubmitting}
              onClick={handleRequestRefund}
            >
              {refundSubmitting ? tc("saving") : t("refundConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
      </>
      )}
    </div>
  );
}
