/**
 * Gabarits d'email d'accompagnement pour l'envoi d'un document au client (E1).
 * Doctrine : docs/product/SPEC_envoi_documents_client.md.
 *
 * Purs (aucune dépendance) : importables client + serveur. Renvoient un sujet
 * et un corps en TEXTE, pré-remplis selon le type de document et ÉDITABLES par
 * l'utilisateur avant l'envoi. Le corps est ensuite enveloppé en HTML par le
 * service d'envoi. Voix « vous », ton professionnel, sans emoji.
 */

export type SendableDocType = "note" | "lettre" | "contrat" | "procedure" | "requete" | "autre";

export interface DocEmailVars {
  clientNom: string;
  cabinetNom: string;
  documentTitre: string;
}

const INTRO_FR: Record<SendableDocType, (v: DocEmailVars) => string> = {
  lettre: () => "Veuillez trouver ci-joint notre correspondance relative à votre dossier.",
  contrat: () =>
    "Veuillez trouver ci-joint le document contractuel relatif à votre dossier. Nous vous invitons à en prendre connaissance attentivement.",
  procedure: () => "Veuillez trouver ci-joint le document de procédure relatif à votre dossier.",
  requete: () => "Veuillez trouver ci-joint la requête relative à votre dossier.",
  note: (v) => `Veuillez trouver ci-joint le document « ${v.documentTitre} » relatif à votre dossier.`,
  autre: (v) => `Veuillez trouver ci-joint le document « ${v.documentTitre} » relatif à votre dossier.`,
};

const INTRO_EN: Record<SendableDocType, (v: DocEmailVars) => string> = {
  lettre: () => "Please find attached our correspondence regarding your file.",
  contrat: () =>
    "Please find attached the contractual document regarding your file. We invite you to review it carefully.",
  procedure: () => "Please find attached the procedural document regarding your file.",
  requete: () => "Please find attached the application regarding your file.",
  note: (v) => `Please find attached the document “${v.documentTitre}” regarding your file.`,
  autre: (v) => `Please find attached the document “${v.documentTitre}” regarding your file.`,
};

/**
 * Construit le sujet + le corps (texte) pré-remplis pour l'envoi d'un document.
 * `type` inconnu → retombe sur « autre ».
 */
export function documentEmailTemplate(
  type: string,
  locale: "fr" | "en",
  vars: DocEmailVars,
): { subject: string; body: string } {
  const key: SendableDocType = (["note", "lettre", "contrat", "procedure", "requete", "autre"].includes(type)
    ? type
    : "autre") as SendableDocType;

  if (locale === "en") {
    const subject = `${vars.documentTitre} — ${vars.cabinetNom}`;
    const body = [
      `Dear ${vars.clientNom},`,
      "",
      INTRO_EN[key](vars),
      "",
      "Please do not hesitate to contact us with any questions.",
      "",
      "Kind regards,",
      vars.cabinetNom,
    ].join("\n");
    return { subject, body };
  }

  const subject = `${vars.documentTitre} — ${vars.cabinetNom}`;
  const body = [
    `Bonjour ${vars.clientNom},`,
    "",
    INTRO_FR[key](vars),
    "",
    "N'hésitez pas à nous contacter pour toute question.",
    "",
    "Cordialement,",
    vars.cabinetNom,
  ].join("\n");
  return { subject, body };
}
