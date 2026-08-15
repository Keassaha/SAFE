import { getTranslations } from "next-intl/server";

/**
 * Squelette de route. Immobile : une pulsation continue n'apporte aucune
 * information et contrevient à PS-042. La forme suffit à annoncer la mise en
 * page qui arrive — ici les deux colonnes du formulaire (champs à gauche,
 * aperçu en direct à droite).
 *
 * L'attente est annoncée aux technologies d'assistance par une région vivante ;
 * le décor, lui, en est retiré.
 */
export default async function Loading() {
  const t = await getTranslations("loadingUi");

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("invoicing")}</span>
      <div aria-hidden className="space-y-4">
        <div className="h-8 w-56 rounded-lg bg-si-line2" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 w-full rounded-lg bg-si-line2" />
            ))}
          </div>
          <div className="h-96 w-full rounded-lg bg-si-line2" />
        </div>
      </div>
    </div>
  );
}
