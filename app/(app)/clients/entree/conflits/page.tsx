import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Check, Copy, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewClients } from "@/lib/auth/permissions";
import { croiserConflitsDuCabinet } from "@/lib/services/entree-client/croisement-conflits-service";
import type { GraviteAppariement } from "@/lib/clients/croisement-conflits";
import type { UserRole } from "@prisma/client";

/**
 * Relance de la recherche de conflits, tous contre tous.
 *
 * Le dernier geste de la reprise. Pendant la saisie, chaque nouveau client
 * n'est comparé qu'à ceux déjà entrés : le premier n'a été comparé à personne.
 * Cette page referme le trou en comparant tout le monde à tout le monde.
 *
 * Elle ne décide rien et n'écrit rien. Elle montre ce qu'elle a trouvé et
 * laisse l'avocat juger : un conflit d'intérêts se tranche par une personne,
 * jamais par un logiciel.
 */
export const dynamic = "force-dynamic";

const ALLURE: Record<
  GraviteAppariement,
  { titre: string; icone: typeof AlertTriangle; cadre: string; encre: string }
> = {
  conflit: {
    titre: "À regarder de près",
    icone: AlertTriangle,
    cadre: "border-si-danger/30 bg-si-danger/[0.05]",
    encre: "text-si-danger-ink",
  },
  doublon: {
    titre: "Fiches en double",
    icone: Copy,
    cadre: "border-si-amber/30 bg-si-amber/[0.06]",
    encre: "text-si-amber-ink",
  },
  signal: {
    titre: "Simples homonymies",
    icone: Eye,
    cadre: "border-si-line bg-si-surface",
    encre: "text-si-muted",
  },
};

const ORDRE: GraviteAppariement[] = ["conflit", "doublon", "signal"];

export default async function CroisementConflitsPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewClients(role as UserRole)) notFound();

  const { appariements, comptes, etendue } = await croiserConflitsDuCabinet(cabinetId);
  const total = appariements.length;

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-16 pt-6">
      <PageHeader
        variant="dashboard"
        title="Recherche de conflits, tout le monde contre tout le monde"
        description={`${etendue.clients} client${etendue.clients > 1 ? "s" : ""} et ${etendue.parties} partie${
          etendue.parties > 1 ? "s" : ""
        } comparés deux à deux. Pendant la saisie, vos premiers clients n'avaient pas encore été comparés aux derniers.`}
      />

      {total === 0 ? (
        <div className="rounded-xl border border-si-verified/25 bg-si-verified/[0.06] px-5 py-6">
          <div className="flex items-center gap-2.5 text-[15px] font-medium text-si-verified">
            <Check className="h-5 w-5" />
            Aucun rapprochement trouvé
          </div>
          <p className="mt-2 max-w-[62ch] text-[13px] text-si-body">
            Personne parmi vos clients ne porte le nom d&apos;une partie adverse, et aucune fiche ne semble en doubler
            une autre. Ce résultat vaut pour les {etendue.clients + etendue.parties} noms présents aujourd&apos;hui : il
            sera à refaire si vous entrez d&apos;autres dossiers anciens.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {ORDRE.filter((g) => comptes[g] > 0).map((gravite) => {
            const allure = ALLURE[gravite];
            const Icone = allure.icone;
            return (
              <section key={gravite}>
                <h2 className="mb-3 flex items-center gap-2 text-[15px] font-medium text-si-ink">
                  <Icone className={`h-4 w-4 ${allure.encre}`} />
                  {allure.titre}
                  <span className="font-mono text-[12px] text-si-subtle">{comptes[gravite]}</span>
                </h2>
                <div className="space-y-2">
                  {appariements
                    .filter((a) => a.gravite === gravite)
                    .map((a) => (
                      <article key={`${a.a.id}-${a.b.id}`} className={`rounded-xl border px-4 py-3.5 ${allure.cadre}`}>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          {a.a.nature === "client" ? (
                            <Link
                              href={`/clients/${a.a.id}`}
                              className="text-[14px] font-medium text-si-ink underline-offset-4 hover:underline"
                            >
                              {a.a.libelle}
                            </Link>
                          ) : (
                            <span className="text-[14px] font-medium text-si-ink">{a.a.libelle}</span>
                          )}
                          <span className="text-[13px] text-si-muted">et</span>
                          {a.b.nature === "client" ? (
                            <Link
                              href={`/clients/${a.b.id}`}
                              className="text-[14px] font-medium text-si-ink underline-offset-4 hover:underline"
                            >
                              {a.b.libelle}
                            </Link>
                          ) : a.b.dossierId ? (
                            <Link
                              href={`/dossiers/${a.b.dossierId}`}
                              className="text-[14px] font-medium text-si-ink underline-offset-4 hover:underline"
                            >
                              {a.b.libelle}
                            </Link>
                          ) : (
                            <span className="text-[14px] font-medium text-si-ink">{a.b.libelle}</span>
                          )}
                          <span className="ml-auto font-mono text-[11px] text-si-subtle">
                            rapprochés par le {a.motif}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] text-si-body">{a.explication}</p>
                      </article>
                    ))}
                </div>
              </section>
            );
          })}

          {/* Ce que cette page ne fait pas, dit une fois, en bas. */}
          <p className="max-w-[62ch] border-t border-si-line pt-5 text-[13px] text-si-muted">
            Rien n&apos;a été modifié. Un rapprochement n&apos;est pas un verdict : deux personnes peuvent porter le
            même nom, et un même nom peut n&apos;être qu&apos;une coquille de saisie. C&apos;est à vous de trancher,
            dossier en main.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/clients/entree"
          className="text-[13px] text-si-body underline underline-offset-4 hover:text-si-ink"
        >
          Revenir à l&apos;entrée des clients
        </Link>
      </div>
    </div>
  );
}
