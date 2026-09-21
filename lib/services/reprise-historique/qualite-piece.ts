/**
 * Ce qu'on peut savoir d'une pièce AVANT de la faire lire.
 *
 * Une capture d'écran de 400 px de large ne donnera jamais un détail de
 * facture lisible, quelle que soit la qualité du lecteur. Le dire tout de
 * suite vaut mieux que dépenser un appel, faire attendre le cabinet, puis lui
 * rendre une carte vide sans lui expliquer ce qui n'allait pas.
 *
 * Deux principes tenus ici :
 * - On mesure, on ne devine pas. Les dimensions viennent de l'en-tête du
 *   fichier, pas d'une heuristique sur le poids en octets, qui dépend surtout
 *   du taux de compression.
 * - On se trompe du bon côté. Le refus est réservé à ce qui est
 *   manifestement illisible ; entre les deux, on laisse passer avec un mot.
 *   Un cabinet bloqué sur une pièce valable abandonne la reprise entière.
 */

export interface DimensionsImage {
  largeur: number;
  hauteur: number;
}

export type VerdictQualite =
  | { verdict: "ok" }
  | { verdict: "reserve"; raison: string }
  | { verdict: "refus"; raison: string };

/**
 * Une page lettre numérisée à 150 ppp fait 1275 × 1650 px, à 100 ppp
 * 850 × 1100. Sous 700 px sur le grand côté, le détail d'une facture (dates,
 * montants, taux horaires en petits caractères) n'existe tout simplement plus
 * dans le fichier.
 */
const GRAND_COTE_REFUS = 700;
const GRAND_COTE_RESERVE = 1100;

export function controlerQualiteImage(
  buffer: Buffer,
  mimeType: string,
): VerdictQualite {
  // Un PDF porte du texte vectoriel : ses dimensions en pixels ne veulent rien
  // dire, et c'est de loin le format le plus sûr. On ne le juge pas.
  if (mimeType === "application/pdf") return { verdict: "ok" };

  const d = dimensionsImage(buffer, mimeType);
  if (!d) return { verdict: "ok" }; // format non mesurable : on ne bloque pas sur une ignorance

  const grandCote = Math.max(d.largeur, d.hauteur);
  if (grandCote < GRAND_COTE_REFUS) {
    return {
      verdict: "refus",
      raison: `Cette image fait ${d.largeur} × ${d.hauteur} pixels : le détail d'une facture n'y est pas lisible. Reprenez la photo de plus près, page entière et à plat, ou déposez le PDF d'origine.`,
    };
  }
  if (grandCote < GRAND_COTE_RESERVE) {
    return {
      verdict: "reserve",
      raison: `Image de petite taille (${d.largeur} × ${d.hauteur} pixels) : vérifiez les montants et les dates de près.`,
    };
  }
  return { verdict: "ok" };
}

/**
 * Dimensions lues dans l'en-tête du fichier. Chaque format les range à un
 * endroit fixe, ce qui évite d'embarquer une bibliothèque d'image entière
 * pour deux entiers.
 */
export function dimensionsImage(buffer: Buffer, mimeType: string): DimensionsImage | null {
  switch (mimeType) {
    case "image/png":
      return dimensionsPng(buffer);
    case "image/jpeg":
      return dimensionsJpeg(buffer);
    case "image/gif":
      return dimensionsGif(buffer);
    case "image/webp":
      return dimensionsWebp(buffer);
    default:
      return null;
  }
}

/** PNG : le bloc IHDR suit les 8 octets de signature, largeur et hauteur en 32 bits. */
function dimensionsPng(b: Buffer): DimensionsImage | null {
  if (b.length < 24 || b.toString("ascii", 12, 16) !== "IHDR") return null;
  return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
}

/**
 * JPEG : il faut parcourir les segments jusqu'au marqueur de trame (SOFn), les
 * seuls à porter les dimensions. SOF4 (0xC4), SOF8 (0xC8) et SOF12 (0xCC) ne
 * sont pas des trames et doivent être sautés.
 */
function dimensionsJpeg(b: Buffer): DimensionsImage | null {
  if (b.length < 4 || b.readUInt16BE(0) !== 0xffd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marqueur = b[i + 1];
    const estTrame = marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc;
    if (estTrame) {
      return { hauteur: b.readUInt16BE(i + 5), largeur: b.readUInt16BE(i + 7) };
    }
    const longueur = b.readUInt16BE(i + 2);
    if (longueur < 2) return null;
    i += 2 + longueur;
  }
  return null;
}

/** GIF : largeur et hauteur en 16 bits petit-boutiste, juste après « GIF89a ». */
function dimensionsGif(b: Buffer): DimensionsImage | null {
  if (b.length < 10 || b.toString("ascii", 0, 3) !== "GIF") return null;
  return { largeur: b.readUInt16LE(6), hauteur: b.readUInt16LE(8) };
}

/** WebP : trois encodages (VP8, VP8L, VP8X), chacun rangeant ses dimensions ailleurs. */
function dimensionsWebp(b: Buffer): DimensionsImage | null {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const type = b.toString("ascii", 12, 16);
  if (type === "VP8X") {
    return {
      largeur: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
      hauteur: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)),
    };
  }
  if (type === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { largeur: 1 + (bits & 0x3fff), hauteur: 1 + ((bits >> 14) & 0x3fff) };
  }
  if (type === "VP8 ") {
    return { largeur: b.readUInt16LE(26) & 0x3fff, hauteur: b.readUInt16LE(28) & 0x3fff };
  }
  return null;
}
