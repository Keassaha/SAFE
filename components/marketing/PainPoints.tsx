import {
  AlertTriangle,
  Clock,
  Calculator,
  FileWarning,
  Ban,
  TrendingDown,
} from "lucide-react";

const PAINS = [
  {
    icon: Calculator,
    pain: "Fidéicommis réconcilié à la main",
    consequence: "Des heures perdues chaque mois à vérifier des chiffres qui devraient se calculer tout seuls.",
  },
  {
    icon: FileWarning,
    pain: "Factures en retard ou non conformes",
    consequence: "Vous perdez des revenus — et vous risquez un signalement au Barreau.",
  },
  {
    icon: AlertTriangle,
    pain: "L'inspection vous garde éveillé la nuit",
    consequence: "Vous n'êtes jamais sûr à 100% que tout est en ordre. Et si un registre manque ?",
  },
  {
    icon: Clock,
    pain: "10+ heures/mois en tâches administratives",
    consequence: "C'est 10 heures que vous ne facturez pas. À 200$/h, c'est 2 000$/mois perdu.",
  },
  {
    icon: Ban,
    pain: "Des outils qui ne comprennent pas le Québec",
    consequence: "Clio, Cosmolex, PCLaw — aucun ne connaît le Règlement B-1 r.5 ou la Loi 25.",
  },
  {
    icon: TrendingDown,
    pain: "Aucune visibilité sur la rentabilité",
    consequence: "Vous facturez, mais savez-vous quels dossiers vous font réellement gagner de l'argent ?",
  },
];

export function PainPoints() {
  return (
    <section className="section-dusk relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-sans font-semibold uppercase tracking-widest text-red-400/80 mb-4">
            Ça vous parle ?
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight">
            Les problèmes que{" "}
            <span className="italic text-red-400/90">chaque avocat</span>{" "}
            connaît.
          </h2>
        </div>

        {/* Pain grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PAINS.map((item) => (
            <div
              key={item.pain}
              className="group relative p-5 sm:p-6 rounded-safe-md bg-red-500/[0.03] border border-red-400/10 hover:border-red-400/25 transition-all duration-500"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-red-400/20 to-transparent" />

              <div className="w-10 h-10 rounded-safe bg-red-500/10 border border-red-400/15 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-red-400/80" />
              </div>

              <h3 className="text-base font-bold text-[var(--safe-white)] mb-2 font-sans tracking-tight">
                {item.pain}
              </h3>
              <p className="text-sm text-white/40 font-sans leading-relaxed group-hover:text-white/55 transition-colors duration-500">
                {item.consequence}
              </p>
            </div>
          ))}
        </div>

        {/* Transition to solution */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-lg sm:text-xl text-[var(--safe-white)] font-sans font-medium">
            Et si tout ça disparaissait{" "}
            <span className="italic text-[var(--safe-sage)]">en 30 jours ?</span>
          </p>
          <div className="mt-6 flex justify-center animate-bounce">
            <div className="w-8 h-8 rounded-full border border-[var(--safe-sage)]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--safe-sage)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
