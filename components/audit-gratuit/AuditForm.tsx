"use client";

/**
 * SAFE — Nouveau formulaire d'audit gratuit (v2)
 * Design : image fournie, palette crème + vert SAFE
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";
import {
  QUESTIONS, SECTIONS, visibleQuestions, PROVINCES,
  type Question,
} from "@/lib/audit-gratuit/questions";
import { buildRecommendation, type Recommendation } from "@/lib/audit-gratuit/recommendation";

type Lang = "fr" | "en";
type Answers = Record<string, unknown>;

interface AuditFormProps {
  lang: Lang;
}

/* ── Labels i18n basiques ─────────────────────────────────────────── */
const T = {
  fr: {
    brand: "Safe",
    confidential: "Confidentiel",
    founderTitle: "Jérémie Tiahou",
    founderSub: "Fondateur · Safe",
    stats: [
      { v: "15 min", l: "Durée" },
      { v: "24 h",   l: "Rapport" },
      { v: "0 $",    l: "Gratuit" },
    ],
    hello:
      "Bonjour. Je suis Jérémie, fondateur de Safe. Ce questionnaire va me permettre de comprendre votre cabinet et de vous préparer un rapport personnalisé sur votre efficacité, votre conformité et une offre réellement adaptée.",
    helloEn:
      "Hi. I'm Jérémie, founder of Safe. This questionnaire will help me understand your practice and prepare a personalized report on your efficiency, compliance, and an offer tailored to you.",
    previous: "Précédent",
    next: "Suivant",
    submit: "Livrer mon rapport",
    submitting: "Envoi…",
    progression: "Progression",
    stepOf: (i: number, n: number) => `Étape ${i} sur ${n}`,
    minutesLeft: (m: number) => `~${m} min restantes`,
    question: (i: number, n: number) => `Question ${i} sur ${n}`,
    required: "Requis",
    other: "Autre — précisez",
    ssl: "Données chiffrées SSL",
    canada: "Hébergé au Canada",
    noCommit: "Aucun engagement",
    validationError: "Veuillez répondre avant de passer à la suite.",
    cta: "Voir mon rapport personnalisé",
    emailMissing: "Veuillez renseigner votre courriel.",
    maxChecked: (n: number) => `Maximum ${n} sélections.`,
  },
  en: {
    brand: "Safe",
    confidential: "Confidential",
    founderTitle: "Jérémie Tiahou",
    founderSub: "Founder · Safe",
    stats: [
      { v: "15 min", l: "Duration" },
      { v: "24 h",   l: "Report" },
      { v: "0 $",    l: "Free" },
    ],
    hello:
      "Hi. I'm Jérémie, founder of Safe. This short questionnaire will help me understand your practice and prepare a personalized report on your efficiency, compliance, and a tailored offer.",
    helloEn: "",
    previous: "Previous",
    next: "Next",
    submit: "Deliver my report",
    submitting: "Sending…",
    progression: "Progress",
    stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
    minutesLeft: (m: number) => `~${m} min left`,
    question: (i: number, n: number) => `Question ${i} of ${n}`,
    required: "Required",
    other: "Other — please specify",
    ssl: "SSL encrypted",
    canada: "Hosted in Canada",
    noCommit: "No commitment",
    validationError: "Please answer before continuing.",
    cta: "See my personalized report",
    emailMissing: "Please provide your email.",
    maxChecked: (n: number) => `Maximum ${n} selections.`,
  },
};

/* ── Valeur vide pour une question ────────────────────────────────── */
function emptyFor(q: Question): unknown {
  if (q.subfields) return {};
  if (q.type === "checkbox" || q.type === "checkbox-with-other") return [];
  return "";
}

/* ── Validation ────────────────────────────────────────────────────── */
function isAnswered(q: Question, v: unknown): boolean {
  if (!q.required) return true;
  if (v == null) return false;
  if (q.subfields && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return q.subfields.every((sf) => !sf.required || (obj[sf.id] != null && obj[sf.id] !== ""));
  }
  if (Array.isArray(v)) return v.length > 0;
  if (q.type === "scale10") return typeof v === "number" && v >= 1 && v <= 10;
  return String(v).trim() !== "";
}

