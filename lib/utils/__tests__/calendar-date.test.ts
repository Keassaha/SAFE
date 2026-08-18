/**
 * Le décalage d'un jour au journal.
 *
 * Défaut observé le 2026-08-17 : écriture saisie le 17, affichée le 16. La valeur
 * en base était juste (`2026-08-17T00:00:00Z`), c'est la LECTURE qui était locale
 * et tombait la veille à 20 h côté Montréal.
 *
 * Ces tests fixent le contrat des deux côtés : ce qu'on écrit et ce qu'on relit.
 */

import { describe, it, expect } from "vitest";
import { toCalendarDayUTC, toIsoDay, CABINET_TIME_ZONE } from "../calendar-date";
import { formatCalendarDate, formatDate } from "../format";

describe("toIsoDay", () => {
  it("rend le jour stocké, pas la veille", () => {
    // Exactement ce que `z.coerce.date()` produit sur la saisie "2026-08-17".
    expect(toIsoDay(new Date("2026-08-17"))).toBe("2026-08-17");
  });

  it("ne dépend pas du fuseau du serveur", () => {
    // Le même instant lu depuis n'importe où doit donner le même jour : c'est ce
    // qui protège l'export QuickBooks/Xero/Sage d'une écriture datée d'un autre
    // jour, donc parfois d'une autre période de TPS/TVQ.
    expect(toIsoDay(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
    expect(toIsoDay(new Date("2026-12-31T00:00:00Z"))).toBe("2026-12-31");
  });
});

describe("toCalendarDayUTC", () => {
  it("ramène un instant de soirée au jour vécu, pas au lendemain", () => {
    // 21 h le 17 à Montréal = 01 h le 18 en UTC. L'écriture doit porter le 17 :
    // c'est le jour de l'avocate, pas celui du serveur.
    const soiree = new Date("2026-08-18T01:00:00Z");
    expect(toIsoDay(toCalendarDayUTC(soiree))).toBe("2026-08-17");
  });

  it("ramène un instant de matinée au même jour", () => {
    const matin = new Date("2026-08-17T13:00:00Z"); // 9 h à Montréal
    expect(toIsoDay(toCalendarDayUTC(matin))).toBe("2026-08-17");
  });

  it("produit toujours minuit UTC pile", () => {
    const d = toCalendarDayUTC(new Date("2026-08-17T18:42:13.512Z"));
    expect(d.toISOString()).toBe("2026-08-17T00:00:00.000Z");
  });

  it("tient au passage à l'heure d'hiver", () => {
    // 2026-11-01 02 h UTC = 2026-10-31 22 h à Montréal (EDT, UTC-4).
    expect(toIsoDay(toCalendarDayUTC(new Date("2026-11-01T02:00:00Z")))).toBe("2026-10-31");
    // 2026-11-02 02 h UTC = 2026-11-01 21 h à Montréal (EST, UTC-5).
    expect(toIsoDay(toCalendarDayUTC(new Date("2026-11-02T02:00:00Z")))).toBe("2026-11-01");
  });

  it("accepte un fuseau explicite, pour le jour où un cabinet sortira de l'Est", () => {
    const instant = new Date("2026-08-18T01:00:00Z");
    expect(toIsoDay(toCalendarDayUTC(instant, "UTC"))).toBe("2026-08-18");
    expect(toIsoDay(toCalendarDayUTC(instant, CABINET_TIME_ZONE))).toBe("2026-08-17");
  });

  it("est idempotent : un jour déjà normalisé ne bouge plus", () => {
    const once = toCalendarDayUTC(new Date("2026-08-17T22:00:00Z"));
    expect(toCalendarDayUTC(once).toISOString()).toBe(once.toISOString());
  });
});

describe("formatCalendarDate", () => {
  it("affiche le jour saisi — le défaut d'origine", () => {
    expect(formatCalendarDate(new Date("2026-08-17"), "fr")).toBe("2026-08-17");
  });

  it("reste juste quand formatDate se trompe", () => {
    // Garde-fou de non-régression : si un jour `formatDate` devenait UTC, cette
    // assertion tomberait et forcerait à relire les 84 fichiers qui l'utilisent
    // pour de vrais horodatages.
    const jour = new Date("2026-08-17");
    expect(formatCalendarDate(jour, "fr")).toBe("2026-08-17");
    expect(formatDate(jour, "fr")).toBe("2026-08-16");
  });
});
