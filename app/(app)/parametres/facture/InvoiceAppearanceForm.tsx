"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Check, AlertTriangle, Upload, Trash2 } from "lucide-react";
import { InvoicePreview } from "@/lib/invoice-template/InvoicePreview";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";
import { isAccentDarkEnough, normalizeHex, DEFAULT_ACCENT } from "@/lib/invoice-template/color";
import { updateInvoiceAppearance } from "./actions";

/** Présélections sobres et foncées (texte blanc lisible garanti). */
const PRESETS: { hex: string; labelKey: string }[] = [
  { hex: "#7A3B2E", labelKey: "presetBrown" },
  { hex: "#1E3A5F", labelKey: "presetNavy" },
  { hex: "#14532D", labelKey: "presetSpruce" },
  { hex: "#6B1F2A", labelKey: "presetBordeaux" },
  { hex: "#334155", labelKey: "presetSlate" },
  { hex: "#4A2545", labelKey: "presetPlum" },
  { hex: "#0F2A22", labelKey: "presetSafeGreen" },
  { hex: "#1F2937", labelKey: "presetCarbon" },
];

const MAX_LOGO_CHARS = 400_000;

export interface InvoiceAppearanceInitial {
  accentColor: string;
  logoUrl: string | null;
  noticeFr: string;
  noticeEn: string;
  signatureName: string;
  signatureTitleFr: string;
  signatureTitleEn: string;
}

export interface CabinetIdentityForPreview {
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  hstNumber: string | null;
  gstNumber: string | null;
  qstNumber: string | null;
  businessNumber: string | null;
}

interface Props {
  initial: InvoiceAppearanceInitial;
  cabinet: CabinetIdentityForPreview;
}

