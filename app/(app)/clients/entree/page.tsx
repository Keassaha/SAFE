import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canCreateClients } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { chargerContexteEntree } from "@/lib/services/entree-client/contexte-entree";
import { FormulaireEntreeClient } from "@/components/clients/entree/FormulaireEntreeClient";
import { routes } from "@/lib/routes";
import type { UserRole } from "@prisma/client";

/**
 * Entrée d'un client déjà servi par le cabinet.
 *
 * Écran du processus de reprise : un cabinet qui arrive dans SAFE avec une
 * clientèle existante entre ses clients un par un, en déclarant ce qu'il a
 * déjà fait. Distinct de `/clients/nouveau`, qui ouvre un client qui arrive
 * aujourd'hui et n'a donc rien d'antérieur à déclarer.
 */
export const dynamic = "force-dynamic";

export default async function EntreeClientPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; enregistre?: string }>;
}) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canCreateClients(role as UserRole)) notFound();

  const params = await searchParams;
  const [contexte, utilisateur] = await Promise.all([
    chargerContexteEntree(cabinetId),
    prisma.user.findUnique({ where: { id: userId }, select: { nom: true } }),
  ]);

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-2 pt-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          variant="dashboard"
          title="Entrée d'un client"
          description="Ce que vous savez, ce que vous avez déjà fait, ce qui reste ouvert."
          action={
            <Link href={routes.safeImportExercices}>
              <Button variant="secondary" type="button">
                Reprendre un exercice précédent
              </Button>
            </Link>
          }
        />
      </div>

      <FormulaireEntreeClient
        contexte={contexte}
        nomUtilisateur={utilisateur?.nom ?? "Vous"}
        erreur={params.erreur ?? null}
        clientPrecedentEnregistre={Boolean(params.enregistre)}
      />
    </div>
  );
}
