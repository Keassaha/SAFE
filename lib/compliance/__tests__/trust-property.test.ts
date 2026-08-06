import { describe, expect, it } from "vitest";
import {
  checkPropertiesBeforeClosure,
  findMissingPropertyFields,
  getClientNoticeDuties,
  getPropertyRetentionRule,
  getTrustPropertyFields,
} from "../trust-property";

/**
 * CH-08 — Autres biens en fidéicommis.
 *
 * Ferme QC-29 à QC-32 et ON-32 de l'audit.
 *
 * Sources : B-1 r.5 art. 1(3), 31, 43 à 46 · By-Law 9 s. 18(9), 23(2).
 *
 * L'écart entre les deux régimes est net et ne doit pas être aplati :
 *   Ontario ajoute la VALEUR et le détenteur PRÉCÉDENT ;
 *   Québec ajoute le LIEU DE GARDE, l'AFFECTATION et l'information du client.
 */

/* ════════════════════════════════════════════════════════════════
   Champs du registre
   ════════════════════════════════════════════════════════════════ */

describe("Champs du registre des autres biens", () => {
  it("porte au Québec les cinq mentions de l'art. 43, plus lieu et affectation", () => {
    const keys = getTrustPropertyFields("QC").map((f) => f.key);
    expect(keys).toEqual([
      "description",
      "identificationNumber",
      "receivedAt",
      "clientId",
      "releasedAt",
      "releasedToName",
      "storageLocation",
      "purpose",
    ]);
  });

  it("ajoute en Ontario la valeur et le détenteur précédent (s. 18(9))", () => {
    const keys = getTrustPropertyFields("ON").map((f) => f.key);
    expect(keys).toContain("estimatedValue");
    expect(keys).toContain("receivedFromName");
  });

  it("N'EXIGE PAS la valeur au Québec, où l'art. 43 ne la mentionne pas", () => {
    // L'imposer ici ajouterait au règlement.
    expect(getTrustPropertyFields("QC").map((f) => f.key)).not.toContain("estimatedValue");
  });

  it("N'EXIGE PAS le lieu de garde en Ontario, où la s. 18(9) ne le mentionne pas", () => {
    const keys = getTrustPropertyFields("ON").map((f) => f.key);
    expect(keys).not.toContain("storageLocation");
    expect(keys).not.toContain("purpose");
  });

  it("laisse le numéro d'identification facultatif : le texte dit « s'il y a lieu »", () => {
    // L'exiger toujours bloquerait l'inscription d'un bien qui n'en porte pas.
    const id = getTrustPropertyFields("QC").find((f) => f.key === "identificationNumber")!;
    expect(id.required).toBe(false);
  });

  it("cite l'article de chaque champ", () => {
    const qc = getTrustPropertyFields("QC");
    expect(qc.find((f) => f.key === "storageLocation")!.reference).toBe("B-1 r.5, art. 45");
    expect(qc.find((f) => f.key === "purpose")!.reference).toBe("B-1 r.5, art. 46");
    expect(getTrustPropertyFields("ON")[0]!.reference).toBe("By-Law 9, s. 18(9)");
  });
});

/* ════════════════════════════════════════════════════════════════
   Détection des manques
   ════════════════════════════════════════════════════════════════ */

describe("Champs manquants", () => {
  const held = {
    description: "Testament original de M. Tremblay",
    receivedAt: new Date("2026-06-01T00:00:00Z"),
    clientId: "client-1",
    storageLocation: "Coffre du bureau",
    purpose: "Conservation jusqu'au décès",
  };

  it("ne réclame rien sur un bien détenu correctement inscrit", () => {
    expect(findMissingPropertyFields(held, "QC")).toHaveLength(0);
  });

  it("N'EXIGE PAS la date de remise tant que le bien est détenu", () => {
    // Un bien encore détenu n'a pas de date de remise. L'exiger bloquerait son
    // inscription au moment où le registre en a le plus besoin.
    const missing = findMissingPropertyFields(held, "QC").map((f) => f.key);
    expect(missing).not.toContain("releasedAt");
    expect(missing).not.toContain("releasedToName");
  });

  it("exige le destinataire dès que la remise est amorcée", () => {
    const missing = findMissingPropertyFields(
      { ...held, releasedAt: new Date("2026-07-01T00:00:00Z") },
      "QC",
    ).map((f) => f.key);
    expect(missing).toContain("releasedToName");
  });

  it("signale la valeur manquante en Ontario, et pas au Québec", () => {
    const base = {
      description: "Certificat d'actions",
      receivedAt: new Date("2026-06-01T00:00:00Z"),
      clientId: "client-1",
      receivedFromName: "Courtier X",
    };
    expect(findMissingPropertyFields(base, "ON").map((f) => f.key)).toContain("estimatedValue");
    expect(findMissingPropertyFields({ ...held }, "QC").map((f) => f.key)).not.toContain(
      "estimatedValue",
    );
  });

  it("traite une chaîne d'espaces comme absente", () => {
    const missing = findMissingPropertyFields({ ...held, description: "   " }, "QC");
    expect(missing.map((f) => f.key)).toContain("description");
  });

  it("accepte une valeur de zéro en Ontario", () => {
    // Un bien sans valeur marchande reste un bien : zéro est une valeur renseignée,
    // pas une absence.
    const missing = findMissingPropertyFields(
      {
        description: "Clé de coffre",
        receivedAt: new Date("2026-06-01T00:00:00Z"),
        clientId: "client-1",
        receivedFromName: "Client",
        estimatedValue: 0,
      },
      "ON",
    );
    expect(missing.map((f) => f.key)).not.toContain("estimatedValue");
  });
});