/* ── Composant principal ─────────────────────────────────────────── */
export function AuditForm({ lang }: AuditFormProps) {
  const t = T[lang];
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIdx, setCurrentIdx] = useState(0); // 0 = intro
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; reco: Recommendation } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ title: string; num: number } | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const totalSteps = visible.length + 1; // +1 pour intro
  const currentQuestion: Question | null = currentIdx === 0 ? null : visible[currentIdx - 1] || null;
  const percent = Math.round((currentIdx / (totalSteps - 1)) * 100);
  const minutesLeft = Math.max(1, Math.round(((totalSteps - currentIdx) * 32) / 60));

  const setAnswer = useCallback((qid: string, v: unknown) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
    setError(null);
  }, []);

  const goNext = useCallback(() => {
    if (currentQuestion && !isAnswered(currentQuestion, answers[currentQuestion.id])) {
      setError(t.validationError);
      return;
    }
    setError(null);
    setDirection(1);
    const nextIdx = Math.min(currentIdx + 1, totalSteps - 1);
    const nextQ = nextIdx === 0 ? null : visible[nextIdx - 1] || null;

    // Détection fin de section → célébration
    if (currentQuestion && nextQ && currentQuestion.section !== nextQ.section) {
      const completed = SECTIONS.find((s) => s.id === currentQuestion.section);
      const num = completed ? SECTIONS.findIndex((s) => s.id === completed.id) + 1 : 0;
      if (completed) {
        setCelebration({ title: completed.title, num });
        window.setTimeout(() => {
          setCelebration(null);
          setCurrentIdx(nextIdx);
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }, 1700);
        return;
      }
    }

    setCurrentIdx(nextIdx);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestion, answers, t, totalSteps, currentIdx, visible]);

  const goPrev = useCallback(() => {
    setError(null);
    setDirection(-1);
    setCurrentIdx((i) => Math.max(i - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ── Submission ──────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (currentQuestion && !isAnswered(currentQuestion, answers[currentQuestion.id])) {
      setError(t.validationError);
      return;
    }
    const contact = answers.contact as { email?: string } | undefined;
    if (!contact?.email) {
      setError(t.emailMissing);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/audit-gratuit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "submit_failed");
      setSubmitted({ id: json.id, reco: json.recommendation });
    } catch (e) {
      setError((e as Error).message || "submit_failed");
    } finally {
      setSubmitting(false);
    }
  }, [answers, currentQuestion, lang, t]);

  /* ── Guard : currentIdx out of range après filtrage ──────────── */
  useEffect(() => {
    if (currentIdx > totalSteps - 1) setCurrentIdx(totalSteps - 1);
  }, [currentIdx, totalSteps]);

  /* ── Page confirmation ───────────────────────────────────────── */
  if (submitted) {
    return <AuditSuccess lang={lang} reco={submitted.reco} id={submitted.id} answers={answers} />;
  }

  const isLastQuestion = currentIdx === totalSteps - 1 && currentIdx > 0;

  return (
    <div className="min-h-screen audit-v2-bg py-12 px-4">
      <div className="mx-auto w-full max-w-2xl">
        <TopHeader />

        <FounderCard lang={lang} />

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIdx}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentIdx === 0 ? (
                <IntroCard lang={lang} onStart={goNext} />
              ) : (
                currentQuestion && (
                  <QuestionCard
                    q={currentQuestion}
                    index={currentIdx}
                    total={totalSteps - 1}
                    value={answers[currentQuestion.id]}
                    onChange={(v) => setAnswer(currentQuestion.id, v)}
                    lang={lang}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {celebration && (
            <SectionCelebration
              title={celebration.title}
              num={celebration.num}
              lang={lang}
            />
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 text-[13px] text-[#8B2E1A] bg-[#FBEDE5] border border-[#E8C5B5] rounded-md px-4 py-2">
            {error}
          </div>
        )}

        {/* Navigation */}
        {currentIdx > 0 && (
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              onClick={goPrev}
              disabled={submitting}
              className="audit-v2-btn-ghost"
            >
              ← {t.previous}
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="audit-v2-btn-primary"
              >
                {submitting ? t.submitting : t.submit} →
              </button>
            ) : (
              <button
                onClick={goNext}
                className="audit-v2-btn-primary"
              >
                {t.next} →
              </button>
            )}
          </div>
        )}

        {/* Progression */}
        <div className="mt-10 audit-v2-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
              {t.progression}
            </span>
            <span className="text-[11px] text-neutral-500">
              {t.minutesLeft(minutesLeft)}
            </span>
          </div>
          <div className="relative h-1.5 bg-neutral-200/60 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--safe-green-800)] to-[var(--safe-green-600)] audit-v2-progress-shine overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
            <span>{t.stepOf(currentIdx + 1, totalSteps)}</span>
            <span>{percent}%</span>
          </div>
        </div>

        <TrustStrip lang={lang} />
      </div>
    </div>
  );
}

/* ── Sous-composants ───────────────────────────────────────────── */

