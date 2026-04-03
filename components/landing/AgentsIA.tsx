"use client";

import { motion } from "framer-motion";
import { MessageSquare, Sparkles, ShieldCheck, FileText } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const agents = [
  {
    name: "Léa",
    role: "Agent Finance",
    description:
      "Formée sur le Règlement B-1, r.5 du Barreau du Québec. Léa vérifie vos calculs de fidéicommis, génère vos rapports mensuels et vous alerte en cas d'anomalie.",
    color: "coral" as const,
    capabilities: [
      "Vérification des mouvements fidéicommis",
      "Génération de rapports B-1, r.5",
      "Détection d'anomalies comptables",
      "Réconciliation bancaire assistée",
    ],
    conversation: [
      { role: "user" as const, text: "Génère le rapport fidéicommis de mars 2026" },
      {
        role: "agent" as const,
        text: "Rapport fidéicommis — mars 2026 généré. Solde d'ouverture : 45 200 $. 12 mouvements, 0 anomalie détectée. Prêt à exporter en PDF.",
      },
    ],
  },
  {
    name: "Max",
    role: "Agent Assistant Juridique",
    description:
      "Formé sur les formulaires TUF 2025 (SJ-1326 à SJ-1329). Max prépare vos formulaires, rédige vos correspondances et résume vos dossiers.",
    color: "green" as const,
    capabilities: [
      "Formulaires TUF 2025 pré-remplis",
      "Rédaction de correspondances",
      "Résumé de dossiers",
      "Rappels d'audiences automatiques",
    ],
    conversation: [
      { role: "user" as const, text: "Prépare le formulaire SJ-1326 pour le dossier Thibodeau" },
      {
        role: "agent" as const,
        text: "Formulaire SJ-1326 pré-rempli avec les données du dossier Thibodeau c. Thibodeau. Veuillez vérifier les dates d'audience avant de signer.",
      },
    ],
  },
];

const colorMap = {
  coral: {
    badge: "bg-gold-600/20 text-gold-700",
    icon: "text-gold-600",
    iconBg: "bg-gold-600/10",
    checkIcon: "text-gold-600",
    nameTitle: "text-gold-700",
    dot: "bg-gold-600",
    label: "text-gold-600",
  },
  green: {
    badge: "bg-green-600/20 text-green-800",
    icon: "text-green-700",
    iconBg: "bg-green-600/10",
    checkIcon: "text-green-700",
    nameTitle: "text-green-800",
    dot: "bg-green-700",
    label: "text-green-700",
  },
};

export function AgentsIA() {
  return (
    <section id="agents-ia" className="py-24 landing-glass-section">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <div className="font-cabin inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-xs text-gold-400 font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Intelligence artificielle
          </div>
          <h2 className="font-manrope text-3xl sm:text-[2.25rem] font-semibold text-white leading-tight tracking-[-0.04em]">
            Vos deux assistants IA.
            <br />
            <span className="text-white/60">Form&eacute;s sur votre r&eacute;alit&eacute;.</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/60">
            Contrairement aux outils g&eacute;n&eacute;riques, L&eacute;a et Max connaissent le
            Barreau du Qu&eacute;bec, les formulaires TUF et vos dossiers.
          </p>
        </motion.div>

        {/* Agents */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {agents.map((agent) => {
            const colors = colorMap[agent.color];
            return (
              <motion.div
                key={agent.name}
                variants={fadeUp}
                className="landing-glass-card overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-neutral-200/30">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
                      <MessageSquare className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-semibold ${colors.nameTitle}`}>{agent.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                          {agent.role}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">{agent.description}</p>
                    </div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="p-6 border-b border-neutral-200/30">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {agent.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2 text-xs text-neutral-600">
                        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${colors.checkIcon}`} />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Conversation mockup */}
                <div className="p-6 bg-white/30">
                  <div className={`text-xs font-medium mb-3 flex items-center gap-1.5 ${colors.label}`}>
                    <FileText className="w-3.5 h-3.5" />
                    Exemple de conversation
                  </div>
                  <div className="space-y-3">
                    {agent.conversation.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-green-700/15 text-neutral-800"
                              : "bg-white/80 border border-neutral-200/60 text-neutral-700"
                          }`}
                        >
                          {msg.role === "agent" && (
                            <span className={`font-semibold text-[10px] block mb-1 ${colors.label}`}>
                              {agent.name}
                            </span>
                          )}
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/80 border border-neutral-200/60">
                        <span className={`typing-dot w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        <span className={`typing-dot w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        <span className={`typing-dot w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-8 text-center text-xs text-white/50"
        >
          Le contenu g&eacute;n&eacute;r&eacute; par l&apos;IA peut contenir des erreurs. Veuillez v&eacute;rifier
          les informations importantes avant tout d&eacute;p&ocirc;t ou envoi officiel.
        </motion.p>
      </div>
    </section>
  );
}
