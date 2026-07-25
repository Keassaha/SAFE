"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  FolderKanban,
  ReceiptText,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { SafeLogo } from "@/components/branding/SafeLogo";
import {
  BG,
  EASE,
  FAINT,
  Footer,
  GREEN,
  INK,
  LINE,
  LINE_SOFT,
  MUTED,
  Nav,
  R,
  SURFACE,
  VERIFIED,
  fadeUp,
} from "./shared";

const PRODUCT_LIST = [
  {
    id: "rapprochement",
    category: "Fidéicommis",
    title: "Rapprochement de juin",
    context: "Écart de 500 $ · Mandat Lavoie",
    status: "À vérifier",
    action: "SAFE a isolé l’écart et conserve la certification en attente.",
    color: "#A16B16",
    background: "rgba(161,107,22,0.08)",
    icon: WalletCards,
  },
  {
    id: "facture",
    category: "Facturation",
    title: "Facture 2026-041",
    context: "Succession Tremblay · 3 200 $",
    status: "Prête à envoyer",
    action: "Les heures approuvées et les débours sont déjà rattachés à la facture.",
    color: GREEN,
    background: "rgba(18,161,80,0.08)",
    icon: ReceiptText,
  },
  {
    id: "inventaire",
    category: "Dossier",
    title: "Inventaire successoral",
    context: "Échéance · 30 juin",
    status: "À valider",
    action: "Le document, l’échéance et le responsable restent liés au même dossier.",
    color: "#52635A",
    background: "rgba(82,99,90,0.08)",
    icon: FolderKanban,
  },
  {
    id: "temps",
    category: "Temps",
    title: "6,5 h non facturées",
    context: "Succession Tremblay",
    status: "À facturer",
    action: "Le temps saisi peut être transféré à la facture sans nouvelle saisie.",
    color: GREEN,
    background: "rgba(18,161,80,0.08)",
    icon: Clock3,
  },
] as const;

const SYSTEM_NODES = [
  {
    id: "dossiers",
    label: "Dossiers",
    icon: FolderKanban,
    position: { left: "13%", top: "17%" },
  },
  {
    id: "temps",
    label: "Temps",
    icon: Clock3,
    position: { right: "13%", top: "14%" },
  },
  {
    id: "facturation",
    label: "Facturation",
    icon: ReceiptText,
    position: { left: "11%", bottom: "14%" },
  },
  {
    id: "fideicommis",
    label: "Fidéicommis",
    icon: WalletCards,
    position: { right: "9%", bottom: "13%" },
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      {...fadeUp(0)}
      className="font-mono text-[11px] uppercase tracking-[0.16em]"
      style={{ color: GREEN }}
    >
      {children}
    </motion.p>
  );
}

