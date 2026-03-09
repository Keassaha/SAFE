"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { routes } from "@/lib/routes";

export type DossierOverviewData = {
  clientId: string;
  clientName: string;
  avocatResponsableNom: string | null;
  assistantJuridiqueNom: string | null;
  tribunalNom: string | null;
  districtJudiciaire: string | null;
  numeroDossierTribunal: string | null;
  nomJuge: string | null;
  resumeDossier: string | null;
  statut: string;
  type: string | null;
  reference: string | null;
  intitule: string;
  dateOuverture: Date;
  modeFacturation: string | null;
  tauxHoraire: number | null;
};

interface DossierOverviewProps {
  data: DossierOverviewData;
}

export function DossierOverview({ data }: DossierOverviewProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");

  const STATUT_LABELS: Record<string, string> = {
    ouvert: t("statusOpen"),
    actif: t("statusActive"),
    en_attente: t("statusPending"),
    cloture: t("statusClosed"),
    archive: t("statusArchived"),
  };

  const TYPE_LABELS: Record<string, string> = {
    droit_famille: t("typeFamily"),
    litige_civil: t("typeCivilLitigation"),
    criminel: t("typeCriminal"),
    immigration: t("typeImmigration"),
    corporate: t("typeCorporate"),
    autre: t("typeOther"),
  };

  const MODE_FACTURATION_LABELS: Record<string, string> = {
    horaire: t("billingHourly"),
    forfait: t("billingFlat"),
    retainer: t("billingRetainer"),
    contingent: t("billingContingent"),
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={tc("client")} />
        <CardContent>
          <p className="text-neutral-text-secondary">
            <Link
              href={routes.client(data.clientId)}
              className="text-primary-700 hover:underline font-medium"
            >
              {data.clientName}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("team")} />
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-neutral-muted">{t("responsibleLawyerLabel")}</span>{" "}
            {data.avocatResponsableNom ?? "—"}
          </div>
          {data.assistantJuridiqueNom && (
            <div>
              <span className="text-neutral-muted">{t("legalAssistantLabel")}</span>{" "}
              {data.assistantJuridiqueNom}
            </div>
          )}
        </CardContent>
      </Card>

      {(data.tribunalNom || data.districtJudiciaire || data.numeroDossierTribunal || data.nomJuge) && (
        <Card>
          <CardHeader title={t("court")} />
          <CardContent className="space-y-2 text-sm">
            {data.tribunalNom && (
              <div>
                <span className="text-neutral-muted">{t("courtName")}</span> {data.tribunalNom}
              </div>
            )}
            {data.districtJudiciaire && (
              <div>
                <span className="text-neutral-muted">{t("district")}</span> {data.districtJudiciaire}
              </div>
            )}
            {data.numeroDossierTribunal && (
              <div>
                <span className="text-neutral-muted">{t("courtFileLabel")}</span>{" "}
                {data.numeroDossierTribunal}
              </div>
            )}
            {data.nomJuge && (
              <div>
                <span className="text-neutral-muted">{t("judgeLabel")}</span> {data.nomJuge}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title={t("matterSummary")} />
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <span className="text-neutral-muted">{t("statusLabel")}</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                data.statut === "actif" || data.statut === "ouvert"
                  ? "bg-status-success-bg text-status-success"
                  : "bg-neutral-200 text-neutral-muted"
              }`}
            >
              {STATUT_LABELS[data.statut] ?? data.statut}
            </span>
            {data.type && (
              <>
                <span className="text-neutral-muted">{t("typeLabel")}</span>
                <span>{TYPE_LABELS[data.type] ?? data.type}</span>
              </>
            )}
          </div>
          <div className="text-neutral-muted">
            {t("openingDate")}{" "}
            {new Date(data.dateOuverture).toLocaleDateString("fr-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          {data.modeFacturation && (
            <div>
              <span className="text-neutral-muted">{t("billingLabel")}</span>{" "}
              {MODE_FACTURATION_LABELS[data.modeFacturation] ?? data.modeFacturation}
              {data.tauxHoraire != null && data.tauxHoraire > 0 && (
                <> — {data.tauxHoraire} $/h</>
              )}
            </div>
          )}
          {data.resumeDossier && (
            <p className="mt-2 text-neutral-text-secondary whitespace-pre-wrap">
              {data.resumeDossier}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
