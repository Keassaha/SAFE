import { sendEmail } from "@/lib/email";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * La demande écrite depuis /demo et /contact.
 *
 * Deux points à ne pas défaire :
 *
 * 1. LES VALEURS SONT ÉCHAPPÉES. Elles arrivent d'un formulaire public et
 *    partent dans deux courriels en HTML. Interpolées telles quelles, un nom
 *    contenant du balisage devenait du balisage dans la boîte de réception.
 * 2. LE TÉLÉPHONE est un champ à part entière depuis le 2026-08-25 : la page
 *    le demande, il doit arriver.
 */

const echapper = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (await isRateLimited(`contact-${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, cabinet, numLawyers, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const nom = echapper(name);
    const courriel = echapper(email);
    const tel = echapper(phone) || "Non spécifié";
    const bureau = echapper(cabinet) || "Non spécifié";
    const avocats = echapper(numLawyers) || "Non spécifié";
    const raison = echapper(message);

    // Send confirmation email to the lawyer
    try {
      await sendEmail({
        to: email,
        subject: "Nous avons reçu votre demande — SAFE",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a3a5c; margin-bottom: 16px;">Merci de votre intérêt!</h2>
            <p>Bonjour ${nom},</p>
            <p>Nous avons bien reçu votre message et nous vous répondrons dans les 24 heures ouvrables.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #666; font-size: 13px; margin: 0;">
              <strong>Récapitulatif:</strong><br/>
              Cabinet: ${bureau}<br/>
              Téléphone: ${tel}<br/>
              Raison: ${raison}
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 32px; margin-bottom: 0;">
              SAFE — safecabinet.ca
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Continue even if confirmation email fails
    }

    // Send notification email to support
    try {
      await sendEmail({
        to: "jeremie@safecabinet.ca",
        subject: `[Nouveau Contact] ${nom} — ${bureau}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a3a5c;">Nouvelle demande de contact</h2>
            <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Nom</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${nom}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Courriel</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${courriel}">${courriel}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Téléphone</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${tel}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Cabinet</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${bureau}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Avocats</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${avocats}</td>
              </tr>
            </table>
            <h3 style="color: #1a3a5c; margin-top: 24px;">Raison:</h3>
            <blockquote style="border-left: 4px solid #8eb69b; margin-left: 0; padding-left: 16px; color: #333;">
              ${raison.replace(/\n/g, "<br/>")}
            </blockquote>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    return NextResponse.json(
      { success: true, message: "Message envoyé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
