import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/marketing/Navbar";

const AuditChat = dynamic(() => import("@/components/audit/AuditChat"), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-xl px-4">
        <div className="h-12 bg-neutral-200 rounded-safe-sm w-3/4" />
        <div className="h-8 bg-neutral-100 rounded-safe-sm w-1/2" />
        <div className="h-32 bg-neutral-100 rounded-safe-sm" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Audit gratuit — SAFE | Évaluez l'efficacité de votre cabinet",
  description:
    "Répondez à quelques questions et recevez un rapport d'audit personnalisé pour votre cabinet d'avocats. Gratuit et confidentiel.",
};

export default async function AuditGratuitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const fromInscription = params.from === "inscription";

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[var(--safe-white)]">
      <Navbar />
      <main className="flex-1 overflow-hidden pt-24">
        {fromInscription && (
          <div className="mx-auto max-w-2xl px-4 mb-4">
            <div className="rounded-safe border border-primary-200 bg-primary-50 px-5 py-4 text-sm text-primary-900 shadow-sm">
              <p className="font-semibold">L&apos;inscription directe n&apos;est pas encore disponible.</p>
              <p className="mt-1 text-primary-700">
                Commencez par notre audit gratuit de 8 minutes pour découvrir comment SAFE peut transformer votre cabinet.
                À la fin, notre équipe vous accompagnera personnellement dans la mise en place.
              </p>
            </div>
          </div>
        )}
        <AuditChat />
      </main>
    </div>
  );
}
