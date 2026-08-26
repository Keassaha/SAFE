"use client";

/**
 * SAFE — Questionnaire du diagnostic.
 * Design aligné sur le site public : albâtre + forêt, serif Instrument, mono.
 * Grammaire reprise de l'accueil : rail de tirets qui nomme la section franchie,
 * compteur d'avancement en coin, une question par palier, transitions lentes.
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SafeMark } from "@/components/branding/SafeLogo";
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
    brand: "SAFE",
    confidential: "Confidentiel",
    founderTitle: "Jérémie Tiahou",
    founderSub: "Fondateur · SAFE",
    stats: [
      { v: "15 min", l: "Durée" },
      { v: "24 h",   l: "Rapport" },
      { v: "0 $",    l: "Gratuit" },
    ],
    hello:
      "Bonjour. Je suis Jérémie, fondateur de SAFE. Ce questionnaire va me permettre de comprendre votre cabinet et de vous préparer un rapport personnalisé sur votre efficacité, votre conformité et une offre réellement adaptée.",
    helloEn:
      "Hi. I'm Jérémie, founder of SAFE. This questionnaire will help me understand your practice and prepare a personalized report on your efficiency, compliance, and an offer tailored to you.",
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
    brand: "SAFE",
    confidential: "Confidential",
    founderTitle: "Jérémie Tiahou",
    founderSub: "Founder · SAFE",
    stats: [
      { v: "15 min", l: "Duration" },
      { v: "24 h",   l: "Report" },
      { v: "0 $",    l: "Free" },
    ],
    hello:
      "Hi. I'm Jérémie, founder of SAFE. This short questionnaire will help me understand your practice and prepare a personalized report on your efficiency, compliance, and a tailored offer.",
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
    <div className="min-h-screen audit-v2-bg px-4 pb-16 pt-24">
      <TopHeader />
      <SectionRail current={currentQuestion?.section ?? null} started={currentIdx > 0} />

      <div className="mx-auto w-full max-w-2xl">
        <FounderCard lang={lang} />

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIdx}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -30 : 30 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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

        {/* Avancement : un compteur discret plutôt qu'une grosse barre */}
        <div
          className="mt-10 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t pt-5"
          style={{ borderColor: "rgba(31,42,36,0.08)" }}
        >
          <div className="flex items-baseline gap-3">
            <motion.span
              key={percent}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[30px] leading-none tabular-nums"
              style={{ color: "#1F2A24" }}
            >
              {String(percent).padStart(2, "0")}
              <span className="text-[15px]" style={{ color: "#7C877F" }}>&nbsp;%</span>
            </motion.span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#7C877F" }}>
              {t.progression}
            </span>
          </div>

          <div className="flex items-baseline gap-6 font-mono text-[11px] tracking-[0.05em]" style={{ color: "#5A665F" }}>
            <span>{t.stepOf(currentIdx + 1, totalSteps)}</span>
            <span>{t.minutesLeft(minutesLeft)}</span>
          </div>
        </div>

        {/* Filet d'avancement, fin, sans dégradé ni brillance */}
        <div className="mt-4 h-px w-full overflow-hidden" style={{ background: "rgba(31,42,36,0.08)" }}>
          <motion.div
            className="h-px origin-left"
            style={{ background: "var(--si-ink-strong)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: percent / 100 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <TrustStrip lang={lang} />
      </div>
    </div>
  );
}

/* ── Sous-composants ───────────────────────────────────────────── */

function TopHeader() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between px-6 sm:px-11"
      style={{
        background: "rgba(239,242,237,0.86)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(31,42,36,0.08)",
      }}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <SafeMark size={22} />
        <span className="font-serif text-[21px]" style={{ color: "#1F2A24" }}>Safe</span>
      </Link>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#7C877F" }}>
        Confidentiel
      </span>
    </header>
  );
}

/**
 * Rail d'étapes : un tiret par section du questionnaire, à droite.
 * La section en cours se nomme et s'allonge, les sections franchies restent vertes.
 * Repère de lecture, jamais cliquable.
 */
function SectionRail({ current, started }: { current: string | null; started: boolean }) {
  const idx = current ? SECTIONS.findIndex((s) => s.id === current) : -1;
  return (
    <div
      className="audit-rail"
      aria-hidden
      style={{ opacity: started && idx >= 0 ? 1 : 0, transition: "opacity 800ms ease" }}
    >
      {SECTIONS.map((s, i) => (
        <div
          key={s.id}
          className={`audit-rail-stop ${i === idx ? "audit-rail-stop--live" : ""} ${i < idx ? "audit-rail-stop--done" : ""}`}
        >
          <span className="audit-rail-label">{s.subtitle}</span>
          <span className="audit-rail-dash" />
        </div>
      ))}
    </div>
  );
}

