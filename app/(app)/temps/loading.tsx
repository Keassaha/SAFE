import { getTranslations } from "next-intl/server";

/**
 * Squelette de route. Immobile, et l'attente est annoncée aux technologies
 * d'assistance par une région vivante ; le décor en est retiré.
 */
export default async function Loading() {
  const t = await getTranslations("loadingUi");

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("timesheet")}</span>
      <div aria-hidden className="space-y-6">
        <div className="py-4">
          <div className="h-9 w-56 rounded bg-si-line2" />
          <div className="mt-3 h-4 w-full max-w-lg rounded bg-si-line2" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="h-9 w-72 max-w-[70%] rounded-md bg-si-line2" />
          <div className="h-10 w-36 rounded-md bg-si-line2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[118px] rounded-lg border border-si-line bg-si-surface" />
          ))}
        </div>
        <div className="rounded-lg border border-si-line bg-si-surface p-5">
          <div className="h-5 w-40 rounded bg-si-line2" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 rounded-md bg-si-line2" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
