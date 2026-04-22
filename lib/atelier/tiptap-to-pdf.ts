/**
 * Convertit le JSON Tiptap (ProseMirror) en éléments react-pdf
 * Gère : paragraphe, titres (h1-h3), listes, gras, italique, saut de ligne
 */
import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  paragraph: { fontSize: 10, marginBottom: 6, lineHeight: 1.5, color: "#1F2937" },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 12, color: "#1E3A5F" },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 10, color: "#1E3A5F" },
  h3: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 8, color: "#374151" },
  listItem: { fontSize: 10, marginBottom: 4, lineHeight: 1.5, paddingLeft: 12, color: "#1F2937" },
  orderedItem: { fontSize: 10, marginBottom: 4, lineHeight: 1.5, paddingLeft: 12, color: "#1F2937" },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  boldItalic: { fontFamily: "Helvetica-BoldOblique" },
});

interface TiptapMark {
  type: "bold" | "italic" | "strike" | "code" | string;
}

interface TiptapNode {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
}

// Rendu d'un nœud texte avec ses marques (bold, italic, etc.)
function renderTextNode(node: TiptapNode, key: number): React.ReactElement {
  if (!node.text) return React.createElement(Text, { key }, "");

  const hasBold = node.marks?.some((m) => m.type === "bold");
  const hasItalic = node.marks?.some((m) => m.type === "italic");

  let style = {};
  if (hasBold && hasItalic) style = styles.boldItalic;
  else if (hasBold) style = styles.bold;
  else if (hasItalic) style = styles.italic;

  return React.createElement(Text, { key, style }, node.text);
}

// Rendu du contenu inline d'un paragraphe
function renderInlineContent(nodes: TiptapNode[] = []): React.ReactElement[] {
  return nodes.flatMap((node, i) => {
    if (node.type === "text") return [renderTextNode(node, i)];
    if (node.type === "hardBreak") return [React.createElement(Text, { key: i }, "\n")];
    return [];
  });
}

// Rendu d'un bloc
function renderBlock(node: TiptapNode, idx: number): React.ReactElement | null {
  switch (node.type) {
    case "paragraph": {
      const children = renderInlineContent(node.content);
      return React.createElement(
        Text,
        { key: idx, style: styles.paragraph },
        children.length > 0 ? children : " "
      );
    }

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const s = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      const children = renderInlineContent(node.content);
      return React.createElement(Text, { key: idx, style: s }, children);
    }

    case "bulletList": {
      const items = (node.content ?? []).map((item, i) => {
        const text = renderInlineContent(item.content?.[0]?.content);
        return React.createElement(
          Text,
          { key: i, style: styles.listItem },
          [React.createElement(Text, { key: "bullet" }, "• "), ...text]
        );
      });
      return React.createElement(View, { key: idx }, items);
    }

    case "orderedList": {
      const items = (node.content ?? []).map((item, i) => {
        const text = renderInlineContent(item.content?.[0]?.content);
        return React.createElement(
          Text,
          { key: i, style: styles.orderedItem },
          [React.createElement(Text, { key: "num" }, `${i + 1}. `), ...text]
        );
      });
      return React.createElement(View, { key: idx }, items);
    }

    case "blockquote": {
      const children = (node.content ?? []).map((n, i) => renderBlock(n, i)).filter(Boolean);
      return React.createElement(
        View,
        { key: idx, style: { borderLeft: "3pt solid #2563EB", paddingLeft: 8, marginVertical: 4 } },
        children
      );
    }

    default:
      return null;
  }
}

/**
 * Convertit un document Tiptap JSON en array d'éléments react-pdf
 */
export function tiptapToPdfElements(content: string): React.ReactElement[] {
  let doc: TiptapNode;
  try {
    doc = JSON.parse(content);
  } catch {
    // Fallback : traiter comme texte brut
    return [React.createElement(Text, { style: styles.paragraph }, content)];
  }

  if (!doc?.content) return [];

  return (doc.content as TiptapNode[])
    .map((node, idx) => renderBlock(node, idx))
    .filter((el): el is React.ReactElement => el !== null);
}
