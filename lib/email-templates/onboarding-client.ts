/* ─────────────────────────────────────────────
   Email Client — Confirmation onboarding SAFE
   ───────────────────────────────────────────── */

import type { CalculationResult } from "@/lib/onboarding/types";
import type { Lang } from "@/lib/onboarding/types";

const content = {
  fr: {
    subject: "Votre audit SAFE est confirme",
    greeting: (name: string) => `Bonjour ${name},`,
    p1: "Merci d'avoir pris le temps de remplir notre audit. Votre demande a bien ete recue.",
    planLabel: "Votre plan :",
    nextStepTitle: "Prochaine etape",
    nextStep:
      "Un membre de notre equipe vous contactera sous 24 heures pour confirmer votre appel de demarrage et commencer la configuration de votre espace SAFE.",
    closing: "Au plaisir de travailler ensemble,",
  },
  en: {
    subject: "Your SAFE audit is confirmed",
    greeting: (name: string) => `Hello ${name},`,
    p1: "Thank you for taking the time to complete our audit. Your request has been received.",
    planLabel: "Your plan:",
    nextStepTitle: "Next step",
    nextStep:
      "A member of our team will contact you within 24 hours to confirm your onboarding call and start configuring your SAFE workspace.",
    closing: "Looking forward to working together,",
  },
};

export function onboardingClientEmailHtml(
  clientName: string,
  lang: Lang,
  calc: CalculationResult
): string {
  const c = content[lang];

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:#235347;padding:32px;text-align:center">
    <div style="width:48px;height:48px;border-radius:12px;background:#3D6B5A;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
      <span style="color:#fff;font-size:20px;font-weight:700">S</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:22px">${c.subject}</h1>
  </div>

  <div style="padding:32px 24px">

    <p style="font-size:15px;color:#333;margin:0 0 16px">${c.greeting(clientName)}</p>
    <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">${c.p1}</p>

    <!-- Plan -->
    <div style="background:#F8FDF9;border:1px solid #DAF1DE;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center">
      <p style="font-size:13px;color:#6B8F7B;margin:0 0 4px">${c.planLabel}</p>
      <p style="font-size:24px;font-weight:700;color:#235347;margin:0">
        ${calc.plan.name[lang]} — ${calc.plan.price === 0
          ? (lang === "fr" ? "Sur devis" : "Custom quote")
          : `${calc.plan.price}$<span style="font-size:14px;font-weight:400;color:#6B8F7B">/${lang === "fr" ? "mois" : "month"}</span>`}
      </p>
    </div>

    <!-- Next step -->
    <h2 style="font-size:16px;color:#235347;margin:0 0 8px">${c.nextStepTitle}</h2>
    <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 32px">${c.nextStep}</p>

    <p style="font-size:14px;color:#555;margin:0 0 4px">${c.closing}</p>

    <!-- Signature -->
    <div style="border-top:1px solid #e5e5e5;padding-top:16px;margin-top:16px">
      <p style="font-size:14px;font-weight:600;color:#333;margin:0">Jeremie Tiahou</p>
      <p style="font-size:13px;color:#6B8F7B;margin:2px 0">${lang === "fr" ? "Fondateur" : "Founder"}, SAFE</p>
      <p style="font-size:13px;color:#6B8F7B;margin:2px 0">bonjour@safe.quebec</p>
      <p style="font-size:13px;color:#6B8F7B;margin:2px 0">(819) 271-8656</p>
      <p style="font-size:13px;margin:2px 0"><a href="https://safecabinet.ca" style="color:#235347">safecabinet.ca</a></p>
    </div>

  </div>
</div>
</body></html>`;
}

export function getClientEmailSubject(lang: Lang): string {
  return content[lang].subject;
}
