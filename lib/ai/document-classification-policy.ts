import { capaciteIAAutorisee } from "./politique-donnees-client";

/**
 * Activation serveur explicite, cabinet par cabinet. Une clé API seule ne vaut
 * pas autorisation. Le réglage vit maintenant avec les autres dans
 * `politique-donnees-client.ts`, pour qu'on voie d'un seul endroit ce qui sort
 * de SAFE ; la variable d'environnement, elle, n'a pas changé.
 */
export function documentClassificationEnabled(cabinetId: string): boolean {
  return capaciteIAAutorisee("classification_documents", cabinetId);
}
