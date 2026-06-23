import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ancrage
        forest: { DEFAULT: "#0B1F19", soft: "#16312A" },
        // Surfaces
        canvas: "#EFF2ED",
        surface: "#FBFCFA",
        // Texte
        ink: "#1F2A24",
        muted: "#5A665F",
        // Accents
        verified: "#2E7D5B",
        amber: "#B07A1C",
        // Lignes
        line: "rgba(31,42,36,0.10)",
        line2: "rgba(31,42,36,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-instrument)", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 18px 40px -32px rgba(31,42,36,0.40)",
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
