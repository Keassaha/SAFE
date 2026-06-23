import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getSecurityAlerts } from "@/lib/services/security/security-alerts";
import { ShieldCheck, AlertTriangle, ShieldAlert, CalendarClock, UserCheck, FileClock } from "lucide-react";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

const DOC_TYPE_LABELS: Record<string, string> = {
  medical: "Examen médical",
  police_cert: "Certificat de police",
  biometrics: "Biométrie",
  language_test: "Test linguistique",
  education_credential: "Équivalence d'études",
};

function joursLabel(j: number): { txt: string; tone: string } {
  if (j < 0) return { txt: `dépassée de ${Math.abs(j)} j`, tone: "text-[#B84A3E] font-medium" };
  if (j <= 3) return { txt: `dans ${j} j`, tone: "text-[#B84A3E] font-medium" };
  return { txt: `dans ${j} j`, tone: "text-si-amber-ink" };
}

export default async function SecuritePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return <div className="p-6"><p className="text-[#B84A3E]">Accès refusé.</p></div>;
  }

  const r = await getSecurityAlerts(cabinetId);
  const copy = getTrustRegulatorCopy(await getCabinetProvince(cabinetId));
  const { fideicommis, echeances, conformite, summary } = r;
  const tout = summary.nbCritiques === 0 && summary.nbAvertissements === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tableau de sécurité"
        description="Ce qui demande votre attention pour rester conforme et protégé : fidéicommis, échéances légales et conformité client."
      />

      {/* Synthèse */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={summary.nbCritiques > 0 ? "border-[#B84A3E]/40 bg-[#B84A3E]/10" : "border-si-line"}>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className={`w-6 h-6 ${summary.nbCritiques > 0 ? "text-[#B84A3E]" : "text-si-muted/50"}`} />
            <div>
              <p className="text-2xl font-bold tabular-nums">{summary.nbCritiques}</p>
              <p className="text-xs text-si-muted">Critique{summary.nbCritiques > 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={summary.nbAvertissements > 0 ? "border-si-amber/40 bg-si-amber/[0.13]" : "border-si-line"}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${summary.nbAvertissements > 0 ? "text-si-amber-ink" : "text-si-muted/50"}`} />
            <div>
              <p className="text-2xl font-bold tabular-nums">{summary.nbAvertissements}</p>
              <p className="text-xs text-si-muted">Avertissement{summary.nbAvertissements > 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {tout && (
        <Card className="border-si-verified/30 bg-si-verified/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-si-verified shrink-0" />
            <p className="text-sm font-medium text-si-verified">
              Aucun risque détecté : fidéicommis sain, aucune échéance imminente, conformité à jour.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fidéicommis */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-si-ink flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-emerald-700" /> Fidéicommis
        </h2>
        {fideicommis.rapprochementEnRetard && (
          <Link href="/comptes/rapprochement" className="block rounded-md border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-3 py-2 hover:bg-[#B84A3E]/10">
            <p className="text-sm font-medium text-[#B84A3E]">
              Rapprochement {fideicommis.rapprochementEnRetard.periode} en retard ({fideicommis.rapprochementEnRetard.joursDepuisFinMois} j)
            </p>
            <p className="text-xs text-[#B84A3E]">
              {copy.isQuebec
                ? "Règlement B-1, r. 5 (Barreau du Québec) : rapprochement mensuel à trois voies à certifier."
                : "By-Law 9, sec. 9.01 (LSO): certification required within 25 days."}
            </p>
          </Link>
        )}
        {fideicommis.alerts.ecartRapprochement && (
          <div className="rounded-md border border-[#B84A3E]/30 bg-si-surface px-3 py-2 text-sm text-[#B84A3E]">
            Écart de rapprochement non nul ({formatCurrency(fideicommis.alerts.ecartRapprochement.ecart)}) — période {fideicommis.alerts.ecartRapprochement.periode}.
          </div>
        )}
        {fideicommis.alerts.soldesNegatifs.map((a) => (
          <div key={a.accountId} className="rounded-md border border-[#B84A3E]/30 bg-si-surface px-3 py-2 text-sm text-[#B84A3E] flex justify-between">
            <span>Solde négatif : {a.clientNom}{a.dossierIntitule ? ` — ${a.dossierIntitule}` : ""}</span>
            <span className="tabular-nums font-medium">{formatCurrency(a.currentBalance)}</span>
          </div>
        ))}
        {fideicommis.alerts.fondsDormants.map((a) => (
          <div key={a.accountId} className="rounded-md border border-si-amber/30 bg-si-surface px-3 py-2 text-sm text-si-amber-ink flex justify-between">
            <span>Fonds dormants ({a.inactifJours} j) : {a.clientNom}{a.dossierIntitule ? ` — ${a.dossierIntitule}` : ""}</span>
            <span className="tabular-nums font-medium">{formatCurrency(a.currentBalance)}</span>
          </div>
        ))}
        {!fideicommis.rapprochementEnRetard && !fideicommis.alerts.ecartRapprochement &&
          fideicommis.alerts.soldesNegatifs.length === 0 && fideicommis.alerts.fondsDormants.length === 0 && (
            <p className="text-xs text-si-muted">Rien à signaler.</p>
          )}
      </section>

      {/* Échéances légales */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-si-ink flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-emerald-700" /> Échéances légales
        </h2>
        {echeances.ircc.length === 0 && echeances.appels.length === 0 ? (
          <p className="text-xs text-si-muted">Aucune échéance dans les 14 prochains jours.</p>
        ) : (
          [...echeances.ircc, ...echeances.appels]
            .sort((a, b) => a.joursRestants - b.joursRestants)
            .map((e) => {
              const j = joursLabel(e.joursRestants);
              return (
                <Link key={`${e.dossierId}-${e.libelle}`} href={routes.dossier(e.dossierId)}
                  className="block rounded-md border border-si-line bg-si-surface px-3 py-2 hover:bg-si-canvas">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-si-ink">
                      {e.libelle} · {e.clientNom}
                      {e.numeroDossier ? ` (${e.numeroDossier})` : ""}
                    </span>
                    <span className={`text-xs shrink-0 ${j.tone}`}>{formatDate(e.date)} · {j.txt}</span>
                  </div>
                </Link>
              );
            })
        )}
      </section>

      {/* Documents qui expirent */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-si-ink flex items-center gap-1.5">
          <FileClock className="w-4 h-4 text-emerald-700" /> Documents qui expirent
        </h2>
        {echeances.documentsExpirant.length === 0 ? (
          <p className="text-xs text-si-muted">Aucun document d&apos;immigration n&apos;expire dans les 30 prochains jours.</p>
        ) : (
          echeances.documentsExpirant.map((d, i) => {
            const j = joursLabel(d.joursRestants);
            return (
              <Link key={`${d.dossierId}-${i}`} href={routes.dossier(d.dossierId)}
                className="block rounded-md border border-si-line bg-si-surface px-3 py-2 hover:bg-si-canvas">
                <div className="flex justify-between gap-3">
                  <span className="text-sm text-si-ink">
                    {DOC_TYPE_LABELS[d.type] ?? d.type}{d.label ? ` (${d.label})` : ""} · {d.clientNom}
                    {d.numeroDossier ? ` (${d.numeroDossier})` : ""}
                  </span>
                  <span className={`text-xs shrink-0 ${j.tone}`}>
                    {formatDate(d.date)} · {d.joursRestants < 0 ? `expiré de ${Math.abs(d.joursRestants)} j` : j.txt}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* Conformité client */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-si-ink flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-emerald-700" /> Conformité client
        </h2>
        {(() => {
          const rows = [
            { label: "Identité non vérifiée (clients actifs)", b: conformite.identiteNonVerifiee },
            { label: "Vérification de conflit non faite", b: conformite.conflitsNonVerifies },
            { label: "Consentement Loi 25 manquant", b: conformite.consentementManquant },
            { label: "FINTRAC non vérifié (dossiers immobiliers)", b: conformite.fintracManquant },
            { label: "Dossiers avec pièces manquantes", b: conformite.piecesManquantes },
          ].filter((x) => x.b.count > 0);
          if (rows.length === 0) return <p className="text-xs text-si-muted">Conformité à jour.</p>;
          return rows.map((x) => (
            <div key={x.label} className="rounded-md border border-si-amber/30 bg-si-surface px-3 py-2">
              <p className="text-sm font-medium text-si-amber-ink">
                {x.label} — {x.b.count}
              </p>
              {x.b.sample.length > 0 && (
                <p className="text-xs text-si-muted mt-0.5">
                  {x.b.sample.map((s) => s.label).join(" · ")}
                  {x.b.count > x.b.sample.length ? ` … +${x.b.count - x.b.sample.length}` : ""}
                </p>
              )}
            </div>
          ));
        })()}
      </section>
    </div>
  );
}
