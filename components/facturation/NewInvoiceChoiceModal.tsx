"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Receipt } from "lucide-react";
import { routes } from "@/lib/routes";

interface DossierWithTasks {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  taskCount: number;
  totalUnbilled: number;
}

interface NewInvoiceChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true, "from registre" is the default path (forfait mode) */
  preferRegistre?: boolean;
}

/**
 * Two-path entry point for creating an invoice:
 *  - Depuis le registre: pick a dossier with unbilled tasks, auto-generate invoice
 *  - From scratch: redirect to the blank invoice creation page
 */
export function NewInvoiceChoiceModal({ isOpen, onClose, preferRegistre = false }: NewInvoiceChoiceModalProps) {
  const t = useTranslations("billingCompUi");
  const { formatCurrency } = useFormatteurs();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "registre">("choose");
  const [dossiers, setDossiers] = useState<DossierWithTasks[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  /* Deux attentes distinctes. Un seul drapeau servait aux deux : pendant le
     simple chargement de la liste, le bouton annonçait déjà « Génération… ». */
  const [chargementListe, setChargementListe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(preferRegistre ? "registre" : "choose");
      setError(null);
      setSelectedDossierId("");
    }
  }, [isOpen, preferRegistre]);

  // Fetch dossiers with unbilled tasks when switching to "registre" mode
  useEffect(() => {
    if (mode !== "registre" || !isOpen) return;
    (async () => {
      setChargementListe(true);
      try {
        const res = await fetch("/api/registre-taches?statut=complete");
        if (!res.ok) throw new Error("Failed to load unbilled tasks");
        const { taches } = await res.json();
        type TacheRow = {
          dossier: { id?: string; intitule?: string; numeroDossier?: string | null } | null;
          montantFinal: number;
        };
        type Grouped = { id: string; intitule: string; numeroDossier: string | null; taskCount: number; totalUnbilled: number };
        const grouped = (taches as TacheRow[]).reduce<Record<string, Grouped>>((acc, tache) => {
          if (!tache.dossier?.id) return acc;
          const did = tache.dossier.id;
          if (!acc[did]) {
            acc[did] = {
              id: did,
              intitule: tache.dossier.intitule ?? "",
              numeroDossier: tache.dossier.numeroDossier ?? null,
              taskCount: 0,
              totalUnbilled: 0,
            };
          }
          acc[did].taskCount += 1;
          acc[did].totalUnbilled += tache.montantFinal;
          return acc;
        }, {});
        setDossiers(Object.values(grouped).sort((a, b) => b.totalUnbilled - a.totalUnbilled));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setChargementListe(false);
      }
    })();
  }, [mode, isOpen]);

  const handleFromRegistre = async () => {
    if (!selectedDossierId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/registre-taches/facturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId: selectedDossierId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate invoice");
      }
      const { invoice } = await res.json();
      onClose();
      if (invoice?.id) router.push(`/facturation/factures/${invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleFromScratch = () => {
    onClose();
    router.push(routes.facturationFactureNouvelle);
  };

  /* Les heures et débours se facturent depuis « Honoraires à facturer », sur
     la page même. La fenêtre n'en parlait pas : son seul chemin « recommandé »
     cherchait dans le registre des tâches, propre au forfait, et répondait
     « aucune tâche » à un cabinet horaire qui avait des heures prêtes. */
  const handleFromHours = () => {
    onClose();
    const section = document.getElementById("facturables");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push(`${routes.facturation}#facturables`);
  };

  const chemins = [
    { cle: "heures", titre: t("pathHours"), aide: t("pathHoursDesc"), action: handleFromHours },
    { cle: "registre", titre: t("pathRegister"), aide: t("pathRegisterDesc"), action: () => setMode("registre") },
    { cle: "vierge", titre: t("pathBlank"), aide: t("pathBlankDesc"), action: handleFromScratch },
  ];
  /* Au forfait, le registre des tâches passe en tête : c'est le chemin
     habituel de ce mode. Aucune pastille « recommandé » : l'ordre suffit. */
  if (preferRegistre) chemins.unshift(chemins.splice(1, 1)[0]!);

  return (
    <Modal open={isOpen} onClose={onClose} title={t("newInvoice")} maxWidth="max-w-xl">
      {mode === "choose" && (
        /* ── Refonte du 2026-10-01 (déc. CEO, image validée) ──────────────
           Deux grandes cartes à icône et une pastille « RECOMMANDÉ » en
           dégradé deviennent une liste de trois chemins : une question, trois
           réponses, un filet entre chacune. */
        <div>
          <p className="mb-1.5 px-1 text-[13px] text-si-muted">{t("pathQuestion")}</p>
          <ul className="border-b border-si-line2">
            {chemins.map((c) => (
              <li key={c.cle} className="border-t border-si-line2">
                <button
                  type="button"
                  onClick={c.action}
                  className="safe-zoom-menu flex min-h-tap w-full items-center gap-4 rounded-md px-1 py-4 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-si-ink">{c.titre}</span>
                    <span className="mt-0.5 block text-[13px] text-si-muted">{c.aide}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === "registre" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="text-si-muted hover:text-si-ink underline"
            >
              ← {t("back")}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-si-muted mb-2">
              {t("matterToInvoice")}
            </label>

            {chargementListe ? (
              <p className="p-8 text-center text-sm text-si-muted" role="status">
                {t("loadingMatters")}
              </p>
            ) : dossiers.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-si-line">
                <p className="text-sm text-si-muted mb-2">{t("noUnbilledTasks")}</p>
                <p className="text-xs text-si-muted">
                  {t("addTasksBeforeInvoicing")}
                </p>
                <Button variant="secondary" onClick={handleFromScratch} className="mt-3">
                  {t("createBlankInvoiceInstead")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dossiers.map((d) => (
                  <label
                    key={d.id}
                    className={`safe-zoom-menu flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      selectedDossierId === d.id ? "border-si-ink bg-si-surface2" : "border-si-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dossier"
                      value={d.id}
                      checked={selectedDossierId === d.id}
                      onChange={() => setSelectedDossierId(d.id)}
                      className="accent-si-ink-strong"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-si-ink truncate">
                        {d.numeroDossier && <span className="font-mono text-xs text-si-muted mr-2">{d.numeroDossier}</span>}
                        {d.intitule}
                      </p>
                      <p className="text-xs text-si-muted">
                        {t("unbilledTaskCount", { count: d.taskCount })}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(d.totalUnbilled)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sans dossier à choisir, « Générer la facture » ne mène nulle part :
              il ne s'affiche qu'à partir d'un dossier. */}
          {!chargementListe && dossiers.length > 0 && (
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleFromRegistre}
                disabled={!selectedDossierId || loading}
                className="gap-2"
              >
                {loading ? (
                  t("generating")
                ) : (
                  <>
                    <Receipt className="w-4 h-4" /> {t("generateInvoice")}
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t("cancel")}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-si-danger-ink">{error}</p>
      )}
    </Modal>
  );
}
