import { describe, expect, it } from "vitest";
import {
  fusionnerChronologie,
  nbPiecesDepuisMetadata,
  type SourcesChronologie,
} from "@/lib/services/correspondance/chronologie";

const VIDE: SourcesChronologie = { facturesEnvoyees: [], notifications: [], saisies: [] };

function d(iso: string): Date {
  return new Date(iso);
}

describe("nbPiecesDepuisMetadata", () => {
  it("lit attachmentCount", () => {
    expect(nbPiecesDepuisMetadata('{"attachmentCount":3}')).toBe(3);
  });

  it("retombe sur la longueur de richDocumentIds", () => {
    expect(nbPiecesDepuisMetadata('{"richDocumentIds":["a","b"]}')).toBe(2);
  });

  it("préfère attachmentCount à la longueur de la liste", () => {
    // Le service d'envoi peut échouer à rendre un document : la liste demandée
    // et le nombre réellement joint diffèrent alors. C'est le second qui est vrai.
    expect(nbPiecesDepuisMetadata('{"richDocumentIds":["a","b","c"],"attachmentCount":2}')).toBe(2);
  });

  it("rend null sur du JSON cassé plutôt que de faire tomber la ligne", () => {
    expect(nbPiecesDepuisMetadata("{ceci n'est pas du json")).toBeNull();
  });

  it("rend null quand le champ est absent, nul ou aberrant", () => {
    expect(nbPiecesDepuisMetadata(null)).toBeNull();
    expect(nbPiecesDepuisMetadata("{}")).toBeNull();
    expect(nbPiecesDepuisMetadata('{"attachmentCount":-1}')).toBeNull();
    expect(nbPiecesDepuisMetadata('{"attachmentCount":"deux"}')).toBeNull();
  });

  it("accepte zéro, qui n'est pas la même chose qu'inconnu", () => {
    expect(nbPiecesDepuisMetadata('{"attachmentCount":0}')).toBe(0);
  });
});

