import type { FactureSaisie } from "@/lib/services/reprise-un-client/saisie";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";

export type StatutFacture = "a_verifier" | "enregistree" | "deja_reprise";

export interface EntreeFacture {
  id: string;
  source: "pdf" | "main";
  statut: StatutFacture;
  fichier?: File;
  fichierNom: string;
  hash?: string;
  mimeType?: string;
  /** Ce que la lecture a proposé, pour marquer en ambre ce qu'on a repris par-dessus. */
  lu?: FactureSaisie;
  saisie: FactureSaisie;
  lectureEchouee?: boolean;
  raisonLecture?: string;
  clientLu?: string | null;
  dejaRepriseLe?: string;
  erreur?: string;
  invoiceId?: string;
  /** Ce que la lecture a rendu, pour décider du client et de la présentation (v4). */
  extraction?: PastInvoiceExtraction | null;
  /** Adressée à un autre client que celui du dépôt : écartée, jamais versée en silence. */
  ecarteeNom?: string;
  /** Du bon client, mais d'un autre mandat : mise de côté, reprise ensuite avec ce mandat. */
  ecarteeMandat?: string;
}

export interface Ids {
  clientId: string;
  dossierId: string;
}