function ProductListVisual() {
  const [activeId, setActiveId] = useState<(typeof PRODUCT_LIST)[number]["id"]>("rapprochement");
  const reduceMotion = useReducedMotion();
  const active = PRODUCT_LIST.find((item) => item.id === activeId) ?? PRODUCT_LIST[0];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const index = PRODUCT_LIST.findIndex((item) => item.id === current);
        return PRODUCT_LIST[(index + 1) % PRODUCT_LIST.length].id;
      });
    }, 3800);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="overflow-hidden rounded-[13px] border"
      style={{
        background: "#FBFCFA",
        borderColor: LINE,
        boxShadow: "0 28px 70px -52px rgba(17,35,28,0.55)",
      }}
    >
      <div className="flex h-12 items-center justify-between border-b px-4 sm:px-5" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2.5">
          <SafeLogo markOnly noPulse size={18} />
          <span className="font-sans text-[12px]" style={{ color: INK }}>SAFE</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.13em]" style={{ color: FAINT }}>
          Aujourd’hui
        </span>
      </div>

      <div className="px-4 pb-3 pt-5 sm:px-6">
        <p className="font-serif text-[22px] font-normal" style={{ color: INK }}>À traiter maintenant</p>
        <p className="mt-1 font-sans text-[11.5px]" style={{ color: FAINT }}>
          4 éléments demandent votre attention
        </p>
      </div>

      <div className="border-t" style={{ borderColor: LINE_SOFT }}>
        {PRODUCT_LIST.map((item) => {
          const Icon = item.icon;
          const selected = active.id === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className="relative grid w-full grid-cols-[34px_1fr] gap-3 border-b px-4 py-3.5 text-left transition-colors sm:grid-cols-[34px_1fr_auto] sm:items-center sm:px-6"
              style={{
                background: selected ? "rgba(31,58,46,0.045)" : "transparent",
                borderColor: LINE_SOFT,
              }}
              aria-pressed={selected}
            >
              {selected && (
                <motion.span
                  layoutId="product-list-selection"
                  className="absolute inset-y-0 left-0 w-0.5"
                  style={{ background: GREEN }}
                  transition={{ duration: 0.28, ease: EASE }}
                />
              )}
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[7px]"
                style={{ background: item.background, color: item.color }}
              >
                <Icon size={15} strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block font-sans text-[10.5px]" style={{ color: FAINT }}>{item.category}</span>
                <span className="mt-0.5 block truncate font-sans text-[13px]" style={{ color: INK }}>{item.title}</span>
                <span className="mt-0.5 block truncate font-sans text-[11px] sm:hidden" style={{ color: MUTED }}>
                  {item.context}
                </span>
              </span>
              <span className="hidden items-center gap-5 sm:flex">
                <span className="font-sans text-[11px]" style={{ color: MUTED }}>{item.context}</span>
                <span
                  className="rounded-full px-2 py-1 font-sans text-[10px]"
                  style={{ background: item.background, color: item.color }}
                >
                  {item.status}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[82px] px-4 py-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex items-start gap-2.5"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GREEN }} />
            <p className="font-sans text-[11.5px] leading-[1.55]" style={{ color: MUTED }}>
              {active.action}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-32 sm:px-6 sm:pt-40" style={{ background: BG }}>
      <div
        aria-hidden
        className="absolute right-[-12%] top-24 h-[560px] w-[560px] rounded-full blur-[110px]"
        style={{ background: "rgba(18,161,80,0.07)" }}
      />
      <div className="relative mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div className="relative z-10">
          <motion.p
            {...fadeUp(0)}
            className="font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: GREEN }}
          >
            SAFE · système de gestion pour cabinets d’avocats
          </motion.p>
          <motion.h1
            {...fadeUp(0.06)}
            className="mt-5 max-w-[11ch] font-serif text-[46px] font-normal leading-[0.99] sm:text-[62px] lg:text-[72px]"
            style={{ color: INK, letterSpacing: "-0.026em" }}
          >
            SAFE tient votre cabinet{" "}
            <span className="italic" style={{ color: GREEN }}>
              ensemble.
            </span>
          </motion.h1>
          <motion.p
            {...fadeUp(0.12)}
            className="mt-7 max-w-[46ch] font-sans text-[17px] leading-[1.62] sm:text-[18px]"
            style={{ color: MUTED }}
          >
            Fidéicommis, dossiers, temps, facturation et conformité partagent enfin le même
            contexte. Vous voyez ce qui est à jour, ce qui attend et ce qui ne concorde pas.
          </motion.p>
          <motion.div {...fadeUp(0.18)} className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href={R.diagnostic}
              className="inline-flex h-11 items-center gap-2 rounded-[7px] px-5 font-sans text-[14px] font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: GREEN,
                color: "#fff",
                boxShadow: "0 14px 28px -18px rgba(18,161,80,0.85)",
              }}
            >
              Faire le diagnostic <ArrowRight size={15} />
            </Link>
            <a
              href="#systeme"
              className="inline-flex h-11 items-center font-sans text-[14px] font-medium"
              style={{ color: INK }}
            >
              Voir comment SAFE fonctionne
            </a>
          </motion.div>
          <motion.p {...fadeUp(0.24)} className="mt-4 font-sans text-[12px]" style={{ color: FAINT }}>
            Une lecture simple des actions qui demandent votre attention.
          </motion.p>
        </div>

        <motion.div {...fadeUp(0.12)} className="relative lg:-mr-24 lg:pl-3">
          <ProductListVisual />
        </motion.div>
      </div>
    </section>
  );
}

