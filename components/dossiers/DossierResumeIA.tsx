"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sparkles, AlertTriangle, Save, RefreshCw } from "lucide-react";

interface DossierSummary {
  synthese: string;
  parties: string[];
  etatAvancement: string;
  echeances: { date: string | null; libelle: string }[];
  piecesCles: string[];
  prochainesActions: string[];
  pointsAttention: string[];
  incertitudes: string[];
  resumeTexte: string;
}

interface DossierResumeIAProps {
  dossierId: string;
  initialResume: string | null;
  canSave: boolean;
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{title}</h4>
      <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-700">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export function DossierResumeIA({ dossierId, initialResume, canSave }: DossierResumeIAProps) {
  const [summary, setSummary] = useState<DossierSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (save = false) => {
    save ? setSaving(true) : setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/resume${save ? "?save=true" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Erreur de génération");
      setSummary((data as { summary: DossierSummary }).summary);
      if (save) setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  return (
    <section className="px-6 py-5 border-b border-slate-200/70 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Résumé IA du dossier
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthèse factuelle générée à partir des pièces et données du dossier.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => generate(false)} disabled={loading || saving}>
          {summary ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Génération…" : summary ? "Régénérer" : "Générer un résumé"}
        </Button>
      </div>

      {error && <p className="text-sm text-status-error mb-3">{error}</p>}

      {!summary && initialResume && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
          {initialResume}
        </div>
      )}

      {summary && (
        <div className="rounded-md border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Résumé généré par IA, à vérifier. Il décrit des faits et ne constitue pas un avis ni une
              stratégie juridique.
            </span>
          </div>

          {summary.synthese && <p className="text-sm text-slate-800">{summary.synthese}</p>}

          {summary.etatAvancement && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                État d&apos;avancement
              </h4>
              <p className="text-sm text-slate-700">{summary.etatAvancement}</p>
            </div>
          )}

          <ListBlock title="Parties" items={summary.parties} />

          {summary.echeances.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Échéances</h4>
              <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-700">
                {summary.echeances.map((e, i) => (
                  <li key={i}>
                    {e.date ? <span className="font-medium">{e.date} — </span> : null}
                    {e.libelle}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ListBlock title="Pièces clés" items={summary.piecesCles} />
          <ListBlock title="Prochaines actions (administratives)" items={summary.prochainesActions} />
          <ListBlock title="Points d'attention" items={summary.pointsAttention} />
          <ListBlock title="Incertitudes / à confirmer" items={summary.incertitudes} />

          {canSave && (
            <div className="flex items-center gap-3 pt-1">
              <Button variant="secondary" size="sm" onClick={() => generate(true)} disabled={saving || loading}>
                <Save className="w-4 h-4" />
                {saving ? "Enregistrement…" : "Enregistrer dans le dossier"}
              </Button>
              {saved && <span className="text-xs text-green-600">Enregistré ✓</span>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
