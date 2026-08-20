import { describe, expect, it } from "vitest";
import {
  formatDureeHM,
  formatHeuresDecimales,
  minutesFacturablesDuChrono,
  minutesVersChampHeures,
  parseDureeHeures,
} from "@/lib/temps/duree";

function minutes(raw: string): number | string {
  const res = parseDureeHeures(raw);
  return res.ok ? res.minutes : res.error;
}

describe("parseDureeHeures — heures décimales", () => {
  it("lit la virgule francophone", () => {
    expect(minutes("1,5")).toBe(90);
  });

  it("lit le point sans discuter", () => {
    expect(minutes("1.5")).toBe(90);
  });

  it("lit une heure pleine", () => {
    expect(minutes("1")).toBe(60);
  });

  it("lit une fraction sans partie entière", () => {
    expect(minutes(",5")).toBe(30);
  });

  it("arrondit au dixième d'heure sans perdre la minute", () => {
    expect(minutes("0,1")).toBe(6);
    expect(minutes("2,25")).toBe(135);
  });
});

describe("parseDureeHeures — heures et minutes dictées", () => {
  it("lit 1h30", () => {
    expect(minutes("1h30")).toBe(90);
  });

  it("ignore les espaces de frappe", () => {
    expect(minutes(" 1 h 30 ")).toBe(90);
  });

  it("lit une heure sans minutes", () => {
    expect(minutes("2h")).toBe(120);
  });

  it("lit les deux-points comme une horloge", () => {
    expect(minutes("1:45")).toBe(105);
  });

  it("lit 1h5 comme 1 h 05, pas 1 h 50", () => {
    expect(minutes("1h5")).toBe(65);
  });
});

describe("parseDureeHeures — sortie de secours en minutes", () => {
  it("accepte 90m", () => {
    expect(minutes("90m")).toBe(90);
  });

  it("accepte 45 min", () => {
    expect(minutes("45 min")).toBe(45);
  });
});

describe("parseDureeHeures — refus", () => {
  it("refuse le vide plutôt que de rendre zéro", () => {
    expect(minutes("")).toBe("vide");
    expect(minutes("   ")).toBe("vide");
  });

  it("refuse ce qui n'est pas une durée", () => {
    expect(minutes("abc")).toBe("illisible");
    expect(minutes("1h2h")).toBe("illisible");
  });

  it("refuse zéro", () => {
    expect(minutes("0")).toBe("zero");
    expect(minutes("0h00")).toBe("zero");
  });

  it("attrape l'ancienne habitude : 60 tapé pour une heure", () => {
    expect(minutes("60")).toBe("trop_longue");
  });

  it("laisse passer une journée entière", () => {
    expect(minutes("24")).toBe(1440);
  });
});

describe("formatHeuresDecimales", () => {
  it("écrit la virgule en français", () => {
    expect(formatHeuresDecimales(90)).toBe("1,5");
  });

  it("écrit le point en anglais", () => {
    expect(formatHeuresDecimales(90, "en")).toBe("1.5");
  });

  it("n'ajoute pas de décimale inutile", () => {
    expect(formatHeuresDecimales(60)).toBe("1");
  });

  it("garde le dixième d'heure", () => {
    expect(formatHeuresDecimales(6)).toBe("0,1");
  });
});

describe("formatDureeHM", () => {
  it("écrit les heures et les minutes", () => {
    expect(formatDureeHM(90)).toBe("1 h 30");
  });

  it("écrit l'heure pleine sans minutes", () => {
    expect(formatDureeHM(120)).toBe("2 h");
  });

  it("écrit les minutes seules sous une heure", () => {
    expect(formatDureeHM(45)).toBe("45 min");
  });

  it("complète la minute à deux chiffres", () => {
    expect(formatDureeHM(65)).toBe("1 h 05");
  });
});

describe("aller-retour minute → heures → minute", () => {
  // Le champ affiche des heures à deux décimales. Si cet affichage ne
  // reconvertissait pas exactement, rouvrir une fiche pour corriger une virgule
  // en déplacerait la durée d'une minute à chaque passage. Une minute
  // facturable ne doit jamais s'évaporer par un aller-retour d'écran.
  it("rend la minute d'origine pour chaque durée d'une journée", () => {
    const perdues: number[] = [];
    for (let m = 1; m <= 1440; m++) {
      const relu = parseDureeHeures(minutesVersChampHeures(m));
      if (!relu.ok || relu.minutes !== m) perdues.push(m);
    }
    expect(perdues).toEqual([]);
  });

  it("relit aussi la forme anglaise du champ", () => {
    const relu = parseDureeHeures(minutesVersChampHeures(95, "en"));
    expect(relu.ok && relu.minutes).toBe(95);
  });
});

describe("minutesFacturablesDuChrono", () => {
  it("ne compte rien tant que le chrono n'a pas démarré", () => {
    expect(minutesFacturablesDuChrono(0, 6)).toBe(0);
  });

  it("compte la première seconde comme un premier incrément", () => {
    expect(minutesFacturablesDuChrono(1, 6)).toBe(6);
  });

  it("arrondit vers le haut comme à l'enregistrement", () => {
    expect(minutesFacturablesDuChrono(47 * 60, 6)).toBe(48);
    expect(minutesFacturablesDuChrono(45 * 60, 15)).toBe(45);
    expect(minutesFacturablesDuChrono(46 * 60, 15)).toBe(60);
  });

  it("laisse la minute nue quand le cabinet n'arrondit pas", () => {
    expect(minutesFacturablesDuChrono(47 * 60, 0)).toBe(47);
  });
});
