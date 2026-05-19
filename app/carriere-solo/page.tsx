"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";

const CarriereSoloFlow = dynamic(
  () => import("@/components/carriere-solo/CarriereSoloFlow").then((m) => m.CarriereSoloFlow),
  {
    loading: () => (
      <div className="min-h-screen audit-v2-bg flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm tracking-wide">Chargement…</div>
      </div>
    ),
  }
);

type Phase = "intro" | "flow";

export default function CarriereSoloPage() {
  const [phase, setPhase] = useState<Phase>("intro");

  if (phase === "flow") {
    return <CarriereSoloFlow />;
  }

  return (
    <div className="min-h-screen audit-v2-bg flex flex-col px-4 py-6">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-4">
        <Link href="/">
          <LogoMark size={28} />
        </Link>
        <Link href="/audit-gratuit" className="audit-v2-btn-ghost">
          J&apos;ai déjà un cabinet →
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#E5E0D5] mb-6">
              <span className="w-2 h-2 rounded-full bg-forest-700 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-600 tracking-wide">
                Checklist gratuite · Québec et Ontario
              </span>
            </div>

            <h1
              className="text-[40px] sm:text-[48px] font-normal text-[#111] mb-5 leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
            >
              Lance ton cabinet.{" "}
              <span className="italic text-forest-700">Sans paniquer sur l&apos;admin.</span>
            </h1>

            <p className="text-slate-600 text-[15px] mb-10 leading-relaxed max-w-md mx-auto">
              Réponds à 5 questions. On te génère une checklist personnalisée selon ta
              juridiction, ton domaine et là où tu en es. Gratuit, et sans courriel obligatoire.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { num: "01", label: "Conforme", sub: "Barreau du Québec et LSO Ontario" },
                { num: "02", label: "Personnalisé", sub: "Adapté à ton domaine de pratique" },
                { num: "03", label: "Téléchargeable", sub: "Un PDF que tu gardes avec toi" },
              ].map((it) => (
                <div key={it.label} className="audit-v2-card text-left">
                  <div
                    className="text-[13px] mb-3 text-forest-700"
                    style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif", letterSpacing: "0.08em" }}
                  >
                    {it.num}
                  </div>
                  <p className="text-[13px] font-semibold text-[#111]">{it.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{it.sub}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("flow")}
              className="audit-v2-btn-primary mx-auto text-[15px] px-9 py-4"
            >
              Générer ma checklist →
            </button>

            <p className="mt-5 text-[11px] text-slate-400 tracking-wide">
              5 minutes · Gratuit · Aucune carte de crédit
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
