/**
 * Mise en archive de la trousse d'inspection.
 *
 * Art. 30 B-1 r.5 (copie papier immédiate) · art. 33 (reconstitution aux frais de
 * l'avocat) · By-Law 9, par. 21(2).
 *
 * ⚠️ NOMS DE FICHIERS EN ASCII, DÉLIBÉRÉMENT. Le format ZIP n'impose pas d'encodage
 * de nom de fichier : sans le drapeau UTF-8, un nom accentué écrit sur macOS s'ouvre
 * en charabia sous Windows. Les titres français vivent donc dans le MANIFESTE, qui est
 * du contenu UTF-8 et s'affiche correctement partout. Un inspecteur qui reçoit une
 * archive illisible n'a rien reçu.
 *
 * ⚠️ AUCUNE COMPRESSION. Les pièces sont stockées telles quelles. Une archive
 * décompressable sans outil particulier, dont chaque octet correspond à l'empreinte
 * annoncée, vaut mieux que quelques kilooctets gagnés.
 */

import { zipSync } from "fflate";
import type { InspectionKit } from "./inspection-kit-service";

/** Nom du fichier remis, horodaté pour qu'on ne confonde pas deux productions. */
export function archiveFilename(kit: InspectionKit): string {
  const from = kit.periodFrom.toISOString().slice(0, 10);
  const to = kit.periodTo.toISOString().slice(0, 10);
  return `trousse-inspection_${from}_${to}.zip`;
}

/**
 * Construit l'archive.
 *
 * Le manifeste est le PREMIER fichier, nommé `00-MANIFESTE.txt` pour qu'il arrive en
 * tête d'un tri alphabétique. C'est lui qui dit ce qui manque, et personne ne doit
 * avoir à le chercher.
 *
 * Les pièces absentes ne produisent AUCUN fichier vide : un CSV de zéro octet dans
 * l'archive ressemblerait à un registre vide plutôt qu'à un registre non produit. Le
 * manifeste, lui, les nomme.
 */
export function buildInspectionArchive(kit: InspectionKit): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();

  files["00-MANIFESTE.txt"] = encoder.encode(kit.manifest);

  for (const item of kit.items) {
    if (item.content === null) continue;
    files[asciiPath(item.filename)] = encoder.encode(item.content);
  }

  return zipSync(files, { level: 0 });
}

/**
 * Réduit un chemin à de l'ASCII sûr.
 *
 * Les noms produits par le service sont déjà ASCII ; cette fonction est un filet, pas
 * une transformation attendue. Si un nom accentué apparaissait un jour, il serait
 * translittéré plutôt que de casser l'archive en silence.
 */
export function asciiPath(path: string): string {
  return path
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._/-]/g, "-");
}
