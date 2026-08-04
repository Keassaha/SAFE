import { describe, expect, it } from "vitest";
import {
  DELIVERY_DECOUPLING_DATE,
  evaluateDelivery,
  findMissingDeclarationFields,
  getChannelInfo,
  getDeclarationRequirements,
  getDeliveryChannels,
  getSelectableDeliveryChannels,
  isDeliveryBeforeWithdrawal,
} from "../invoice-delivery";

/**
 * CH-13 — Transmission de la facture.
 *
 * Sources : B-1 r.5 art. 56(2) · By-Law 9 s. 9(1)3.
 *
 * Le mot du règlement est « envoyée » / « delivered », pas « préparée » ni « émise ».
 *
 * Le module doit tenir deux exigences contraires :
 *   - refuser un retrait appuyé sur une facture jamais transmise ;
 *   - ne PAS refuser à un cabinet qui poste ou remet ses factures, sous peine de
 *     produire du contournement, qui détruit la traçabilité qu'on protège.
 */

const QC = "QC" as const;
const ON = "ON" as const;

/* ════════════════════════════════════════════════════════════════
   Le refus
   ════════════════════════════════════════════════════════════════ */

describe("Facture non transmise", () => {
  it("refuse quand aucune transmission n'est consignée", () => {
    const v = evaluateDelivery({ province: QC, deliveredAt: null, deliveryChannel: null });
    expect(v.allowed).toBe(false);
    expect(v.reference).toBe("B-1 r.5, art. 56(2)");
  });

  it("cite le texte plutôt que d'affirmer une interdiction", () => {
    const v = evaluateDelivery({ province: QC, deliveredAt: null, deliveryChannel: null });
    expect(v.reasonFr).toContain("la facturation a été envoyée");
    expect(v.reasonFr).toContain("l'émettre ne suffit pas");
  });

  it("cite le texte ontarien pour un cabinet ontarien", () => {
    const v = evaluateDelivery({ province: ON, deliveredAt: null, deliveryChannel: null });
    expect(v.reference).toBe("By-Law 9, s. 9(1)3");
    expect(v.reasonFr).toContain("a billing has been delivered");
  });

  it("OUVRE UNE PORTE dans le refus, jamais un mur", () => {
    // Un garde-fou sans porte de sortie produit du contournement (PR-2).
    const v = evaluateDelivery({ province: QC, deliveredAt: null, deliveryChannel: null });
    expect(v.remedyFr).toContain("déclarez la transmission");
    expect(v.remedyFr).toMatch(/postée|main propre/);
  });

  it("refuse une date sans canal au lieu de supposer", () => {
    // Sinon n'importe quelle date écrite en base ouvrirait le retrait.
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-07-01"),
      deliveryChannel: null,
    });
    expect(v.allowed).toBe(false);
    expect(v.reasonFr).toContain("canal est inconnu");
  });

  it("refuse un canal inventé", () => {
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-07-01"),
      deliveryChannel: "TELEPATHIE",
    });
    expect(v.allowed).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Prouvé contre déclaré
   ════════════════════════════════════════════════════════════════ */

describe("Preuve et déclaration sont distinguées", () => {
  it("l'envoi depuis SAFE est le SEUL canal prouvé", () => {
    const prouves = getDeliveryChannels().filter((c) => c.proven).map((c) => c.channel);
    expect(prouves).toEqual(["EMAIL_SAFE"]);
  });

  it("un envoi SAFE passe sans signalement", () => {
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-07-01"),
      deliveryChannel: "EMAIL_SAFE",
    });
    expect(v.allowed).toBe(true);
    expect(v.proven).toBe(true);
    expect(v.flagFr).toBeNull();
  });

  it("une transmission déclarée PASSE, et elle est signalée", () => {
    // Refuser serait du sur-blocage : poster une facture, c'est l'envoyer.
    for (const canal of ["POSTE", "MAIN_PROPRE", "AUTRE_COURRIEL", "PORTAIL_CLIENT"]) {
      const v = evaluateDelivery({
        province: QC,
        deliveredAt: new Date("2026-07-01"),
        deliveryChannel: canal,
      });
      expect(v.allowed, canal).toBe(true);
      expect(v.proven, canal).toBe(false);
      expect(v.flagFr, canal).toContain("DÉCLARÉE");
    }
  });

  it("ne maquille jamais une déclaration en preuve", () => {
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-07-01"),
      deliveryChannel: "POSTE",
    });
    expect(v.flagFr).toContain("non prouvée par SAFE");
  });
});

/* ════════════════════════════════════════════════════════════════
   L'héritage
   ════════════════════════════════════════════════════════════════ */

