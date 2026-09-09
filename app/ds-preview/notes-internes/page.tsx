import { NavetteThread } from "@/components/navette/NavetteThread";
import type { SerializedNavetteRow } from "@/lib/navette/notes-internes-vue";

/**
 * Contrôle visuel de la section « Notes internes » de la fiche dossier.
 *
 * Les seize états que la refonte du 2026-09-05 devait couvrir, rendus côte à
 * côte avec le composant RÉEL et des données de la forme exacte que la page
 * lui passe. Route hors navigation, sans base de données, fermée en
 * production par `app/ds-preview/layout.tsx`.
 *
 * Ce n'est pas un substitut à la vraie route : c'est ce qui permet de voir en
 * une page des états qu'une seule fiche ne montre jamais en même temps (deux
 * demandes actives, permission insuffisante, nom très long).
 */
export const dynamic = "force-dynamic";

const AVOCATE = "u-camille";
const ADJOINTE = "u-aaliyah";

const il_y_a = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function ligne(p: Partial<SerializedNavetteRow> & { id: string; type: SerializedNavetteRow["type"] }): SerializedNavetteRow {
  return {
    body: null,
    authorId: ADJOINTE,
    authorName: "Aaliyah Côté",
    authorRole: "assistante",
    recipientId: AVOCATE,
    recipientName: "Me Camille Roy",
    parentId: null,
    dueDate: null,
    confidentiel: false,
    resolvedAt: null,
    createdAt: il_y_a(12),
    ...p,
  };
}

const DEMANDE = ligne({
  id: "d1",
  type: "ready_for_review",
  body: "La requête est relue et les annexes sont numérotées. Il reste une incertitude sur la date de signification, que le greffe n'a pas confirmée.",
});

const MESSAGE = ligne({
  id: "m1",
  type: "info",
  authorId: AVOCATE,
  authorName: "Me Camille Roy",
  authorRole: "avocat",
  recipientId: null,
  recipientName: null,
  body: "Certaines informations semblent manquer au dossier.",
  createdAt: il_y_a(140),
});

const REPONSE = ligne({
  id: "m2",
  type: "reply",
  parentId: "m1",
  recipientId: null,
  recipientName: null,
  body: "Le relevé bancaire de mars manque encore. Je relance le client aujourd'hui.",
  createdAt: il_y_a(125),
});

const HISTORIQUE: SerializedNavetteRow[] = [
  ligne({ id: "h1", type: "ready_for_review", resolvedAt: il_y_a(1500), createdAt: il_y_a(1560), body: "Requête prête à valider" }),
  ligne({ id: "h2", type: "sent_back", authorId: AVOCATE, authorName: "Me Camille Roy", authorRole: "avocat", recipientId: ADJOINTE, recipientName: "Aaliyah Côté", resolvedAt: il_y_a(1490), createdAt: il_y_a(1500), body: "Il manque l'annexe B." }),
  ligne({ id: "h3", type: "ready_for_review", resolvedAt: il_y_a(1400), createdAt: il_y_a(1450) }),
  ligne({ id: "h4", type: "approved", authorId: AVOCATE, authorName: "Me Camille Roy", authorRole: "avocat", recipientId: ADJOINTE, recipientName: "Aaliyah Côté", resolvedAt: il_y_a(1400), createdAt: il_y_a(1400) }),
  ligne({ id: "h5", type: "document_ready", resolvedAt: il_y_a(1380), createdAt: il_y_a(1390), body: "Projet de requête en révision" }),
  ligne({ id: "h6", type: "approved", authorId: AVOCATE, authorName: "Me Camille Roy", authorRole: "avocat", recipientId: ADJOINTE, recipientName: "Aaliyah Côté", resolvedAt: il_y_a(1370), createdAt: il_y_a(1370) }),
  ligne({ id: "h7", type: "invoice_ready", resolvedAt: il_y_a(1360), createdAt: il_y_a(1365) }),
];

const LONG =
  "Le greffe a confirmé par téléphone que la signification pouvait se faire par huissier jusqu'au 19, mais la confirmation écrite n'est pas arrivée. J'ai préparé les deux versions de l'avis, celle qui suppose la signification par huissier et celle qui suppose la remise en mains propres, pour qu'aucune des deux ne soit à écrire dans l'urgence si la réponse tombe tard. Le dossier client porte les deux, et j'ai noté au calendrier la relance du greffe pour demain matin.";