function ProofStrip() {
  const proofs = [
    "Conçu au Québec",
    "Données hébergées au Canada",
    "Pensé pour le fidéicommis",
    "Utilisé dans un vrai cabinet",
  ];
  return (
    <section className="border-y px-5 py-5 sm:px-6" style={{ background: SURFACE, borderColor: LINE }}>
      <div className="mx-auto grid max-w-[1180px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {proofs.map((proof) => (
          <div key={proof} className="flex items-center gap-2 font-sans text-[12.5px]" style={{ color: MUTED }}>
            <Check size={13} style={{ color: GREEN }} />
            <span>{proof}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SystemFigure() {
  const reduceMotion = useReducedMotion();

  const paths = [
    "M 360 250 C 282 218, 244 150, 142 112",
    "M 360 250 C 438 206, 478 137, 578 103",
    "M 360 250 C 281 292, 229 350, 128 401",
    "M 360 250 C 443 286, 482 363, 591 407",
  ];

  return (
    <motion.div
      {...fadeUp(0.08)}
      className="relative min-h-[430px] overflow-hidden sm:min-h-[500px]"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(18,161,80,0.08), rgba(18,161,80,0.015) 31%, transparent 58%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-[5%] opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(31,58,46,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,46,0.045) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "radial-gradient(circle at center, black 10%, transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[318px] w-[318px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ borderColor: "rgba(31,58,46,0.055)" }}
      />

      <svg
        aria-hidden
        viewBox="0 0 720 500"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke={GREEN}
            strokeWidth="1.25"
            strokeLinecap="round"
            initial={reduceMotion ? false : { opacity: 0, pathLength: 0 }}
            whileInView={{ opacity: 0.28, pathLength: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ delay: 0.12 + index * 0.11, duration: 0.8, ease: EASE }}
          />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <motion.div
          className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full border"
          style={{
            background: "#F8FBF8",
            borderColor: GREEN,
            boxShadow: "0 20px 48px -28px rgba(18,79,49,0.5)",
          }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <span
            aria-hidden
            className="absolute inset-[7px] rounded-full border"
            style={{ borderColor: "rgba(18,161,80,0.34)" }}
          />
          <SafeLogo
            markOnly
            noPulse
            size={34}
            className="[&>span]:!bg-[#F1F8F3] [&>span]:!ring-[#12A150]/70"
          />
        </motion.div>
        <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
          Contexte partagé
        </span>
      </div>

      {SYSTEM_NODES.map((node, index) => {
        const Icon = node.icon;

        return (
          <motion.div
            key={node.id}
            className="absolute flex w-[92px] flex-col items-center text-center sm:w-[112px]"
            style={node.position}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ delay: 0.34 + index * 0.1, duration: 0.5, ease: EASE }}
          >
            <span
              className="relative flex h-12 w-12 items-center justify-center rounded-full border sm:h-14 sm:w-14"
              style={{
                background: "#F6FAF7",
                borderColor: "rgba(18,161,80,0.28)",
                color: GREEN,
              }}
            >
              <Icon size={19} strokeWidth={1.5} />
            </span>
            <span
              className="mt-2 font-sans text-[11.5px] sm:text-[12.5px]"
              style={{ color: INK }}
            >
              {node.label}
            </span>
          </motion.div>
        );
      })}

      <div
        aria-hidden
        className="absolute inset-x-[12%] bottom-[5%] h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(31,58,46,0.10), transparent)" }}
      />
    </motion.div>
  );
}

function SystemSection() {
  return (
    <section id="systeme" className="scroll-mt-20 px-5 py-28 sm:px-6 lg:py-36" style={{ background: BG }}>
      <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div>
          <SectionLabel>Un système, pas une collection d’outils</SectionLabel>
          <motion.h2
            {...fadeUp(0.06)}
            className="mt-5 max-w-[13ch] font-serif text-[36px] font-normal leading-[1.06] sm:text-[48px]"
            style={{ color: INK, letterSpacing: "-0.02em" }}
          >
            Chaque action garde son contexte.
          </motion.h2>
          <motion.p
            {...fadeUp(0.12)}
            className="mt-6 max-w-[43ch] font-sans text-[16px] leading-[1.65]"
            style={{ color: MUTED }}
          >
            Un dossier ne vit pas séparément de son temps, de sa facture ou de ses fonds en
            fiducie. SAFE relie ces éléments pour que l’information circule sans être recopiée.
          </motion.p>
          <motion.p
            {...fadeUp(0.18)}
            className="mt-5 max-w-[43ch] font-sans text-[14px] leading-[1.6]"
            style={{ color: INK }}
          >
            Le contexte circule d’une action à la suivante sans être ressaisi.
          </motion.p>
        </div>
        <SystemFigure />
      </div>
    </section>
  );
}

