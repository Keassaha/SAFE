import { sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, cabinet, numLawyers, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Send confirmation email to the lawyer
    try {
      await sendEmail({
        to: email,
        subject: "Nous avons reçu votre demande — SAFE Cabinet",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a3a5c; margin-bottom: 16px;">Merci de votre intérêt!</h2>
            <p>Bonjour ${name},</p>
            <p>Nous avons bien reçu votre message et nous vous répondrons dans les 24 heures ouvrables.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #666; font-size: 13px; margin: 0;">
              <strong>Récapitulatif:</strong><br/>
              Cabinet: ${cabinet || "Non spécifié"}<br/>
              Avocats: ${numLawyers || "Non spécifié"}<br/>
              Message: ${message.substring(0, 100)}...
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
        to: "ptiahou@gmail.com",
        subject: `[Nouveau Contact] ${name} — ${cabinet || "Cabinet non spécifié"}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a3a5c;">Nouvelle demande de contact</h2>
            <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Nom</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Courriel</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Cabinet</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${cabinet || "Non spécifié"}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Avocats</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${numLawyers || "Non spécifié"}</td>
              </tr>
            </table>
            <h3 style="color: #1a3a5c; margin-top: 24px;">Message:</h3>
            <blockquote style="border-left: 4px solid #8eb69b; margin-left: 0; padding-left: 16px; color: #333;">
              ${message.replace(/\n/g, "<br/>")}
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
