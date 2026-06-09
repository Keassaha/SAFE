import { redirect } from "next/navigation";

/**
 * Ancienne fiche lead — consolidée dans /console/clients/[id] (chantier 2).
 * Spec : docs/product/CONSOLE_CONSULTANT_REFACTOR_v1.md
 */
export default async function ConsoleLeadDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/console/clients/${id}`);
}