describe("fusionnerChronologie", () => {
  it("rend une liste vide sans source", () => {
    expect(fusionnerChronologie(VIDE)).toEqual([]);
  });

  it("trie du plus récent au plus ancien, toutes sources confondues", () => {
    const out = fusionnerChronologie({
      facturesEnvoyees: [
        {
          id: "f1",
          subject: "Facture 2026-014",
          recipientEmail: "client@exemple.ca",
          status: "sent",
          errorMessage: null,
          attachmentName: "facture.pdf",
          sentAt: d("2026-03-02T10:00:00Z"),
          createdAt: d("2026-03-02T10:00:00Z"),
          invoice: { numero: "2026-014" },
          sentBy: { nom: "Me Derisier" },
        },
      ],
      notifications: [
        {
          id: "n1",
          type: "document_send",
          subject: "Mise en demeure",
          sentTo: "client@exemple.ca",
          status: "sent",
          sentAt: d("2026-03-05T09:00:00Z"),
          metadata: '{"attachmentCount":2}',
        },
      ],
      saisies: [
        {
          id: "s1",
          typeCommunication: "appel_telephonique",
          titre: null,
          expediteur: "Me Derisier",
          destinataire: "Me Tremblay",
          dateCommunication: d("2026-03-01T00:00:00Z"),
          createdAt: d("2026-03-10T00:00:00Z"),
        },
      ],
    });

    expect(out.map((e) => e.id)).toEqual(["notification:n1", "facture:f1", "saisie:s1"]);
  });

  it("départage deux dates identiques de façon stable", () => {
    const meme = d("2026-03-02T10:00:00Z");
    const premier = fusionnerChronologie({
      ...VIDE,
      notifications: [
        { id: "a", type: "x", subject: "A", sentTo: "a@a.ca", status: "sent", sentAt: meme, metadata: null },
        { id: "b", type: "x", subject: "B", sentTo: "b@b.ca", status: "sent", sentAt: meme, metadata: null },
      ],
    });
    const second = fusionnerChronologie({
      ...VIDE,
      notifications: [
        { id: "b", type: "x", subject: "B", sentTo: "b@b.ca", status: "sent", sentAt: meme, metadata: null },
        { id: "a", type: "x", subject: "A", sentTo: "a@a.ca", status: "sent", sentAt: meme, metadata: null },
      ],
    });
    expect(premier.map((e) => e.id)).toEqual(second.map((e) => e.id));
  });

  it("marque en échec tout statut qui n'est pas « sent »", () => {
    const out = fusionnerChronologie({
      ...VIDE,
      facturesEnvoyees: [
        {
          id: "f1",
          subject: "Facture",
          recipientEmail: "client@exemple.ca",
          status: "failed",
          errorMessage: "Adresse rejetée",
          attachmentName: null,
          sentAt: null,
          createdAt: d("2026-03-02T10:00:00Z"),
          invoice: { numero: "2026-014" },
          sentBy: null,
        },
      ],
    });
    expect(out[0].etat).toBe("echec");
    expect(out[0].erreur).toBe("Adresse rejetée");
  });

  it("traite un statut inconnu comme un échec, jamais comme un envoi réussi", () => {
    const out = fusionnerChronologie({
      ...VIDE,
      notifications: [
        { id: "n1", type: "x", subject: "S", sentTo: "a@a.ca", status: "queued", sentAt: d("2026-01-01T00:00:00Z"), metadata: null },
      ],
    });
    expect(out[0].etat).toBe("echec");
  });

  it("utilise la date de création quand la date d'envoi manque", () => {
    const out = fusionnerChronologie({
      ...VIDE,
      facturesEnvoyees: [
        {
          id: "f1",
          subject: "Facture",
          recipientEmail: "client@exemple.ca",
          status: "failed",
          errorMessage: null,
          attachmentName: null,
          sentAt: null,
          createdAt: d("2026-02-02T08:30:00Z"),
          invoice: null,
          sentBy: null,
        },
      ],
    });
    expect(out[0].date).toBe("2026-02-02T08:30:00.000Z");
  });

  it("distingue un envoi de document d'une notification ordinaire", () => {
    const out = fusionnerChronologie({
      ...VIDE,
      notifications: [
        { id: "n1", type: "document_send", subject: "Doc", sentTo: "a@a.ca", status: "sent", sentAt: d("2026-03-02T10:00:00Z"), metadata: null },
        { id: "n2", type: "status_change", subject: "Statut", sentTo: "a@a.ca", status: "sent", sentAt: d("2026-03-01T10:00:00Z"), metadata: null },
      ],
    });
    expect(out[0].source).toBe("document");
    expect(out[1].source).toBe("notification");
  });

  it("ne prétend pas connaître le sens d'une ligne saisie à la main", () => {
    const out = fusionnerChronologie({
      ...VIDE,
      saisies: [
        {
          id: "s1",
          typeCommunication: "lettre_recue",
          titre: "  ",
          expediteur: "Greffe",
          destinataire: null,
          dateCommunication: null,
          createdAt: d("2026-03-01T00:00:00Z"),
        },
      ],
    });
    expect(out[0].sens).toBe("saisi");
    expect(out[0].etat).toBe("saisi");
    // Titre blanc : on retombe sur le type, jamais sur une chaîne vide.
    expect(out[0].objet).toBe("lettre recue");
    // Pas de destinataire : l'expéditeur tient lieu de contrepartie.
    expect(out[0].interlocuteur).toBe("Greffe");
  });

  it("préfixe les identifiants par la source pour éviter une collision de clés", () => {
    const out = fusionnerChronologie({
      facturesEnvoyees: [
        {
          id: "meme-id",
          subject: "Facture",
          recipientEmail: "a@a.ca",
          status: "sent",
          errorMessage: null,
          attachmentName: null,
          sentAt: d("2026-03-02T10:00:00Z"),
          createdAt: d("2026-03-02T10:00:00Z"),
          invoice: null,
          sentBy: null,
        },
      ],
      notifications: [
        { id: "meme-id", type: "x", subject: "N", sentTo: "a@a.ca", status: "sent", sentAt: d("2026-03-01T10:00:00Z"), metadata: null },
      ],
      saisies: [],
    });
    expect(new Set(out.map((e) => e.id)).size).toBe(2);
  });
});
