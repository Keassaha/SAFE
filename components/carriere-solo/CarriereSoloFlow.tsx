"use client";

/**
 * SAFE — Carrière Solo
 * Flux complet : questionnaire 5 questions puis checklist personnalisée.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { QUESTIONS } from "@/lib/carriere-solo/questions";
import {
  generateChecklist,
  isHighlightedForFear,
} from "@/lib/carriere-solo/generator";
import type {
  Answers,
  ChecklistItem,
  GeneratedChecklist,
} from "@/lib/carriere-solo/types";

type RawAnswers = {
  juridiction?: string;
  statut?: string;
  horizon?: string;
  domaines?: string[];
  peur?: string;
};

const PRIORITY_LABEL: Record<ChecklistItem["priority"], string> = {
  critique: "Critique",
  important: "Important",
  recommande: "Recommandé",
};

const PRIORITY_STYLE: Record<ChecklistItem["priority"], string> = {
  critique: "bg-amber-700 text-white",
  important: "bg-forest-700 text-white",
  recommande: "bg-slate-200 text-slate-700",
};

function coutLabel(item: ChecklistItem, juridiction: "qc" | "on"): string | null {
  if (!item.cout) return null;
  if (item.cout.commun) return item.cout.commun;
  return juridiction === "qc" ? item.cout.qc ?? null : item.cout.on ?? null;
}

export function CarriereSoloFlow() {
  const [step, setStep] = useState(0); // 0..4 questions, 5 = résultat
  const [raw, setRaw] = useState<RawAnswers>({});

  const total = QUESTIONS.length;
  const isResult = step >= total;

  const generated: GeneratedChecklist | null = useMemo(() => {
    if (!isResult) return null;
    return generateChecklist(raw as Answers);
  }, [isResult, raw]);

  function setAnswer(id: string, value: string | string[]) {
    setRaw((prev) => ({ ...prev, [id]: value }));
  }

  function next() {
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  if (isResult && generated) {
    return <ChecklistResult generated={generated} raw={raw} onRestart={() => { setStep(0); setRaw({}); }} />;
  }

  const q = QUESTIONS[step];
  const current = raw[q.id];
  const canContinue =
    q.type === "checkbox"
      ? Array.isArray(current) && current.length > 0
      : typeof current === "string" && current.length > 0;

  function toggleCheckbox(value: string) {
    const arr = Array.isArray(current) ? [...current] : [];
    const idx = arr.indexOf(value);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else if (!q.maxChecked || arr.length < q.maxChecked) {
      arr.push(value);
    }
    setAnswer(q.id, arr);
  }

  function selectRadio(value: string) {
    setAnswer(q.id, value);
    // Avance automatique après une courte pause pour le retour visuel.
    setTimeout(() => setStep((s) => s + 1), 220);
  }

  return (
    <div className="min-h-screen audit-v2-bg flex flex-col px-4 py-8">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        {/* Progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Question {step + 1} sur {total}
            </span>
            <button onClick={back} disabled={step === 0} className="audit-v2-btn-ghost disabled:opacity-0">
              ← Retour
            </button>
          </div>
          <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-forest-700 transition-all duration-300"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              className="text-[26px] sm:text-[30px] text-[#111] leading-[1.15] mb-2"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
            >
              {q.prompt}
            </h2>
            {q.helper && (
              <p className="text-[13px] text-slate-600 mb-6 leading-relaxed">{q.helper}</p>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              {q.options.map((opt) => {
                const active =
                  q.type === "checkbox"
                    ? Array.isArray(current) && current.includes(opt.value)
                    : current === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      q.type === "checkbox" ? toggleCheckbox(opt.value) : selectRadio(opt.value)
                    }
                    className={`audit-v2-option ${active ? "audit-v2-option--active" : ""}`}
                  >
                    <span className="audit-v2-option-label">{opt.label}</span>
                    {opt.sub && <span className="audit-v2-option-sub">{opt.sub}</span>}
                    {active && <span className="audit-v2-option-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {q.type === "checkbox" && (
              <button
                onClick={next}
                disabled={!canContinue}
                className="audit-v2-btn-primary mt-6 w-full justify-center"
              >
                Continuer →
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Résultat : la checklist personnalisée ────────────────────────── */

