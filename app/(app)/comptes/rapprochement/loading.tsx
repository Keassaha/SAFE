import { getTranslations } from "next-intl/server";

/**
 * Squelette de route. Immobile, et l'attente est annoncée aux technologies
 * d'assistance par une région vivante ; le décor en est retiré.
 */
export default async function RapprochementLoading() {
  const t = await getTranslations("trustReconciliationUi");

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden className="space-y-6">
        <div className="rounded-lg bg-si-forest p-8">
          <div className="h-4 w-40 rounded bg-white/15" />
          <div className="mt-4 h-9 w-72 max-w-full rounded bg-white/20" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-white/10" />
        </div>
        <div className="h-[58px] rounded-lg border border-si-line bg-si-surface" />
        <div className="rounded-lg border border-si-line bg-si-surface p-6">
          <div className="h-6 w-64 max-w-full rounded bg-si-line2" />
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[62px] rounded-md bg-si-line2" />
            ))}
          </div>
          <div className="mt-5 h-10 w-48 rounded-md bg-si-line2" />
        </div>
      </div>
    </div>
  );
}
