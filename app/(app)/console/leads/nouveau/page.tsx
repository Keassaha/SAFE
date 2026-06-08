import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { NewLeadForm } from "@/components/console/NewLeadForm";

/**
 * Formulaire de création d'un nouveau Lead (cabinet prospect).
 * Le scoring firmographique est calculé automatiquement à la création.
 */
export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nouveau cabinet"
        description="Ajouter un prospect au CRM. Le score firmographique est calculé automatiquement."
        backHref="/console/leads"
        backLabel="Tous les cabinets"
      />
      <Card>
        <CardContent className="px-6 py-6">
          <NewLeadForm />
        </CardContent>
      </Card>
    </div>
  );
}