function TopHeader() {
  return (
    <div className="flex items-center justify-between mb-10">
      <LogoMark size={34} />
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-300/70 bg-white/60 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--safe-green-800)]" />
        <span className="text-[11px] text-neutral-700 tracking-wide">Confidentiel</span>
      </div>
    </div>
  );
}

function FounderCard({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <div className="flex flex-col items-center text-center mb-10">
      <div className="w-20 h-20 rounded-full bg-[#111] text-white flex items-center justify-center mb-4 shadow-lg shadow-black/10">
        <span className="font-serif text-[22px] text-[var(--safe-green-100)]" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>
          JT
        </span>
      </div>
      <h1
        className="text-[30px] leading-tight text-[#111] mb-1"
        style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
      >
        {t.founderTitle}
      </h1>
      <p className="text-[12px] text-neutral-500 tracking-wide mb-8">{t.founderSub}</p>

      <div className="w-full h-px bg-neutral-200/80 mb-6" />

      <div className="flex items-center justify-center gap-10">
        {t.stats.map((s) => (
          <div key={s.l} className="text-center">
            <div
              className="text-[22px] text-[#111]"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
            >
              {s.v}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-1">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntroCard({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const t = T[lang];
  return (
    <div className="audit-v2-card-lg">
      <div className="flex gap-3 mb-2">
        <div className="shrink-0 w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center">
          <span className="font-serif text-[12px] text-[var(--safe-green-100)]" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>JT</span>
        </div>
        <div className="flex-1">
          <p className="text-[15px] text-[#111] leading-relaxed">
            <span className="font-semibold">Bonjour.</span> {lang === "fr" ? t.hello.substring(9) : t.hello}
          </p>
          {lang === "fr" && t.helloEn && (
            <>
              <div className="my-5 h-px bg-neutral-200/70" />
              <p className="text-[13px] text-neutral-500 leading-relaxed italic">
                {t.helloEn}
              </p>
            </>
          )}
        </div>
      </div>

      <button onClick={onStart} className="audit-v2-btn-primary w-full mt-6 justify-center">
        {lang === "fr" ? "Commencer le diagnostic" : "Start the diagnostic"} →
      </button>
    </div>
  );
}

function QuestionCard({
  q, index, total, value, onChange, lang,
}: {
  q: Question; index: number; total: number;
  value: unknown; onChange: (v: unknown) => void; lang: Lang;
}) {
  const t = T[lang];
  const section = SECTIONS.find((s) => s.id === q.section);

  return (
    <div className="audit-v2-card-lg">
      <div className="flex gap-3 mb-5">
        <div className="shrink-0 w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center">
          <span className="font-serif text-[12px] text-[var(--safe-green-100)]" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>JT</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
            {t.question(index, total)} · {section?.title}
          </div>
          <h3
            className="text-[22px] leading-snug text-[#111] mb-2"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            {q.label}
          </h3>
          {q.help && <p className="text-[13px] text-neutral-500 leading-relaxed">{q.help}</p>}
        </div>
      </div>

      <div className="mt-4">
        <FieldRenderer q={q} value={value} onChange={onChange} lang={lang} />
      </div>
    </div>
  );
}

function FieldRenderer({
  q, value, onChange, lang,
}: {
  q: Question; value: unknown; onChange: (v: unknown) => void; lang: Lang;
}) {
  const t = T[lang];

  // Sous-champs groupés
  if (q.subfields) {
    const obj = (value as Record<string, unknown>) || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {q.subfields.map((sf) => (
          <div key={sf.id} className={sf.options && sf.options.length > 4 ? "md:col-span-2" : ""}>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
              {sf.label}
            </label>
            {sf.type === "radio" && sf.options ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sf.options.map((o) => (
                  <OptionButton
                    key={o.value}
                    label={o.label}
                    sub={o.sub}
                    selected={obj[sf.id] === o.value}
                    onClick={() => onChange({ ...obj, [sf.id]: o.value })}
                    compact
                  />
                ))}
              </div>
            ) : (
              <input
                type={sf.type === "number" ? "number" : sf.type === "email" ? "email" : sf.type === "tel" ? "tel" : "text"}
                value={(obj[sf.id] as string) ?? ""}
                onChange={(e) => onChange({ ...obj, [sf.id]: sf.type === "number" ? Number(e.target.value) : e.target.value })}
                placeholder={sf.placeholder}
                className="audit-v2-input"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  switch (q.type) {
    case "text":
    case "email":
    case "tel":
    case "url":
    case "number":
      return (
        <input
          type={q.type}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(q.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={q.placeholder}
          className="audit-v2-input"
        />
      );

    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          rows={4}
          className="audit-v2-textarea"
        />
      );

    case "scale10": {
      const v = typeof value === "number" ? value : 0;
      return (
        <div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onChange(n)}
                className={`w-11 h-11 rounded-md text-[14px] font-medium transition
                  ${v === n
                    ? "bg-[var(--safe-green-800)] text-white border-transparent"
                    : "bg-white/70 border border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-neutral-400">
            <span>1 — très insatisfait</span>
            <span>10 — parfait</span>
          </div>
        </div>
      );
    }

    case "radio":
    case "radio-with-other": {
      const selected = value as string;
      const isOther = q.type === "radio-with-other" && typeof selected === "string" && selected.startsWith("other:");
      return (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options?.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={selected === o.value || (o.value === "autre" && isOther)}
                onClick={() => {
                  if (o.value === "autre" && q.type === "radio-with-other") onChange("other:");
                  else onChange(o.value);
                }}
              />
            ))}
          </div>
          {isOther && (
            <input
              type="text"
              autoFocus
              value={typeof selected === "string" ? selected.replace(/^other:/, "") : ""}
              onChange={(e) => onChange(`other:${e.target.value}`)}
              placeholder={t.other}
              className="audit-v2-input mt-3"
            />
          )}
        </div>
      );
    }

    case "checkbox":
    case "checkbox-with-other": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const otherChecked = q.type === "checkbox-with-other" && arr.some((v) => v.startsWith("other:"));
      const otherText = otherChecked ? (arr.find((v) => v.startsWith("other:")) || "other:").replace(/^other:/, "") : "";

      const toggle = (v: string) => {
        if (v === "autre" && q.type === "checkbox-with-other") {
          if (otherChecked) onChange(arr.filter((x) => !x.startsWith("other:")));
          else {
            if (q.maxChecked && arr.length >= q.maxChecked) return;
            onChange([...arr, "other:"]);
          }
          return;
        }
        if (arr.includes(v)) onChange(arr.filter((x) => x !== v));
        else {
          if (q.maxChecked && arr.length >= q.maxChecked) return;
          onChange([...arr, v]);
        }
      };

      return (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options?.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={arr.includes(o.value) || (o.value === "autre" && otherChecked)}
                onClick={() => toggle(o.value)}
              />
            ))}
          </div>
          {otherChecked && (
            <input
              type="text"
              autoFocus
              value={otherText}
              onChange={(e) => {
                const rest = arr.filter((x) => !x.startsWith("other:"));
                onChange([...rest, `other:${e.target.value}`]);
              }}
              placeholder={t.other}
              className="audit-v2-input mt-3"
            />
          )}
          {q.maxChecked && (
            <p className="mt-3 text-[11px] text-neutral-400">{t.maxChecked(q.maxChecked)}</p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function OptionButton({
  label, sub, selected, onClick, compact = false,
}: {
  label: string; sub?: string; selected: boolean; onClick: () => void; compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985, y: 0 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`audit-v2-option ${selected ? "audit-v2-option--active" : ""} ${compact ? "audit-v2-option--compact" : ""}`}
    >
      <span className="audit-v2-option-label">{label}</span>
      {sub && <span className="audit-v2-option-sub">{sub}</span>}
      <AnimatePresence>
        {selected && (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="audit-v2-option-check"
            aria-hidden="true"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.5 L5 9 L9.5 3.5" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function TrustStrip({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-neutral-500">
      <span className="flex items-center gap-2">
        <TrustIcon kind="lock" /> {t.ssl}
      </span>
      <span className="flex items-center gap-2">
        <TrustIcon kind="pin" /> {t.canada}
      </span>
      <span className="flex items-center gap-2">
        <TrustIcon kind="clock" /> {t.noCommit}
      </span>
    </div>
  );
}

/* ── Page succès ─────────────────────────────────────────────── */
function AuditSuccess({
  lang, reco, id, answers,
}: {
  lang: Lang; reco: Recommendation; id: string; answers: Answers;
}) {
  const contact = (answers.contact as { email?: string }) || {};
  const nom = ((answers.identite as { nom_complet?: string })?.nom_complet || "").split(" ")[0] || "";
  const fmt = (n: number) => `${n.toLocaleString("fr-CA")} $`;

  return (
    <div className="min-h-screen audit-v2-bg py-12 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <TopHeader />

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="audit-v2-card-lg text-center"
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--safe-green-800)] mb-6 font-medium">
              Merci {nom}
            </div>
            <h1
              className="text-[36px] leading-tight text-[#111] mb-4"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
            >
              Votre rapport{" "}
              <span className="italic text-[var(--safe-green-800)]">est prêt</span>.
            </h1>
            <p className="text-[14px] text-neutral-600 leading-relaxed max-w-xl mx-auto">
              {lang === "fr"
                ? `Nous venons de vous l'envoyer à ${contact.email}. Vous y trouverez la synthèse complète de vos réponses, le diagnostic, le devis comparatif et notre recommandation d'offre.`
                : `We just sent it to ${contact.email}. It contains a full synthesis, diagnostic, benchmark quote and our tailored offer.`}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="audit-v2-kpi">
                <div className="audit-v2-kpi-val">{fmt(reco.roi.annualValue)}</div>
                <div className="audit-v2-kpi-lab">Valeur récupérable / an</div>
              </div>
              <div className="audit-v2-kpi">
                <div className="audit-v2-kpi-val">{reco.roi.hoursPerWeek} h</div>
                <div className="audit-v2-kpi-lab">Libérées par semaine</div>
              </div>
              <div className="audit-v2-kpi">
                <div className="audit-v2-kpi-val">{reco.safeOffer.savings.percent}%</div>
                <div className="audit-v2-kpi-lab">Économie vs marché</div>
              </div>
            </div>

            <div className="mt-8 audit-v2-offer">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--safe-green-100)] mb-2">
                Offre recommandée
              </div>
              <div
                className="text-[28px] mb-1"
                style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
              >
                {reco.safeOffer.name}
              </div>
              <div className="text-[12px] text-[var(--safe-green-100)] mb-4">
                {reco.safeOffer.tagline}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[40px]"
                  style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
                >
                  {fmt(reco.safeOffer.monthly)}
                </span>
                <span className="text-[12px] text-[var(--safe-green-100)]">/ mois · {reco.safeOffer.seats}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`/api/audit-gratuit/${id}/pdf`}
                className="audit-v2-btn-primary justify-center"
              >
                Télécharger le PDF →
              </a>
              <a
                href="mailto:jeremie@safecabinet.ca?subject=Suite%20à%20mon%20audit%20SAFE"
                className="audit-v2-btn-ghost justify-center"
              >
                Planifier l&apos;appel de 30 min
              </a>
            </div>

            <div className="mt-8 text-[11px] text-neutral-400">
              Référence : <span className="font-mono">{id}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Célébration de fin de section ────────────────────────────────── */
function SectionCelebration({
  title, num, lang,
}: {
  title: string; num: number; lang: Lang;
}) {
  const label = lang === "fr" ? "Section complétée" : "Section completed";
  const nextLabel = lang === "fr" ? "On passe à la suivante…" : "Moving to the next one…";
  const pad = String(num).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at center, rgba(11,26,19,0.72) 0%, rgba(11,26,19,0.94) 70%)",
        backdropFilter: "blur(6px)",
      }}
      aria-live="polite"
      role="status"
    >
      <motion.div
        initial={{ scale: 0.9, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: -8, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm text-center"
      >
        {/* Check animé */}
        <div className="relative mx-auto mb-6 w-[120px] h-[120px]">
          {/* Anneaux pulsants */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: "1.5px solid rgba(143,180,159,0.45)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.5], opacity: [0.7, 0] }}
            transition={{ duration: 1.4, ease: "easeOut", repeat: 1 }}
          />
          <motion.span
            className="absolute inset-2 rounded-full"
            style={{ border: "1.5px solid rgba(143,180,159,0.3)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.85, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.2, repeat: 1 }}
          />

          {/* Disque vert */}
          <motion.div
            className="absolute inset-[18px] rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--safe-green-700) 0%, var(--safe-green-900) 100%)",
              boxShadow: "0 18px 48px -12px rgba(31,58,46,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg width="44" height="44" viewBox="0 0 52 52" fill="none">
              <motion.path
                d="M13 27 L22 36 L39 18"
                stroke="#EAF3EC"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
          className="text-[10px] uppercase tracking-[0.3em] text-[var(--safe-green-100)] mb-3"
        >
          — {pad} · {label}
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] text-white leading-tight mb-2"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="text-[13px] text-[var(--safe-green-100)]/80"
        >
          {nextLabel}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

/* ── Icônes ligne (remplacent les emojis) ─────────────────────────── */
function TrustIcon({ kind }: { kind: "lock" | "pin" | "clock" }) {
  const common = {
    width: 14, height: 14, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "lock") {
    return (
      <svg {...common}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (kind === "pin") {
    return (
      <svg {...common}>
        <path d="M12 22s7-7.58 7-12a7 7 0 0 0-14 0c0 4.42 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
