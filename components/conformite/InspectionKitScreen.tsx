"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CabinetProvince } from "@/lib/compliance/rules";

/**
 * Trousse d'inspection — art. 29, 30, 33 B-1 r.5 / By-Law 9, par. 21(2).
 *
 * ── Décisions de design, et pourquoi ─────────────────────────────────────────
 *
 * UNE INTENTION (M2) : remettre la trousse. Mais l'écran ouvre sur CE QUI MANQUE, pas
 * sur le bouton. Un cabinet qui télécharge sans regarder arriverait devant l'inspecteur
 * en croyant être prêt, et c'est précisément ce que la trousse doit empêcher.
 *
 * LE BOUTON RESTE ACTIF MÊME AVEC DES PIÈCES MANQUANTES. Le désactiver serait du
 * sur-blocage : une trousse incomplète remise en connaissance de cause vaut mieux
 * qu'aucune trousse, et le manifeste porte la liste des trous. C'est à l'avocate de
 * décider, pas au logiciel.
 *
 * PAS DE GRILLE (A14), nombres à droite (L2), entêtes et données à la même taille avec
 * la graisse pour seule hiérarchie (T2), aucune icône décorative (A6).
 */

interface KitItem {
  kind: string;
  filename: string;
  titleFr: string;
  reference: string;
  rowCount: number;
  fingerprint: string | null;
  missingReasonFr: string | null;
}

interface Duty {
  reference: string;
  dutyFr: string;
}

interface Props {
  from: string;
  to: string;
  province: CabinetProvince;
  cabinetName: string;
  missingCount: number;
  manifestFingerprint: string;
  manifest: string;
  duties: Duty[];
  items: KitItem[];
}

const KIND_LABEL: Record<string, string> = {
  REGISTER: "Registres",
  MONTHLY_REPORT: "Rapports mensuels",
  ANNUAL_REPORT: "Rapport annuel",
  SHORTFALL_LOG: "Soldes débiteurs",
};

/**
 * Surface structurelle.
 *
 * Le ton est un PARAMÈTRE, pas une classe passée par-dessus : deux `bg-*` de même
 * spécificité se départagent par l'ordre du CSS généré, pas par l'ordre où on les
 * écrit. Le panneau qui doit ressortir ressortait donc de façon non garantie.
 */
function Panel({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "alert";
  className?: string;
}) {
  const toneClasses =
    tone === "alert"
      ? "border-[#B84A3E]/30 bg-[#B84A3E]/[0.05]"
      : "border-[var(--si-line)] bg-[var(--si-surface)]";
  return <section className={`rounded-xl border ${toneClasses} ${className}`}>{children}</section>;
}

