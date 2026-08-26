import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Un même montant ne doit jamais s'écrire de deux manières.
 *
 * Le repli des formateurs lit `document.documentElement.lang`, juste dans un
 * navigateur mais absent au rendu serveur : tout ce que le serveur écrivait
 * tombait en français, quelle que soit la langue du cabinet. Un cabinet en
 * anglais recevait « 1 234,56 $ » du serveur, puis « $1,234.56 » après
 * hydratation.
 *
 * Depuis, un composant serveur prend `getFormatteurs()` et un composant client
 * `useFormatteurs()`. Les deux lient la locale de la requête. Ce fichier
 * éprouve le contrat qu'ils partagent.
 */
const langue = vi.hoisted(() => ({ courante: "fr" as "fr" | "en" }));
vi.mock("next-intl/server", () => ({
  getLocale: async () => langue.courante,
}));

const { formatCurrency, formatCalendarDate } = await import("@/lib/utils/format");
const { getFormatteurs } = await import("@/lib/i18n/formatteurs-serveur");

beforeEach(() => {
  langue.courante = "fr";
});

/** fr-CA groupe avec une espace insécable étroite (U+202F) et en pose une avant le « $ ». */
const espaces = (s: string) => s.replace(/[\u00a0\u202f\u2009]/g, " ");
describe("formateurs liés à la locale", () => {
  it("écrit un montant en anglais pour un cabinet en anglais", async () => {
    langue.courante = "en";
    const { formatCurrency: montant } = await getFormatteurs();
    // Avant correctif, côté serveur : « 1 234,56 $ », quelle que soit la langue.
    expect(montant(1234.56)).toBe("$1,234.56");
    expect(montant(-980)).toBe("-$980.00");
  });

  it("écrit un montant en français pour un cabinet en français", async () => {
    const { formatCurrency: montant } = await getFormatteurs();
    expect(espaces(montant(1234.56))).toBe("1 234,56 $");
    expect(espaces(montant(-980))).toBe("-980,00 $");
  });

  it("expose la locale, pour un Intl monté à la main dans l'écran", async () => {
    langue.courante = "en";
    expect((await getFormatteurs()).locale).toBe("en");
  });

  it("laisse un appelant imposer sa locale, dernier argument compris", async () => {
    langue.courante = "en";
    const { formatCurrency: montant } = await getFormatteurs();
    expect(espaces(montant(1234.56, "CAD", "fr"))).toBe("1 234,56 $");
  });

  it("les deux écritures d'un même montant diffèrent bel et bien", () => {
    expect(formatCurrency(1234.56, "CAD", "en")).not.toBe(
      formatCurrency(1234.56, "CAD", "fr"),
    );
  });

  it("garde la date calendaire à minuit UTC, sans glisser d'un jour", async () => {
    // Le piège que `formatCalendarDate` existe pour éviter : lu en heure locale
    // depuis Montréal, le 4 mars à minuit UTC tombe le 3 mars.
    const jour = new Date("2026-03-04T00:00:00.000Z");
    expect(formatCalendarDate(jour, "fr")).toBe("2026-03-04");
    langue.courante = "en";
    expect((await getFormatteurs()).formatCalendarDate(jour)).toContain("2026");
  });
});
