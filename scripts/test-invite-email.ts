/**
 * Test envoi email d'invitation.
 * Run: npx tsx --env-file=.env scripts/test-invite-email.ts
 */

import { sendEmail, invitationEmailHtml } from "@/lib/email";

async function main() {
  console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);

  const html = invitationEmailHtml({
    cabinetNom: "Derisier Law",
    inviteUrl: "https://safe-wheat-seven.vercel.app/rejoindre/test-token-abc123",
    role: "assistante",
  });

  const result = await sendEmail({
    to: "keassahatd@gmail.com",
    subject: "TEST — Invitation SAFE · Derisier Law",
    html,
    cabinetNom: "Derisier Law",
  });

  console.log("Résultat:", result);
}

main().catch(console.error);
