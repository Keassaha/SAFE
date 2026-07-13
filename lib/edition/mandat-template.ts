/**
 * Gabarit de départ pour un mandat, calqué sur le modèle officiel du
 * Barreau du Québec « Convention de mandat et d'honoraires »
 * (https://www.barreau.qc.ca/media/qcahz3cu/convention-honoraires.docx),
 * structure en 10 sections.
 *
 * Ancrages réglementaires :
 *  - Code de déontologie des avocats (RLRQ c B-1, r 3.1), art. 102 :
 *    honoraires justes et raisonnables + facteurs ; obligation d'informer le
 *    client du coût prévisible des services.
 *  - Règlement sur la procédure de conciliation et d'arbitrage des comptes des
 *    avocats (RLRQ c B-1, r 17) : droit du client à la conciliation (45 jours)
 *    puis à l'arbitrage de compte.
 *  - Règlement sur la comptabilité en fidéicommis des avocats : avances déposées
 *    sans délai au compte en fidéicommis, au nom du client.
 *
 * Le contenu retourné est du JSON ProseMirror (Tiptap) pré-rempli avec les
 * données connues du dossier ; les montants, délais et coordonnées manquants
 * sont laissés en champs [____] à compléter par l'avocat dans l'éditeur.
 * Voix « vous » proscrite ici : le modèle du Barreau parle de « l'Avocat » et
 * « le Client » à la 3e personne, on garde cette convention juridique.
 */

export interface MandatTemplateInput {
  cabinetNom: string;
  cabinetAdresse: string | null;
  cabinetTelephone: string | null;
  cabinetEmail: string | null;
  avocatNom: string | null;
  clientNom: string;
  clientEmail: string | null;
  dossierIntitule: string;
  dossierNumero: string | null;
  /** "forfait" | "horaire" | "pourcentage"/"contingent" | "aide_juridique" | ... */
  modeFacturation: string | null;
  tauxHoraire: number | null;
  /** Provision initiale (avance en fidéicommis) si connue dans le mandat du dossier. */
  provisionInitiale: number | null;
  /** Date d'aujourd'hui, formatée par l'appelant. */
  dateFormatee: string;
  devise: string;
}

type PMNode = Record<string, unknown>;

function text(value: string, bold = false): PMNode {
  return bold ? { type: "text", text: value, marks: [{ type: "bold" }] } : { type: "text", text: value };
}

function heading(level: number, value: string): PMNode {
  return { type: "heading", attrs: { level }, content: [text(value, true)] };
}

/** Paragraphe avec fragments mixtes (texte simple ou gras). Vide si aucun contenu. */
function paragraph(...parts: (PMNode | string)[]): PMNode {
  const content = parts.map((p) => (typeof p === "string" ? text(p) : p));
  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
}

function bullet(...items: string[]): PMNode {
  return {
    type: "bulletList",
    content: items.map((it) => ({ type: "listItem", content: [paragraph(it)] })),
  };
}

/** Termine une phrase par un point sauf si elle finit déjà par une ponctuation. */
function endSentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** Coordonnées sur une ligne, champs manquants remplacés par un repère [ ]. */
function coordonnees(parts: (string | null)[]): string {
  const filled = parts.map((p) => (p && p.trim() ? p.trim() : null)).filter(Boolean);
  return filled.length > 0 ? filled.join(", ") : "[coordonnées à compléter]";
}

