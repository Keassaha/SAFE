/**
 * Le module « worker » de pdf.js n'a pas de déclaration de types. Il n'est
 * chargé que pour être posé sur `globalThis.pdfjsWorker` (rendu d'une page sur
 * le fil principal, voir components/clients/reprise-un-client/ApercuPiece.tsx).
 */
declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
  export const WorkerMessageHandler: unknown;
}
