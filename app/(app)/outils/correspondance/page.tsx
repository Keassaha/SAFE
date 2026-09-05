import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewDossiers } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChronologieCorrespondance } from "@/components/correspondance/ChronologieCorrespondance";
import { chargerChronologieCabinet } from "@/lib/services/correspondance/charger";
import { routes } from "@/lib/routes";
import type { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";

/**
 * Correspondance du cabinet — l'outil, lot 0.
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §22, lot 0.
 *
 * ── Pourquoi cet écran existe en plus de l'onglet du cartable ────────────────
 * L'onglet du cartable répond à « qu'a-t-on échangé sur CE dossier ». Il ne
 * répond pas à « qu'est-ce qui est parti du cabinet cette semaine, et est-ce
 * que tout est bien parti ». Cette seconde question n'avait aucun écran, alors
 * que les trois journaux la contenaient déjà.
 *
 * ── Ce que ce n'est pas ──────────────────────────────────────────────────────
 * Pas une boîte de réception. Rien n'entre ici, on n'y répond pas, et seules
 * les communications rattachées à un dossier s'y affichent. La contrainte de
 * cadrage du chantier tient : SAFE gère la correspondance des dossiers, pas la
 * vie courriel du cabinet.
 *
 * Composant SERVEUR : la chronologie se rend avec la page, sans aller-retour
 * réseau. C'est ce qui tient le premier rendu sous la seconde (PS-072).
 */
export default async function CorrespondanceCabinetPage() {
  const session = await requireCabinetAndUser();
  if (!canViewDossiers(session.role as UserRole)) notFound();

  const t = await getTranslations("correspondanceOutil");
  const { entrees, tronquee } = await chargerChronologieCabinet(session.cabinetId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("toolsLabel"), href: routes.outils },
          { label: t("title"), href: routes.outilsCorrespondance },
        ]}
      />
      <ChronologieCorrespondance entrees={entrees} tronquee={tronquee} afficherDossier />
    </div>
  );
}
