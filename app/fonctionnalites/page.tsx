"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  FolderKanban,
  Receipt,
  LockKeyhole,
  CalendarClock,
  LineChart,
  UserCog,
  ArrowRight,
  Shield,
  Users,
  FileText,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

/* ───── Animated Mockups for each feature ───── */

function DossierMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const d = 0.3;

  return (
    <div ref={ref} className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 overflow-hidden p-4 md:p-6">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d, duration: 0.5 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-[var(--safe-sage)]" />
          <span className="text-[10px] font-semibold text-[var(--safe-white)] font-jakarta">Dossiers actifs</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-[var(--safe-sage)]/15 text-[8px] text-[var(--safe-sage)] font-jakarta">47 dossiers</div>
      </motion.div>

      {/* Dossier list */}
      {[
        { name: "Tremblay c. Roy", type: "Garde d'enfants", status: "En cours", color: "bg-[var(--safe-sage)]" },
        { name: "Gagnon c. Dubois", type: "Pension alimentaire", status: "Urgent", color: "bg-amber-400" },
        { name: "Lavoie c. Bergeron", type: "Divorce", status: "En cours", color: "bg-[var(--safe-sage)]" },
        { name: "Morin c. Pelletier", type: "Médiation", status: "Nouveau", color: "bg-blue-400" },
        { name: "Côté c. Martin", type: "Partage patrimoine", status: "Terminé", color: "bg-emerald-400" },
      ].map((item, i) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: d + 0.3 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between py-2 px-3 mb-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:border-[var(--safe-sage)]/20 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
            <div>
              <div className="text-[9px] font-medium text-[var(--safe-white)] font-jakarta">{item.name}</div>
              <div className="text-[7px] text-[var(--safe-text-muted)] font-jakarta">{item.type}</div>
            </div>
          </div>
          <span className="text-[7px] text-[var(--safe-text-muted)] font-jakarta">{item.status}</span>
        </motion.div>
      ))}
    </div>
  );
}

function FacturationMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const d = 0.3;

  return (
    <div ref={ref} className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 overflow-hidden p-4 md:p-6">
      {/* Invoice header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d, duration: 0.5 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[var(--safe-sage)]" />
          <span className="text-[10px] font-semibold text-[var(--safe-white)] font-jakarta">Facture #1048</span>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ delay: d + 1.2, type: "spring", stiffness: 300 }}
          className="px-2 py-0.5 rounded-full bg-[var(--safe-sage)]/15 text-[7px] text-[var(--safe-sage)] font-jakarta font-semibold"
        >
          CONFORME B-1 r.5
        </motion.div>
      </motion.div>

      {/* Client info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: d + 0.3 }}
        className="mb-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
      >
        <div className="text-[7px] text-[var(--safe-text-muted)] font-jakarta">Client</div>
        <div className="text-[9px] text-[var(--safe-white)] font-jakarta font-medium">Me Sophie Tremblay — Dossier #2024-047</div>
      </motion.div>

      {/* Line items appearing one by one */}
      {[
        { desc: "Consultation initiale (2h)", amount: "600,00 $" },
        { desc: "Rédaction procédure (3.5h)", amount: "1 050,00 $" },
        { desc: "Préparation audience (1.5h)", amount: "450,00 $" },
      ].map((line, i) => (
        <motion.div
          key={line.desc}
          initial={{ opacity: 0, x: 15 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: d + 0.5 + i * 0.15, duration: 0.4 }}
          className="flex items-center justify-between py-1.5 px-2 mb-1 text-[8px] font-jakarta"
        >
          <span className="text-[var(--safe-white)]/70">{line.desc}</span>
          <span className="text-[var(--safe-white)] font-medium">{line.amount}</span>
        </motion.div>
      ))}

      {/* Totals with animated calculation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d + 1.0, duration: 0.5 }}
        className="mt-2 pt-2 border-t border-white/5 space-y-1"
      >
        <div className="flex justify-between text-[7px] font-jakarta text-[var(--safe-text-muted)]">
          <span>Sous-total</span><span>2 100,00 $</span>
        </div>
        <div className="flex justify-between text-[7px] font-jakarta text-[var(--safe-text-muted)]">
          <span>TPS (5%)</span><span>105,00 $</span>
        </div>
        <div className="flex justify-between text-[7px] font-jakarta text-[var(--safe-text-muted)]">
          <span>TVQ (9,975%)</span><span>209,48 $</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: d + 1.3, duration: 0.4 }}
          className="flex justify-between text-[9px] font-jakarta font-bold text-[var(--safe-white)] pt-1 border-t border-white/10"
        >
          <span>Total</span><span>2 414,48 $</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FideicommisMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const d = 0.3;

  return (
    <div ref={ref} className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 overflow-hidden p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <LockKeyhole className="w-4 h-4 text-[var(--safe-sage)]" />
          <span className="text-[10px] font-semibold text-[var(--safe-white)] font-jakarta">Compte en fidéicommis</span>
        </div>
      </motion.div>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d + 0.2 }}
        className="mb-3 p-3 rounded-xl bg-[var(--safe-accent)]/10 border border-[var(--safe-sage)]/15"
      >
        <div className="text-[7px] text-[var(--safe-sage)] font-jakarta mb-1">Solde total en fidéicommis</div>
        <div className="text-lg font-bold text-[var(--safe-white)] font-jakarta">47 250,00 $</div>
      </motion.div>

      {/* Transactions */}
      {[
        { type: "Dépôt", client: "Tremblay", amount: "+5 000,00 $", icon: "text-[var(--safe-sage)]", bg: "bg-[var(--safe-sage)]/10" },
        { type: "Retrait", client: "Gagnon", amount: "-2 300,00 $", icon: "text-amber-400", bg: "bg-amber-400/10" },
        { type: "Dépôt", client: "Lavoie", amount: "+8 500,00 $", icon: "text-[var(--safe-sage)]", bg: "bg-[var(--safe-sage)]/10" },
      ].map((tx, i) => (
        <motion.div
          key={tx.client}
          initial={{ opacity: 0, x: -15 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: d + 0.5 + i * 0.15 }}
          className="flex items-center justify-between py-2 px-2 mb-1 rounded-lg bg-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-md ${tx.bg} flex items-center justify-center`}>
              <LockKeyhole className={`w-2.5 h-2.5 ${tx.icon}`} />
            </div>
            <div>
              <div className="text-[8px] font-medium text-[var(--safe-white)] font-jakarta">{tx.type} — {tx.client}</div>
              <div className="text-[7px] text-[var(--safe-text-muted)] font-jakarta">Double validation requise</div>
            </div>
          </div>
          <span className={`text-[8px] font-bold font-jakarta ${tx.amount.startsWith("+") ? "text-[var(--safe-sage)]" : "text-amber-400"}`}>{tx.amount}</span>
        </motion.div>
      ))}

      {/* Validation animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: d + 1.2, type: "spring" }}
        className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[var(--safe-sage)]/20 bg-[var(--safe-sage)]/5"
      >
        <Check className="w-3 h-3 text-[var(--safe-sage)]" />
        <span className="text-[7px] text-[var(--safe-sage)] font-jakarta font-medium">Piste d&apos;audit : toutes les transactions sont vérifiées</span>
      </motion.div>
    </div>
  );
}

function EcheancierMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const d = 0.3;

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
  const events = [
    { day: 0, row: 0, label: "Audience Tremblay", color: "bg-[var(--safe-sage)]" },
    { day: 1, row: 1, label: "Délai signification", color: "bg-amber-400" },
    { day: 2, row: 0, label: "Médiation Lavoie", color: "bg-blue-400" },
    { day: 3, row: 2, label: "Dépôt mémoire", color: "bg-[var(--safe-sage)]" },
    { day: 4, row: 0, label: "Consultation", color: "bg-purple-400" },
  ];

  return (
    <div ref={ref} className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 overflow-hidden p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[var(--safe-sage)]" />
          <span className="text-[10px] font-semibold text-[var(--safe-white)] font-jakarta">Semaine du 7 avril 2026</span>
        </div>
      </motion.div>

      {/* Calendar grid header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: d + 0.2 }}
        className="grid grid-cols-5 gap-1 mb-2"
      >
        {days.map((day) => (
          <div key={day} className="text-center text-[7px] text-[var(--safe-text-muted)] font-jakarta py-1">{day}</div>
        ))}
      </motion.div>

      {/* Calendar grid with events */}
      <div className="grid grid-cols-5 gap-1" style={{ minHeight: "120px" }}>
        {days.map((_, di) => (
          <div key={di} className="relative">
            {events
              .filter((e) => e.day === di)
              .map((event, ei) => (
                <motion.div
                  key={event.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: d + 0.5 + di * 0.12, type: "spring", stiffness: 300 }}
                  className={`${event.color}/20 border border-white/5 rounded-md p-1.5 mb-1`}
                  style={{ marginTop: `${event.row * 28}px` }}
                >
                  <div className={`w-1 h-1 rounded-full ${event.color} mb-0.5`} />
                  <div className="text-[6px] font-medium text-[var(--safe-white)] font-jakarta leading-tight">{event.label}</div>
                </motion.div>
              ))}
          </div>
        ))}
      </div>

      {/* Alert notification */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: d + 1.3 }}
        className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg border border-amber-500/20 bg-amber-900/10"
      >
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        <span className="text-[7px] text-amber-300 font-jakarta">Rappel : Délai de signification — Gagnon c. Dubois dans 3 jours</span>
      </motion.div>
    </div>
  );
}

function RapportsMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const d = 0.3;
  const bars = [45, 62, 55, 78, 68, 92, 70, 85, 95, 60, 80, 88];

  return (
    <div ref={ref} className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 overflow-hidden p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-[var(--safe-sage)]" />
          <span className="text-[10px] font-semibold text-[var(--safe-white)] font-jakarta">Rapport financier 2025-2026</span>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Revenus", value: "148 920 $", change: "+12%" },
          { label: "Heures fact.", value: "1 247h", change: "+8%" },
          { label: "Marge", value: "72%", change: "+3%" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: d + 0.3 + i * 0.1 }}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]"
          >
            <div className="text-[6px] text-[var(--safe-text-muted)] font-jakarta">{kpi.label}</div>
            <div className="text-[10px] font-bold text-[var(--safe-white)] font-jakarta">{kpi.value}</div>
            <div className="text-[7px] text-[var(--safe-sage)] font-jakarta">{kpi.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-[3px] h-[60px] mb-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ background: `rgba(142, 182, 155, ${0.25 + (h / 100) * 0.5})` }}
            initial={{ height: 0 }}
            animate={inView ? { height: `${h}%` } : {}}
            transition={{ delay: d + 0.6 + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"].map((m) => (
          <span key={m} className="text-[5px] text-[var(--safe-text-muted)] font-jakarta">{m}</span>
        ))}
      </div>
    </div>
  );
}

function AgentsIAMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const d = 0.3;
  const [typedText, setTypedText] = useState("");
  const fullText = "Basé sur l'analyse du dossier Tremblay c. Roy, je recommande de préparer une demande de garde partagée avec pension alimentaire indexée selon les lignes directrices fédérales.";

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setTypedText(fullText.slice(0, i));
        if (i >= fullText.length) clearInterval(interval);
      }, 25);
      return () => clearInterval(interval);
    }, (d + 1.0) * 1000);
    return () => clearTimeout(timer);
  }, [inView]);

  return (
    <div ref={ref} className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 overflow-hidden p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-[var(--safe-sage)]" />
          <span className="text-[10px] font-semibold text-[var(--safe-white)] font-jakarta">Employé virtuel — Assistant juridique</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[var(--safe-sage)] animate-pulse" />
      </motion.div>

      {/* User message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d + 0.3 }}
        className="flex justify-end mb-3"
      >
        <div className="max-w-[80%] p-2.5 rounded-xl rounded-tr-sm bg-[var(--safe-accent)]/30 border border-[var(--safe-sage)]/15">
          <div className="text-[8px] text-[var(--safe-white)] font-jakarta">
            Analyse le dossier Tremblay c. Roy et suggère les prochaines étapes.
          </div>
        </div>
      </motion.div>

      {/* Search animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d + 0.6 }}
        className="flex items-center gap-2 mb-3 px-2"
      >
        <Search className="w-3 h-3 text-[var(--safe-sage)] animate-pulse" />
        <span className="text-[7px] text-[var(--safe-text-muted)] font-jakarta italic">Recherche dans 47 dossiers...</span>
      </motion.div>

      {/* AI response */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: d + 0.8 }}
        className="max-w-[85%] p-2.5 rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06]"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[8px]">🤖</span>
          <span className="text-[7px] font-semibold text-[var(--safe-sage)] font-jakarta">Employé virtuel</span>
        </div>
        <div className="text-[8px] text-[var(--safe-white)]/80 font-jakarta leading-relaxed">
          {typedText}
          {typedText.length < fullText.length && typedText.length > 0 && (
            <span className="animate-pulse text-[var(--safe-sage)]">|</span>
          )}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: d + 1.5 }}
        className="mt-3 flex items-center gap-1.5 px-2"
      >
        <Shield className="w-2.5 h-2.5 text-[var(--safe-text-muted)]" />
        <span className="text-[6px] text-[var(--safe-text-muted)] font-jakarta italic">L&apos;IA assiste, vous décidez. Aucun conseil juridique automatisé.</span>
      </motion.div>
    </div>
  );
}

