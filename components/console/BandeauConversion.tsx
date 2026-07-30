"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { envoyerInvitationAdmin } from "@/app/(app)/console/clients/[id]/convertir/actions";

/**
 * Bandeau d'état de la conversion, en tête de la fiche.
 *
 * Trois états, un seul affiché à la fois. Chacun porte l'action qui débloque
 * l'étape suivante, et rien d'autre : c'est le point du parcours où l'on veut le
 * moins d'hésitation possible.
 */
export function BandeauConversion({
  leadId,
  etat,
  invitationEmail,
  invitationExpiree,
}: {
  leadId: string;
  etat: "A_CONVERTIR" | "INVITATION_EN_ATTENTE" | "ACTIF";
  invitationEmail?: string | null;
  invitationExpiree?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function envoyer() {
    setErreur(null);
    setMessage(null);
    startTransition(async () => {
      const res = await envoyerInvitationAdmin(leadId);
      if (res.ok) {
        setMessage(res.message ?? "Invitation envoyée.");
        router.refresh();
      } else {
        setErreur(res.error);
      }
    });
  }

  if (etat === "ACTIF") return null;

  if (etat === "A_CONVERTIR") {
    return (
      <section className="rounded-xl border border-si-verified/30 bg-si-verified/[0.05] px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-si-ink">Ce cabinet a signé.</p>
            <p className="mt-1 text-sm leading-6 text-si-muted">
              La conversion crée le cabinet client, prépare l&apos;accès et pose les tâches
              d&apos;intégration. L&apos;historique de prospection reste ici.
            </p>
          </div>
          <Link href={`/console/clients/${leadId}/convertir`} className="shrink-0">
            <Button variant="primary">Convertir en client</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-si-amber/30 bg-si-amber/[0.08] px-6 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-si-amber-ink">
            Accès pas encore envoyé{invitationExpiree ? " · invitation expirée" : ""}
          </p>
          <p className="mt-1 text-sm leading-6 text-si-ink">
            Le cabinet existe et l&apos;invitation attend pour{" "}
            <span className="font-medium">{invitationEmail}</span>. Envoyez-la quand la
            configuration est prête.
            {invitationExpiree && " Le lien sera prolongé automatiquement à l'envoi."}
          </p>
        </div>
        <Button variant="primary" onClick={envoyer} disabled={isPending} className="shrink-0">
          {isPending ? "Envoi..." : "Envoyer l'invitation"}
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-si-verified">{message}</p>}
      {erreur && <p className="mt-3 text-sm text-[#B84A3E]">{erreur}</p>}
    </section>
  );
}