/** Clause d'honoraires pré-remplie selon le mode de facturation. */
function honorairesClause(input: MandatTemplateInput): string {
  const mode = (input.modeFacturation ?? "").toLowerCase();
  if (mode.includes("forfait")) {
    return "Le Client paie l'Avocat un montant forfaitaire de [____] $ pour les Services rendus, plus les taxes applicables.";
  }
  if (mode.includes("pourcent") || mode.includes("contingent") || mode.includes("resultat")) {
    return "Le Client paie l'Avocat [____] % des montants reçus pour le Client, quelle qu'en soit l'origine (négociation, transaction, jugement ou exécution forcée), plus les taxes applicables.";
  }
  if (mode.includes("horaire") || input.tauxHoraire) {
    const taux = input.tauxHoraire ? `${input.tauxHoraire}` : "[____]";
    return `Le Client paie l'Avocat un taux horaire de ${taux} $ pour les Services rendus, plus les taxes applicables.`;
  }
  return "Le Client paie l'Avocat selon le mode de tarification suivant : [taux horaire de ____ $ / montant forfaitaire de ____ $ / ____ % des montants reçus], plus les taxes applicables.";
}

/** Construit le titre par défaut du document mandat. */
export function mandatTitreParDefaut(input: { dossierNumero: string | null; clientNom: string }): string {
  const ref = input.dossierNumero ? ` — ${input.dossierNumero}` : "";
  return `Convention de mandat et d'honoraires — ${input.clientNom}${ref}`;
}

