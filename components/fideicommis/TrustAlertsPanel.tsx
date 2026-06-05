"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";

interface TrustAccountAlert {
  accountId: string;
  clientNom: string;
  dossierIntitule: string | null;
  currentBalance: number;
  derniereActivite: string;
  inactifJours: number;
}
interface TrustAlertsReport {
  soldesNegatifs: TrustAccountAlert[];
  fondsDormants: TrustAccountAlert[];
  ecartRapprochement: { periode: string; ecart: number; status: string } | null;
  summary: { nbCritiques: number; nbAvertissements: number };
}

function libelleCompte(a: TrustAccountAlert): string {
  return a.dossierIntitule ? `${a.clientNom} — ${a.dossierIntitule}` : a.clientNom;
}

export function TrustAlertsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["fideicommis", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/alerts");
      if (!res.ok) throw new Error("Erreur chargement des alertes");
      return res.json() as Promise<TrustAlertsReport>;
    },
  });

  if (isLoading || !data) return null;

  const { soldesNegatifs, fondsDormants, ecartRapprochement, summary } = data;

  // Aucune alerte → confirmation discrète.
  if (summary.nbCritiques === 0 && summary.nbAvertissements === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" aria-hidden />
          <p className="text-sm font-medium text-green-800">
            Surveillance fidéicommis : aucun solde négatif ni fonds dormant.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={summary.nbCritiques > 0 ? "border-red-300 bg-red-50/40" : "border-amber-300 bg-amber-50/40"}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 shrink-0 ${summary.nbCritiques > 0 ? "text-red-600" : "text-amber-600"}`} aria-hidden />
          <h3 className="text-sm font-semibold text-neutral-text-primary">Surveillance fidéicommis</h3>
        </div>

        {ecartRapprochement && (
          <Link href="/comptes/rapprochement" className="block rounded-md border border-red-200 bg-white px-3 py-2 hover:bg-red-50/50">
            <p className="text-sm font-medium text-red-800">
              Écart de rapprochement non nul — période {ecartRapprochement.periode}
            </p>
            <p className="text-xs text-red-600">
              Écart : {formatCurrency(ecartRapprochement.ecart)} · statut {ecartRapprochement.status}. Le registre
              et la banque doivent concorder (B-1 r.5).
            </p>
          </Link>
        )}

        {soldesNegatifs.length > 0 && (
          <div className="rounded-md border border-red-200 bg-white px-3 py-2">
            <p className="text-sm font-medium text-red-800 mb-1">
              Solde fiducie négatif — {soldesNegatifs.length} compte{soldesNegatifs.length > 1 ? "s" : ""} (drapeau rouge)
            </p>
            <ul className="text-xs text-red-700 space-y-0.5">
              {soldesNegatifs.map((a) => (
                <li key={a.accountId} className="flex justify-between gap-3">
                  <span className="truncate">{libelleCompte(a)}</span>
                  <span className="tabular-nums font-medium shrink-0">{formatCurrency(a.currentBalance)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fondsDormants.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-white px-3 py-2">
            <p className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Fonds dormants — {fondsDormants.length} compte
              {fondsDormants.length > 1 ? "s" : ""} (inactifs &gt; 180 j)
            </p>
            <ul className="text-xs text-amber-800 space-y-0.5">
              {fondsDormants.map((a) => (
                <li key={a.accountId} className="flex justify-between gap-3">
                  <span className="truncate">
                    {libelleCompte(a)} · {a.inactifJours} j
                  </span>
                  <span className="tabular-nums font-medium shrink-0">{formatCurrency(a.currentBalance)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
