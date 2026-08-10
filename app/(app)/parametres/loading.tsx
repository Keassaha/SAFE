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
      <span className="sr-only">{t("settings")}</span>
      <div aria-hidden className="space-y-4">
      <div className="h-8 w-40 rounded-lg bg-si-line2" />
      <div className="h-11 w-full max-w-md rounded-lg bg-si-line2" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 w-full rounded-lg bg-si-line2" />
        ))}
      </div>
      </div>
    </div>
  );
}
