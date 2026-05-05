import { describe, it, expect } from "vitest";
import { computeMenuPosition } from "../ClientQuickActions";

const MENU_WIDTH = 224;
const VIEWPORT_MARGIN = 8;

const desktop = { width: 1440, height: 900 };
const mobile = { width: 375, height: 667 };

describe("computeMenuPosition", () => {
  it("desktop : aligne le bord droit du menu sur le bord droit du bouton", () => {
    const trigger = { top: 100, bottom: 140, left: 1100, right: 1180 };
    const pos = computeMenuPosition(trigger, 120, desktop);
    expect(pos.left).toBe(trigger.right - MENU_WIDTH);
    expect(pos.top).toBe(trigger.bottom + 8);
    expect(pos.placement).toBe("below");
  });

  it("flippe à gauche-aligné si le right-align dépasse à gauche", () => {
    // Bouton près du bord gauche : right=100 → left = -124, on retombe sur left-align.
    const trigger = { top: 100, bottom: 140, left: 20, right: 100 };
    const pos = computeMenuPosition(trigger, 120, desktop);
    expect(pos.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
  });

  it("clampe le bord droit du menu pour rester dans le viewport", () => {
    const trigger = { top: 100, bottom: 140, left: 1430, right: 1450 };
    const pos = computeMenuPosition(trigger, 120, desktop);
    expect(pos.left + MENU_WIDTH).toBeLessThanOrEqual(desktop.width - VIEWPORT_MARGIN);
  });

  it("mobile : tient toujours dans la largeur de l'écran", () => {
    const trigger = { top: 60, bottom: 96, left: 280, right: 360 };
    const pos = computeMenuPosition(trigger, 120, mobile);
    expect(pos.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(pos.left + MENU_WIDTH).toBeLessThanOrEqual(mobile.width - VIEWPORT_MARGIN);
  });

  it("flippe au-dessus si le menu déborderait en bas", () => {
    // Bouton tout en bas, pas de place dessous.
    const trigger = { top: 820, bottom: 860, left: 1200, right: 1280 };
    const pos = computeMenuPosition(trigger, 200, desktop);
    expect(pos.placement).toBe("above");
    expect(pos.top + 200).toBeLessThanOrEqual(trigger.top);
  });

  it("garde 'below' tant qu'il reste de la place dessous", () => {
    const trigger = { top: 100, bottom: 140, left: 1100, right: 1180 };
    const pos = computeMenuPosition(trigger, 120, desktop);
    expect(pos.placement).toBe("below");
  });

  it("clampe en haut si ni dessus ni dessous ne tient (cas extrême)", () => {
    // Très petit viewport, menu plus haut que tout — ne doit pas sortir du viewport.
    const trigger = { top: 100, bottom: 130, left: 200, right: 300 };
    const tinyViewport = { width: 400, height: 200 };
    const pos = computeMenuPosition(trigger, 250, tinyViewport);
    expect(pos.top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
  });
});
