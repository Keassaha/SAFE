"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle } from "lucide-react";

type CompensationType = "salaire_fixe" | "taux_horaire_admin" | "taux_horaire_fact" | "mixte" | "contractuel";

const COMP_LABELS: Record<CompensationType, string> = {
  salaire_fixe: "Salaire fixe",
  taux_horaire_admin: "Taux horaire administratif (non-facturable)",
  taux_horaire_fact: "Taux horaire facturable (rechargé au client)",
  mixte: "Mixte : salaire de base + taux facturable",
  contractuel: "Contractuel (à la tâche / au projet)",
};

export default function EquipePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("assistante");
  const [compType, setCompType] = useState<CompensationType>("salaire_fixe");
  const [montant, setMontant] = useState("");
  const [tauxFact, setTauxFact] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const compensation = {
      type: compType,
      montant: montant ? parseFloat(montant) : null,
      isBillable: compType === "taux_horaire_fact" || compType === "mixte",
      tauxHoraireFact: (compType === "taux_horaire_fact" || compType === "mixte") && tauxFact
        ? parseFloat(tauxFact)
        : null,
      visibleRentabilite: true,
      saisieParEmployee: true,
    };

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, compensation }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setSuccess(`Invitation envoyée à ${email}`);
        setEmail("");
        setMontant("");
        setTauxFact("");
      }
    } catch {
      setError("Impossible d'envoyer l'invitation. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const showMontant = compType !== "contractuel";
  const showTauxFact = compType === "taux_horaire_fact" || compType === "mixte";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <PageHeader
        title="Équipe"
        description="Invitez un membre à rejoindre votre cabinet sur SAFE."
      />

      <Card>
        <CardHeader title="Inviter un membre" />
        <CardContent>
          <p className="text-sm text-gray-500 mb-5">
            Un email d&apos;invitation sera envoyé. Le lien est valide 72 heures.
          </p>
          <form onSubmit={handleInvite} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email professionnel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="prenom@cabinet.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="assistante">Assistante juridique</option>
                <option value="avocat">Avocate / Avocat</option>
                <option value="comptabilite">Comptabilité</option>
              </select>
            </div>

            {/* Type de rémunération */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type de rémunération
              </label>
              <div className="space-y-2">
                {(Object.entries(COMP_LABELS) as [CompensationType, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="compType"
                      value={key}
                      checked={compType === key}
                      onChange={() => setCompType(key)}
                      className="mt-0.5 accent-gray-900"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Montant */}
            {showMontant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {compType === "salaire_fixe" ? "Salaire annuel ($ CAD)" : "Taux horaire ($ CAD / h)"}
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder={compType === "salaire_fixe" ? "ex. 48000" : "ex. 35"}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            )}

            {/* Taux facturable (mixte) */}
            {showTauxFact && compType === "mixte" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Taux horaire facturable au client ($ CAD / h)
                </label>
                <input
                  type="number"
                  value={tauxFact}
                  onChange={(e) => setTauxFact(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder="ex. 85"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            )}

            {/* Notes fixes (réponses déjà confirmées) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Configuration appliquée</p>
              <p className="text-xs text-gray-500">✓ Coût visible dans les rapports de rentabilité par dossier</p>
              <p className="text-xs text-gray-500">✓ L&apos;assistante saisit ses heures · Me Derisier valide</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading || !email} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Envoi en cours…" : "Envoyer l'invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
