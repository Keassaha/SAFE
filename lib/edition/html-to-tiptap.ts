/**
 * Conversion de contenu importé (HTML issu d'un .docx, ou texte brut d'un PDF /
 * d'un copier-coller) vers le format ProseMirror (Tiptap) éditable stocké dans
 * RichDocument.content. Utilisé par l'import de mandats existants.
 *
 * Le jeu d'extensions doit rester aligné sur celui de l'éditeur
 * (components/edition/DocumentEditor.tsx) pour que le document importé s'ouvre
 * proprement : StarterKit (paragraphes, titres, gras, italique, souligné, liens,
 * listes, citations, code, filet), alignement, et tableaux.
 */
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const IMPORT_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
];

/** Convertit du HTML (ex. sortie mammoth d'un .docx) en contenu Tiptap sérialisé. */
export function htmlToTiptapContent(html: string): string {
  const json = generateJSON(html || "<p></p>", IMPORT_EXTENSIONS);
  return JSON.stringify(json);
}

type PMNode = Record<string, unknown>;

/**
 * Convertit du texte brut (PDF extrait, copier-coller) en contenu Tiptap.
 * Une ligne vide sépare deux paragraphes ; un simple saut de ligne devient un
 * retour à la ligne (hardBreak) à l'intérieur du même paragraphe.
 */
export function textToTiptapContent(text: string): string {
  const normalized = (text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const blocks = normalized.length > 0 ? normalized.split(/\n{2,}/) : [];

  const content: PMNode[] =
    blocks.length > 0
      ? blocks.map((block) => {
          const lines = block.split("\n");
          const inline: PMNode[] = [];
          lines.forEach((line, i) => {
            if (i > 0) inline.push({ type: "hardBreak" });
            if (line.length > 0) inline.push({ type: "text", text: line });
          });
          return inline.length > 0 ? { type: "paragraph", content: inline } : { type: "paragraph" };
        })
      : [{ type: "paragraph" }];

  return JSON.stringify({ type: "doc", content });
}
