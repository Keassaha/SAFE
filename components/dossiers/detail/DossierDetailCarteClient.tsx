"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { User, Users, Briefcase } from "lucide-react";

/**
 * Onglet 01 — Carte client
 * Formulaire en 3 sections accordéon : Identité, Situation familiale, Situation professionnelle & financière
 */
export function DossierDetailCarteClient({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-xl-md border border-white/10 bg-si-surface/95 p-6 shadow-xl backdrop-blur sm:p-8">
      <div className="mb-6 border-b border-si-line pb-5">
        <h2 className="text-lg font-bold tracking-tight text-si-ink">
          {t("clientCardTitle")}
        </h2>
        <p className="mt-1 text-sm text-si-muted">
          {t("clientCardSubtitle")}
        </p>
      </div>

      <Accordion type="single" defaultValue="identite" className="w-full">
        <AccordionItem value="identite" className="border-si-line">
          <AccordionTrigger value="identite" className="py-4 text-left font-medium hover:no-underline [&[data-state=open]]:text-si-forest">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-si-forest/10 text-si-forest">
                <User className="h-4 w-4" />
              </span>
              {t("identityAndContact")}
            </span>
          </AccordionTrigger>
          <AccordionContent value="identite" className="pb-4 pl-12 text-sm text-si-muted">
            <p className="rounded-lg bg-si-canvas p-4 text-si-muted">
              {t("identityEmptyState")}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="familiale" className="border-si-line">
          <AccordionTrigger value="familiale" className="py-4 text-left font-medium hover:no-underline [&[data-state=open]]:text-si-forest">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-si-forest/10 text-si-forest">
                <Users className="h-4 w-4" />
              </span>
              {t("familySituation")}
            </span>
          </AccordionTrigger>
          <AccordionContent value="familiale" className="pb-4 pl-12 text-sm text-si-muted">
            <p className="rounded-lg bg-si-canvas p-4 text-si-muted">
              {t("familyEmptyState")}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pro-financiere" className="border-si-line">
          <AccordionTrigger value="pro-financiere" className="py-4 text-left font-medium hover:no-underline [&[data-state=open]]:text-si-forest">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-si-forest/10 text-si-forest">
                <Briefcase className="h-4 w-4" />
              </span>
              {t("professionalFinancialSituation")}
            </span>
          </AccordionTrigger>
          <AccordionContent value="pro-financiere" className="pb-4 pl-12 text-sm text-si-muted">
            <p className="rounded-lg bg-si-canvas p-4 text-si-muted">
              {t("professionalFinancialEmptyState")}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="mt-4 text-xs text-si-muted">
        {t("matterLabel", { id: dossierId })}
      </p>
    </div>
  );
}