function ReconciliationFigure() {
  const rows = [
    ["Solde bancaire", "21 000 $", true],
    ["Registre du fidéicommis", "21 000 $", true],
    ["Soldes par dossier", "20 500 $", false],
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-[14px] border bg-white p-5 sm:p-7" style={{ borderColor: LINE }}>
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: LINE }}>
        <span className="font-sans text-[13px]" style={{ color: INK }}>Rapprochement à trois voies</span>
        <span className="font-mono text-[11px]" style={{ color: FAINT }}>JUIN 2026</span>
      </div>
      <div className="mt-2">
        {rows.map(([label, value, ok], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + index * 0.12, duration: 0.35 }}
            className="flex items-center justify-between border-b py-4"
            style={{ borderColor: LINE_SOFT }}
          >
            <span className="font-sans text-[13px]" style={{ color: MUTED }}>{label}</span>
            <span className="flex items-center gap-2 font-mono text-[13px]" style={{ color: ok ? INK : "#9A6712" }}>
              {value}
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: ok ? GREEN : "#C38A24", boxShadow: ok ? "none" : "0 0 0 5px rgba(195,138,36,0.10)" }}
              />
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.35 }}
        className="mt-5 flex items-start gap-3 rounded-[9px] px-4 py-3"
        style={{ background: "rgba(195,138,36,0.08)", color: "#72531B" }}
      >
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <span className="font-sans text-[12px] leading-[1.5]">
          Écart de 500 $. La certification reste bloquée jusqu’à la correction.
        </span>
      </motion.div>
    </div>
  );
}

function BillingFlowFigure() {
  const steps = [
    { label: "Temps saisi", value: "6,5 h", icon: Clock3 },
    { label: "Facture émise", value: "3 200 $", icon: ReceiptText },
    { label: "Paiement reçu", value: "14 juin", icon: Check },
  ];

  return (
    <div className="overflow-hidden rounded-[14px] border bg-white p-5 sm:p-7" style={{ borderColor: LINE }}>
      <div className="relative grid gap-5 sm:grid-cols-3">
        <motion.div
          aria-hidden
          className="absolute left-[12%] right-[12%] top-7 hidden h-px origin-left sm:block"
          style={{ background: GREEN }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 + index * 0.16, duration: 0.4 }}
              className="relative z-10"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full border"
                style={{ background: "#F7FAF7", borderColor: "rgba(18,161,80,0.22)", color: GREEN }}
              >
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <p className="mt-4 font-sans text-[12px]" style={{ color: FAINT }}>{step.label}</p>
              <p className="mt-1 font-mono text-[18px]" style={{ color: INK }}>{step.value}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-8 border-t pt-4 font-sans text-[12.5px]" style={{ borderColor: LINE, color: VERIFIED }}>
        Chaque étape conserve le dossier et le client d’origine.
      </div>
    </div>
  );
}

function ReviewFigure() {
  const cards = [
    { label: "Question", title: "Confirmer la date de signature", tone: "#A06C16" },
    { label: "Document prêt", title: "Projet de requête en révision", tone: MUTED },
    { label: "Prêt pour revue", title: "Requête prête à valider", tone: VERIFIED },
  ];

  return (
    <div className="overflow-hidden rounded-[14px] border bg-white p-5 sm:p-7" style={{ borderColor: LINE }}>
      <div className="flex items-center justify-between">
        <span className="font-serif text-[20px]" style={{ color: INK }}>Navette</span>
        <span className="rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ background: "#EDF1ED", color: MUTED }}>3</span>
      </div>
      <div className="mt-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: 14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12, duration: 0.4 }}
            className="group flex items-start gap-3 border-t py-4"
            style={{ borderColor: LINE_SOFT }}
          >
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-125"
              style={{ background: card.tone }}
            />
            <span className="min-w-0">
              <span className="block font-sans text-[10.5px] uppercase tracking-[0.09em]" style={{ color: card.tone }}>
                {card.label}
              </span>
              <span className="mt-1 block font-sans text-[13px]" style={{ color: INK }}>{card.title}</span>
              <span className="mt-1 block font-sans text-[11.5px]" style={{ color: FAINT }}>Aaliyah Côté · Dossier 2026-001</span>
            </span>
            <ArrowRight size={14} className="ml-auto mt-3 shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: FAINT }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatureStory({
  label,
  title,
  body,
  result,
  visual,
  reverse = false,
}: {
  label: string;
  title: string;
  body: string;
  result: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div className={reverse ? "lg:order-2 lg:pl-12" : "lg:pr-12"}>
        <SectionLabel>{label}</SectionLabel>
        <motion.h3
          {...fadeUp(0.06)}
          className="mt-5 max-w-[15ch] font-serif text-[34px] font-normal leading-[1.08] sm:text-[43px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          {title}
        </motion.h3>
        <motion.p {...fadeUp(0.12)} className="mt-6 max-w-[48ch] font-sans text-[16px] leading-[1.65]" style={{ color: MUTED }}>
          {body}
        </motion.p>
        <motion.p
          {...fadeUp(0.18)}
          className="mt-7 border-l-2 pl-4 font-sans text-[14px] leading-[1.55]"
          style={{ color: INK, borderColor: GREEN }}
        >
          {result}
        </motion.p>
      </div>
      <motion.div {...fadeUp(0.1)} className={reverse ? "lg:order-1" : ""}>
        {visual}
      </motion.div>
    </div>
  );
}

