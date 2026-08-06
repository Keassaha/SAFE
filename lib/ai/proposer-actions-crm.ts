import Anthropic from "@anthropic-ai/sdk";

/**
 * Assistant de prospection — propose les prochaines tâches administratives sur
 * un cabinet prospect.
 *
 * Ce n'est pas un rédacteur de courriels ni un stratège. Il lit l'état réel d'un
 * lead (stage, contacts, historique, notes) et répond à une seule question :
 * « qu'est-ce qui devrait être fait sur ce dossier, concrètement, cette
 * semaine ». Les propositions deviennent des tâches réelles si vous les
 * acceptez, et alimentent alors la tour de contrôle.
 *
 * Garde-fous du même esprit que le reste des capacités IA du repo :
 *  - factuel, jamais d'invention sur le cabinet ;
 *  - administratif et commercial, jamais de conseil juridique ;
 *  - ton posé, jamais de pression ni d'argument de peur (règle de vente SAFE :
 *    on ne tient jamais tête à l'avocat) ;
 *  - les incertitudes sont dites, pas comblées ;
 *  - rien ne s'exécute tout seul, la validation humaine est obligatoire.
 */

export type EtatLeadPourIa = {
  raisonSociale: string;
  ville: string | null;
  province: string;
  tailleCabinet: string;
  domainesPratique: string[];
  logicielActuel: string | null;
  aTrustAccounting: boolean;
  stageLead: string;
  statutLead: string;
  score: number;
  sourceLead: string;
  joursDepuisDerniereActivite: number | null;
  notesPrivees: string | null;
  contacts: {
    prenom: string;
    nom: string;
    titre: string | null;
    role: string;
    estDecideur: boolean;
    estChampionInterne: boolean;
    aEmail: boolean;
    desabonne: boolean;
  }[];
  /** Les plus récentes d'abord. */
  activites: { type: string; direction: string; sujet: string | null; ilYaJours: number }[];
  tachesOuvertes: { titre: string; echeance: string | null }[];
};

export type PropositionAction = {
  /** Doit correspondre à l'enum TypeTaskCrm. */
  type: string;
  titre: string;
  /** Pourquoi celle-ci, en une phrase, appuyée sur les données fournies. */
  motif: string;
  /** Nombre de jours d'ici l'échéance suggérée. */
  dansJours: number;
  priorite: "HAUTE" | "NORMALE" | "BASSE";
  /** Identifiant de gabarit de courriel pertinent, si applicable. */
  gabaritSuggere: string | null;
};

export type AnalyseProspection = {
  lecture: string;
  propositions: PropositionAction[];
  incertitudes: string[];
};

const TYPES_TACHE = [
  "FOLLOW_UP_EMAIL",
  "APPEL",
  "LINKEDIN_DM",
  "ENVOYER_RESSOURCE",
  "RELANCER",
  "MEETING",
  "PREPARER_AUDIT",
  "REVISION_BUNDLE",
  "ACTIVATION_STEP",
];

const GABARITS_CONNUS = [
  "PREMIER_CONTACT",
  "INVITATION_AUDIT",
  "SUITE_AUDIT",
  "RELANCE_DOUCE",
  "PLACE_FONDATRICE",
  "SUIVI_CONSULTATION",
];

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

/** Nettoie ce que renvoie le modèle : on ne fait confiance à rien. */
function normaliserPropositions(v: unknown): PropositionAction[] {
  if (!Array.isArray(v)) return [];
  const out: PropositionAction[] = [];
  for (const brut of v.slice(0, 3)) {
    if (!brut || typeof brut !== "object") continue;
    const o = brut as Record<string, unknown>;
    const type = typeof o.type === "string" && TYPES_TACHE.includes(o.type) ? o.type : "RELANCER";
    const titre = typeof o.titre === "string" ? o.titre.trim() : "";
    if (titre.length < 3) continue;
    const dansJoursBrut = typeof o.dansJours === "number" ? Math.round(o.dansJours) : 2;
    const priorite =
      o.priorite === "HAUTE" || o.priorite === "BASSE" ? o.priorite : "NORMALE";
    const gabarit =
      typeof o.gabaritSuggere === "string" && GABARITS_CONNUS.includes(o.gabaritSuggere)
        ? o.gabaritSuggere
        : null;
    out.push({
      type,
      titre: titre.slice(0, 140),
      motif: typeof o.motif === "string" ? o.motif.trim().slice(0, 300) : "",
      dansJours: Math.min(30, Math.max(0, dansJoursBrut)),
      priorite,
      gabaritSuggere: gabarit,
    });
  }
  return out;
}

/**
 * Retourne `null` si la clé API est absente ou en cas d'échec : l'appelant
 * dégrade proprement, l'écran continue de fonctionner sans l'assistant.
 */
