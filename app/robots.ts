import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Règles d'accès pour les robots des moteurs de recherche.
 * On autorise les pages publiques et on bloque l'app authentifiée, les pages
 * d'auth et les pages utilitaires (qui ne doivent jamais apparaître dans Google).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/connexion",
        "/inscription",
        "/inscription-gate",
        "/forgot-password",
        "/reset-password",
        "/onboarding",
        "/rejoindre/",
        "/facture/",
        "/style-guide",
        // Espaces applicatifs authentifiés
        "/tableau-de-bord",
        "/clients",
        "/dossiers",
        "/temps",
        "/facturation",
        "/comptes",
        "/rapports",
        "/parametres",
        "/journal",
        "/comptabilite",
        "/conformite",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
