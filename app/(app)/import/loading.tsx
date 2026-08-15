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
      <span className="sr-only">{t("import")}</span>
      <div aria-hidden className="space-y-4">
      <div className="h-8 w-36 rounded-lg bg-si-line2" />
      <div className="h-72 w-full max-w-2xl rounded-lg bg-si-line2" />
      </div>
    </div>
  );
}