/** Construit le contenu ProseMirror sérialisé d'un mandat pré-rempli. */
export function buildMandatContent(input: MandatTemplateInput): string {
  const mode = (input.modeFacturation ?? "").toLowerCase();
  const estHoraire = mode.includes("horaire") || (!!input.tauxHoraire && !mode.includes("forfait") && !mode.includes("pourcent"));

  const avanceLine = input.provisionInitiale
    ? `À la signature de cette Convention, le Client s'engage à payer à l'Avocat une avance sur le coût des Services à rendre (l'« Avance en fidéicommis »). Le montant de cette Avance en fidéicommis est de ${input.provisionInitiale} $.`
    : "À la signature de cette Convention, le Client s'engage à payer à l'Avocat une avance sur le coût des Services à rendre (l'« Avance en fidéicommis »). Le montant de cette Avance en fidéicommis est de [____] $.";

  const content: PMNode[] = [
    heading(1, "Convention de mandat et d'honoraires"),
    paragraph(text("Entre l'Avocat : ", true), coordonnees([input.avocatNom, input.cabinetNom, input.cabinetAdresse, input.cabinetTelephone, input.cabinetEmail])),
    paragraph(text("Et le Client : ", true), coordonnees([input.clientNom, input.clientEmail])),
    paragraph("Dans la présente Convention, « les Parties » désigne l'Avocat et le Client. Le masculin est employé pour alléger le texte."),

    heading(2, "Modes de prévention et de règlement des différends"),
    paragraph(
      "Le Client doit envisager sérieusement d'autres moyens de régler son différend en dehors des tribunaux (conciliation, négociation, médiation, arbitrage). L'Avocat a discuté de ces options avec le Client.",
    ),

    heading(2, "1. Quels sont les services demandés?"),
    paragraph(
      "Le Client a besoin de l'expertise de l'Avocat pour : " +
        input.dossierIntitule +
        (input.dossierNumero ? ` (dossier n° ${input.dossierNumero})` : "") +
        " (les « Services »).",
    ),
    paragraph(
      "Une annexe budgétaire peut être jointe à la présente Convention pour présenter les étapes habituelles du dossier et le budget à prévoir. Le cas échéant, elle en fait partie intégrante.",
    ),

    heading(2, "2. Combien coûtent les services?"),
    paragraph(text("Aide juridique. ", true), "L'Avocat doit informer sans délai le Client lorsqu'il le croit admissible à l'aide juridique. Si l'admissibilité est confirmée, la présente Convention prend fin."),
    paragraph(text("Assurance frais juridiques. ", true), "Le Client est responsable de vérifier s'il bénéficie d'une protection d'assurance frais juridiques (contrats personnels ou collectifs) et d'en informer l'Avocat."),
    paragraph(text("Honoraires professionnels. ", true), honorairesClause(input)),
    paragraph("À moins d'indication contraire du Client, l'Avocat peut déléguer une partie du travail, notamment à :"),
    bullet(
      "un avocat collaborateur, au taux horaire de [____] $;",
      "un associé, au taux horaire de [____] $;",
      "un stagiaire, au taux horaire de [____] $.",
    ),
  ];

  if (estHoraire) {
    content.push(
      paragraph("Le temps consacré au dossier inclut notamment le temps nécessaire pour :"),
      bullet(
        "prendre connaissance des documents;",
        "les rencontres, en présentiel comme en virtuel;",
        "la recherche et la rédaction;",
        "les communications avec la partie adverse, le Client et tout autre intervenant.",
      ),
      paragraph("Les taux horaires peuvent être ajustés [____] années après la signature de cette Convention, notamment selon l'indexation à l'inflation. Le cas échéant, l'annexe budgétaire est révisée et signée de nouveau par les Parties."),
    );
  }

  content.push(
    paragraph(text("Frais de justice et autres dépenses. ", true), "En plus des honoraires, le Client rembourse l'Avocat pour les frais de justice et autres dépenses engagés dans le dossier (frais de greffe, signification, sténographe, expertise, etc.). Ces frais sont fixés par tarif ou règlement et révisés chaque année, donc hors du contrôle de l'Avocat."),
    paragraph(text("Expertises. ", true), "Si une expertise ou les services d'un autre professionnel sont nécessaires, l'Avocat soumet au Client le choix et l'évaluation des coûts pour obtenir son autorisation avant d'engager ce professionnel."),
    paragraph(text("Estimation des coûts. ", true), "L'Avocat évalue l'ensemble des coûts reliés aux Services à la somme de [____] $ avant taxes. Cette estimation est indicative, basée sur l'expérience de l'Avocat et la nature des Services; elle peut varier selon le déroulement du dossier. L'Avocat informe le Client de tout changement de circonstances susceptible de modifier significativement ce coût."),
    paragraph(text("Montant maximal à ne pas dépasser. ", true), "Le montant maximal que le Client est prêt à payer pour les Services est de [____] $. L'Avocat informe sans délai le Client lorsqu'il croit que les honoraires et frais excéderont cette somme."),

    heading(2, "3. Comment payer les services?"),
    paragraph(text("Avances en fidéicommis. ", true), avanceLine),
    paragraph("Au fur et à mesure de la progression du dossier, l'Avocat peut réclamer d'autres Avances en fidéicommis, payables dans les [____] jours suivant la demande. Ces avances sont déposées sans délai dans le compte en fidéicommis de l'Avocat, au nom du Client, et ne servent qu'à payer les factures et les frais du dossier. Tout montant restant après la dernière facture est remboursé au Client."),
    paragraph(text("Comptes d'honoraires. ", true), "L'Avocat s'engage à envoyer un compte d'honoraires détaillé [mensuel / bimestriel / à la fin des Services] indiquant le temps consacré à chaque tâche (date, intervenant, description, temps). Un compte d'honoraires est obligatoirement transmis au Client avant tout retrait d'avances en fidéicommis pour le paiement des Services rendus et des frais engagés."),
    paragraph(text("Modes de paiement. ", true), "Les paiements peuvent être effectués :"),
    bullet(
      "en argent comptant;",
      "par carte de débit ou de crédit;",
      "par virement bancaire / Interac, selon les instructions transmises;",
      `par chèque libellé au nom de « ${input.cabinetNom} ».`,
    ),
    paragraph(text("Intérêts. ", true), "Le Client paie tout compte d'honoraires dans les [____] jours suivant son envoi. Après ce délai, un taux d'intérêt de [____] % par année s'ajoute au solde dû."),

    heading(2, "4. Comment communiquer entre nous?"),
    paragraph("Les Parties peuvent communiquer par courriel, téléphone, message texte ou tout autre moyen convenu. Pour réduire les risques et protéger les renseignements personnels du Client, l'Avocat transmet les renseignements et documents sensibles au moyen d'une plateforme sécurisée; les autres communications (par exemple les courriels ordinaires) ne garantissent pas la même confidentialité."),

    heading(2, "5. Comment sont gérés les renseignements personnels?"),
    paragraph("L'Avocat recueille et traite les renseignements personnels du Client en conformité avec les lois sur la protection des renseignements personnels. Le contenu du dossier est conservé pendant 7 ans après la fin du mandat. Par la suite, seuls les renseignements nécessaires à la vérification des conflits d'intérêts sont conservés; les autres documents sont détruits. L'Avocat remet au Client les documents originaux de son dossier avant toute destruction."),

    heading(2, "6. Informer l'Avocat des changements"),
    paragraph("Le Client s'engage à informer l'Avocat sans délai de tout changement de ses coordonnées, de sa situation financière ou de tout autre changement significatif susceptible de modifier la Convention ou les Services. La Convention et l'annexe budgétaire peuvent alors être modifiées en conséquence."),

    heading(2, "7. Comment résoudre les différends liés à cette convention?"),
    paragraph("Le Barreau du Québec encadre la pratique des avocats afin de protéger le public. En cas de désaccord sur un compte d'honoraires, le Client peut demander la conciliation du compte auprès du Barreau du Québec dans les 45 jours de la réception du compte et, le cas échéant, l'arbitrage de compte, selon le Règlement sur la procédure de conciliation et d'arbitrage des comptes des avocats."),

    heading(2, "8. Qu'est-ce qu'un conflit d'intérêts?"),
    paragraph("L'Avocat et son cabinet doivent éviter de se placer en situation de conflit d'intérêts. Une telle situation survient lorsqu'il existe un risque sérieux que l'intérêt personnel de l'Avocat, ou ses devoirs envers un autre client, un ancien client ou une autre personne, nuisent à ses devoirs envers le Client."),

    heading(2, "9. Quand et comment mettre fin à la convention?"),
    paragraph("Le Client peut mettre fin à la Convention en tout temps; il reçoit alors un compte d'honoraires final."),
    paragraph("L'Avocat peut mettre fin à la Convention pour un motif sérieux, en transmettant au Client, le plus rapidement possible, un avis en indiquant la raison, notamment :"),
    bullet(
      "le lien de confiance entre l'Avocat et le Client est rompu;",
      "le Client a trompé l'Avocat, n'a pas collaboré ou a agi sans tenir compte de ses avis;",
      "le Client a refusé de payer une avance en fidéicommis ou un compte d'honoraires, après un préavis raisonnable;",
      "l'Avocat ou son cabinet se retrouve en situation de conflit d'intérêts;",
      "tout autre motif valable.",
    ),
    paragraph("L'Avocat ne peut mettre fin à la Convention à un moment inopportun, par exemple lorsque l'arrêt des Services causerait des retards importants ou un préjudice sérieux au Client."),

    heading(2, "10. À quel moment la convention commence-t-elle à s'appliquer?"),
    paragraph("Cette Convention s'applique [dès sa signature] OU [dès que les conditions suivantes sont remplies : ____]."),

    heading(2, "Signatures"),
    paragraph(`Fait à [Ville], le ${input.dateFormatee}.`),
    paragraph(),
    paragraph(text("L'Avocat", true)),
    paragraph("Signature : ______________________________"),
    paragraph(endSentence((input.avocatNom ? input.avocatNom + ", " : "") + input.cabinetNom)),
    paragraph(coordonnees([input.cabinetEmail, input.cabinetTelephone])),
    paragraph(),
    paragraph(text("Le Client", true)),
    paragraph("Signature : ______________________________"),
    paragraph(endSentence(input.clientNom)),
    paragraph(coordonnees([input.clientEmail])),
  );

  return JSON.stringify({ type: "doc", content });
}
