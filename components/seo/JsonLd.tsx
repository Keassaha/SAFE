/**
 * Injecte des données structurées JSON-LD dans la page.
 *
 * Les moteurs (Google) et les IA (ChatGPT, Gemini) lisent ce balisage pour
 * comprendre et citer la page. Usage :
 *
 *   import { JsonLd } from "@/components/seo/JsonLd";
 *   import { organizationSchema, softwareApplicationSchema } from "@/lib/seo";
 *   <JsonLd schema={[organizationSchema(), softwareApplicationSchema()]} />
 */
export function JsonLd({ schema }: { schema: object | object[] }) {
  const payload = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {payload.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Le contenu vient de nos propres fonctions typées (lib/seo.ts), pas
          // d'une saisie utilisateur : pas de risque d'injection.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
