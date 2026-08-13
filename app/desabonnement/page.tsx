import { prisma } from "@/lib/db";
import { verifierSignature } from "@/lib/crm/desabonnement";
import { confirmerDesabonnement } from "./actions";

/**
 * Page publique de désabonnement (LCAP).
 *
 * Le désabonnement demande une confirmation plutôt que de s'exécuter à
 * l'ouverture du lien : les antipourriels et les aperçus de messagerie
 * pré-chargent les liens des courriels, et un désabonnement en un seul GET
 * serait déclenché par des robots au lieu de la personne.
 */
export default async function DesabonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; s?: string; fait?: string }>;
}) {
  const { c: contactId, s: signature, fait } = await searchParams;

  const valide =
    !!contactId && !!signature && verifierSignature(contactId, signature);

  const contact = valide
    ? await prisma.leadContact.findUnique({
        where: { id: contactId },
        select: { email: true, doNotContact: true },
      })
    : null;

  const dejaFait = fait === "1" || contact?.doNotContact === true;

  return (
    <main className="flex min-h-screen items-center justify-center bg-si-canvas px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-si-line bg-si-surface px-7 py-8">
        {!valide || !contact ? (
          <>
            <h1 className="font-serif text-2xl text-si-ink">Lien invalide</h1>
            <p className="mt-3 text-sm leading-6 text-si-muted">
              Ce lien de désabonnement n&apos;est pas reconnu. Écrivez-nous à
              bonjour@safecabinet.ca et nous retirerons votre adresse à la main.
            </p>
          </>
        ) : dejaFait ? (
          <>
            <h1 className="font-serif text-2xl text-si-ink">C&apos;est fait</h1>
            <p className="mt-3 text-sm leading-6 text-si-muted">
              {contact.email} ne recevra plus de courriels de notre part. Merci de nous
              l&apos;avoir dit.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-si-ink">Se désabonner</h1>
            <p className="mt-3 text-sm leading-6 text-si-muted">
              Confirmez et nous cesserons d&apos;écrire à {contact.email}. Aucune question,
              aucune relance.
            </p>
            <form action={confirmerDesabonnement} className="mt-6">
              <input type="hidden" name="c" value={contactId} />
              <input type="hidden" name="s" value={signature} />
              <button
                type="submit"
                className="h-[38px] rounded-md safe-action-degrade px-4 text-[13px] font-medium text-si-surface transition hover:brightness-95"
              >
                Confirmer le désabonnement
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