const CAS: { titre: string; note: string; props: Parameters<typeof NavetteThread>[0] }[] = [
  {
    titre: "1. Aucune note",
    note: "L'état vide dit quoi faire, sans illustration.",
    props: { dossierId: "d", rows: [], currentUserId: AVOCATE, currentUserRole: "avocat", locale: "fr" },
  },
  {
    titre: "2. Aucune action en attente",
    note: "Deux approbations historiques, aucune demande vivante : aucun bouton de décision. C'est le cas de la capture d'origine.",
    props: { dossierId: "d", rows: [MESSAGE, REPONSE, ...HISTORIQUE], currentUserId: AVOCATE, currentUserRole: "avocat", locale: "fr" },
  },
  {
    titre: "3. Une demande de révision active",
    note: "Une seule action pleine. « Approuver » ne s'affiche que là, et seulement pour la personne visée.",
    props: { dossierId: "d", rows: [DEMANDE, MESSAGE, REPONSE, ...HISTORIQUE], currentUserId: AVOCATE, currentUserRole: "avocat", locale: "fr" },
  },
  {
    titre: "4. Plusieurs demandes actives",
    note: "Chaque demande porte sa propre décision. L'échéance passe en ambre.",
    props: {
      dossierId: "d",
      rows: [DEMANDE, ligne({ id: "d2", type: "ready_for_review", createdAt: il_y_a(40), dueDate: new Date(Date.now() + 2 * 864e5).toISOString(), body: "Deuxième demande." }), ligne({ id: "q1", type: "question", createdAt: il_y_a(60), body: "Confirmer la date de signature chez le notaire ?" })],
      currentUserId: AVOCATE,
      currentUserRole: "avocat",
      locale: "fr",
    },
  },
  {
    titre: "5. Correction demandée, vue de l'adjointe",
    note: "Elle reçoit le motif et peut marquer traité. Elle ne voit aucune décision d'approbation.",
    props: {
      dossierId: "d",
      rows: [ligne({ id: "s1", type: "sent_back", authorId: AVOCATE, authorName: "Me Camille Roy", authorRole: "avocat", recipientId: ADJOINTE, recipientName: "Aaliyah Côté", body: "Il manque l'annexe B, et la page 4 porte encore l'ancienne adresse." }), MESSAGE],
      currentUserId: ADJOINTE,
      currentUserRole: "assistante",
      locale: "fr",
    },
  },
  {
    titre: "6. Permission insuffisante",
    note: "Une avocate qui n'est pas visée par la demande ne voit ni « Approuver » ni « Demander une correction ». La demande reste lisible dans l'historique, avec son statut.",
    props: { dossierId: "d", rows: [DEMANDE, MESSAGE], currentUserId: "u-autre", currentUserRole: "avocat", locale: "fr" },
  },
  {
    titre: "7. Message confidentiel",
    note: "Vue de l'adjointe : le fil ne porte aucune trace du message confidentiel (il est déjà filtré côté serveur ; ici on rend ce que le serveur lui enverrait).",
    props: { dossierId: "d", rows: [MESSAGE, REPONSE], currentUserId: ADJOINTE, currentUserRole: "assistante", locale: "fr" },
  },
  {
    titre: "8. Texte long et nom long",
    note: "La colonne de lecture est bornée à 68 caractères. Le nom ne casse pas la ligne d'auteur.",
    props: {
      dossierId: "d",
      rows: [
        ligne({ id: "L1", type: "ready_for_review", body: LONG, authorName: "Marie-Ève Beaulieu-Saint-Onge de Rochebrune" }),
        ligne({ id: "L2", type: "info", recipientId: null, recipientName: null, body: LONG, authorName: "Marie-Ève Beaulieu-Saint-Onge de Rochebrune", createdAt: il_y_a(200) }),
      ],
      currentUserId: AVOCATE,
      currentUserRole: "avocat",
      locale: "fr",
    },
  },
  {
    titre: "9. Historique volumineux",
    note: "Six lignes visibles, le reste derrière un dépliage explicite.",
    props: {
      dossierId: "d",
      rows: [...HISTORIQUE, ...HISTORIQUE.map((r) => ({ ...r, id: r.id + "b", createdAt: il_y_a(2000) }))],
      currentUserId: AVOCATE,
      currentUserRole: "avocat",
      locale: "fr",
    },
  },
  {
    titre: "10. Anglais",
    note: "Aucune chaîne en dur.",
    props: { dossierId: "d", rows: [DEMANDE, MESSAGE, ...HISTORIQUE], currentUserId: AVOCATE, currentUserRole: "avocat", locale: "en" },
  },
];

export default function ApercuNotesInternes() {
  return (
    <main className="min-h-screen bg-si-canvas px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-2xl text-si-ink">Notes internes, contrôle visuel</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-si-muted">
          Le composant réel, avec les données de la forme exacte que la fiche dossier lui passe.
          Les états qu&apos;une seule fiche ne montre jamais ensemble.
        </p>

        <div className="mt-8 space-y-8">
          {CAS.map((c) => (
            <section key={c.titre}>
              <h2 className="text-sm font-medium text-si-ink">{c.titre}</h2>
              <p className="mt-0.5 max-w-[68ch] text-sm text-si-muted">{c.note}</p>
              {/* La fiche à onglets fournit cette surface dans l'application. */}
              <div className="mt-3 rounded-2xl border border-si-line bg-si-surface p-6">
                <NavetteThread {...c.props} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
