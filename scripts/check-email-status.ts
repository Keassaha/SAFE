/**
 * Vérifie le statut d'un email Resend + les domaines configurés.
 * Run: npx tsx --env-file=.env scripts/check-email-status.ts
 */
import { Resend } from "resend";

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Statut de l'email de test
  const email = await resend.emails.get("f5aa76dc-a4e8-4a51-973b-6e16a962f9d3");
  console.log("=== Statut email de test ===");
  console.log(JSON.stringify(email, null, 2));

  // Domaines vérifiés dans Resend
  const domains = await resend.domains.list();
  console.log("\n=== Domaines Resend ===");
  console.log(JSON.stringify(domains, null, 2));
}

main().catch(console.error);
