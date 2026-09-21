import { describe, it, expect } from "vitest";
import { dimensionsImage, controlerQualiteImage } from "@/lib/services/reprise-historique/qualite-piece";

/** Fabrique un en-tête PNG minimal portant ces dimensions. */
function png(largeur: number, hauteur: number): Buffer {
  const b = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(largeur, 16);
  b.writeUInt32BE(hauteur, 20);
  return b;
}

/** En-tête JPEG minimal : APP0 puis une trame SOF0. */
function jpeg(largeur: number, hauteur: number): Buffer {
  const b = Buffer.alloc(30);
  b.writeUInt16BE(0xffd8, 0);
  b.writeUInt16BE(0xffe0, 2); // APP0
  b.writeUInt16BE(6, 4); // longueur du segment
  b.writeUInt16BE(0xffc0, 10); // SOF0
  b.writeUInt16BE(11, 12);
  b[14] = 8;
  b.writeUInt16BE(hauteur, 15);
  b.writeUInt16BE(largeur, 17);
  return b;
}

function gif(largeur: number, hauteur: number): Buffer {
  const b = Buffer.alloc(10);
  b.write("GIF89a", 0, "ascii");
  b.writeUInt16LE(largeur, 6);
  b.writeUInt16LE(hauteur, 8);
  return b;
}

describe("dimensionsImage", () => {
  it("lit un PNG", () => {
    expect(dimensionsImage(png(1275, 1650), "image/png")).toEqual({ largeur: 1275, hauteur: 1650 });
  });

  it("lit un JPEG en sautant les segments qui ne sont pas des trames", () => {
    expect(dimensionsImage(jpeg(2048, 1536), "image/jpeg")).toEqual({ largeur: 2048, hauteur: 1536 });
  });

  it("lit un GIF, petit-boutiste", () => {
    expect(dimensionsImage(gif(640, 480), "image/gif")).toEqual({ largeur: 640, hauteur: 480 });
  });

  it("rend null sur un fichier tronqué plutôt que de lire n'importe quoi", () => {
    expect(dimensionsImage(Buffer.alloc(4), "image/png")).toBeNull();
    expect(dimensionsImage(Buffer.from("pas une image"), "image/jpeg")).toBeNull();
  });

  it("rend null sur un format qu'on ne sait pas mesurer", () => {
    expect(dimensionsImage(png(100, 100), "application/pdf")).toBeNull();
  });
});

describe("controlerQualiteImage", () => {
  it("refuse une image dont le grand côté est manifestement trop petit", () => {
    const v = controlerQualiteImage(png(400, 300), "image/png");
    expect(v.verdict).toBe("refus");
    if (v.verdict === "refus") expect(v.raison).toContain("400 × 300");
  });

  it("émet une réserve entre les deux, sans bloquer", () => {
    expect(controlerQualiteImage(png(900, 700), "image/png").verdict).toBe("reserve");
  });

  it("laisse passer une page lettre numérisée à 150 ppp", () => {
    expect(controlerQualiteImage(png(1275, 1650), "image/png").verdict).toBe("ok");
  });

  it("juge sur le GRAND côté : une page haute et étroite reste lisible", () => {
    expect(controlerQualiteImage(png(600, 1600), "image/png").verdict).toBe("ok");
  });

  it("ne juge jamais un PDF, dont les pixels ne veulent rien dire", () => {
    expect(controlerQualiteImage(Buffer.alloc(4), "application/pdf").verdict).toBe("ok");
  });

  it("ne bloque pas sur une ignorance : format non mesurable = ok", () => {
    expect(controlerQualiteImage(Buffer.from("???"), "image/webp").verdict).toBe("ok");
  });
});