const featureMockups: Record<string, React.ComponentType> = {
  "Gestion des dossiers": DossierMockup,
  "Facturation conforme": FacturationMockup,
  "Comptes en fidéicommis": FideicommisMockup,
  "Échéanciers & délais": EcheancierMockup,
  "Rapports financiers": RapportsMockup,
  "Employés virtuels": AgentsIAMockup,
};

const features = [
  {
    icon: FolderKanban,
    title: "Gestion des dossiers",
    description:
      "Suivi complet de chaque dossier familial : parties au dossier, enfants, pensions alimentaires, garde, échéanciers judiciaires et documentation centralisée.",
    details: [
      "Fiche complète par dossier avec tous les intervenants",
      "Suivi des enfants, pensions et droits de garde",
      "Historique chronologique de chaque action",
      "Documents liés et notes de suivi",
      "Statuts personnalisables par type de mandat",
    ],
    align: "left" as const,
  },
  {
    icon: Receipt,
    title: "Facturation conforme",
    description:
      "Factures conformes au Règlement B-1 r.5 du Barreau du Québec. Calculs TPS/TVQ automatiques, gestion des encaissements et états de compte professionnels.",
    details: [
      "Modèles de facture conformes au Barreau",
      "Calcul automatique TPS (5%) et TVQ (9.975%)",
      "Envoi par courriel avec lien client sécurisé",
      "Notes de crédit et ajustements",
      "Suivi des paiements et relances",
    ],
    align: "right" as const,
  },
  {
    icon: LockKeyhole,
    title: "Comptes en fidéicommis",
    description:
      "Registre de fidéicommis complet avec mouvements traçables et validation humaine obligatoire. Conformité totale avec les obligations du Barreau.",
    details: [
      "Dépôts et retraits avec double validation",
      "Soldes en temps réel par client et par dossier",
      "Relevés de fidéicommis exportables en PDF",
      "Piste d'audit complète et inaltérable",
      "Alertes en cas de solde insuffisant",
    ],
    align: "left" as const,
  },
  {
    icon: CalendarClock,
    title: "Échéanciers & délais",
    description:
      "Ne manquez plus aucun délai de cour, de prescription ou de signification. Alertes automatiques et calendrier intégré à vos dossiers.",
    details: [
      "Calendrier intégré avec vue par dossier",
      "Alertes automatiques par courriel et dans l'app",
      "Délais de prescription calculés automatiquement",
      "Rappels configurables (7 jours, 3 jours, 24h)",
      "Synchronisation avec vos calendriers externes",
    ],
    align: "right" as const,
  },
  {
    icon: LineChart,
    title: "Rapports financiers",
    description:
      "Vue d'ensemble de la rentabilité par dossier, par avocat et par type de mandat. Exportez vos rapports pour votre comptable ou le Barreau.",
    details: [
      "Tableau de bord financier en temps réel",
      "Rentabilité par dossier et par avocat",
      "Rapport annuel d'impôts et de revenus",
      "Rapports de taxes (TPS/TVQ) pour Revenu Québec",
      "Export Excel et PDF en un clic",
    ],
    align: "left" as const,
  },
  {
    icon: UserCog,
    title: "Employés virtuels",
    description:
      "Assistance intelligente pour la rédaction de documents et la recherche juridique. L'IA ne donne jamais de conseils juridiques — elle vous assiste, vous décidez.",
    details: [
      "Génération de brouillons de documents",
      "Recherche dans vos dossiers par langage naturel",
      "Résumés automatiques de procédures",
      "Suggestions de formulaires applicables",
      "Respecte la déontologie : aucun conseil juridique",
    ],
    align: "right" as const,
  },
];

