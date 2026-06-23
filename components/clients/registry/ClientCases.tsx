"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FolderOpen } from "lucide-react";
import { routes } from "@/lib/routes";

interface CaseItem {
  id: string;
  reference: string | null;
  numeroDossier: string | null;
  intitule: string;
  statut: string;
  type: string | null;
}

interface ClientCasesProps {
  cases: CaseItem[];
  clientId: string;
}

export function ClientCases({ cases, clientId }: ClientCasesProps) {
  const t = useTranslations("clients");

  return (
    <Card>
      <CardHeader
        title={t("casesTab")}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={routes.dossierNouveau(clientId)}
              className="text-sm font-medium text-si-forest hover:underline"
            >
              {t("newMatter")}
            </Link>
            {cases.length > 0 && (
              <Link
                href={`${routes.dossiers}?clientId=${clientId}`}
                className="text-sm font-medium text-si-forest hover:underline"
              >
                {t("openMatters")}
              </Link>
            )}
          </div>
        }
      />
      <CardContent>
        {cases.length === 0 ? (
          <p className="text-sm text-si-muted">{t("noCasesAssociated")}</p>
        ) : (
          <ul className="space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={routes.dossier(c.id)}
                  className="flex items-center gap-2 text-sm text-si-forest hover:underline"
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  {c.numeroDossier ?? c.reference ?? "—"} — {c.intitule}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      c.statut === "actif"
                        ? "bg-si-verified/10 text-si-verified"
                        : "bg-si-canvas text-si-muted"
                    }`}
                  >
                    {c.statut === "actif" ? t("caseActive") : t("caseClosed")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
