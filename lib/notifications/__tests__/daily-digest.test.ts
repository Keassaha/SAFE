import { describe, it, expect } from "vitest";
import {
  hasDigestContent,
  digestSubject,
  renderDigestHtml,
  type DigestData,
} from "@/lib/notifications/daily-digest";

function emptyData(): DigestData {
  return {
    recipientName: "Aaliyah",
    navetteNeedsMe: { count: 0, items: [] },
    upcomingDeadlines: [],
    overdueTasks: { count: 0, items: [] },
    pendingHoursToApprove: 0,
  };
}

function richData(): DigestData {
  return {
    recipientName: "Aaliyah",
    navetteNeedsMe: {
      count: 3,
      items: [
        { type: "sent_back", dossierLabel: "IMM-2026-014", body: "Missing signature", dueISO: null },
      ],
    },
    upcomingDeadlines: [
      { label: "Closing", dossierLabel: "RE-2026-002", daysUntil: 1 },
    ],
    overdueTasks: { count: 1, items: [{ titre: "Call client", dossierLabel: "IMM-2026-014", daysOverdue: 2 }] },
    pendingHoursToApprove: 4,
  };
}

describe("daily-digest pure functions", () => {
  describe("hasDigestContent (règle du silence)", () => {
    it("renvoie false quand tout est vide", () => {
      expect(hasDigestContent(emptyData())).toBe(false);
    });
    it("renvoie true dès qu'une section a du contenu", () => {
      expect(hasDigestContent(richData())).toBe(true);
      const onlyHours = { ...emptyData(), pendingHoursToApprove: 1 };
      expect(hasDigestContent(onlyHours)).toBe(true);
      const onlyNavette = { ...emptyData(), navetteNeedsMe: { count: 1, items: [] } };
      expect(hasDigestContent(onlyNavette)).toBe(true);
    });
  });

  describe("digestSubject", () => {
    it("résume les compteurs FR/EN", () => {
      const fr = digestSubject(richData(), "fr");
      const en = digestSubject(richData(), "en");
      expect(fr).toContain("3");
      expect(en).toContain("3");
      expect(en.toLowerCase()).toContain("daily summary".toLowerCase());
    });
    it("retombe sur le sujet de base sans navette/échéance", () => {
      const d = { ...emptyData(), overdueTasks: { count: 1, items: [] } };
      expect(digestSubject(d, "en")).toBe("Your daily summary");
    });
  });

  describe("renderDigestHtml", () => {
    it("inclut le nom, le CTA et le cabinet, sans emoji", () => {
      const html = renderDigestHtml(richData(), "en", "https://app.safecabinet.ca", "Derisier Law");
      expect(html).toContain("Aaliyah");
      expect(html).toContain("Derisier Law");
      expect(html).toContain("https://app.safecabinet.ca");
      expect(html).toContain("Open SAFE");
      // Pas d'emoji décoratif (plage symboles/emoji courante).
      expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html)).toBe(false);
    });
    it("échappe le HTML des données pour éviter l'injection", () => {
      const d = richData();
      d.navetteNeedsMe.items[0].body = "<script>alert(1)</script>";
      const html = renderDigestHtml(d, "en", "https://x", "A & B");
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("A &amp; B");
    });
    it("omet les sections vides", () => {
      const d = { ...emptyData(), pendingHoursToApprove: 2 };
      const html = renderDigestHtml(d, "fr", "https://x");
      expect(html).toContain("Heures à approuver");
      expect(html).not.toContain("Échéances proches");
    });
  });
});
