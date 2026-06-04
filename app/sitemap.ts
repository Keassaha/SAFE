import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Carte du site fournie à Google et aux autres moteurs.
 * Next.js régénère ce fichier à chaque build : il suffit d'ajouter une route
 * publique ci-dessous pour qu'elle soit prise en compte.
 *
 * On ne liste QUE les pages publiques indexables. L'app authentifiée, les pages
 * d'auth et les pages utilitaires sont exclues (voir aussi app/robots.ts).
 */

type Entry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const PUBLIC_ROUTES: Entry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/fonctionnalites", priority: 0.9, changeFrequency: "monthly" },
  { path: "/tarification", priority: 0.9, changeFrequency: "monthly" },
  { path: "/a-propos", priority: 0.7, changeFrequency: "monthly" },
  { path: "/demo", priority: 0.7, changeFrequency: "monthly" },
  { path: "/audit-gratuit", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" },
  { path: "/conditions", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
