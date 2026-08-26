"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toIntlLocale } from "@/lib/i18n/locale";
import type { RevenueChartPoint } from "@/lib/dashboard/types";

/**
 * Facturé et encaissé, mois par mois.
 *
 * ## Pourquoi cette forme
 *
 * Deux séries à comparer mois par mois : colonnes groupées. La forme « jauge »
 * (le facturé en piste, l'encaissé en remplissage) était plus élégante, mais
 * elle ment dès qu'un mois encaisse une facture émise le mois d'avant, ce qui
 * est le cas courant d'un cabinet. Les colonnes groupées supportent n'importe
 * quel rapport entre les deux valeurs.
 *
 * ## Pourquoi ces deux couleurs
 *
 * Emphase, pas catégoriel : une teinte porteuse et un gris de retrait.
 * L'encaissé est ce qui est réellement rentré, il prend le vert de l'état
 * validé ; le facturé n'est qu'une créance, il reste gris. Le couple
 * `#26654A` / `#888E94` a été passé au validateur du référentiel dataviz :
 * séparation daltonisme ΔE 17,2 (protan) et 19,8 (tritan), vision normale
 * 20,2, contraste supérieur à 3:1 sur les deux. Le plancher de chroma est
 * volontairement échoué : le gris DOIT lire gris, c'est son rôle, et le vert
 * de la marque est désaturé par décision de palette.
 *
 * ## Le relief
 *
 * Le CEO a demandé un diagramme « 3D ». Une vraie perspective fausse la
 * lecture des hauteurs : c'est le seul point où je n'ai pas suivi la demande à
 * la lettre. Le relief est donc porté par la matière et non par la géométrie —
 * dégradé vertical, capuchon arrondi, arête haute éclairée, ombre au sol — de
 * sorte que les colonnes se lisent comme des objets posés, pendant que leur
 * hauteur reste mesurée sur un axe plat.
 */

interface Props {
  data: RevenueChartPoint[];
}

type Fenetre = 6 | 12;

/** Axe : des montants courts. « 12 450 $ » sur un axe, c'est du bruit. */
function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M$`;
  if (abs >= 1_000) return `${Math.round(n / 1000)} k$`;
  return `${Math.round(n)} $`;
}

/** Colonne à capuchon arrondi, ancrée à la ligne de base (jamais arrondie en bas). */
function cheminColonne(x: number, y: number, w: number, h: number, r = 4): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${x},${y + h}`,
    `L${x},${y + rr}`,
    `Q${x},${y} ${x + rr},${y}`,
    `L${x + w - rr},${y}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `L${x + w},${y + h}`,
    "Z",
  ].join(" ");
}

function Colonne(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  /** Identifiant du dégradé et de l'arête, propre à la série. */
  degrade?: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill, degrade } = props;
  if (height <= 0 || width <= 0) return null;
  return (
    <g filter="url(#ombre-colonne)">
      <path d={cheminColonne(x, y, width, height)} fill={degrade ? `url(#${degrade})` : fill} />
      {/* Arête éclairée : l'objet reçoit la lumière par le haut. Elle ne change
          pas la hauteur lue, elle habille le capuchon. */}
      <path
        d={cheminColonne(x, y, width, Math.min(4, height))}
        fill="var(--si-surface)"
        opacity={0.32}
      />
    </g>
  );
}

/**
 * Les deux couleurs viennent des jetons, jamais d'une hexadécimale recopiée :
 * la palette est pilotable depuis `lib/ds/palettes.ts`, et un diagramme figé
 * dériverait d'elle à la première retouche. Contrepartie assumée : la
 * séparation mesurée plus haut vaut pour la palette « Ardoise » en vigueur ;
 * qui change `verified` ou `border-strong` doit repasser le validateur.
 */
const VERT = "var(--si-verified)";
const GRIS = "var(--si-border-strong)";

