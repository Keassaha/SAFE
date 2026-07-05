"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Users, Trash2, Plus, Loader2 } from "lucide-react";

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-si-line bg-si-canvas/80 text-sm text-si-ink focus:bg-si-surface focus:ring-2 focus:ring-si-verified/20 focus:border-si-verified outline-none transition-all";

type ClientOpt = { id: string; raisonSociale: string | null; prenom: string | null; nom: string | null };

export interface PayerRuleRow {
  id: string;
  payerEmail: string | null;
  payerName: string | null;
  clientId: string | null;
  scope: "CLIENT_UNIQUE" | "PAYEUR_CONNU";
  note: string | null;
  active: boolean;
  source: string | null;
  clientLabel: string | null;
}

function clientLabel(c: ClientOpt) {
  return (
    c.raisonSociale?.trim() ||
    [c.prenom, c.nom].filter(Boolean).join(" ").trim() ||
    "Client sans nom"
  );
}

export function PayeursReglesView({
  initialRules,
  clients,
}: {
  initialRules: PayerRuleRow[];
  clients: ClientOpt[];
}) {
  const t = useTranslations("payerRules");
  const tc = useTranslations("common");
  const [rules, setRules] = useState<PayerRuleRow[]>(initialRules);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Formulaire de création
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");
  const [clientId, setClientId] = useState("");
  const [scope, setScope] = useState<"CLIENT_UNIQUE" | "PAYEUR_CONNU">("CLIENT_UNIQUE");
  const [note, setNote] = useState("");

  async function refresh() {
    const res = await fetch("/api/facturation/payeurs-regles");
    if (res.ok) {
      const data = await res.json();
      setRules(
        (data.rules ?? []).map((r: PayerRuleRow & { client?: { raisonSociale: string | null; prenom: string | null; nom: string | null } | null }) => ({
          ...r,
          clientLabel: r.client
            ? r.client.raisonSociale?.trim() || [r.client.prenom, r.client.nom].filter(Boolean).join(" ").trim() || null
            : null,
        })),
      );
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/facturation/payeurs-regles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerEmail: payerEmail || undefined,
          payerName: payerName || undefined,
          clientId: clientId || undefined,
          scope,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("createError"));
      setPayerEmail("");
      setPayerName("");
      setClientId("");
      setNote("");
      setScope("CLIENT_UNIQUE");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(rule: PayerRuleRow) {
    await fetch(`/api/facturation/payeurs-regles/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
    await refresh();
  }

  async function remove(rule: PayerRuleRow) {
    await fetch(`/api/facturation/payeurs-regles/${rule.id}`, { method: "DELETE" });
    await refresh();
  }

  const canSubmit = (payerEmail.trim() || payerName.trim()) && (scope !== "CLIENT_UNIQUE" || clientId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t("addRule")} />
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={t("payerEmailLabel")} value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="ex: papa@courriel.com" />
              <Input label={t("payerNameLabel")} value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder={tc("optional")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-si-muted">{t("scopeLabel")}</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as "CLIENT_UNIQUE" | "PAYEUR_CONNU")} className={selectClass}>
                <option value="CLIENT_UNIQUE">{t("scopeClientUnique")}</option>
                <option value="PAYEUR_CONNU">{t("scopeKnownPayer")}</option>
              </select>
              <p className="mt-1 text-xs text-si-muted">
                {scope === "CLIENT_UNIQUE" ? t("scopeClientUniqueHint") : t("scopeKnownPayerHint")}
              </p>
            </div>
            {scope === "CLIENT_UNIQUE" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-si-muted">{t("clientLabel")} *</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={selectClass}>
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {clientLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Input label={t("noteLabel")} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tc("optional")} />
            {error && <p className="text-sm text-[#B84A3E]">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit || busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" />{t("save")}</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("payerRulesTitle")} />
        <CardContent>
          {rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-si-muted">{t("payerRulesEmpty")}</p>
          ) : (
            <ul className="divide-y divide-si-line">
              {rules.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-si-canvas text-si-muted">
                      <Users className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-si-ink">
                        {r.payerEmail || r.payerName || "—"}
                        {r.source === "appris" && (
                          <span className="ml-2 rounded-full bg-si-verified/10 px-2 py-0.5 text-[10px] font-medium text-si-verified">
                            {t("learnedBadge")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-si-muted">
                        {r.scope === "CLIENT_UNIQUE" ? t("scopeClientUnique") : t("scopeKnownPayer")}
                        {r.clientLabel ? ` → ${r.clientLabel}` : ""}
                        {r.note ? ` · ${r.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.active ? "bg-si-verified/10 text-si-verified" : "bg-si-canvas text-si-muted"}`}>
                      {r.active ? t("active") : t("inactive")}
                    </span>
                    <Button type="button" variant="tertiary" className="!px-2 !py-1" onClick={() => toggleActive(r)}>
                      {r.active ? t("deactivate") : t("reactivate")}
                    </Button>
                    <Button type="button" variant="tertiary" className="!px-2 !py-1 min-w-0" onClick={() => remove(r)} aria-label={t("deleteRule")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
