import { getTranslations } from "next-intl/server";

/**
 * Squelette de route. Immobile : une pulsation continue n'apporte aucune
 * information et contrevient à PS-042. La forme suffit à annoncer la mise en
 * page qui arrive.
 *
 * L'attente est annoncée aux technologies d'assistance par une région vivante ;
 * le décor, lui, en est retiré.
 */
export default async function Loading() {
  const t = await getTranslations("loadingUi");

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("management")}</span>
      <div aria-hidden className="space-y-4">
      <div className="h-8 w-44 rounded-lg bg-si-line2" />
      <div className="h-5 w-72 max-w-full rounded-lg bg-si-line2" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-lg bg-si-line2" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-si-line2" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg bg-si-line2" />
        ))}
      </div>
      </div>
    </div>
  );
}