export function InspectionKitScreen({
  from,
  to,
  province,
  cabinetName,
  missingCount,
  manifestFingerprint,
  manifest,
  duties,
  items,
}: Props) {
  const router = useRouter();
  const [showManifest, setShowManifest] = useState(false);

  const missing = items.filter((i) => i.missingReasonFr);
  const present = items.filter((i) => !i.missingReasonFr);

  const groups = Object.entries(
    present.reduce<Record<string, KitItem[]>>((acc, i) => {
      (acc[i.kind] ??= []).push(i);
      return acc;
    }, {}),
  );

  const downloadUrl = `/api/conformite/trousse?from=${from}&to=${to}`;

  return (
    <div className="space-y-6">
      {/* ── La période ─────────────────────────────────────────── */}
      <Panel className="p-4">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            router.push(
              `/inspection/trousse?from=${fd.get("from")}&to=${fd.get("to")}`,
            );
          }}
        >
          <label className="block">
            <span className="text-xs text-[var(--si-muted)]">Du</span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1 block rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--si-muted)]">Au</span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1 block rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-[#0B1F19]/[0.04]"
          >
            Recalculer
          </button>
          <p className="w-full text-xs text-[var(--si-muted)] sm:w-auto sm:flex-1">
            Douze mois par défaut : c'est la fenêtre qu'un inspecteur demande.
          </p>
        </form>
      </Panel>

      {/* ── Ce qui manque, en tête ─────────────────────────────── */}
      {missingCount > 0 ? (
        <Panel tone="alert" className="p-4">
          <h2 className="text-base font-medium text-[#8F3529]">
            {missingCount} {missingCount === 1 ? "pièce manquante" : "pièces manquantes"} ou
            incomplète{missingCount === 1 ? "" : "s"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">
            La trousse reste téléchargeable, et son manifeste porte cette liste. Vous
            choisissez de la remettre en l'état ou de compléter d'abord.
          </p>
          <ul className="mt-3">
            {missing.map((i) => (
              <li
                key={i.filename}
                className="border-t border-[#B84A3E]/15 py-2.5 text-sm first:border-t-0 first:pt-0"
              >
                <span className="text-[var(--si-ink)]">{i.titleFr}</span>
                <span className="text-[var(--si-muted)]"> · {i.reference}</span>
                <p className="mt-0.5 text-[var(--si-muted)]">{i.missingReasonFr}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel className="p-4">
          <h2 className="text-base font-medium text-[var(--si-ink)]">
            Aucune pièce manquante pour cette période
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
            Cela ne vaut pas attestation de conformité. La trousse constate la présence des
            pièces, pas l'exactitude de leur contenu.
          </p>
        </Panel>
      )}

      {/* ── Le geste ───────────────────────────────────────────── */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--si-ink)]">
              Télécharger la trousse
            </h2>
            <p className="mt-0.5 text-xs text-[var(--si-muted)]">
              {cabinetName} · {present.length}{" "}
              {present.length === 1 ? "pièce" : "pièces"} · archive ZIP
            </p>
          </div>
          <a
            href={downloadUrl}
            className="rounded-lg bg-[var(--si-forest)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#123028]"
          >
            Télécharger
          </a>
        </div>
      </Panel>

      {/* ── Le contenu ─────────────────────────────────────────── */}
      {groups.map(([kind, list]) => (
        <Panel key={kind}>
          <header className="flex items-baseline justify-between gap-4 border-b border-[var(--si-line)] px-4 py-3">
            <h3 className="text-sm font-medium text-[var(--si-ink)]">
              {KIND_LABEL[kind] ?? kind}
            </h3>
            <span className="shrink-0 text-xs tabular-nums text-[var(--si-muted)]">
              {list.length} {list.length === 1 ? "pièce" : "pièces"}
            </span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--si-line)]">
                  <th scope="col" className="w-1/2 px-4 py-2.5 text-left font-medium text-[var(--si-muted)]">
                    Pièce et article
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-[var(--si-muted)]">
                    Lignes
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-[var(--si-muted)]">
                    Empreinte
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr
                    key={i.filename}
                    className="border-b border-[var(--si-line)] transition-colors last:border-b-0 hover:bg-[#0B1F19]/[0.02]"
                  >
                    <td className="max-w-0 px-4 py-3 text-[var(--si-ink)]">
                      <span className="block truncate">
                        {i.titleFr}
                        <span className="text-[var(--si-muted)]"> · {i.reference}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-[var(--si-ink)]">
                      {i.rowCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--si-muted)]">
                      {i.fingerprint ? i.fingerprint.slice(0, 12) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}

      {/* ── Le manifeste, à la demande ─────────────────────────── */}
      <Panel>
        <button
          type="button"
          onClick={() => setShowManifest((v) => !v)}
          className="flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#0B1F19]/[0.02]"
        >
          <span className="text-sm font-medium text-[var(--si-ink)]">
            {showManifest ? "Masquer le manifeste" : "Voir le manifeste"}
          </span>
          <span className="shrink-0 font-mono text-xs text-[var(--si-muted)]">
            {manifestFingerprint.slice(0, 12)}
          </span>
        </button>
        {showManifest && (
          <pre className="overflow-x-auto border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-ink)]">
            {manifest}
          </pre>
        )}
      </Panel>

      {/* ── Ce que le règlement demande ────────────────────────── */}
      {duties.length > 0 && (
        <Panel className="p-4">
          <h3 className="text-sm font-medium text-[var(--si-ink)]">
            Ce que le règlement demande
          </h3>
          <ul className="mt-2 space-y-2">
            {duties.map((d) => (
              <li key={d.reference} className="text-sm">
                <span className="text-[var(--si-muted)]">{d.reference}</span>
                <p className="mt-0.5 leading-relaxed text-[var(--si-ink)]">{d.dutyFr}</p>
              </li>
            ))}
          </ul>
          {province === "ON" && (
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
              La clause d'accès de l'article 29 québécois n'a pas d'équivalent identifié dans
              By-Law 9. SAFE ne prétend donc pas la couvrir en Ontario.
            </p>
          )}
        </Panel>
      )}

      <p className="max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
        Les empreintes SHA-256 permettent de vérifier qu'une pièce transmise n'a pas été
        modifiée depuis sa production. Elles ne sont exigées par aucun article : c'est un
        moyen, choisi ici, de rendre la trousse vérifiable.
      </p>
    </div>
  );
}