export async function proposerActionsCrm(
  etat: EtatLeadPourIa,
): Promise<AnalyseProspection | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY manquant — assistant de prospection désactivé");
    return null;
  }

  const client = new Anthropic({ apiKey });

  const bloc = (titre: string, lignes: string[]) =>
    lignes.length ? `${titre}\n${lignes.map((l) => `- ${l}`).join("\n")}` : "";

  const contexte = [
    `CABINET: ${etat.raisonSociale}`,
    `LOCALISATION: ${[etat.ville, etat.province].filter(Boolean).join(", ")}`,
    `TAILLE: ${etat.tailleCabinet}`,
    etat.domainesPratique.length ? `DOMAINES: ${etat.domainesPratique.join(", ")}` : "",
    etat.logicielActuel ? `LOGICIEL ACTUEL: ${etat.logicielActuel}` : "",
    `FIDÉICOMMIS: ${etat.aTrustAccounting ? "oui" : "non ou inconnu"}`,
    `ÉTAPE PIPELINE: ${etat.stageLead}`,
    `STATUT: ${etat.statutLead}`,
    `SCORE: ${etat.score}/100`,
    `SOURCE: ${etat.sourceLead}`,
    etat.joursDepuisDerniereActivite === null
      ? "DERNIÈRE ACTIVITÉ: aucune"
      : `DERNIÈRE ACTIVITÉ: il y a ${etat.joursDepuisDerniereActivite} jours`,
    bloc(
      "CONTACTS:",
      etat.contacts.map(
        (c) =>
          `${c.prenom} ${c.nom}${c.titre ? ` (${c.titre})` : ""} — ${c.role}` +
          `${c.estDecideur ? ", décideur" : ""}${c.estChampionInterne ? ", champion interne" : ""}` +
          `${c.aEmail ? "" : ", pas d'adresse courriel"}${c.desabonne ? ", DÉSABONNÉ" : ""}`,
      ),
    ),
    bloc(
      "HISTORIQUE (du plus récent au plus ancien):",
      etat.activites.map(
        (a) => `il y a ${a.ilYaJours} j — ${a.type} (${a.direction})${a.sujet ? ` : ${a.sujet}` : ""}`,
      ),
    ),
    bloc(
      "TÂCHES DÉJÀ OUVERTES:",
      etat.tachesOuvertes.map((t) => `${t.titre}${t.echeance ? ` (échéance ${t.echeance})` : ""}`),
    ),
    etat.notesPrivees ? `NOTES PRIVÉES:\n${etat.notesPrivees.slice(0, 1200)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Tu assistes le fondateur de SAFE Inc., un logiciel de gestion pour petits cabinets d'avocats au Québec et en Ontario. Il fait sa prospection lui-même. Tu l'aides à décider quoi faire, concrètement, sur un cabinet prospect donné.

RÈGLES STRICTES :
- Appuie-toi UNIQUEMENT sur les données ci-dessous. N'invente aucun fait sur le cabinet, aucune personne, aucun chiffre.
- Propose des tâches ADMINISTRATIVES et COMMERCIALES uniquement. Jamais de conseil juridique.
- Ton posé. Jamais de pression, jamais d'argument de peur, jamais de fausse urgence. Si le prospect n'a pas répondu, on n'insiste pas plus fort, on espace.
- Ne propose jamais d'écrire à un contact marqué DÉSABONNÉ.
- Ne propose pas une tâche qui existe déjà dans les tâches ouvertes.
- Maximum 3 propositions. Une seule si une seule s'impose. Zéro si la bonne décision est de ne rien faire maintenant, et dis-le alors dans la lecture.
- Si une information te manque pour bien juger, mets-la dans "incertitudes" au lieu de deviner.
- Écris en français, en vouvoyant. N'utilise jamais de tiret long en milieu de phrase.

TYPES DE TÂCHE AUTORISÉS : ${TYPES_TACHE.join(", ")}
GABARITS DE COURRIEL DISPONIBLES : ${GABARITS_CONNUS.join(", ")}

DONNÉES DU CABINET :
${contexte}

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "lecture": "deux ou trois phrases sur où en est ce dossier et ce qui le débloque",
  "propositions": [
    {
      "type": "un des types autorisés",
      "titre": "l'action à faire, à l'impératif, précise",
      "motif": "pourquoi celle-ci maintenant, appuyé sur les données",
      "dansJours": 2,
      "priorite": "HAUTE|NORMALE|BASSE",
      "gabaritSuggere": "un des gabarits ou null"
    }
  ],
  "incertitudes": ["ce que tu ne sais pas et qui changerait ta réponse"]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const texte = message.content[0]?.type === "text" ? message.content[0].text : "";
    const json = texte.match(/\{[\s\S]*\}/);
    if (!json) return null;

    const parsed = JSON.parse(json[0]) as Record<string, unknown>;
    return {
      lecture: typeof parsed.lecture === "string" ? parsed.lecture.trim() : "",
      propositions: normaliserPropositions(parsed.propositions),
      incertitudes: asStringArray(parsed.incertitudes),
    };
  } catch (err) {
    console.error("proposerActionsCrm error", err);
    return null;
  }
}
