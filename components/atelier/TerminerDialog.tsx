"use client";

import { useState } from "react";
import { CheckCircle, Clock, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const TYPES_ACTIVITE = [
  { value: "redaction", label: "Rédaction" },
  { value: "revision", label: "Révision" },
  { value: "consultation", label: "Consultation" },
  { value: "recherche", label: "Recherche" },
  { value: "autre", label: "Autre" },
];

interface Props {
  doc: {
    id: string;
    titre: string;
    dossier: { id: string; intitule: string; tauxHoraire?: number | null };
    client: { raisonSociale?: string | null };
  };
  sessionId: string;
  dureeMinutes: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function TerminerDialog({ doc, sessionId, dureeMinutes, onClose, onSuccess }: Props) {
  const [typeActivite, setTypeActivite] = useState("redaction");
  const [description, setDescription] = useState(`Rédaction — ${doc.titre}`);
  const [taux, setTaux] = useState(doc.dossier.tauxHoraire ?? 150);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const montant = ((dureeMinutes / 60) * taux).toFixed(2);
  const heures = Math.floor(dureeMinutes / 60);
  const minutes = dureeMinutes % 60;
  const dureeLabel = heures > 0
    ? `${heures}h ${minutes > 0 ? `${minutes}min` : ""}`
    : `${minutes} min`;

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/atelier/documents/${doc.id}/terminer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          typeActivite,
          description,
          dureeMinutes,
          tauxHoraire: taux,
        }),
      });
      if (res.ok) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--safe-neutral-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-[var(--safe-text-title)]">Travail terminé</p>
              <p className="text-sm text-[var(--safe-text-secondary)]">{doc.titre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--safe-neutral-bg)]">
            <X className="w-4 h-4 text-[var(--safe-text-secondary)]" />
          </button>
        </div>

        {/* Résumé */}
        <div className="p-5 space-y-4">
          {/* Durée + montant */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--safe-neutral-bg)] rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-[var(--safe-primary)] mx-auto mb-1" />
              <p className="text-xl font-bold text-[var(--safe-text-title)]">{dureeLabel}</p>
              <p className="text-xs text-[var(--safe-text-secondary)]">Durée de travail</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{montant} $</p>
              <p className="text-xs text-green-600">Montant facturable</p>
            </div>
          </div>

          {/* Contexte */}
          <div className="text-sm text-[var(--safe-text-secondary)] bg-[var(--safe-neutral-bg)] rounded-lg px-3 py-2">
            <span className="font-medium text-[var(--safe-text-title)]">{doc.client.raisonSociale}</span>
            {" · "}
            {doc.dossier.intitule}
          </div>

          {/* Type d'activité */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wide">
              Type d&apos;activité
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES_ACTIVITE.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTypeActivite(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    typeActivite === t.value
                      ? "bg-[var(--safe-primary)] text-white"
                      : "bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-border)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wide">
              Description (pour la facture)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)] resize-none"
            />
          </div>

          {/* Taux horaire */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wide">
              Taux horaire ($ CAD)
            </label>
            <input
              type="number"
              value={taux}
              onChange={(e) => setTaux(Number(e.target.value))}
              min={0}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[var(--safe-neutral-border)]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-[var(--safe-text-secondary)] border border-[var(--safe-neutral-border)] rounded-xl hover:bg-[var(--safe-neutral-bg)] transition-colors"
          >
            Continuer à travailler
          </button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isSubmitting ? "Création..." : "Créer la fiche de temps"}
          </Button>
        </div>
      </div>
    </div>
  );
}
