"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  FolderClosed,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils/format";
import { closeDossier } from "@/app/(app)/dossiers/actions";
import type { ClosureBlockers } from "@/lib/services/dossiers/closure-blockers";

interface ClosureData {
  statut: string;
  dateCloture: string | null;
  retentionJusqua: string | null;
  closedAt: string | null;
  blockers: ClosureBlockers;
}

/**
 * Onglet Fermeture — Phase 4.
 * Alerte sur ce qui reste à régler (factures impayées, débours, fidéicommis),
 * permet de fermer le dossier (avec confirmation explicite si éléments en attente,
 * blocage dur si solde fidéicommis négatif), conserve une trace et expose la
 * lettre de fermeture.
 */
export function DossierDetailFermeture({
  dossierId,
  statutDossier = "",
}: {
  dossierId: string;
  statutDossier?: string;
}) {
  const t = useTranslations("matterDetailUi");
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<ClosureData>({
    queryKey: ["dossier", dossierId, "closure"],
    queryFn: async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/closure-blockers`);
      if (!res.ok) throw new Error("load");
      return res.json();
    },
  });

  const isClosed = (data?.statut ?? statutDossier) === "cloture";
  const blockers = data?.blockers;
  const letterHref = `/api/documents/closure-letter/${dossierId}`;

  const fmtDate = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })
      : "";

  const blockerLines: string[] = [];
  if (blockers) {
    if (blockers.factures.count > 0) {
      blockerLines.push(
        t("closureBlockerInvoices", {
          count: blockers.factures.count,
          amount: formatCurrency(blockers.factures.montant),
        }),
      );
    }
    if (blockers.debours.count > 0) {
      blockerLines.push(
        t("closureBlockerDebours", {
          count: blockers.debours.count,
          amount: formatCurrency(blockers.debours.montant),
        }),
      );
    }
    if (blockers.trust.isPositive) {
      blockerLines.push(
        t("closureBlockerTrustPositive", { amount: formatCurrency(blockers.trust.balance) }),
      );
    }
  }
  const hardBlockLine =
    blockers?.trust.isNegative
      ? t("closureBlockerTrustNegative", { amount: formatCurrency(blockers.trust.balance) })
      : null;

  async function handleClose() {
    setSubmitting(true);
    setError(null);
    const result = await closeDossier(dossierId, { acknowledge: ack });
    setSubmitting(false);
    if (result.ok) {
      setModalOpen(false);
      setAck(false);
      await refetch();
      router.refresh();
      return;
    }
    if (result.reason === "already_closed") {
      setModalOpen(false);
      await refetch();
      router.refresh();
      return;
    }
    if (result.reason === "hard_block") setError(t("closeHardBlockMsg"));
    else if (result.reason === "needs_ack") setError(t("closeNeedsAckMsg"));
    else setError(t("closeErrorMsg"));
  }

  const card = "rounded-2xl border border-si-line bg-si-surface p-6";

  if (isLoading) {
    return (
      <div className={`${card} flex items-center justify-center py-12`}>
        <Loader2 className="h-6 w-6 animate-spin text-si-muted/60" aria-hidden />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={card}>
        <p className="text-sm text-si-muted">{t("closureLoadError")}</p>
      </div>
    );
  }

  // ── Dossier déjà fermé ───────────────────────────────────────────────
  if (isClosed) {
    return (
      <div className={`${card} space-y-4`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-si-forest/[0.06] text-si-forest">
            <FolderClosed className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="font-serif text-[19px] leading-tight text-si-ink">
              {t("closedOnLabel", { date: fmtDate(data?.dateCloture ?? data?.closedAt) })}
            </h3>
            <p className="mt-0.5 text-sm text-si-muted">
              {t("retentionUntilLabel", { date: fmtDate(data?.retentionJusqua) })}
            </p>
            <p className="mt-1 text-xs text-si-muted">{t("closureTraceNote")}</p>
          </div>
        </div>
        <a href={letterHref} target="_blank" rel="noopener noreferrer" className="inline-block">
          <Button type="button" variant="secondary">
            <FileDown className="mr-2 h-4 w-4" aria-hidden />
            {t("downloadClosureLetter")}
          </Button>
        </a>
      </div>
    );
  }

  // ── Dossier ouvert : alerte + bouton de fermeture ────────────────────
  return (
    <div className={`${card} space-y-5`}>
      <div>
        <h3 className="font-serif text-[19px] leading-tight text-si-ink">{t("closureSectionTitle")}</h3>
        <p className="mt-1 text-sm text-si-muted">{t("closureIntro")}</p>
      </div>

      {hardBlockLine && (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden />
          <AlertTitle>{t("closureBlockersTitle")}</AlertTitle>
          <AlertDescription>
            <p>{hardBlockLine}</p>
          </AlertDescription>
        </Alert>
      )}

      {!hardBlockLine && blockerLines.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>{t("closureBlockersTitle")}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-0.5 pl-4">
              {blockerLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!hardBlockLine && blockerLines.length === 0 && (
        <Alert variant="info">
          <CheckCircle2 aria-hidden />
          <AlertDescription>
            <p>{t("closureAllClear")}</p>
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="primary"
        disabled={Boolean(hardBlockLine)}
        onClick={() => {
          setError(null);
          setAck(false);
          setModalOpen(true);
        }}
      >
        <FolderClosed className="mr-2 h-4 w-4" aria-hidden />
        {t("closeButton")}
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t("closeConfirmTitle")}>
        <div className="space-y-4">
          <p className="text-sm text-si-muted">{t("closeConfirmIntro")}</p>

          {blockerLines.length > 0 && (
            <ul className="list-disc space-y-0.5 rounded-lg border border-si-line bg-si-canvas/60 p-3 pl-7 text-sm text-si-ink">
              {blockerLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}

          {blockerLines.length > 0 && (
            <label className="flex items-start gap-2.5 text-sm text-si-ink">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-si-forest"
              />
              <span>{t("closeAck")}</span>
            </label>
          )}

          {error && <p className="text-sm text-[var(--safe-status-error)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="tertiary" onClick={() => setModalOpen(false)}>
              {t("closeCancelButton")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={submitting || (blockerLines.length > 0 && !ack)}
              onClick={handleClose}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {t("closeConfirmButton")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