function ProductArguments() {
  return (
    <section id="arguments" className="scroll-mt-20 px-5 py-28 sm:px-6 lg:py-36" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-[1100px] space-y-28 lg:space-y-40">
        <FeatureStory
          label="Vérifier"
          title="L’écart apparaît avant l’inspection."
          body="SAFE compare le relevé bancaire, le registre du fidéicommis et les soldes par dossier. Lorsqu’un montant ne concorde pas, le système le signale et empêche une certification prématurée."
          result="Vous corrigez une différence identifiée, pas un doute diffus."
          visual={<ReconciliationFigure />}
        />
        <FeatureStory
          reverse
          label="Encaisser"
          title="Le travail suit son chemin jusqu’au paiement."
          body="Les heures et les débours sont déjà rattachés au dossier. Ils peuvent remonter dans la facture, puis rester visibles jusqu’à l’encaissement, sans reconstruire l’historique."
          result="Moins de ressaisie. Moins de travail réalisé qui reste oublié."
          visual={<BillingFlowFigure />}
        />
        <FeatureStory
          label="Collaborer"
          title="L’équipe prépare. L’avocat garde le jugement."
          body="La Navette rassemble les questions, les documents prêts et les éléments à valider. L’adjointe sait ce qui avance. L’avocat retrouve les décisions qui demandent réellement son attention."
          result="SAFE soutient le copilote du cabinet sans se substituer à lui."
          visual={<ReviewFigure />}
        />
      </div>
    </section>
  );
}