export function CashflowChart({ data }: Props) {
  const locale = useLocale();
  const { formatCurrency } = useFormatteurs();
  const intlLocale = toIntlLocale(locale);
  const [fenetre, setFenetre] = useState<Fenetre>(6);

  const points = useMemo(() => {
    return data.slice(-fenetre).map((p) => ({
      label: p.label,
      facture: p.invoiced ?? 0,
      encaisse: p.value,
    }));
  }, [data, fenetre]);

  const totalFacture = points.reduce((s, p) => s + p.facture, 0);
  const totalEncaisse = points.reduce((s, p) => s + p.encaisse, 0);
  const vide = totalFacture === 0 && totalEncaisse === 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <LegendeItem couleur={GRIS} label="Facturé" />
          <LegendeItem couleur={VERT} label="Encaissé" />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Période affichée">
          {([6, 12] as Fenetre[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFenetre(f)}
              aria-pressed={fenetre === f}
              className={`safe-zoom-menu rounded-md px-2.5 py-1 text-[12px] font-medium ${
                fenetre === f
                  ? "bg-si-surface2 text-si-ink"
                  : "text-si-muted hover:text-si-ink"
              }`}
            >
              {f} mois
            </button>
          ))}
        </div>
      </div>

      {vide ? (
        /* Un diagramme de zéros est moins lisible qu'une phrase. Tant qu'aucune
           facture n'a circulé, l'écran le dit au lieu de dessiner une ligne
           plate qu'il faudrait interpréter. */
        <div className="flex h-[240px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-si-line text-center">
          <p className="text-[13px] text-si-body">Aucune facture sur la période.</p>
          <p className="text-[12px] text-si-muted">
            Le diagramme se remplit dès la première facture émise.
          </p>
        </div>
      ) : (
        <>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={points}
                margin={{ top: 12, right: 4, bottom: 0, left: -8 }}
                barGap={5}
                barCategoryGap="26%"
              >
                <defs>
                  {/* Le dégradé se fait par l'opacité du MÊME jeton, pas par
                      une seconde teinte : la carte est blanche, donc 80 % du
                      jeton y lit exactement comme sa version claire, et il n'y
                      a qu'une couleur à maintenir par série. */}
                  <linearGradient id="grad-facture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GRIS} stopOpacity={0.76} />
                    <stop offset="100%" stopColor={GRIS} stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="grad-encaisse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={VERT} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={VERT} stopOpacity={1} />
                  </linearGradient>
                  <filter id="ombre-colonne" x="-40%" y="-20%" width="180%" height="150%">
                    <feDropShadow
                      dx="0"
                      dy="4"
                      stdDeviation="3.5"
                      floodColor="var(--si-ink)"
                      floodOpacity="0.2"
                    />
                  </filter>
                </defs>
                {/* Grille en retrait : elle sert la lecture, elle ne la dispute pas. */}
                <CartesianGrid
                  vertical={false}
                  stroke="var(--si-line2)"
                  strokeDasharray="0"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--si-muted)", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--si-muted)", fontSize: 11 }}
                  tickFormatter={compact}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "var(--si-line2)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const facture = Number(payload.find((p) => p.dataKey === "facture")?.value ?? 0);
                    const encaisse = Number(
                      payload.find((p) => p.dataKey === "encaisse")?.value ?? 0,
                    );
                    const ecart = facture - encaisse;
                    const taux = facture > 0 ? Math.round((encaisse / facture) * 100) : 0;
                    return (
                      <div className="rounded-xl border border-si-line bg-si-surface px-3 py-2.5 shadow-menu">
                        <p className="mb-1.5 text-[12px] font-medium capitalize text-si-ink">
                          {label}
                        </p>
                        <LigneTooltip
                          couleur={GRIS}
                          label="Facturé"
                          valeur={formatCurrency(facture, "CAD", intlLocale)}
                        />
                        <LigneTooltip
                          couleur={VERT}
                          label="Encaissé"
                          valeur={formatCurrency(encaisse, "CAD", intlLocale)}
                        />
                        <div className="mt-1.5 border-t border-si-line2 pt-1.5 text-[11.5px] text-si-muted">
                          Reste {formatCurrency(ecart, "CAD", intlLocale)} · {taux} % encaissé
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="facture"
                  name="Facturé"
                  maxBarSize={34}
                  shape={<Colonne degrade="grad-facture" />}
                  isAnimationActive={false}
                >
                  {points.map((p) => (
                    <Cell key={`f-${p.label}`} />
                  ))}
                </Bar>
                <Bar
                  dataKey="encaisse"
                  name="Encaissé"
                  maxBarSize={34}
                  shape={<Colonne degrade="grad-encaisse" />}
                  isAnimationActive={false}
                >
                  {points.map((p) => (
                    <Cell key={`e-${p.label}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Repli textuel : le diagramme n'est jamais le seul porteur du
              chiffre. Il sert aussi le daltonisme complet et l'impression. */}
          <details className="mt-3">
            <summary className="safe-zoom-menu inline-block cursor-pointer rounded-md px-1.5 py-0.5 text-[12px] text-si-muted hover:text-si-ink">
              Voir les chiffres
            </summary>
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-si-line">
                  <th scope="col" className="py-1.5 text-left font-medium text-si-muted">
                    Mois
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium text-si-muted">
                    Facturé
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium text-si-muted">
                    Encaissé
                  </th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.label} className="border-b border-si-line2">
                    <td className="py-1.5 capitalize text-si-body">{p.label}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-si-body">
                      {formatCurrency(p.facture, "CAD", intlLocale)}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-si-ink">
                      {formatCurrency(p.encaisse, "CAD", intlLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}

function LegendeItem({ couleur, label }: { couleur: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-si-body">
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-[3px]"
        style={{ background: couleur }}
      />
      {label}
    </span>
  );
}

function LigneTooltip({
  couleur,
  label,
  valeur,
}: {
  couleur: string;
  label: string;
  valeur: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-[12px]">
      <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: couleur }} />
      <span className="text-si-muted">{label}</span>
      <span className="ml-auto font-mono tabular-nums text-si-ink">{valeur}</span>
    </div>
  );
}
