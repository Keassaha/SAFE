import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { attachDemandeSiteToCrm } from "@/lib/crm/lead-from-demande";
import { NextRequest, NextResponse } from "next/server";

/**
 * La demande écrite depuis /demo et /contact, et la demande de rendez-vous.
 *
 * Trois points à ne pas défaire :
 *
 * 1. LA DEMANDE EST ÉCRITE EN BASE AVANT TOUT ENVOI. Jusqu'au 2026-09-04, cette
 *    route n'écrivait nulle part : elle envoyait deux courriels, attrapait leurs
 *    échecs et répondait quand même « succès ». Un envoi manqué faisait
 *    disparaître la demande. Désormais l'enregistrement prime : si l'écriture
 *    échoue, on répond une erreur au visiteur au lieu de lui mentir ; si un
 *    envoi ou le CRM échoue ensuite, la demande reste lisible et porte la trace
 *    de ce qui a manqué (`accuseReceptionEnvoye`, `aviseInterneEnvoye`,
 *    `crmNote`). C'est le contrat déjà appliqué à l'audit gratuit.
 * 2. LES VALEURS SONT ÉCHAPPÉES. Elles arrivent d'un formulaire public et
 *    partent dans deux courriels en HTML. Interpolées telles quelles, un nom
 *    contenant du balisage devenait du balisage dans la boîte de réception.
 * 3. LE TÉLÉPHONE est un champ à part entière depuis le 2026-08-25 : la page
 *    le demande, il doit arriver.
 */

export const runtime = "nodejs";

const AVIS_INTERNE = "jeremie@safecabinet.ca";

const echapper = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Coupe les textes libres : une demande publique n'a pas à peser un roman. */
const texte = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);

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
    const {
      name,
      email,
      phone,
      cabinet,
      numLawyers,
      message,
      momentSouhaite,
      page,
      lang,
    } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const moment = texte(momentSouhaite, 500);

    // ── 1. Enregistrement. Rien ne part avant que ceci ait réussi. ──
    const demande = await prisma.demandeSite.create({
      data: {
        type: moment ? "RENDEZ_VOUS" : "CONTACT",
        page: texte(page, 120) || null,
        nom: texte(name, 200),
        email: texte(email, 200).toLowerCase(),
        telephone: texte(phone, 60) || null,
        cabinet: texte(cabinet, 200) || null,
        nbAvocats: texte(numLawyers, 40) || null,
        raison: texte(message) || null,
        momentSouhaite: moment || null,
        langue: lang === "en" ? "en" : "fr",
        ip: ip || null,
        userAgent: texte(request.headers.get("user-agent"), 300) || null,
      },
    });

    const nom = echapper(demande.nom);
    const courriel = echapper(demande.email);
    const tel = echapper(demande.telephone) || "Non spécifié";
    const bureau = echapper(demande.cabinet) || "Non spécifié";
    const avocats = echapper(demande.nbAvocats) || "Non spécifié";
    const raison = echapper(demande.raison);
    const momentEchappe = echapper(demande.momentSouhaite);

    // ── 2. Accusé de réception au prospect. Faillible, jamais bloquant. ──
    let accuseEnvoye = false;
    try {
      await sendEmail({
        to: demande.email,
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
              ${momentEchappe ? `<br/>Moments proposés: ${momentEchappe}` : ""}
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 32px; margin-bottom: 0;">
              SAFE — safecabinet.ca
            </p>
          </div>
        `,
      });
      accuseEnvoye = true;
    } catch (emailError) {
      console.error("[contact] accusé de réception non envoyé:", emailError);
    }

    // ── 3. Avis interne. Faillible, jamais bloquant. ──
    let aviseEnvoye = false;
    try {
      await sendEmail({
        to: AVIS_INTERNE,
        subject: `${demande.type === "RENDEZ_VOUS" ? "[Rendez-vous]" : "[Nouveau Contact]"} ${nom} — ${bureau}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a3a5c;">${
              demande.type === "RENDEZ_VOUS"
                ? "Nouvelle demande de rendez-vous"
                : "Nouvelle demande de contact"
            }</h2>
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
              ${
                momentEchappe
                  ? `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Moments</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${momentEchappe}</td>
              </tr>`
                  : ""
              }
            </table>
            <h3 style="color: #1a3a5c; margin-top: 24px;">Raison:</h3>
            <blockquote style="border-left: 4px solid #8eb69b; margin-left: 0; padding-left: 16px; color: #333;">
              ${raison.replace(/\n/g, "<br/>")}
            </blockquote>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">Référence : ${demande.id}</p>
          </div>
        `,
      });
      aviseEnvoye = true;
    } catch (emailError) {
      console.error("[contact] avis interne non envoyé:", emailError);
    }

    // ── 4. Rattachement CRM. Faillible, jamais bloquant : la demande est
    // déjà écrite, le CRM ne peut plus rien faire perdre. ──
    let crmNote: string;
    try {
      const crm = await attachDemandeSiteToCrm(demande.id);
      crmNote = crm.ok ? crm.note : `Échec du rattachement CRM : ${crm.error}`;
      if (!crm.ok) console.error("[contact] CRM attach failed:", crm.error);
    } catch (e) {
      crmNote = `Échec du rattachement CRM : ${
        e instanceof Error ? e.message : String(e)
      }`;
      console.error("[contact] CRM attach threw:", e);
    }

    // La trace de ce qui a suivi. Best-effort : elle ne doit pas faire échouer
    // une demande déjà enregistrée et déjà transmise.
    try {
      await prisma.demandeSite.update({
        where: { id: demande.id },
        data: {
          accuseReceptionEnvoye: accuseEnvoye,
          aviseInterneEnvoye: aviseEnvoye,
          crmNote,
        },
      });
    } catch (e) {
      console.error("[contact] trace de suivi non écrite:", e);
    }

    return NextResponse.json(
      { success: true, id: demande.id, message: "Message envoyé avec succès" },
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
