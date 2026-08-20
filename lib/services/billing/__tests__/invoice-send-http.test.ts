import { describe, expect, it } from "vitest";
import { reponseHttpPourEnvoi } from "@/lib/services/billing/invoice-send-http";

/**
 * Ces cinq codes existaient dans la route avant son extraction. Ils sont la
 * seule chose que le refactor pouvait casser en silence : un 502 devenu 200
 * ferait croire à un envoi réussi qui n'a pas eu lieu.
 */
describe("reponseHttpPourEnvoi — codes conservés à l'identique", () => {
  it("facture introuvable → 404", () => {
    const r = reponseHttpPourEnvoi({ statut: "facture_introuvable" });
    expect(r.status).toBe(404);
    expect(r.body.error).toBe("Facture non trouvée");
  });

  it("client sans courriel → 400", () => {
    const r = reponseHttpPourEnvoi({ statut: "client_sans_courriel" });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("Le client n'a pas d'adresse courriel");
  });

  it("envoi échoué → 502, et surtout PAS un succès", () => {
    const r = reponseHttpPourEnvoi({ statut: "envoi_echoue", message: "SMTP refusé" });
    expect(r.status).toBe(502);
    expect(r.body.success).toBeUndefined();
    expect(String(r.body.error)).toContain("SMTP refusé");
    expect(r.body.pdfWasAttached).toBe(false);
  });

  it("envoyé mais statut non escaladé → 207 avec avertissement", () => {
    const r = reponseHttpPourEnvoi({ statut: "envoye_statut_non_escalade", pdfJoint: true });
    expect(r.status).toBe(207);
    expect(r.body.success).toBe(true);
    expect(r.body.pdfWasAttached).toBe(true);
    expect(String(r.body.warning)).toContain("escalade de statut");
  });

  it("envoyé → 200", () => {
    const r = reponseHttpPourEnvoi({ statut: "envoye", pdfJoint: true, pdfError: null });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.pdfWasAttached).toBe(true);
    expect(r.body.pdfError).toBeUndefined();
  });

  it("envoyé sans PDF joint : le succès reste un succès, et le dit", () => {
    // Le courriel part avec un lien plutôt qu'une pièce jointe. Ce n'est pas un
    // échec, mais l'appelant doit pouvoir le savoir.
    const r = reponseHttpPourEnvoi({
      statut: "envoye",
      pdfJoint: false,
      pdfError: "Playwright indisponible",
    });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.pdfWasAttached).toBe(false);
    expect(r.body.pdfError).toBe("Playwright indisponible");
  });
});
