import { ArrowRight, Shield, Clock, Lock } from "lucide-react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="section-night relative py-16 sm:py-28 lg:py-36 overflow-hidden">
      {/* Large accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] sm:w-[500px] sm:h-[300px] lg:w-[800px] lg:h-[400px] bg-[var(--safe-accent)] opacity-10 rounded-full blur-[80px] pointer-events-none" />
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium font-sans">
            50 places fondatrices, tarif verrouillé à vie pour les premiers inscrits
          </span>
        </div>

        {/* Emotional headline */}
        <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-4 sm:mb-6 leading-[1.08] tracking-tight">
          Combien d&apos;heures allez-vous encore{" "}
          <span className="italic text-[var(--safe-sage)]">perdre ce mois-ci ?</span>
        </h2>

        {/* Agitation + contrast */}
        <p className="text-base sm:text-lg md:text-xl text-[var(--safe-text-muted)] mb-3 max-w-2xl mx-auto font-sans leading-relaxed">
          Pendant que vous réconciliez votre fidéicommis à la main, d&apos;autres
          cabinets l&apos;ont déjà automatisé. La prochaine inspection arrive. Serez-vous prêt ?
        </p>

        {/* Triple guarantee */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 mt-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400/70" />
            <span className="text-sm text-[var(--safe-text-muted)] font-sans">30 jours remboursé</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400/70" />
            <span className="text-sm text-[var(--safe-text-muted)] font-sans">Migration assistée</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400/70" />
            <span className="text-sm text-[var(--safe-text-muted)] font-sans">Hébergé au Canada</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/audit-gratuit"
            className="group inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 bg-[var(--safe-accent)] text-[var(--safe-lightest)] text-sm sm:text-base lg:text-lg font-semibold rounded-full hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 shadow-2xl shadow-[var(--safe-accent)]/20 font-sans"
          >
            Faire mon audit gratuit
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:border-[var(--safe-sage)]/60 hover:bg-[var(--safe-sage)]/5 transition-all duration-300 font-sans"
          >
            Réserver une démo
          </Link>
        </div>

        {/* Final nudge */}
        <p className="text-xs text-[var(--safe-text-muted)]/40 font-sans">
          Le tarif fondateur passera de 99$ à 149$/mois après les 50 premières inscriptions.
        </p>
      </div>
    </section>
  );
}