export default function FonctionnalitesPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="section-blanc-casse relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 landing-grid opacity-20 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
            >
              Fonctionnalités
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="font-instrument text-5xl md:text-6xl lg:text-7xl text-[var(--safe-white)] mb-6 leading-[1.05] tracking-tight"
            >
              Tout ce dont votre{" "}
              <span className="italic text-[var(--safe-sage)]">cabinet</span> a besoin.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg text-[var(--safe-text-muted)] max-w-2xl mx-auto font-jakarta leading-relaxed"
            >
              Chaque module est conçu spécifiquement pour la réalité des cabinets en droit
              familial au Québec. Aucune fonctionnalité superflue, aucun compromis sur la
              conformité.
            </motion.p>
          </div>
        </section>

        {/* Feature sections — alternating layout with animated mockups */}
        {features.map((feat, idx) => {
          const MockupComponent = featureMockups[feat.title];
          return (
            <section
              key={feat.title}
              className={`relative py-20 lg:py-28 ${
                idx === 0 ? "section-blanc-casse" : idx === 1 ? "section-blanc-casse-mid" : idx < 4 ? "section-afternoon" : "section-dusk"
              }`}
            >
              <div className="landing-grain absolute inset-0 pointer-events-none" />
              <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
                <div
                  className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                    feat.align === "right" ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Text side */}
                  <motion.div
                    initial={{ opacity: 0, x: feat.align === "left" ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={feat.align === "right" ? "lg:order-2" : ""}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--safe-accent)]/15 border border-[var(--safe-sage)]/10 flex items-center justify-center mb-6">
                      <feat.icon className="w-7 h-7 text-[var(--safe-sage)]" />
                    </div>
                    <h2 className="font-instrument text-3xl md:text-4xl text-[var(--safe-white)] mb-4 leading-tight">
                      {feat.title}
                    </h2>
                    <p className="text-[var(--safe-text-muted)] text-lg leading-relaxed mb-8 font-jakarta">
                      {feat.description}
                    </p>
                    <ul className="space-y-3">
                      {feat.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--safe-sage)] mt-2 shrink-0" />
                          <span className="text-sm text-[var(--safe-text-muted)] font-jakarta">
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Animated mockup */}
                  <motion.div
                    initial={{ opacity: 0, x: feat.align === "left" ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={feat.align === "right" ? "lg:order-1" : ""}
                  >
                    <div className="card-dark rounded-2xl bg-[var(--safe-darkest)] p-1">
                    {MockupComponent ? <MockupComponent /> : (
                      <div className="aspect-[4/3] rounded-2xl border border-white/5 bg-[var(--safe-mid-dark)]/30 flex items-center justify-center overflow-hidden">
                        <feat.icon className="w-16 h-16 text-[var(--safe-sage)] opacity-20" />
                      </div>
                    )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Additional small features grid */}
        <section className="relative py-20 lg:py-28 bg-[var(--safe-darkest)]">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="text-center mb-16">
              <p className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4">
                Et aussi...
              </p>
              <h2 className="font-instrument text-3xl md:text-4xl text-[var(--safe-white)]">
                Des fonctionnalités qui font la différence.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: "Conformité Loi 25", desc: "Protection des données personnelles intégrée" },
                { icon: Users, title: "Multi-utilisateurs", desc: "Rôles et permissions granulaires" },
                { icon: FileText, title: "Génération PDF", desc: "Factures et relevés professionnels" },
                { icon: Bell, title: "Notifications", desc: "Alertes personnalisables en temps réel" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-6 rounded-2xl border border-white/5 bg-[var(--safe-dark)] hover:border-[var(--safe-sage)]/20 transition-all duration-500"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-6 h-6 text-[var(--safe-sage)] mb-4" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-[var(--safe-white)] mb-2 font-jakarta">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--safe-text-muted)] font-jakarta">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
