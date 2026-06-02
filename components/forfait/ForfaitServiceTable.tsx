"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/format";
import { Plus, Pencil, Check, X } from "lucide-react";

interface ForfaitService {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  montant: number;
  categorie: string | null;
  sousType: string | null;
  taxable: boolean;
  actif: boolean;
}

interface EditState { id: string; field: string; value: string }

export function ForfaitServiceTable() {
  const queryClient = useQueryClient();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({ code: "", nom: "", montant: "", categorie: "", taxable: true });

  const { data } = useQuery({
    queryKey: ["forfait-services"],
    queryFn: async () => {
      const res = await fetch("/api/forfait-services");
      if (!res.ok) return { services: [] };
      return res.json() as Promise<{ services: ForfaitService[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { id: string; field: string; value: unknown }) => {
      const res = await fetch("/api/forfait-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: params.id, [params.field]: params.value }),
      });
      if (!res.ok) throw new Error("Error updating");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forfait-services"] });
      setEditState(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/forfait-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newService.code,
          nom: newService.nom,
          montant: parseFloat(newService.montant),
          categorie: newService.categorie || undefined,
          taxable: newService.taxable,
        }),
      });
      if (!res.ok) throw new Error("Error creating");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forfait-services"] });
      setShowAdd(false);
      setNewService({ code: "", nom: "", montant: "", categorie: "", taxable: true });
    },
  });

  const services = data?.services ?? [];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Fee Schedule</h3>
          <Button variant="secondary" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-3 h-3" /> Add Service
          </Button>
        </div>

        {showAdd && (
          <div className="mb-4 p-3 bg-neutral-50 rounded-safe border space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input label="Code" value={newService.code} onChange={e => setNewService({ ...newService, code: e.target.value })} placeholder="IMMO-ACHAT" />
              <Input label="Service Name" value={newService.nom} onChange={e => setNewService({ ...newService, nom: e.target.value })} placeholder="Real estate purchase" />
              <Input label="Price ($)" type="number" step="0.01" value={newService.montant} onChange={e => setNewService({ ...newService, montant: e.target.value })} placeholder="1500.00" />
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Category</label>
                <select
                  value={newService.categorie}
                  onChange={e => setNewService({ ...newService, categorie: e.target.value })}
                  className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
                >
                  <option value="">General</option>
                  <option value="immobilier">Real Estate</option>
                  <option value="immigration">Immigration</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newService.taxable} onChange={e => setNewService({ ...newService, taxable: e.target.checked })} className="rounded" />
                Taxable (HST 13%)
              </label>
              <Button variant="primary" onClick={() => createMutation.mutate()} disabled={!newService.code || !newService.nom || !newService.montant}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm [&_th]:px-3 [&_td]:px-3 [&_th:first-child]:pl-0 [&_td:first-child]:pl-0 [&_th:last-child]:pr-0 [&_td:last-child]:pr-0">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium w-24">Code</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium w-20">Category</th>
                <th className="pb-2 font-medium w-28 text-right">Price</th>
                <th className="pb-2 font-medium w-16 text-center">Tax</th>
                <th className="pb-2 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-neutral-50">
                  <td className="py-2 font-mono text-xs text-neutral-500">{s.code}</td>
                  <td className="py-2 font-medium">{s.nom}</td>
                  <td className="py-2 text-xs text-neutral-500">{s.categorie ?? "—"}</td>
                  <td className="py-2 text-right tabular-nums">
                    {editState?.id === s.id && editState.field === "montant" ? (
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number" step="0.01"
                          className="w-24 h-7 px-2 rounded border border-primary-400 bg-white text-sm text-right"
                          value={editState.value}
                          onChange={e => setEditState({ ...editState, value: e.target.value })}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === "Enter") updateMutation.mutate({ id: s.id, field: "montant", value: parseFloat(editState.value) });
                            if (e.key === "Escape") setEditState(null);
                          }}
                        />
                        <button onClick={() => updateMutation.mutate({ id: s.id, field: "montant", value: parseFloat(editState.value) })} className="text-green-600"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditState(null)} className="text-neutral-400"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary-600 hover:underline"
                        onClick={() => setEditState({ id: s.id, field: "montant", value: String(s.montant) })}
                      >
                        {formatCurrency(s.montant)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    <span className={`text-xs ${s.taxable ? "text-green-600" : "text-neutral-400"}`}>
                      {s.taxable ? "HST" : "—"}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => setEditState({ id: s.id, field: "montant", value: String(s.montant) })}
                      className="text-neutral-400 hover:text-primary-600"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-neutral-400">No services configured. Add your first service above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
