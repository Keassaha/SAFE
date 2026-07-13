import { describe, it, expect } from "vitest";
import { htmlToTiptapContent, textToTiptapContent } from "@/lib/edition/html-to-tiptap";

describe("htmlToTiptapContent (import .docx)", () => {
  it("conserve titres, gras et listes", () => {
    const html =
      "<h1>Mandat</h1><p>Bonjour <strong>Marie</strong>.</p><ul><li>a</li><li>b</li></ul>";
    const doc = JSON.parse(htmlToTiptapContent(html));
    expect(doc.type).toBe("doc");
    const types = doc.content.map((n: { type: string }) => n.type);
    expect(types).toEqual(["heading", "paragraph", "bulletList"]);
    // Le gras est préservé comme mark sur "Marie".
    const marie = doc.content[1].content.find((n: { text?: string }) => n.text === "Marie");
    expect(marie.marks?.[0]?.type).toBe("bold");
  });

  it("ne casse pas sur un HTML vide", () => {
    const doc = JSON.parse(htmlToTiptapContent(""));
    expect(doc.type).toBe("doc");
    expect(Array.isArray(doc.content)).toBe(true);
  });
});

describe("textToTiptapContent (PDF / copier-coller)", () => {
  it("sépare les paragraphes sur les lignes vides", () => {
    const doc = JSON.parse(textToTiptapContent("Para 1\n\nPara 2"));
    expect(doc.content).toHaveLength(2);
    expect(doc.content[0].content[0].text).toBe("Para 1");
    expect(doc.content[1].content[0].text).toBe("Para 2");
  });

  it("transforme un simple saut de ligne en retour à la ligne (hardBreak)", () => {
    const doc = JSON.parse(textToTiptapContent("Ligne A\nLigne B"));
    expect(doc.content).toHaveLength(1);
    const kinds = doc.content[0].content.map((n: { type: string }) => n.type);
    expect(kinds).toContain("hardBreak");
  });

  it("retourne un paragraphe vide pour une entrée vide", () => {
    const doc = JSON.parse(textToTiptapContent("   "));
    expect(doc.content).toEqual([{ type: "paragraph" }]);
  });
});
