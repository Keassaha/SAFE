/**
 * Autres biens en fidéicommis — les biens qui ne sont pas de l'argent.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 1(3), 43 à 46 (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, s. 18(9), 23(2) (PDF officiel, version du 2017-04-27)
 *
 * Ce que couvre l'obligation, concrètement : titres, actions, testaments originaux,
 * actes notariés, clés, bijoux détenus en garantie, chèques certifiés non déposés.
 * L'art. 1(3) définit l'« autre bien en fidéicommis » comme « tout bien, autre qu'une
 * somme d'argent, reçu par un avocat pour être affecté suivant les instructions du
 * client ou d'une autre personne ».
 *
 * Les deux régimes n'exigent PAS la même chose, et l'écart est net :
 *
 *   Ontario ajoute       la VALEUR du bien, et la personne qui le détenait
 *                        IMMÉDIATEMENT AVANT (s. 18(9))
 *   Québec ajoute        le lieu de garde et ses changements (art. 45),
 *                        l'affectation (art. 46), et l'information du client
 *                        quand le bien vient d'un tiers (art. 44)
 *
 * Aplatir les deux produirait soit un registre incomplet, soit des champs inventés.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   CHAMPS DU REGISTRE — art. 43 QC / s. 18(9) ON
   ════════════════════════════════════════════════════════════════ */

export interface TrustPropertyField {
  key: string;
  labelFr: string;
  labelEn: string;
  reference: string;
  required: boolean;
  /** Exigé seulement au moment de la remise du bien. */
  onRelease?: boolean;
}

/**
 * Champs exigés du registre des autres biens.
 *
 * Art. 43 : « L'avocat doit, dès réception ou remise d'un autre bien en fidéicommis,
 * inscrire dans un registre permanent une description du bien y compris le numéro
 * d'identification s'il y a lieu, la date à laquelle l'avocat en a pris possession,
 * le nom du client pour lequel le bien est détenu, la date à laquelle l'avocat le
 * remet et le nom de la personne à qui il le remet. »
 *
 * s. 18(9) : « A record showing all property, other than money, held in trust for
 * clients, and describing each property and identifying the date on which the
 * licensee took possession of each property, **the person who had possession of each
 * property immediately before the licensee took possession**, **the value of each
 * property**, the client for whom each property is held in trust, the date on which
 * possession of each property is given away and the person to whom possession of each
 * property is given. »
 */
export function getTrustPropertyFields(province: CabinetProvince): TrustPropertyField[] {
  const qc = province === "QC";
  const reference = qc ? "B-1 r.5, art. 43" : "By-Law 9, s. 18(9)";

  const fields: TrustPropertyField[] = [
    {
      key: "description",
      labelFr: "Description du bien",
      labelEn: "Description of the property",
      reference,
      required: true,
    },
    {
      key: "identificationNumber",
      labelFr: "Numéro d'identification, s'il y a lieu",
      labelEn: "Identification number, if any",
      // « s'il y a lieu » : le texte le conditionne expressément. L'exiger toujours
      // bloquerait l'inscription d'un bien qui n'en porte pas.
      reference: qc ? "B-1 r.5, art. 43" : "By-Law 9, s. 18(9)",
      required: false,
    },
    {
      key: "receivedAt",
      labelFr: "Date de prise de possession",
      labelEn: "Date the licensee took possession",
      reference,
      required: true,
    },
    {
      key: "clientId",
      labelFr: "Client pour lequel le bien est détenu",
      labelEn: "Client for whom the property is held in trust",
      reference,
      required: true,
    },
    {
      key: "releasedAt",
      labelFr: "Date de remise du bien",
      labelEn: "Date possession is given away",
      reference,
      required: true,
      onRelease: true,
    },
    {
      key: "releasedToName",
      labelFr: "Nom de la personne à qui le bien est remis",
      labelEn: "Person to whom possession is given",
      reference,
      required: true,
      onRelease: true,
    },
  ];

  if (!qc) {
    // Deux champs que le Québec n'exige PAS. Les imposer là-bas ajouterait au
    // règlement ; les omettre ici trouerait le registre ontarien.
    fields.push(
      {
        key: "receivedFromName",
        labelFr: "Personne qui détenait le bien immédiatement avant",
        labelEn: "Person who had possession immediately before the licensee",
        reference: "By-Law 9, s. 18(9)",
        required: true,
      },
      {
        key: "estimatedValue",
        labelFr: "Valeur du bien",
        labelEn: "Value of the property",
        reference: "By-Law 9, s. 18(9)",
        required: true,
      },
    );
  } else {
    // Trois obligations propres au Québec, aux art. 44 à 46.
    fields.push(
      {
        key: "storageLocation",
        labelFr: "Lieu où le bien meuble est gardé",
        labelEn: "Location where the property is kept",
        reference: "B-1 r.5, art. 45",
        required: true,
      },
      {
        key: "purpose",
        labelFr: "Affectation du bien",
        labelEn: "Purpose for which the property is held",
        reference: "B-1 r.5, art. 46",
        required: true,
      },
    );
  }

  return fields;
}

