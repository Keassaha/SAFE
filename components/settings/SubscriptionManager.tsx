"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PLANS, PlanKey } from "@/lib/stripe";
import { Check } from "lucide-react";

interface SubscriptionManagerProps {
  currentPlan: string;
  stripeCustomerId: string | null;
  periodEnd: string | null;
}

export function SubscriptionManager({
  currentPlan,
  stripeCustomerId,
  periodEnd,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(plan: PlanKey) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors de la redirection vers Stripe");
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading("manage");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors de l'ouverture du portail");
    } finally {
      setLoading(null);
    }
  }

  const planEntries = Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Abonnement</h3>
          <p className="text-sm text-muted-foreground">
            Plan actuel : <strong className="capitalize">{currentPlan}</strong>
            {periodEnd && (
              <span>
                {" "}
                — Renouvellement le{" "}
                {new Date(periodEnd).toLocaleDateString("fr-CA")}
              </span>
            )}
          </p>
        </div>
        {stripeCustomerId && (
          <Button
            variant="outline"
            onClick={handleManage}
            disabled={loading === "manage"}
          >
            {loading === "manage" ? "Chargement..." : "Gérer l'abonnement"}
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {planEntries.map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          return (
            <div
              key={key}
              className={`rounded-lg border p-6 ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <h4 className="font-semibold text-lg">{plan.name}</h4>
              <p className="text-2xl font-bold mt-2">
                {(plan.price / 100).toFixed(0)} $
                <span className="text-sm font-normal text-muted-foreground">
                  /mois
                </span>
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.features.maxUsers === -1
                    ? "Utilisateurs illimités"
                    : `${plan.features.maxUsers} utilisateur${plan.features.maxUsers > 1 ? "s" : ""}`}
                </li>
                {plan.features.trustAccounts && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Comptes fidéicommis
                  </li>
                )}
                {plan.features.virtualEmployees && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Employés virtuels IA
                  </li>
                )}
                {plan.features.advancedReports && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Rapports avancés
                  </li>
                )}
                {plan.features.api && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    API et intégrations
                  </li>
                )}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plan actuel
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(key)}
                    disabled={loading === key}
                  >
                    {loading === key ? "Chargement..." : "Choisir ce plan"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
