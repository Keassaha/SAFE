"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ClipboardList,
  Baby,
  CircleDollarSign,
  Landmark,
  AlertTriangle,
  FileSignature,
  PenLine,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  WIZARD_CATEGORIES,
  WIZARD_FIELD_DEFS,
  WIZARD_STEPS,
  WIZARD_COLORS as C,
} from "@/lib/documents/famille/wizard-data";
import { generateDocumentWithFormData } from "@/lib/documents/famille/actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  divorce: ClipboardList,
  garde: Baby,
  pension: CircleDollarSign,
  patrimoine: Landmark,
  urgence: AlertTriangle,
  entente: FileSignature,
  correspondance: PenLine,
  special: BookOpen,
};

function CategoryIcon({ iconKey, color, size = 28 }: { iconKey: string; color: string; size?: number }) {
  const IconComponent = CATEGORY_ICONS[iconKey];
  if (!IconComponent) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color }}>
      <IconComponent size={size} strokeWidth={1.8} />
    </span>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────
function Ico({ name, sz = 18 }: { name: string; sz?: number }) {
  const p = { width: sz, height: sz, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    chevR: <polyline points="9 18 15 12 9 6"/>,
    chevL: <polyline points="15 18 9 12 15 6"/>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    sparkle: <><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  };
  return <svg {...p}>{icons[name]}</svg>;
}

// ─── TextInput ──────────────────────────────────────────────────────────
function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline,
  options,
}: {
  label?: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  options?: string[];
}) {
  const base: React.CSSProperties = { width: "100%", padding: multiline ? "12px 14px" : "10px 14px", borderRadius: 12, border: `1px solid ${C.sl100}`, background: C.white, fontSize: 13.5, color: C.sl800, fontFamily: "inherit", outline: "none", transition: "border-color .2s", resize: multiline ? "vertical" : "none" };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.sl400, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</label>}
      {options ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }}>
          <option value="">— Sélectionner —</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : multiline ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} style={base} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────