export interface TrustPropertySnapshot {
  description?: string | null;
  identificationNumber?: string | null;
  receivedAt?: Date | null;
  clientId?: string | null;
  receivedFromName?: string | null;
  estimatedValue?: number | null;
  storageLocation?: string | null;
  purpose?: string | null;
  releasedAt?: Date | null;
  releasedToName?: string | null;
}

/**
 * Champs manquants sur une inscription.
 *
 * Les champs de remise ne sont évalués que si le bien est effectivement remis : un
 * bien encore détenu n'a pas de date de remise, et l'exiger bloquerait son
 * inscription au moment où le registre en a le plus besoin.
 */
export function findMissingPropertyFields(
  property: TrustPropertySnapshot,
  province: CabinetProvince,
  options: { released?: boolean } = {},
): TrustPropertyField[] {
  const released = options.released ?? Boolean(property.releasedAt || property.releasedToName);

  return getTrustPropertyFields(province).filter((f) => {
    if (!f.required) return false;
    if (f.onRelease && !released) return false;

    const value = property[f.key as keyof TrustPropertySnapshot];
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return !value.trim();
    if (typeof value === "number") return false;
    return false;
  });
}

/* ════════════════════════════════════════════════════════════════
   INFORMATION DU CLIENT — art. 44 et 45 QC
   ════════════════════════════════════════════════════════════════ */

export interface ClientNoticeDuty {
  code: "THIRD_PARTY_RECEIPT" | "STORAGE_LOCATION" | "STORAGE_LOCATION_CHANGE";
  labelFr: string;
  reference: string;
  /** L'obligation est-elle satisfaite ? */
  done: boolean;
}

/**
 * Obligations d'information du client.
 *
 * Art. 44 : « L'avocat doit informer SANS DÉLAI le client concerné lorsque la
 * personne qui lui confie un autre bien en fidéicommis n'est pas ce client. »
 * Art. 45 : « L'avocat doit aviser le client du lieu où est gardé un bien meuble qui
 * lui est confié en fidéicommis ET DE TOUT CHANGEMENT D'EMPLACEMENT SUBSÉQUENT. »
 *
 * **By-Law 9 n'impose aucune de ces deux notifications.** La s. 18(9) exige un
 * registre, pas une information du client. La liste est donc vide en Ontario, plutôt
 * que remplie d'obligations inventées.
 */
export function getClientNoticeDuties(params: {
  province: CabinetProvince;
  fromThirdParty: boolean;
  clientNotifiedAt: Date | null | undefined;
  storageLocation: string | null | undefined;
  storageNotifiedAt: Date | null | undefined;
  storageChangedSinceNotice: boolean;
}): ClientNoticeDuty[] {
  if (params.province !== "QC") return [];

  const duties: ClientNoticeDuty[] = [];

  if (params.fromThirdParty) {
    duties.push({
      code: "THIRD_PARTY_RECEIPT",
      labelFr:
        "Informer sans délai le client que le bien lui a été confié par une autre personne",
      reference: "B-1 r.5, art. 44",
      done: Boolean(params.clientNotifiedAt),
    });
  }

  if (params.storageLocation) {
    duties.push({
      code: "STORAGE_LOCATION",
      labelFr: "Aviser le client du lieu où le bien est gardé",
      reference: "B-1 r.5, art. 45",
      done: Boolean(params.storageNotifiedAt),
    });

    if (params.storageChangedSinceNotice) {
      duties.push({
        code: "STORAGE_LOCATION_CHANGE",
        labelFr: "Aviser le client du changement d'emplacement du bien",
        reference: "B-1 r.5, art. 45",
        done: false,
      });
    }
  }

  return duties;
}