describe("Factures antérieures au découplage", () => {
  it("laisse passer une transmission présumée", () => {
    // Bloquer rétroactivement empêcherait un cabinet de retirer sur des factures
    // réellement transmises, sur la seule base d'un défaut logiciel qui n'est pas
    // le sien.
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-05-12"),
      deliveryChannel: "LEGACY_PRESUME",
    });
    expect(v.allowed).toBe(true);
  });

  it("DIT que la transmission est présumée, pas prouvée", () => {
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-05-12"),
      deliveryChannel: "LEGACY_PRESUME",
    });
    expect(v.proven).toBe(false);
    expect(v.flagFr).toContain("PRÉSUMÉE");
    expect(v.flagFr).toContain("Aucune preuve d'envoi");
  });

  it("porte la date de bascule dans le signalement", () => {
    const v = evaluateDelivery({
      province: QC,
      deliveredAt: new Date("2026-05-12"),
      deliveryChannel: "LEGACY_PRESUME",
    });
    expect(v.flagFr).toContain(DELIVERY_DECOUPLING_DATE);
  });
});

/* ════════════════════════════════════════════════════════════════
   La déclaration manuelle
   ════════════════════════════════════════════════════════════════ */

describe("Déclaration de transmission", () => {
  it("n'exige que la date et le canal", () => {
    // Exiger une pièce jointe transformerait la porte de sortie en second mur.
    const manquants = findMissingDeclarationFields({});
    expect(manquants).toEqual(["deliveredAt", "deliveryChannel"]);
  });

  it("accepte une déclaration complète", () => {
    expect(
      findMissingDeclarationFields({
        deliveredAt: new Date("2026-07-01"),
        deliveryChannel: "POSTE",
      }),
    ).toEqual([]);
  });

  it("INTERDIT de s'attribuer un envoi SAFE à la main", () => {
    // Sinon n'importe qui pourrait se donner la preuve d'un envoi qui n'a pas eu lieu.
    expect(
      findMissingDeclarationFields({
        deliveredAt: new Date("2026-07-01"),
        deliveryChannel: "EMAIL_SAFE",
      }),
    ).toContain("deliveryChannel");
  });

  it("interdit de se déclarer soi-même en transmission présumée", () => {
    expect(
      findMissingDeclarationFields({
        deliveredAt: new Date("2026-07-01"),
        deliveryChannel: "LEGACY_PRESUME",
      }),
    ).toContain("deliveryChannel");
  });

  it("n'offre au choix que les canaux réellement déclarables", () => {
    const choisissables = getSelectableDeliveryChannels().map((c) => c.channel);
    expect(choisissables).not.toContain("EMAIL_SAFE");
    expect(choisissables).not.toContain("LEGACY_PRESUME");
    expect(choisissables).toContain("POSTE");
  });

  it("explique pourquoi chaque champ est demandé", () => {
    for (const r of getDeclarationRequirements()) {
      expect(r.whyFr.length, r.field).toBeGreaterThan(20);
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   La chronologie
   ════════════════════════════════════════════════════════════════ */

describe("Chronologie", () => {
  it("refuse une transmission postérieure au retrait", () => {
    // Sans ce contrôle, on retire aujourd'hui et on déclare demain avoir transmis
    // la semaine dernière.
    expect(
      isDeliveryBeforeWithdrawal({
        deliveredAt: new Date("2026-07-10"),
        withdrawalDate: new Date("2026-07-05"),
      }),
    ).toBe(false);
  });

  it("accepte une transmission le jour même du retrait", () => {
    const d = new Date("2026-07-05T09:00:00Z");
    expect(
      isDeliveryBeforeWithdrawal({ deliveredAt: d, withdrawalDate: d }),
    ).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════
   Invariants
   ════════════════════════════════════════════════════════════════ */

describe("Invariants du catalogue", () => {
  it("chaque canal porte une note qui dit quoi conserver", () => {
    for (const c of getDeliveryChannels()) {
      expect(c.noteFr.length, c.channel).toBeGreaterThan(20);
    }
  });

  it("un canal prouvé n'est jamais déclarable à la main", () => {
    for (const c of getDeliveryChannels()) {
      if (c.proven) expect(c.selectable, c.channel).toBe(false);
    }
  });

  it("retrouve un canal par son identifiant", () => {
    expect(getChannelInfo("POSTE")?.labelFr).toBe("Postée au client");
    expect(getChannelInfo("INEXISTANT")).toBeNull();
    expect(getChannelInfo(null)).toBeNull();
  });
});