function ContinuityAndPricing() {
  const plans = [
    ["Solo", "99 $", "Pour une pratique individuelle."],
    ["Cabinet", "149 $", "Pour une petite équipe qui travaille ensemble."],
  ];
  return (
    <section className="border-t px-5 py-28 sm:px-6 lg:py-36" style={{ background: BG, borderColor: LINE }}>
      <div className="mx-auto grid max-w-[1100px] gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionLabel>Construit dans le réel</SectionLabel>
          <motion.h2
            {...fadeUp(0.06)}
            className="mt-5 max-w-[13ch] font-serif text-[36px] font-normal leading-[1.08] sm:text-[46px]"
            style={{ color: INK }}
          >
            Le produit évolue avec le cabinet.
          </motion.h2>
          <motion.p {...fadeUp(0.12)} className="mt-6 max-w-[44ch] font-sans text-[16px] leading-[1.65]" style={{ color: MUTED }}>
            SAFE est utilisé dans le quotidien d’un cabinet indépendant. Les frictions observées
            dans le vrai travail deviennent des améliorations du système.
          </motion.p>
          <div className="mt-10 space-y-4">
            {[
              [BookOpen, "Une terminologie adaptée à la pratique juridique"],
              [ShieldCheck, "Une attention particulière au fidéicommis et à la traçabilité"],
              [Scale, "La responsabilité professionnelle reste clairement celle du cabinet"],
            ].map(([Icon, text]) => {
              const ItemIcon = Icon as typeof BookOpen;
              return (
                <div key={String(text)} className="flex items-start gap-3 font-sans text-[13.5px] leading-[1.5]" style={{ color: MUTED }}>
                  <ItemIcon size={16} className="mt-0.5 shrink-0" strokeWidth={1.6} style={{ color: GREEN }} />
                  <span>{String(text)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between border-b pb-5" style={{ borderColor: LINE }}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>Tarification</p>
              <h3 className="mt-3 font-serif text-[27px] font-normal" style={{ color: INK }}>Simple dès le départ.</h3>
            </div>
            <Link href={R.tarification} className="hidden items-center gap-2 font-sans text-[13px] sm:flex" style={{ color: INK }}>
              Tous les détails <ArrowRight size={14} />
            </Link>
          </div>
          {plans.map(([name, price, detail]) => (
            <motion.div
              key={name}
              {...fadeUp(0.05)}
              className="grid gap-4 border-b py-7 sm:grid-cols-[1fr_auto] sm:items-center"
              style={{ borderColor: LINE }}
            >
              <div>
                <p className="font-sans text-[15px]" style={{ color: INK }}>{name}</p>
                <p className="mt-1 font-sans text-[13px]" style={{ color: MUTED }}>{detail}</p>
              </div>
              <p className="font-mono text-[25px]" style={{ color: INK }}>
                {price}<span className="ml-1 font-sans text-[11px]" style={{ color: FAINT }}>/ mois</span>
              </p>
            </motion.div>
          ))}
          <p className="mt-5 font-sans text-[12.5px]" style={{ color: FAINT }}>
            Configuration initiale comprise. Prix en dollars canadiens, taxes en sus.
          </p>
        </div>
      </div>
    </section>
  );
}

function Questions() {
  const questions = [
    ["SAFE garantit-il ma conformité ?", "Non. SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité professionnelle demeure celle du cabinet."],
    ["Est-ce que SAFE remplace mon adjointe ?", "Non. SAFE prépare, relie et signale. Votre équipe conserve le jugement et la connaissance du cabinet."],
    ["À qui appartiennent mes données ?", "À votre cabinet. Les données sont hébergées au Canada et peuvent être exportées dans les formats offerts."],
  ];
  return (
    <section className="border-t px-5 py-28 sm:px-6" style={{ background: SURFACE, borderColor: LINE }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionLabel>Avant de nous parler</SectionLabel>
        <motion.h2
          {...fadeUp(0.06)}
          className="mt-5 max-w-[14ch] font-serif text-[36px] font-normal leading-[1.08] sm:text-[46px]"
          style={{ color: INK }}
        >
          Des réponses précises aux questions importantes.
        </motion.h2>
        <div className="mt-12">
          {questions.map(([question, answer], index) => (
            <motion.div
              key={question}
              {...fadeUp(index * 0.04)}
              className="grid gap-4 border-t py-7 md:grid-cols-[0.86fr_1.14fr]"
              style={{ borderColor: LINE }}
            >
              <h3 className="font-serif text-[20px] font-normal leading-[1.35]" style={{ color: INK }}>{question}</h3>
              <p className="max-w-[58ch] font-sans text-[14px] leading-[1.65]" style={{ color: MUTED }}>{answer}</p>
            </motion.div>
          ))}
        </div>
        <Link href={R.faq} className="mt-4 inline-flex items-center gap-2 font-sans text-[13.5px]" style={{ color: INK }}>
          Lire toutes les questions <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t px-5 py-28 text-center sm:px-6 lg:py-36" style={{ background: BG, borderColor: LINE }}>
      <div className="mx-auto max-w-[700px]">
        <motion.p {...fadeUp(0)} className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
          La prochaine étape
        </motion.p>
        <motion.h2
          {...fadeUp(0.06)}
          className="mt-5 font-serif text-[38px] font-normal leading-[1.05] sm:text-[52px]"
          style={{ color: INK, letterSpacing: "-0.02em" }}
        >
          Voyons si SAFE convient à votre façon de travailler.
        </motion.h2>
        <motion.p {...fadeUp(0.12)} className="mx-auto mt-6 max-w-[50ch] font-sans text-[16px] leading-[1.65]" style={{ color: MUTED }}>
          Commencez par un diagnostic concret de votre cabinet. Vous décidez ensuite si une
          démonstration mérite vingt minutes de votre temps.
        </motion.p>
        <motion.div {...fadeUp(0.18)} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={R.diagnostic}
            className="inline-flex h-11 items-center gap-2 rounded-[7px] px-6 font-sans text-[14px] font-medium transition-transform hover:-translate-y-0.5"
            style={{ background: GREEN, color: "#fff" }}
          >
            Faire le diagnostic <ArrowRight size={15} />
          </Link>
          <Link href={R.demo} className="inline-flex h-11 items-center font-sans text-[14px]" style={{ color: INK }}>
            Réserver une rencontre
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: BG, color: INK }}>
      <Nav />
      <main>
        <Hero />
        <ProofStrip />
        <SystemSection />
        <ProductArguments />
        <ContinuityAndPricing />
        <Questions />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