export function InvoiceAppearanceForm({ initial, cabinet }: Props) {
  const t = useTranslations("settingsUi");
  const [accent, setAccent] = useState(initial.accentColor || DEFAULT_ACCENT);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [noticeFr, setNoticeFr] = useState(initial.noticeFr);
  const [noticeEn, setNoticeEn] = useState(initial.noticeEn);
  const [sigName, setSigName] = useState(initial.signatureName);
  const [sigTitleFr, setSigTitleFr] = useState(initial.signatureTitleFr);
  const [sigTitleEn, setSigTitleEn] = useState(initial.signatureTitleEn);

  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const normalized = normalizeHex(accent);
  const accentValid = normalized !== null && isAccentDarkEnough(accent);

  // Facture-exemple pour l'aperçu — reflète les réglages courants.
  const sample = useMemo<PresentedInvoice>(() => {
    const toLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
    return {
      id: "preview",
      numero: "2026-001",
      dateEmission: new Date("2026-05-01"),
      dateEcheance: new Date("2026-06-15"),
      statut: "brouillon",
      invoiceStatus: null,
      currency: "CAD",
      isForfait: false,
      cabinet: {
        id: "preview",
        nom: cabinet.nom,
        adresse: cabinet.adresse,
        telephone: cabinet.telephone,
        email: cabinet.email,
        barreauNumero: null,
        logoUrl: logoUrl,
        taxNumbers: {
          hstNumber: cabinet.hstNumber,
          gstNumber: cabinet.gstNumber,
          qstNumber: cabinet.qstNumber,
          businessNumber: cabinet.businessNumber,
        },
        invoiceTemplate: "derisier",
        invoiceNotice: { fr: toLines(noticeFr), en: toLines(noticeEn) },
        invoiceSignature: sigName.trim()
          ? { name: sigName.trim(), title: { fr: sigTitleFr.trim(), en: sigTitleEn.trim() } }
          : null,
        invoiceAccentColor: accentValid ? (normalized as string) : DEFAULT_ACCENT,
      },
      client: {
        id: "c",
        typeClient: "personne_physique",
        raisonSociale: null,
        prenom: "Jean",
        nom: "Tremblay",
        email: "jean@example.com",
        billingAddress: "12 rue Test",
        billingCity: "Ottawa",
        billingProvince: "ON",
        billingPostalCode: "K1A 0A1",
        billingCountry: "Canada",
      },
      dossier: { id: "d", intitule: "Demande de résidence permanente — IRCC", numeroDossier: "D-1", modeFacturation: "horaire" },
      lines: [
        { id: "l1", type: "honoraires", description: "Consultation initiale et analyse du dossier", date: new Date("2026-05-01"), hours: 3, rate: 200, amount: 600, userNom: "Me Derisier", parentLineId: null, source: "invoice_line" },
        { id: "l2", type: "honoraires", description: "Préparation et soumission des formulaires IRCC", date: new Date("2026-05-08"), hours: 5, rate: 200, amount: 1000, userNom: "Me Derisier", parentLineId: null, source: "invoice_line" },
        { id: "l3", type: "debours_taxable", description: "Frais administratifs et traduction certifiée", date: new Date("2026-05-10"), hours: null, rate: null, amount: 150, userNom: null, parentLineId: null, source: "invoice_line" },
      ],
      totals: {
        subtotalTaxable: 1750,
        tps: 227.5,
        tvq: 0,
        hst: 227.5,
        taxRegime: "HST",
        deboursNonTaxableTotal: 0,
        montantTotal: 1977.5,
        montantPaye: 0,
        balanceDue: 1977.5,
        totalRabais: 0,
      },
    } as unknown as PresentedInvoice;
  }, [cabinet, logoUrl, noticeFr, noticeEn, sigName, sigTitleFr, sigTitleEn, accentValid, normalized]);

  const onPickLogo = (file: File | null) => {
    setLogoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError(t("logoErrorNotImage"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = String(reader.result);
      if (dataUri.length > MAX_LOGO_CHARS) {
        setLogoError(t("logoErrorTooLarge"));
        return;
      }
      setLogoUrl(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async () => {
    setError(null);
    setSavedOk(false);
    if (!accentValid) {
      setError(t("accentErrorTooLight"));
      return;
    }
    setSaving(true);
    try {
      const res = await updateInvoiceAppearance({
        accentColor: normalized as string,
        logoUrl: logoUrl ?? "",
        noticeFr: noticeFr.split("\n").map((l) => l.trim()).filter(Boolean),
        noticeEn: noticeEn.split("\n").map((l) => l.trim()).filter(Boolean),
        signatureName: sigName,
        signatureTitleFr: sigTitleFr,
        signatureTitleEn: sigTitleEn,
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        setSavedOk(true);
      }
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      {/* Colonne réglages */}
      <div className="space-y-6">
        {/* Couleur d'accent */}
        <Card>
          <CardHeader title={t("accentColorTitle")} />
          <CardContent className="space-y-4">
            <p className="text-sm safe-text-secondary">
              {t("accentColorHelp")}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const isActive = normalizeHex(accent) === normalizeHex(p.hex);
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setAccent(p.hex)}
                    title={t(p.labelKey)}
                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 ${
                      isActive ? "border-neutral-900 ring-2 ring-neutral-300" : "border-white shadow"
                    }`}
                    style={{ backgroundColor: p.hex }}
                    aria-label={t(p.labelKey)}
                  />
                );
              })}
            </div>
            <div className="flex items-end gap-3">
              <Input
                label={t("accentColorHexLabel")}
                name="accentColor"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="#7A3B2E"
                className="font-mono"
              />
              <div
                className="h-10 w-10 shrink-0 rounded-safe-sm border border-neutral-border"
                style={{ backgroundColor: accentValid ? (normalized as string) : "#FFFFFF" }}
              />
            </div>
            {!accentValid && (
              <p className="flex items-center gap-1.5 text-xs text-status-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("accentInvalidWarning")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader title={t("logoTitle")} />
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-safe-sm border border-neutral-border bg-neutral-50 overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={t("logoAlt")} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs safe-text-secondary">{t("logoNone")}</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {t("logoChoose")}
                </Button>
                {logoUrl && (
                  <Button type="button" variant="ghost" className="gap-2" onClick={() => setLogoUrl(null)}>
                    <Trash2 className="h-4 w-4" /> {t("logoRemove")}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs safe-text-secondary">{t("logoHint")}</p>
            {logoError && <p className="text-xs text-status-error">{logoError}</p>}
          </CardContent>
        </Card>

        {/* Mentions N.B. */}
        <Card>
          <CardHeader title={t("noticeTitle")} />
          <CardContent className="space-y-3">
            <p className="text-xs safe-text-secondary">{t("noticeHint")}</p>
            <div>
              <label className="block text-sm font-medium safe-text-title mb-1">{t("noticeLangFr")}</label>
              <textarea
                value={noticeFr}
                onChange={(e) => setNoticeFr(e.target.value)}
                rows={4}
                className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm"
                placeholder={t("noticePlaceholderFr")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium safe-text-title mb-1">{t("noticeLangEn")}</label>
              <textarea
                value={noticeEn}
                onChange={(e) => setNoticeEn(e.target.value)}
                rows={4}
                className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm"
                placeholder={t("noticePlaceholderEn")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader title={t("signatureTitle")} />
          <CardContent className="space-y-3">
            <Input label={t("signatureNameLabel")} name="signatureName" value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="Marjorie-Alexandra Derisier" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={t("signatureTitleFrLabel")} name="signatureTitleFr" value={sigTitleFr} onChange={(e) => setSigTitleFr(e.target.value)} placeholder={t("signatureTitleFrPlaceholder")} />
              <Input label={t("signatureTitleEnLabel")} name="signatureTitleEn" value={sigTitleEn} onChange={(e) => setSigTitleEn(e.target.value)} placeholder={t("signatureTitleEnPlaceholder")} />
            </div>
            <p className="text-xs safe-text-secondary">{t("signatureHint")}</p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={onSubmit} disabled={saving || !accentValid} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("save")}
          </Button>
          {savedOk && (
            <span className="flex items-center gap-1.5 text-sm text-status-success">
              <Check className="h-4 w-4" /> {t("saved")}
            </span>
          )}
          {error && <span className="text-sm text-status-error">{error}</span>}
        </div>
      </div>

      {/* Colonne aperçu */}
      <div className="lg:sticky lg:top-6">
        <Card>
          <CardHeader title={t("livePreviewTitle")} />
          <CardContent>
            <div className="border border-neutral-border rounded-safe-sm overflow-hidden bg-neutral-50">
              <InvoicePreview invoice={sample} language="fr" showSignature className="min-h-[640px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