function FounderCard({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <div className="mb-10">
      <div className="flex items-center gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--si-ink-strong)" }}
        >
          <span className="font-serif text-[16px]" style={{ color: "#EAF2EC" }}>JT</span>
        </span>
        <div>
          <p className="font-serif text-[24px] leading-none" style={{ color: "#1F2A24" }}>
            {t.founderTitle}
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#7C877F" }}>
            {t.founderSub}
          </p>
        </div>
      </div>

      <div className="mt-7 flex items-baseline gap-10 border-t pt-5" style={{ borderColor: "rgba(31,42,36,0.08)" }}>
        {t.stats.map((s) => (
          <div key={s.l}>
            <div className="font-mono text-[19px] tabular-nums leading-none" style={{ color: "#1F2A24" }}>
              {s.v}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#7C877F" }}>
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
      <p className="font-sans text-[16px] leading-[1.62]" style={{ color: "#1F2A24" }}>
        <span className="font-serif text-[19px]">Bonjour.</span>{" "}
        {lang === "fr" ? t.hello.substring(9) : t.hello}
      </p>
      {lang === "fr" && t.helloEn && (
        <>
          <div className="my-6 h-px" style={{ background: "rgba(31,42,36,0.08)" }} />
          <p className="font-sans text-[13.5px] italic leading-[1.6]" style={{ color: "#5A665F" }}>
            {t.helloEn}
          </p>
        </>
      )}

      <button onClick={onStart} className="audit-v2-btn-primary mt-8 w-full justify-center">
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
      {/* Une question à l'écran, annoncée par sa section : rien d'autre à lire */}
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--si-ink-strong)" }}>
          {section?.subtitle}
        </span>
        <span className="font-mono text-[10px] tracking-[0.12em] tabular-nums" style={{ color: "#7C877F" }}>
          {t.question(index, total)}
        </span>
      </div>

      <h3
        className="mt-5 max-w-[30ch] font-serif text-[26px] leading-[1.14] sm:text-[30px]"
        style={{ color: "#1F2A24", letterSpacing: "-0.014em" }}
      >
        {q.label}
      </h3>
      {q.help && (
        <p className="mt-3 max-w-[52ch] font-sans text-[13.5px] leading-[1.6]" style={{ color: "#5A665F" }}>
          {q.help}
        </p>
      )}

      <div className="mt-8">
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
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onChange(n)}
                className="h-11 w-11 rounded-[8px] border font-mono text-[14px] tabular-nums transition-colors duration-300"
                style={
                  v === n
                    ? { background: "var(--si-ink-strong)", borderColor: "var(--si-ink-strong)", color: "#F4F7F3" }
                    : { background: "#FFFFFF", borderColor: "rgba(31,42,36,0.10)", color: "#5A665F" }
                }
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between font-sans text-[11.5px]" style={{ color: "#7C877F" }}>
            <span>1 · très insatisfait</span>
            <span>10 · parfait</span>
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
    <div
      className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 font-sans text-[11.5px]"
      style={{ color: "#7C877F" }}
    >
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
    <div className="min-h-screen audit-v2-bg px-4 pb-16 pt-24">
      <TopHeader />
      <div className="mx-auto w-full max-w-3xl">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="audit-v2-card-lg text-center"
          >
            <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--si-ink-strong)" }}>
              Merci {nom}
            </div>
            <h1
              className="mb-5 font-serif text-[38px] leading-[1.08]"
              style={{ color: "#1F2A24", letterSpacing: "-0.02em" }}
            >
              Votre rapport{" "}
              <span className="italic" style={{ color: "var(--si-ink-strong)" }}>est prêt</span>.
            </h1>
            <p className="mx-auto max-w-xl font-sans text-[14.5px] leading-[1.62]" style={{ color: "#5A665F" }}>
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

            <div className="audit-v2-offer mt-8">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgb(var(--si-surface-rgb) / 0.72)" }}>
                Offre recommandée
              </div>
              <div className="mb-1 font-serif text-[30px] leading-tight">
                {reco.safeOffer.name}
              </div>
              <div className="mb-5 font-sans text-[13px]" style={{ color: "#C4D4C9" }}>
                {reco.safeOffer.tagline}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-sans text-[13px]" style={{ color: "#C4D4C9" }}>À partir de</span>
                <span className="font-mono text-[38px] tabular-nums leading-none">
                  {fmt(reco.safeOffer.monthly)}
                </span>
                <span className="font-sans text-[12.5px]" style={{ color: "#C4D4C9" }}>
                  / mois · {reco.safeOffer.seats}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-[var(--safe-green-100)]/70 leading-relaxed max-w-xs mx-auto">
                L&apos;offre définitive sera confirmée lors de votre rencontre avec l&apos;équipe SAFE.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`/api/audit-gratuit/${id}/pdf`}
                className="audit-v2-btn-primary justify-center"
              >
                Télécharger le PDF →
              </a>
              <a
                href="mailto:jeremie@safecabinet.ca?subject=Suite%20à%20mon%20diagnostic%20SAFE"
                className="audit-v2-btn-ghost justify-center"
              >
                Planifier l&apos;appel de 30 min
              </a>
            </div>

            <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "#7C877F" }}>
              Référence {id}
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
  const label = lang === "fr" ? "Section franchie" : "Section cleared";
  const nextLabel = lang === "fr" ? "On passe à la suivante." : "Moving to the next one.";
  const pad = String(num).padStart(2, "0");

  /* Palier franchi : un aplat forêt, un tiret qui se trace, rien de plus. */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ background: "rgba(20,38,31,0.96)" }}
      aria-live="polite"
      role="status"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[11px] tracking-[0.16em]" style={{ color: "rgb(var(--si-surface-rgb) / 0.72)" }}>
            {pad}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgb(var(--si-surface-rgb) / 0.72)" }}>
            {label}
          </span>
        </div>

        <motion.span
          aria-hidden
          className="mt-5 block h-px origin-left"
          style={{ background: "var(--si-ink-strong)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        />

        <h3
          className="mt-6 font-serif text-[32px] leading-[1.12]"
          style={{ color: "#F4F7F3", letterSpacing: "-0.018em" }}
        >
          {title}
        </h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.55 }}
          className="mt-3 font-sans text-[14px]"
          style={{ color: "rgba(244,247,243,0.6)" }}
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
