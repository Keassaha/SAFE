"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

type ClientOverviewData = {
  typeClient: string;
  primary_email: string | null;
  phone_primary: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  langue: string | null;
  createdAt: Date;
  notesConfidentielles: string | null;
};

function formatAddress(data: ClientOverviewData): string {
  const parts = [
    data.address_line_1,
    data.address_line_2,
    [data.city, data.province].filter(Boolean).join(", "),
    data.postalCode,
    data.country,
  ].filter(Boolean);
  return parts.join(", ") || "—";
}

export function ClientOverview({ data }: { data: ClientOverviewData }) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t("clientInfo")} />
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-muted">
            {t("clientType")} :{" "}
            <span className="text-neutral-text-primary">
              {data.typeClient === "personne_physique" ? t("individual") : t("company")}
            </span>
          </p>
          <div className="grid gap-3">
            {data.primary_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-neutral-muted shrink-0" />
                <a href={`mailto:${data.primary_email}`} className="text-primary-700 hover:underline">
                  {data.primary_email}
                </a>
              </div>
            )}
            {data.phone_primary && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-neutral-muted shrink-0" />
                <span>{data.phone_primary}</span>
              </div>
            )}
            {(data.address_line_1 || data.city) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-neutral-muted shrink-0 mt-0.5" />
                <span>{formatAddress(data)}</span>
              </div>
            )}
            {data.langue && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-neutral-muted shrink-0" />
                <span>{data.langue === "FR" ? tc("french") : data.langue === "EN" ? tc("english") : data.langue}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-muted pt-2">
            {t("createdOn")} :{" "}
            {new Intl.DateTimeFormat("fr-CA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(data.createdAt)}
          </p>
        </CardContent>
      </Card>
      {data.notesConfidentielles && (
        <Card>
          <CardHeader title={t("notes")} />
          <CardContent>
            <p className="text-sm text-neutral-text-secondary whitespace-pre-wrap">
              {data.notesConfidentielles}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