export function SafeDocGeneratorWizard() {
  const [step, setStep] = useState(0);
  const [catId, setCatId] = useState<string | null>(null);
  const [tplId, setTplId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const category = useMemo(() => WIZARD_CATEGORIES.find((c) => c.id === catId), [catId]);
  const template = useMemo(() => category?.templates.find((t) => t.id === tplId) ?? null, [category, tplId]);

  const filteredCategories = useMemo(() => {
    if (!searchQ.trim()) return WIZARD_CATEGORIES;
    const q = searchQ.toLowerCase();
    return WIZARD_CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.templates.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [searchQ]);

  const updateField = useCallback((path: string, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev };
      const parts = path.split(".");
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!obj[key] || typeof obj[key] !== "object") obj[key] = {};
        obj = obj[key] as Record<string, unknown>;
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  }, []);

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    setError(null);
    const result = await generateDocumentWithFormData({
      template: { name: template.name, form: template.form, ref: template.ref },
      formData,
      customInstructions: customInstructions || undefined,
    });
    if (result.ok) {
      setGeneratedDoc(result.content);
      setStep(4);
    } else {
      setError(result.error);
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
  };

  const handleReset = () => {
    setStep(0);
    setCatId(null);
    setTplId(null);
    setFormData({});
    setCustomInstructions("");
    setGeneratedDoc("");
    setError(null);
    setHoveredCard(null);
  };

  const an = (d = 0) => ({
    opacity: 1,
    transform: "translateY(0)",
    transition: `all .5s cubic-bezier(.16,1,.3,1) ${d}s`,
  });

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={an(0.05)}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.sl100}`, background: C.white, maxWidth: 400 }}>
                <span style={{ color: C.sl400 }}><Ico name="search" sz={18}/></span>
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Rechercher une catégorie..."
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: C.sl800, fontFamily: "inherit" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredCategories.map((cat) => {
                const isHover = hoveredCard === `cat-${cat.id}`;
                return (
                  <div
                    key={cat.id}
                    onClick={() => { setCatId(cat.id); setStep(1); }}
                    onMouseEnter={() => setHoveredCard(`cat-${cat.id}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && (setCatId(cat.id), setStep(1))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: isHover ? `${cat.color}08` : C.white,
                      border: `1px solid ${isHover ? `${cat.color}30` : C.sl100}`,
                      transition: "all .2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: `${cat.color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon iconKey={cat.icon} color={cat.color} size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.sl900 }}>{cat.label}</div>
                      <div style={{ fontSize: 12, color: C.sl400, marginTop: 2 }}>{cat.templates.length} modèles</div>
                    </div>
                    <span style={{ color: C.sl300, flexShrink: 0 }}><Ico name="chevR" sz={18}/></span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 1:
        if (!category) return null;
        return (
          <div style={an(0.05)}>
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${category.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon iconKey={category.icon} color={category.color} size={20} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.sl900 }}>{category.label}</div>
                <div style={{ fontSize: 12, color: C.sl400 }}>{category.templates.length} modèles disponibles</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {category.templates.map((tpl) => {
                const isHover = hoveredCard === `tpl-${tpl.id}`;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => { setTplId(tpl.id); setStep(2); }}
                    onMouseEnter={() => setHoveredCard(`tpl-${tpl.id}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && (setTplId(tpl.id), setStep(2))}
                    style={{
                      padding: "16px 20px", borderRadius: 14, cursor: "pointer",
                      background: isHover ? C.white : "transparent",
                      border: `1px solid ${isHover ? `${C.bl400}30` : C.sl100}`,
                      boxShadow: isHover ? "0 4px 16px rgba(0,0,0,.04)" : "none",
                      transition: "all .3s", display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.sl900 }}>{tpl.name}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        {tpl.form !== "—" && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: C.bl100, color: C.bl600 }}>{tpl.form}</span>}
                        <span style={{ fontSize: 11, color: C.sl400 }}>{tpl.ref}</span>
                      </div>
                    </div>
                    <span style={{ color: C.sl300, transition: "transform .2s", transform: isHover ? "translateX(3px)" : "none" }}><Ico name="chevR" sz={16}/></span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 2:
        if (!template) return null;
        return (
          <div style={an(0.05)}>
            <div style={{ marginBottom: 20, padding: 18, borderRadius: 14, background: C.bl100, border: `1px solid ${C.bl200}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.bl700 }}>{template.name}</div>
              <div style={{ fontSize: 12, color: C.bl600, marginTop: 3 }}>{template.ref}</div>
              {template.form !== "—" && <div style={{ fontSize: 11, fontWeight: 600, color: C.bl500, marginTop: 3 }}>Formulaire: {template.form}</div>}
            </div>

            <TextInput label="District judiciaire" value={formData._district as string} onChange={(v) => updateField("_district", v)} placeholder="ex: Montréal, Gatineau, Québec..." />

            {template.fields.map((fieldKey) => {
              const def = WIZARD_FIELD_DEFS[fieldKey];
              if (!def) return <TextInput key={fieldKey} label={fieldKey} value={formData[fieldKey] as string} onChange={(v) => updateField(fieldKey, v)} />;

              if (def.type === "group" && def.fields) {
                return (
                  <div key={fieldKey} style={{ padding: 18, borderRadius: 14, border: `1px solid ${C.sl100}`, background: C.sl50, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.sl600, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>{def.label}</div>
                    {def.fields.map((f) => (
                      <TextInput
                        key={f.key}
                        label={f.label}
                        type={f.type}
                        value={(formData[fieldKey] as Record<string, string>)?.[f.key] as string}
                        onChange={(v) => updateField(`${fieldKey}.${f.key}`, v)}
                        options={f.options}
                        placeholder={f.placeholder}
                      />
                    ))}
                  </div>
                );
              }
              if (def.type === "textarea") {
                return <TextInput key={fieldKey} label={def.label} value={formData[fieldKey] as string} onChange={(v) => updateField(fieldKey, v)} multiline placeholder={def.placeholder} />;
              }
              if (def.type === "select" && def.options) {
                return <TextInput key={fieldKey} label={def.label} value={formData[fieldKey] as string} onChange={(v) => updateField(fieldKey, v)} options={def.options} />;
              }
              if (def.type === "number") {
                return <TextInput key={fieldKey} label={def.label} value={formData[fieldKey] as string} onChange={(v) => updateField(fieldKey, v)} type="number" placeholder="0.00" />;
              }
              if (def.type === "repeater" && def.fields) {
                const items = (formData[`${fieldKey}_items`] as Record<string, unknown>[]) || [{}];
                return (
                  <div key={fieldKey} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.sl600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>{def.label}</div>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ padding: 16, borderRadius: 12, border: `1px solid ${C.sl100}`, background: C.sl50, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.sl400, marginBottom: 8 }}>Enfant {idx + 1}</div>
                        {def.fields?.map((f) => (
                          <TextInput
                            key={f.key}
                            label={f.label}
                            type={f.type}
                            value={item[f.key] as string}
                            onChange={(v) => {
                              const next = [...items];
                              next[idx] = { ...next[idx], [f.key]: v };
                              updateField(`${fieldKey}_items`, next);
                            }}
                            options={f.options}
                          />
                        ))}
                      </div>
                    ))}
                    <Button variant="tertiary" type="button" onClick={() => updateField(`${fieldKey}_items`, [...items, {}])} className="text-sm">+ Ajouter un enfant</Button>
                  </div>
                );
              }
              return <TextInput key={fieldKey} label={def.label} value={formData[fieldKey] as string} onChange={(v) => updateField(fieldKey, v)} placeholder={def.placeholder} />;
            })}
          </div>
        );

      case 3:
        if (!template) return null;
        return (
          <div style={an(0.05)}>
            <div style={{ padding: 20, borderRadius: 16, background: `linear-gradient(135deg, ${C.bl500}08, ${C.purple}08)`, border: `1px solid ${C.bl200}`, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: C.bl500 }}><Ico name="sparkle" sz={20}/></span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.sl900 }}>Rédaction assistée par IA</span>
              </div>
              <div style={{ fontSize: 13, color: C.sl500, lineHeight: 1.6 }}>
                Claude va rédiger votre document en utilisant les informations saisies et les modèles du droit familial québécois. Vous pourrez réviser et modifier le résultat avant de l&apos;utiliser.
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 14, background: C.warnBg, border: `1px solid ${C.warn}25`, marginBottom: 20, display: "flex", gap: 10 }}>
              <span style={{ color: C.warn, flexShrink: 0, marginTop: 2 }}><Ico name="alert" sz={16}/></span>
              <div style={{ fontSize: 12, color: C.sl700, lineHeight: 1.6 }}>
                <strong>Avertissement Barreau du Québec</strong> — Ce document sera préparé avec l&apos;assistance d&apos;intelligence artificielle générative. Conformément au Guide pratique du Barreau (oct. 2024), une révision professionnelle complète est obligatoire avant toute utilisation.
              </div>
            </div>

            <TextInput
              label="Instructions supplémentaires pour l'IA (optionnel)"
              value={customInstructions}
              onChange={setCustomInstructions}
              multiline
              placeholder="Ex: Insister sur l'urgence de la situation, mentionner la jurisprudence..."
            />

            <div style={{ padding: 16, borderRadius: 14, border: `1px solid ${C.sl100}`, background: C.sl50, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.sl600, marginBottom: 10 }}>Résumé du document</div>
              <div style={{ fontSize: 13, color: C.sl700 }}>
                <strong>{template.name}</strong><br />
                District : {(formData._district as string) || "Non spécifié"}<br />
                Réf. : {template.ref}<br />
                Champs remplis : {Object.keys(formData).filter((k) => formData[k] !== undefined && formData[k] !== "" && formData[k] !== null).length}
              </div>
            </div>

            {error && (
              <div style={{ padding: 14, borderRadius: 12, background: C.badBg, border: `1px solid ${C.bad}20`, marginBottom: 16, fontSize: 13, color: C.bad }}>
                Erreur : {error}
              </div>
            )}

            <Button variant="primary" type="button" onClick={handleGenerate} disabled={generating} className="w-full justify-center">
              <Sparkles className="w-4 h-4 mr-2 inline-block" aria-hidden />
              {generating ? "Génération en cours..." : "Générer le document avec Claude"}
            </Button>
          </div>
        );

      case 4:
        return (
          <div style={an(0.05)}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <Button variant="secondary" type="button" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2 inline-block" aria-hidden />
                Copier
              </Button>
              <Button variant="secondary" type="button" onClick={() => setStep(3)}>
                <RefreshCw className="w-4 h-4 mr-2 inline-block" aria-hidden />
                Régénérer
              </Button>
            </div>

            <div style={{ padding: 16, borderRadius: 14, background: C.warnBg, border: `1px solid ${C.warn}20`, marginBottom: 16, display: "flex", gap: 8, fontSize: 11, color: C.sl700 }}>
              <span style={{ color: C.warn }}><Ico name="alert" sz={14}/></span>
              Document préparé avec assistance IA — révision professionnelle obligatoire avant utilisation
            </div>

            <div
              style={{
                padding: "32px 36px", borderRadius: 16, background: C.white, border: `1px solid ${C.sl100}`,
                boxShadow: "0 2px 12px rgba(0,0,0,.04)", fontSize: 14, lineHeight: 1.8, color: C.sl800,
                whiteSpace: "pre-wrap", minHeight: 400, maxHeight: "60vh", overflow: "auto",
              }}
            >
              {generatedDoc || "Aucun document généré."}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="px-6 pt-5 pb-4 border-b border-[var(--safe-neutral-border)]/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold safe-text-title tracking-tight">Progression</h2>
            {step > 0 && (
              <Button variant="tertiary" type="button" onClick={handleReset} className="text-sm">
                Nouveau document
              </Button>
            )}
          </div>
          <nav aria-label="Progression du wizard" className="flex items-center gap-0">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      i <= step
                        ? "bg-green-600 text-white"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      i <= step ? "text-[var(--safe-text-title)]" : "text-neutral-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div
                    className="mx-1.5 h-0.5 w-5 shrink-0 self-end mb-4 bg-[var(--safe-neutral-border)]"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </nav>
        </div>
        <CardContent className="pt-4">
          {step > 0 && step < 4 && (
            <div className="flex justify-between mb-5">
              <Button variant="tertiary" type="button" onClick={() => setStep(Math.max(0, step - 1))} className="text-sm">
                <ChevronLeft className="w-4 h-4 mr-1 inline-block" aria-hidden />
                Retour
              </Button>
              {step === 2 && (
                <Button type="button" onClick={() => setStep(3)} className="text-sm">
                  Continuer vers l&apos;IA
                  <ChevronRight className="w-4 h-4 ml-1 inline-block" aria-hidden />
                </Button>
              )}
            </div>
          )}
          <div className="min-h-[280px]">{renderStep()}</div>
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-xs text-neutral-500">
        SAFE — Propulsé par Claude (Anthropic) — Conforme Guide IA Barreau du Québec (oct. 2024)
      </p>
    </div>
  );
}
