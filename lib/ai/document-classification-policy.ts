/** Activation serveur explicite, cabinet par cabinet. Une clé API seule ne vaut pas autorisation. */
export function documentClassificationEnabled(cabinetId: string): boolean {
  return (process.env.SAFE_AI_DOCUMENT_CLASSIFICATION_CABINETS ?? "")
    .split(",").map((id) => id.trim()).filter(Boolean).includes(cabinetId);
}
