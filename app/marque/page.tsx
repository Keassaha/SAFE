import type { Metadata } from "next";
import { SafeLogo, SafeMark } from "@/components/branding/SafeLogo";

export const metadata: Metadata = {
  title: "SAFE — Marque",
  robots: { index: false, follow: false },
};

const TAILLES = [16, 20, 24, 32, 48, 96];

function Bloc({
  titre,
  note,
  fond,
  encre,
  children,
}: {
  titre: string;
  note: string;
  fond: string;
  encre: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: fond, border: "1px solid rgba(31,42,36,0.10)", padding: "28px 32px" }}>
      <p
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: encre,
          opacity: 0.55,
          margin: 0,
        }}
      >
        {titre}
      </p>
      <p style={{ fontSize: 13, color: encre, opacity: 0.7, margin: "6px 0 22px", maxWidth: "58ch" }}>{note}</p>
      {children}
    </section>
  );
}

export default function PageMarque() {
  return (
    <main style={{ background: "#EFF2ED", color: "#1F2A24", minHeight: "100vh", padding: "56px 40px 96px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1080, display: "grid", gap: 24 }}>
        <header>
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontSize: 44,
              fontWeight: 400,
              margin: 0,
            }}
          >
            La marque SAFE
          </h1>
          <p style={{ fontSize: 14.5, color: "#5A665F", maxWidth: "62ch", marginTop: 10 }}>
            Page de contrôle, non indexée. Elle montre la marque servie aux tailles et sur les
            fonds réels du produit, et garde les pistes écartées pour mémoire. Spécification
            écrite dans docs/brand/IDENTITE_SAFE.md.
          </p>
        </header>

        <Bloc
          titre="Marque servie — « L'Assemblage »"
          note="Un carré partagé par un joint orthogonal en gradins. Les deux pièces sont identiques, tournées de 180°. Le joint n'est pas peint, il est évidé : c'est le fond qui passe entre les pièces, à n'importe quelle taille et sur n'importe quelle surface. Sous vingt pixels, le dessin bascule tout seul sur la version à joint élargi."
          fond="#FBFCFA"
          encre="#1F2A24"
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 34, flexWrap: "wrap" }}>
            {TAILLES.map((t) => (
              <div key={t} style={{ textAlign: "center" }}>
                <SafeMark size={t} tone="light" />
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "#7C877F", marginTop: 10 }}>
                  {t} px
                </p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc
          titre="Pistes écartées — « Les Galets », « La Voûte »"
          note="Gardées pour mémoire et pour un aller-retour en une ligne. Ne pas les employer."
          fond="#FBFCFA"
          encre="#1F2A24"
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 34, flexWrap: "wrap" }}>
            {(["galets", "voute"] as const).map((forme) =>
              [24, 48, 96].map((t) => (
                <div key={`${forme}-${t}`} style={{ textAlign: "center" }}>
                  <SafeMark size={t} tone="light" shape={forme} />
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "#7C877F", marginTop: 10 }}>
                    {forme}, {t} px
                  </p>
                </div>
              )),
            )}
          </div>
        </Bloc>

        <Bloc
          titre="Verrou horizontal"
          note="Le mot suit la taille du mark : corps à 0,62 du côté du symbole, écart de trois modules, interlettrage de vingt pour cent. Grotesque, jamais serif : le symbole est entièrement orthogonal."
          fond="#FBFCFA"
          encre="#1F2A24"
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 44, flexWrap: "wrap" }}>
            {[16, 20, 24, 32].map((t) => (
              <SafeLogo key={t} size={t} />
            ))}
          </div>
        </Bloc>

        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <Bloc
            titre="Fond sombre"
            note="Pied de page du site, en-tête forêt de l'application."
            fond="#16231D"
            encre="#F3F7F4"
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 30, flexWrap: "wrap" }}>
              <SafeLogo size={20} variant="dark" />
              <SafeMark size={32} tone="dark" />
              <SafeMark size={20} tone="dark" />
            </div>
          </Bloc>

          <Bloc
            titre="Monochrome"
            note="Factures, rapports imprimés, dossier d'inspection. Maximum deux couleurs sur une facture : la marque n'en consomme qu'une."
            fond="#FFFFFF"
            encre="#1C1C1C"
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 30, flexWrap: "wrap" }}>
              <SafeLogo size={20} tone="mono-dark" />
              <SafeMark size={32} tone="mono-dark" />
              <SafeMark size={16} tone="mono-dark" />
            </div>
          </Bloc>

          <Bloc
            titre="Plaque"
            note="Réservée à l'icône d'application posée sur un fond clair. Le symbole étant déjà un carré plein, la favicon et les barres de navigation prennent le symbole nu."
            fond="#FBFCFA"
            encre="#1F2A24"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap" }}>
              <SafeLogo size={32} plate markOnly />
              <SafeLogo size={20} plate markOnly />
              <SafeLogo size={14} plate markOnly />
            </div>
          </Bloc>

          <Bloc
            titre="Fond vert de marque"
            note="Bandeaux d'action, cartons de couverture du rapport d'audit."
            fond="#1F3A2E"
            encre="#EDF3EF"
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 30, flexWrap: "wrap" }}>
              <SafeLogo size={20} tone="mono-light" />
              <SafeMark size={32} tone="mono-light" />
            </div>
          </Bloc>
        </div>
      </div>
    </main>
  );
}
