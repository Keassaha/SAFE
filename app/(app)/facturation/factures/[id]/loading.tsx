import { getTranslations } from "next-intl/server";

/**
 * Squelette de route. Immobile : une pulsation continue n'apporte aucune
 * information et contrevient à PS-042. La forme suffit à annoncer la mise en
 * page qui arrive — ici le bandeau de montants puis le document lui-même.
 *
 * L'attente est annoncée aux technologies d'assistance par une région vivante ;
 * le décor, lui, en est retiré.
 */
export default async function Loading() {
  const t = await getTranslations("loadingUi");

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("invoice")}</span>
      <div aria-hidden className="space-y-4">
        <div className="h-8 w-72 rounded-lg bg-si-line2" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-si-line2" />
          ))}
        </div>
        <div className="h-[520px] w-full max-w-3xl rounded-lg bg-si-line2" />
      </div>
    </div>
  );
}
