"use client";

import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Receipt,
  Wallet,
  Calculator,
  CalendarClock,
  ListChecks,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { CATALOG } from "@/lib/catalog/catalog";
import {
  composeInterface,
  suggestToolsForDomains,
} from "@/lib/catalog/compose-menu";
import type { Domaine } from "@/lib/catalog/types";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  FolderOpen,
  Receipt,
  Wallet,
  Calculator,
  CalendarClock,
  ListChecks,
};

const DOMAINS: { id: Domaine; label: string }[] = [
  { id: "famille", label: "Droit de la famille" },
  { id: "immobilier", label: "Immobilier" },
  { id: "immigration", label: "Immigration" },
];

function StatusBadge({ status }: { status: "ga" | "beta" | "custom" }) {
  const map = {
    ga: "bg-si-verified/10 text-si-verified",
    beta: "bg-si-amber/[0.13] text-si-amber-ink",
    custom: "bg-violet-100 text-violet-700",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${map[status]}`}
    >
      {status}
    </span>
  );
}

function KindBadge({ kind }: { kind: "page" | "widget" | "action" }) {
  const map = {
    page: "bg-sky-100 text-sky-700",
    widget: "bg-si-line text-si-ink",
    action: "bg-si-amber/[0.13] text-si-amber-ink",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${map[kind]}`}>
      {kind}
    </span>
  );
}

export function CatalogueDemoView() {
  // Manifeste initial : un cabinet "famille" pré-coché (ce que l'audit produirait).
  const [activated, setActivated] = useState<Set<string>>(
    () => new Set(suggestToolsForDomains(CATALOG, ["famille"])),
  );

  const toggle = (id: string) =>
    setActivated((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const applyDomainPreset = (domain: Domaine) =>
    setActivated(new Set(suggestToolsForDomains(CATALOG, [domain])));

  const composed = useMemo(
    () => composeInterface(CATALOG, Array.from(activated)),
    [activated],
  );

  const manifest = useMemo(
    () =>
      JSON.stringify(
        { activatedToolIds: Array.from(activated).sort() },
        null,
        2,
      ),
    [activated],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* ── Colonne gauche : le menu COMPOSÉ (le résultat) ──────────────── */}
      <div className="space-y-3">
        <div className="rounded-lg border border-si-line bg-si-surface p-3">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-si-muted">
            Menu du cabinet (composé)
          </p>
          <nav className="space-y-3">
            {composed.menu.map((group) => (
              <div key={group.id}>
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-si-muted">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon ? ICONS[item.icon] ?? Wrench : Wrench;
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-si-ink hover:bg-si-canvas/60"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-si-muted" strokeWidth={1.5} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.status !== "ga" && <StatusBadge status={item.status} />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {composed.missingDependencies.length > 0 && (
          <div className="rounded-md border border-[#B84A3E]/30 bg-[#B84A3E]/10 p-3 text-xs text-[#B84A3E]">
            <p className="font-semibold">Dépendances manquantes</p>
            <ul className="mt-1 list-disc pl-4">
              {composed.missingDependencies.map((d) => (
                <li key={d.toolId}>
                  <code>{d.toolId}</code> requiert : {d.missing.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {composed.injections.length > 0 && (
          <div className="rounded-md border border-si-line bg-si-canvas p-3 text-xs text-si-ink">
            <p className="font-semibold text-si-muted">
              Widgets / actions injectés (hors menu)
            </p>
            <ul className="mt-1 space-y-1">
              {composed.injections.map((inj) => (
                <li key={inj.toolId} className="flex items-center gap-1.5">
                  <KindBadge kind={inj.kind} />
                  <span className="truncate">{inj.label}</span>
                  <span className="text-si-muted">
                    → {inj.host}/{inj.slotOrLocation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Colonne droite : le CATALOGUE (la bibliothèque) ─────────────── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-si-muted">
            Simuler un audit :
          </span>
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => applyDomainPreset(d.id)}
              className="rounded-full border border-si-line bg-si-surface px-3 py-1 text-xs font-medium text-si-ink transition hover:border-si-verified/50 hover:bg-si-verified/10"
            >
              Cabinet « {d.label} »
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-si-line bg-si-surface">
          <div className="border-b border-si-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-si-muted">
            Bibliothèque interne ({CATALOG.length} outils) — cochez pour activer
          </div>
          <ul className="divide-y divide-si-line">
            {CATALOG.map((tool) => {
              const on = activated.has(tool.id);
              return (
                <li key={tool.id} className="px-4 py-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(tool.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-si-ink">
                          {tool.label}
                        </span>
                        <KindBadge kind={tool.placement.kind} />
                        <StatusBadge status={tool.status} />
                        {tool.domains.length === 0 ? (
                          <span className="rounded bg-si-canvas px-1.5 py-0.5 text-[10px] text-si-muted">
                            cœur
                          </span>
                        ) : (
                          tool.domains.map((d) => (
                            <span
                              key={d}
                              className="rounded bg-si-verified/10 px-1.5 py-0.5 text-[10px] text-si-verified"
                            >
                              {d}
                            </span>
                          ))
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-si-muted">
                        {tool.description}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-si-muted">
                        {tool.placement.kind === "page" && (
                          <span>
                            placement : menu « {tool.placement.group} » (#
                            {tool.placement.order})
                          </span>
                        )}
                        {tool.placement.kind === "widget" && (
                          <span>
                            injecté dans : {tool.placement.host}/{tool.placement.slot}
                          </span>
                        )}
                        {tool.placement.kind === "action" && (
                          <span>
                            action sur : {tool.placement.host}/
                            {tool.placement.location}
                          </span>
                        )}
                        {tool.requires?.length ? (
                          <span>requiert : {tool.requires.join(", ")}</span>
                        ) : null}
                        {tool.seeds?.length ? (
                          <span>seeds : {tool.seeds.join(", ")}</span>
                        ) : null}
                        {tool.compliance?.length ? (
                          <span className="text-si-amber-ink">
                            conformité : {tool.compliance.join(" · ")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <details className="rounded-lg border border-si-line bg-si-canvas">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-si-muted">
            Manifeste d'activation (ce que la Console générerait)
          </summary>
          <pre className="overflow-x-auto px-4 pb-4 text-xs text-si-ink">
            {manifest}
          </pre>
        </details>
      </div>
    </div>
  );
}
