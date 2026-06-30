import Link from "next/link";
import { TARIFICATION } from "@/lib/tarification";

type Props = {
  variant?: "fondateurs" | "pack-ev";
};

// Widget compact à insérer dans le tableau de bord pour driver vers /tarification.
// - variant="fondateurs" : visible tant que des places Fondateurs restent
// - variant="pack-ev"    : visible pour les utilisateurs sans Pack EV actif
// Si "fondateurs" est demandé mais que les 50 places sont prises, on retombe sur "pack-ev".

export function TarificationDashboardWidget({ variant = "pack-ev" }: Props) {
  const { placesPrises, placesTotal, abonnementVie } = TARIFICATION.fondateurs;
  const fondateursOuvert = placesPrises < placesTotal;
  const showFondateurs = variant === "fondateurs" && fondateursOuvert;

  if (showFondateurs) {
    return (
      <div className="bg-surface border border-[0.5px] border-forest-600/45 rounded-[7px] p-6 shadow-[0_18px_50px_-28px_rgba(31,58,46,0.45)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] uppercase tracking-[0.15em] text-forest-600 font-medium">
            Offre Fondateurs
          </span>
          <span className="text-text-body/40">·</span>
          <span className="text-[12px] text-text-body">
            {placesPrises} / {placesTotal} places
          </span>
        </div>
        <p className="font-sans font-medium text-[15px] text-text-primary mb-1.5">
          Verrouillez votre tarif à vie à {abonnementVie} $/mois, 12 mois gratuits.
        </p>
        <p className="text-[13px] text-text-body leading-[1.6] mb-5">
          Cette offre ne sera jamais répétée.
        </p>
        <Link
          href="/tarification#fondateurs"
          className="inline-flex items-center justify-center rounded-full bg-forest-600 text-white px-4 py-1.5 text-[13px] font-medium hover:bg-forest-700 transition-colors"
        >
          Devenir Fondateur &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-[0.5px] border-border rounded-[7px] p-6">
      <p className="text-[11px] uppercase tracking-[0.15em] text-forest-600 font-medium mb-3">
        Pack Employé Virtuel
      </p>
      <p className="font-sans font-medium text-[15px] text-text-primary mb-1.5">
        Vous récupérez en moyenne 6 à 12 heures par semaine.
      </p>
      <p className="text-[13px] text-text-body leading-[1.6] mb-5">
        Activez votre Employé Virtuel — l&apos;assistant de vos assistants. Dix automations
        qui exécutent vos tâches répétitives. Vous gardez le contrôle, l&apos;IA fait le reste.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/tarification#employe-virtuel"
          className="inline-flex items-center justify-center rounded-full bg-forest-600 text-white px-4 py-1.5 text-[13px] font-medium hover:bg-forest-700 transition-colors"
        >
          Découvrir le Pack — {TARIFICATION.packEv.prix.toLocaleString("fr-CA")} $/mois
        </Link>
        <Link
          href="/tarification"
          className="inline-flex items-center justify-center rounded-full border border-[0.5px] border-border px-4 py-1.5 text-[13px] font-medium text-text-primary hover:bg-surface transition-colors"
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}
