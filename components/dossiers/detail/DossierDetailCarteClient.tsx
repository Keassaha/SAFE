"use client";

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
  return (
    <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-xl backdrop-blur sm:p-8">
      <div className="mb-6 border-b border-[var(--safe-neutral-border)] pb-5">
        <h2 className="text-lg font-bold tracking-tight text-[var(--safe-text-title)]">
          Carte client
        </h2>
        <p className="mt-1 text-sm text-[var(--safe-text-secondary)]">
          Identité, situation familiale et informations professionnelles ou financières liées au dossier.
        </p>
      </div>

      <Accordion type="single" defaultValue="identite" className="w-full">
        <AccordionItem value="identite" className="border-[var(--safe-neutral-border)]">
          <AccordionTrigger value="identite" className="py-4 text-left font-medium hover:no-underline [&[data-state=open]]:text-[var(--safe-green-700)]">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--safe-green-50)] text-[var(--safe-green-700)]">
                <User className="h-4 w-4" />
              </span>
              Identité et coordonnées
            </span>
          </AccordionTrigger>
          <AccordionContent value="identite" className="pb-4 pl-12 text-sm text-[var(--safe-text-secondary)]">
            <p className="rounded-lg bg-[var(--safe-neutral-100)] p-4 text-[var(--safe-text-secondary)]">
              Aucune donnée renseignée pour le moment. Les informations d’identité et de contact du client pourront être complétées ici.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="familiale" className="border-[var(--safe-neutral-border)]">
          <AccordionTrigger value="familiale" className="py-4 text-left font-medium hover:no-underline [&[data-state=open]]:text-[var(--safe-green-700)]">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--safe-green-50)] text-[var(--safe-green-700)]">
                <Users className="h-4 w-4" />
              </span>
              Situation familiale
            </span>
          </AccordionTrigger>
          <AccordionContent value="familiale" className="pb-4 pl-12 text-sm text-[var(--safe-text-secondary)]">
            <p className="rounded-lg bg-[var(--safe-neutral-100)] p-4 text-[var(--safe-text-secondary)]">
              Aucune donnée renseignée. Régime matrimonial, enfants et situation familiale pourront être détaillés dans cette section.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pro-financiere" className="border-[var(--safe-neutral-border)]">
          <AccordionTrigger value="pro-financiere" className="py-4 text-left font-medium hover:no-underline [&[data-state=open]]:text-[var(--safe-green-700)]">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--safe-green-50)] text-[var(--safe-green-700)]">
                <Briefcase className="h-4 w-4" />
              </span>
              Situation professionnelle & financière
            </span>
          </AccordionTrigger>
          <AccordionContent value="pro-financiere" className="pb-4 pl-12 text-sm text-[var(--safe-text-secondary)]">
            <p className="rounded-lg bg-[var(--safe-neutral-100)] p-4 text-[var(--safe-text-secondary)]">
              Aucune donnée renseignée. Revenus, emploi et situation financière pourront être renseignés ici.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="mt-4 text-xs text-[var(--safe-text-secondary)]">
        Dossier {dossierId}
      </p>
    </div>
  );
}