function ChecklistResult({
  generated,
  raw,
  onRestart,
}: {
  generated: GeneratedChecklist;
  raw: RawAnswers;
  onRestart: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const juridiction = generated.answers.juridiction;
  const juriLabel = juridiction === "qc" ? "Québec" : "Ontario";

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch("/api/carriere-solo/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: generated.answers }),
      });
      if (!res.ok) throw new Error("Échec de génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "checklist-carriere-solo-safe.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("La génération du PDF a échoué. Réessaie dans un instant.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen audit-v2-bg px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#E5E0D5] mb-5">
            <span className="w-2 h-2 rounded-full bg-forest-700" />
            <span className="text-[11px] font-medium text-slate-600 tracking-wide">
              Ta checklist Carrière Solo · {juriLabel}
            </span>
          </span>
          <h1
            className="text-[32px] sm:text-[40px] text-[#111] leading-[1.1] mb-3"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            Ton plan pour ouvrir{" "}
            <span className="italic text-forest-700">ton cabinet.</span>
          </h1>
          <p className="text-[14px] text-slate-600 max-w-md mx-auto leading-relaxed">
            {generated.totalItems} étapes adaptées à ton profil, dont{" "}
            <strong className="text-amber-700">{generated.criticalCount} critiques</strong>. Garde ce
            document à portée pendant tout ton lancement.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 justify-center">
          <button onClick={downloadPdf} disabled={downloading} className="audit-v2-btn-primary justify-center">
            {downloading ? "Génération…" : "Télécharger en PDF ↓"}
          </button>
          <button onClick={onRestart} className="audit-v2-btn-ghost justify-center">
            Recommencer le questionnaire
          </button>
        </div>

        {/* Sections */}
        {generated.sections.map((section) => (
          <div key={section.meta.id} className="mb-9">
            <div className="mb-4">
              <h2
                className="text-[22px] text-[#111] leading-tight"
                style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
              >
                {section.meta.title}
              </h2>
              <p className="text-[12.5px] text-slate-500">{section.meta.subtitle}</p>
            </div>

            <div className="flex flex-col gap-3">
              {section.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  juridiction={juridiction}
                  highlighted={isHighlightedForFear(item, generated.answers)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* CTA Programme Carrière Solo */}
        <div className="rounded-2xl bg-[#1A2E2A] text-white p-7 sm:p-9 mt-4">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8FB49F]">
            Programme Carrière Solo
          </span>
          <h3
            className="text-[24px] sm:text-[28px] leading-tight mt-3 mb-3"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            Tu n&apos;es pas obligé de faire ça seul.
          </h3>
          <p className="text-[14px] text-[#D4E8D9] leading-relaxed mb-6">
            Cette checklist te montre le chemin. SAFE peut le parcourir avec toi. On a construit
            l&apos;OS du cabinet d&apos;avocat depuis la chaise du teneur de livres, justement pour
            que ton lancement ne ressemble pas à un parcours d&apos;obstacles.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#1A2E2A] px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#F0F9F4] transition-colors"
          >
            Demander à intégrer le Programme Carrière Solo →
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-8 leading-relaxed">
          Cette checklist est fournie à titre informatif. Elle ne constitue pas un avis juridique.
          Vérifie toujours les sources officielles avant d&apos;agir.
        </p>
      </div>
    </div>
  );
}

/* ── Carte d'un item de checklist ─────────────────────────────────── */

function ItemCard({
  item,
  juridiction,
  highlighted,
}: {
  item: ChecklistItem;
  juridiction: "qc" | "on";
  highlighted: boolean;
}) {
  const cout = coutLabel(item, juridiction);
  return (
    <div className="audit-v2-card">
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded ${PRIORITY_STYLE[item.priority]}`}
        >
          {PRIORITY_LABEL[item.priority]}
        </span>
        {highlighted && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Ta priorité
          </span>
        )}
      </div>

      <p className="text-[14.5px] font-semibold text-[#111] mt-2.5 leading-snug">{item.action}</p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[12px] text-slate-600">
        <span><strong className="text-slate-500 font-medium">Quand :</strong> {item.delai}</span>
        {cout && <span><strong className="text-slate-500 font-medium">Coût :</strong> {cout}</span>}
      </div>

      {item.piege && (
        <p className="text-[12.5px] text-amber-700 mt-2 leading-relaxed">
          <strong>À éviter :</strong> {item.piege.texte}
          {item.piege.chiffre ? ` (${item.piege.chiffre})` : ""}
        </p>
      )}

      {item.autorite && (
        <a
          href={item.autorite.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11.5px] text-forest-700 underline mt-2"
        >
          {item.autorite.label} ↗
        </a>
      )}

      {item.sansAvec && (
        <div className="mt-3.5 rounded-xl bg-[#F0F9F4] border-l-[3px] border-forest-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Sans SAFE
              </span>
              <p className="text-[12.5px] text-slate-700 mt-1 leading-relaxed">
                {item.sansAvec.sansSafe}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-700">
                Avec SAFE
              </span>
              <p className="text-[12.5px] text-slate-800 mt-1 leading-relaxed">
                {item.sansAvec.avecSafe}
              </p>
            </div>
          </div>
          {item.sansAvec.chiffre && (
            <p className="text-[12px] mt-3 pt-3 border-t border-[#C8E6D3]">
              <strong className="text-amber-700">{item.sansAvec.chiffre.valeur}</strong>
              <span className="text-slate-500"> · {item.sansAvec.chiffre.source}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
