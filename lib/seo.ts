import type { Metadata } from "next";

/**
 * Configuration SEO centrale de SAFE.
 *
 * Tout le référencement passe par ce fichier : on change une valeur ici, elle se
 * propage partout (metadata des pages, Open Graph, données structurées JSON-LD).
 *
 * Note i18n : le site sert le FR et l'EN via le cookie NEXT_LOCALE (pas de préfixe
 * d'URL /fr ou /en). Le hreflang propre exige des URLs distinctes par langue, donc
 * on traite ici le FRANÇAIS comme version canonique indexable. Le hreflang sera
 * ajouté si/quand l'anglais obtient ses propres URLs. Voir docs/marketing/seo/.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://safecabinet.ca"
).replace(/\/$/, "");

export const SITE_NAME = "SAFE";
export const SITE_LEGAL_NAME = "SAFE Inc.";

/** Image partagée par défaut (aperçu LinkedIn / réseaux). */
export const DEFAULT_OG_IMAGE = "/safe-hero-dashboard.png";
/**
 * Logo carré des données structurées. Fabriqué par `npm run brand:assets` à
 * partir de `components/brand/safe-mark.ts` : ne pas y substituer une capture.
 */
export const LOGO_PATH = "/safe-logo.png";

/**
 * Description de repli, et surtout description des données structurées.
 *
 * Elle affirmait « Conforme au Barreau du Québec ». C'est la seule phrase du
 * site qui promettait une conformité, et elle la promettait à l'endroit le plus
 * lu par les moteurs et les modèles : le JSON-LD de l'accueil. La marque
 * l'interdit, l'accueil dit maintenant le contraire noir sur blanc (« SAFE
 * garantit-il la conformité ? Non. »), et une page qui se contredit entre son
 * texte et son balisage perd les deux fois.
 *
 * Elle nomme donc ce que SAFE fait, pas ce qu'il garantirait, et elle couvre
 * les deux provinces servies. 152 caractères.
 *
 * Aucune page publique ne s'en sert comme description de page : toutes passent
 * la leur à `buildMetadata`. Elle ne vit que dans `organizationSchema` et
 * `softwareApplicationSchema`, tous deux injectés sur l'accueil.
 */
const DEFAULT_DESCRIPTION =
  "Suite administrative pour cabinets d'avocats du Québec et de l'Ontario : dossiers, temps, facturation, comptabilité et fidéicommis dans un même système.";

type BuildMetadataInput = {
  /** Titre de la page, sans le suffixe « — SAFE » (ajouté automatiquement). */
  title: string;
  description?: string;
  /** Chemin canonique, ex. "/fonctionnalites". "/" pour l'accueil. */
  path: string;
  /** Image OG spécifique à la page (sinon image par défaut). */
  ogImage?: string;
  /** Empêcher l'indexation (pages utilitaires). */
  noindex?: boolean;
};

/**
 * Construit l'objet Metadata Next.js pour une page publique.
 * Gère titre, description, canonical et Open Graph de façon cohérente.
 */
export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
}: BuildMetadataInput): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const fullTitle = path === "/" ? title : `${title} — ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "fr_CA",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Données structurées (JSON-LD) — la matière première lue par Google et les IA.
 * On les injecte via le composant <JsonLd> (components/seo/JsonLd.tsx).
 * ──────────────────────────────────────────────────────────────────────────── */

/** Identité de l'entreprise. À placer une fois, sur l'accueil. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${LOGO_PATH}`,
    description: DEFAULT_DESCRIPTION,
    /* Gatineau, comme le pied de page du site. Le balisage disait Montréal :
       Google prend l'adresse d'une Organization au sérieux pour le signal
       local, et deux villes différentes sur le même site en font une donnée
       sur laquelle il n'appuie plus (confirmé par le CEO le 21 août 2026). */
    address: {
      "@type": "PostalAddress",
      addressLocality: "Gatineau",
      addressRegion: "QC",
      addressCountry: "CA",
    },
    /* Les deux provinces servies, comme le dit la première vue de l'accueil
       (« Adapté au Québec et à l'Ontario »). Le balisage n'en déclarait
       qu'une, et un signal local qui contredit la page ne sert ni l'un ni
       l'autre. */
    areaServed: [
      { "@type": "AdministrativeArea", name: "Québec" },
      { "@type": "AdministrativeArea", name: "Ontario" },
    ],
    sameAs: [] as string[], // à compléter : LinkedIn, etc.
  };
}

/** Description du produit SAFE. À placer sur l'accueil et les pages produit. */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Legal Practice Management Software",
    operatingSystem: "Web",
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "fr-CA",
    audience: {
      "@type": "Audience",
      audienceType: "Cabinets d'avocats, petits cabinets, adjointes juridiques",
      geographicArea: [
        { "@type": "AdministrativeArea", name: "Québec" },
        { "@type": "AdministrativeArea", name: "Ontario" },
      ],
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/tarification`,
    },
  };
}

type FaqItem = { question: string; answer: string };

/** FAQ structurée. À placer sur les pages qui présentent des questions/réponses. */
export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