/* ════════════════════════════════════════════════════════════════
   CONSERVATION — art. 31-32 QC / s. 23(2) ON
   ════════════════════════════════════════════════════════════════ */

export interface PropertyRetentionRule {
  years: number;
  anchor: "FILE_CLOSURE" | "FISCAL_YEAR_END";
  reference: string;
  noteFr: string;
}

/**
 * Durée de conservation du registre des autres biens.
 *
 * Québec : l'art. 31 impose 7 ans « à partir de la fermeture du dossier » pour tous
 * les journaux et registres, à l'exception du registre des rapports mensuels. Le
 * registre des autres biens en fait partie.
 *
 * Ontario : la s. 23(2) impose **10 ans** précédant la dernière fin d'exercice pour
 * les registres des paragraphes 1, 2, 3, 8, **9**, 10 et 11 de la s. 18. Le registre
 * des biens est le paragraphe 9 : il relève donc des dix ans, pas des six.
 *
 * Les deux points de départ diffèrent : fermeture du dossier au Québec, fin
 * d'exercice en Ontario. Une purge qui confondrait les deux détruirait des registres
 * encore exigibles.
 */
export function getPropertyRetentionRule(province: CabinetProvince): PropertyRetentionRule {
  if (province === "QC") {
    return {
      years: 7,
      anchor: "FILE_CLOSURE",
      reference: "B-1 r.5, art. 31",
      noteFr: "Sept ans à compter de la FERMETURE DU DOSSIER.",
    };
  }
  return {
    years: 10,
    anchor: "FISCAL_YEAR_END",
    reference: "By-Law 9, s. 23(2)",
    noteFr:
      "Dix ans précédant la dernière fin d'exercice. Le registre des biens est le paragraphe 9 de la s. 18, visé par la s. 23(2) et non par les six ans de la s. 23(1).",
  };
}

/* ════════════════════════════════════════════════════════════════
   FERMETURE DE DOSSIER
   ════════════════════════════════════════════════════════════════ */

export interface PropertyClosureBlocker {
  code: "PROPERTY_STILL_HELD";
  messageFr: string;
  reference: string;
  remedyFr: string;
  count: number;
}

/**
 * Un dossier peut-il être fermé alors que des biens y sont encore détenus ?
 *
 * Aucun article ne l'interdit expressément. Mais l'art. 46 impose que le bien soit
 * « utilisé selon son affectation », et l'art. 18 al. 3 fait courir la conservation
 * à compter de la fermeture : fermer un dossier en gardant le bien fait perdre la
 * trace de ce qui reste à rendre.
 *
 * On SIGNALE donc, sans bloquer (PR-8) : c'est une alerte de gestion, pas une
 * interdiction réglementaire, et la présenter comme telle serait inventer une règle.
 */
export function checkPropertiesBeforeClosure(params: {
  province: CabinetProvince;
  heldPropertyCount: number;
}): PropertyClosureBlocker | null {
  if (params.heldPropertyCount === 0) return null;
  return {
    code: "PROPERTY_STILL_HELD",
    messageFr: `${params.heldPropertyCount} bien(s) en fidéicommis sont encore détenus pour ce dossier.`,
    reference: params.province === "QC" ? "B-1 r.5, art. 43, 46" : "By-Law 9, s. 18(9)",
    remedyFr:
      "Remettez les biens et inscrivez la remise au registre, ou fermez le dossier en connaissance de cause. Aucun article n'interdit la fermeture, mais le registre doit rester exact.",
    count: params.heldPropertyCount,
  };
}