/* ════════════════════════════════════════════════════════════════
   Information du client — art. 44 et 45
   ════════════════════════════════════════════════════════════════ */

describe("Information du client", () => {
  const base = {
    province: "QC" as const,
    fromThirdParty: false,
    clientNotifiedAt: null,
    storageLocation: "Coffre du bureau",
    storageNotifiedAt: null,
    storageChangedSinceNotice: false,
  };

  it("exige d'informer le client quand le bien vient d'un tiers (art. 44)", () => {
    const d = getClientNoticeDuties({ ...base, fromThirdParty: true });
    const duty = d.find((x) => x.code === "THIRD_PARTY_RECEIPT")!;
    expect(duty.reference).toBe("B-1 r.5, art. 44");
    expect(duty.done).toBe(false);
  });

  it("marque l'obligation faite quand la notification est datée", () => {
    const d = getClientNoticeDuties({
      ...base,
      fromThirdParty: true,
      clientNotifiedAt: new Date("2026-06-02T00:00:00Z"),
    });
    expect(d.find((x) => x.code === "THIRD_PARTY_RECEIPT")!.done).toBe(true);
  });

  it("exige d'aviser le client du lieu de garde (art. 45)", () => {
    const d = getClientNoticeDuties(base);
    expect(d.map((x) => x.code)).toContain("STORAGE_LOCATION");
  });

  it("rouvre l'obligation à chaque CHANGEMENT d'emplacement", () => {
    // L'art. 45 vise « tout changement d'emplacement subséquent ». Une notification
    // initiale ne couvre pas les déplacements ultérieurs.
    const d = getClientNoticeDuties({
      ...base,
      storageNotifiedAt: new Date("2026-06-02T00:00:00Z"),
      storageChangedSinceNotice: true,
    });
    const change = d.find((x) => x.code === "STORAGE_LOCATION_CHANGE")!;
    expect(change.done).toBe(false);
    expect(change.reference).toBe("B-1 r.5, art. 45");
  });

  it("N'IMPOSE AUCUNE notification en Ontario", () => {
    // La s. 18(9) exige un registre, pas une information du client. En inventer une
    // serait aussi grave que d'en omettre une.
    expect(
      getClientNoticeDuties({ ...base, province: "ON", fromThirdParty: true }),
    ).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Conservation — art. 31 QC / s. 23(2) ON
   ════════════════════════════════════════════════════════════════ */

describe("Conservation du registre des biens", () => {
  it("Québec : 7 ans à compter de la FERMETURE DU DOSSIER", () => {
    const r = getPropertyRetentionRule("QC");
    expect(r.years).toBe(7);
    expect(r.anchor).toBe("FILE_CLOSURE");
    expect(r.reference).toBe("B-1 r.5, art. 31");
  });

  it("Ontario : 10 ans, et non 6 — le registre des biens est le par. 9", () => {
    // La s. 23(2) vise les paragraphes 1, 2, 3, 8, 9, 10 et 11 de la s. 18. Le
    // registre des biens en fait partie : il relève des dix ans, pas des six de la
    // s. 23(1). Purger à six ans détruirait un registre encore exigible.
    const r = getPropertyRetentionRule("ON");
    expect(r.years).toBe(10);
    expect(r.anchor).toBe("FISCAL_YEAR_END");
    expect(r.reference).toBe("By-Law 9, s. 23(2)");
  });

  it("les deux points de départ diffèrent, et le disent", () => {
    expect(getPropertyRetentionRule("QC").anchor).not.toBe(
      getPropertyRetentionRule("ON").anchor,
    );
  });
});

/* ════════════════════════════════════════════════════════════════
   Fermeture de dossier
   ════════════════════════════════════════════════════════════════ */

describe("Fermeture d'un dossier détenant des biens", () => {
  it("ne signale rien quand aucun bien n'est détenu", () => {
    expect(checkPropertiesBeforeClosure({ province: "QC", heldPropertyCount: 0 })).toBeNull();
  });

  it("SIGNALE les biens encore détenus, sans prétendre à une interdiction", () => {
    // Aucun article n'interdit la fermeture. Présenter l'alerte comme un blocage
    // réglementaire inventerait une règle.
    const b = checkPropertiesBeforeClosure({ province: "QC", heldPropertyCount: 2 })!;
    expect(b.count).toBe(2);
    expect(b.remedyFr).toContain("Aucun article n'interdit la fermeture");
  });

  it("cite l'article de la province", () => {
    expect(checkPropertiesBeforeClosure({ province: "ON", heldPropertyCount: 1 })!.reference).toBe(
      "By-Law 9, s. 18(9)",
    );
  });
});
