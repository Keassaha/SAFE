"use client";

import { FolderOpen, FileText, ChevronRight } from "lucide-react";

const SCHEMES = {
  current: {
    name: "Actuel (Arc-en-ciel)",
    colors: {
      famille: { bg: "bg-blue-50", border: "border-blue-200", tab: "bg-blue-400", icon: "text-blue-500" },
      immobilier: { bg: "bg-amber-50", border: "border-amber-200", tab: "bg-amber-500", icon: "text-amber-600" },
      litige: { bg: "bg-red-50", border: "border-red-200", tab: "bg-red-400", icon: "text-red-500" },
      contrat: { bg: "bg-gray-50", border: "border-gray-200", tab: "bg-gray-400", icon: "text-gray-500" },
      immigration: { bg: "bg-green-50", border: "border-green-200", tab: "bg-green-500", icon: "text-green-600" },
      succession: { bg: "bg-purple-50", border: "border-purple-200", tab: "bg-purple-400", icon: "text-purple-500" },
    },
  },
  slate: {
    name: "Proposition 1 : Neutre Professionnel",
    colors: {
      famille: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      immobilier: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      litige: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-700", icon: "text-slate-700" },
      contrat: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      immigration: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      succession: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-700", icon: "text-slate-700" },
    },
  },
  blue: {
    name: "Proposition 2 : Bleu Corporatif",
    colors: {
      famille: { bg: "bg-blue-50", border: "border-blue-150", tab: "bg-blue-700", icon: "text-blue-800" },
      immobilier: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-blue-700", icon: "text-blue-800" },
      litige: { bg: "bg-blue-50", border: "border-blue-150", tab: "bg-blue-700", icon: "text-blue-800" },
      contrat: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-blue-700", icon: "text-blue-800" },
      immigration: { bg: "bg-blue-50", border: "border-blue-150", tab: "bg-blue-700", icon: "text-blue-800" },
      succession: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-blue-700", icon: "text-blue-800" },
    },
  },
  minimal: {
    name: "Proposition 3 : Minimaliste Noir/Blanc",
    colors: {
      famille: { bg: "bg-white", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      immobilier: { bg: "bg-gray-50", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      litige: { bg: "bg-white", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      contrat: { bg: "bg-gray-50", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      immigration: { bg: "bg-white", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      succession: { bg: "bg-gray-50", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
    },
  },
};

const DOSSIER_TYPES = [
  { type: "famille", label: "Droit Famille" },
  { type: "immobilier", label: "Immobilier" },
  { type: "litige", label: "Litige" },
  { type: "contrat", label: "Contrats" },
  { type: "immigration", label: "Immigration" },
  { type: "succession", label: "Succession" },
];

function FolderCardPreview({
  type,
  label,
  colors,
}: {
  type: string;
  label: string;
  colors: Record<string, any>;
}) {
  const color = colors[type as keyof typeof colors];
  return (
    <div
      className={`rounded-lg border-2 ${color.bg} ${color.border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden`}
    >
      <div className={`h-2 ${color.tab} w-1/2 rounded-b-sm mx-4`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">#2024-{type.substring(0, 3).toUpperCase()}</p>
          </div>
          <FolderOpen className={`w-5 h-5 shrink-0 ${color.icon}`} />
        </div>

        <div className="space-y-1.5 border-t border-current border-opacity-10 pt-3">
          {["Document 1", "Document 2", "Document 3"].map((doc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <FileText className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate text-gray-600 flex-1">{doc}</span>
              <span className="text-gray-400 shrink-0">il y a 2j</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">3 documents</span>
          <span className={`text-xs font-medium ${color.icon} opacity-70 flex items-center gap-1`}>
            Ouvrir <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function ColorSchemePreview() {
  return (
    <div className="w-full bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Aperçu des Palettes de Couleurs
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Comparez les 3 propositions pour l&apos;interface d&apos;atelier
        </p>

        <div className="space-y-16">
          {Object.entries(SCHEMES).map(([key, scheme]) => (
            <div key={key} className="border-b border-gray-200 pb-12 last:border-b-0">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">{scheme.name}</h2>
              <p className="text-sm text-gray-600 mb-6">
                {key === "current" && "Design actuel avec couleurs différentes par type"}
                {key === "slate" && "Palette neutre et professionnelle avec variations subtiles"}
                {key === "blue" && "Bleu corporatif discret avec quelques accents gris"}
                {key === "minimal" && "Approche épurée en noir/blanc avec onglets sombres"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOSSIER_TYPES.map(({ type, label }) => (
                  <FolderCardPreview
                    key={type}
                    type={type}
                    label={label}
                    colors={scheme.colors}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Recommandation</h3>
          <p className="text-sm text-blue-800">
            <strong>Proposition 1 (Neutre Professionnel)</strong> offre le meilleur équilibre :
            elle est épurée et professionnelle sans perdre la distinction entre les types de dossiers
            (via les onglets). Elle inspire la confiance légale tout en restant visuellement cohérente.
          </p>
        </div>
      </div>
    </div>
  );
}
