"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { routes } from "@/lib/routes";
import { generateDocumentForDossier } from "@/lib/documents/famille/actions";
import type { DocumentCategoryRecord } from "@/lib/documents/famille/taxonomy";

type DossierOption = { id: string; intitule: string; clientName: string; reference: string | null };

export function GenerateurDocumentsForm({
  dossiers,
  categories,
  cabinetId,
  userId,
}: {
  dossiers: DossierOption[];
  categories: DocumentCategoryRecord[];
  cabinetId: string;
  userId: string;
}) {
  const [dossierId, setDossierId] = useState("");
  const [documentTypeCode, setDocumentTypeCode] = useState("");
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [saveToDossier, setSaveToDossier] = useState(false);
  const [result, setResult] = useState<{ content?: string; documentId?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const allTypes = categories.flatMap((cat) =>
    cat.types.map((t) => ({ ...t, categoryName: cat.nameFr }))
  );
  const selectedType = allTypes.find((t) => t.code === documentTypeCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierId || !documentTypeCode) return;
    setResult(null);
    startTransition(async () => {
      const res = await generateDocumentForDossier({
        cabinetId,
        userId,
        dossierId,
        documentTypeCode,
        language,
        saveToDossier,
      });
      if (res.ok) {
        setResult({ content: res.content, documentId: res.documentId });
      } else {
        setResult({ error: res.error });
      }
    });
  };

  const inputBase =
    "w-full rounded-safe border border-[var(--safe-neutral-border)] bg-white px-3 py-2 text-sm text-[var(--safe-text-title)] placeholder:text-[var(--safe-text-secondary)] focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader
          title="Paramètres"
        />
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--safe-text-secondary)] -mt-2">
            Choisissez un dossier et un type de document. Le document généré devra être révisé par un professionnel avant toute utilisation.
          </p>
          <div>
            <label htmlFor="dossier" className="block text-sm font-medium text-[var(--safe-text-title)] mb-1">
              Dossier
            </label>
            <select
              id="dossier"
              value={dossierId}
              onChange={(e) => setDossierId(e.target.value)}
              className={inputBase}
              required
            >
              <option value="">— Sélectionner un dossier —</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.reference ? `${d.reference} — ` : ""}{d.intitule} ({d.clientName})
                </option>
              ))}
            </select>
            {dossiers.length === 0 && (
              <p className="mt-1 text-xs text-[var(--safe-text-secondary)]">
                Aucun dossier actif. Créez un dossier ou ouvrez-en un depuis la liste des dossiers.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-[var(--safe-text-title)] mb-1">
              Type de document
            </label>
            <select
              id="documentType"
              value={documentTypeCode}
              onChange={(e) => setDocumentTypeCode(e.target.value)}
              className={inputBase}
              required
            >
              <option value="">— Sélectionner un type —</option>
              {categories.map((cat) => (
                <optgroup key={cat.code} label={cat.nameFr}>
                  {cat.types.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.nameFr} {t.formRef ? `(${t.formRef})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedType && (
              <p className="mt-1 text-xs text-[var(--safe-text-secondary)]">
                Base légale : {selectedType.legalBasis}
              </p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-[var(--safe-text-title)] mb-2">Langue</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--safe-text-title)]">
                <input
                  type="radio"
                  name="language"
                  value="fr"
                  checked={language === "fr"}
                  onChange={() => setLanguage("fr")}
                  className="rounded-full border-[var(--safe-neutral-border)] text-green-600 focus:ring-green-600/50"
                />
                Français
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--safe-text-title)]">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === "en"}
                  onChange={() => setLanguage("en")}
                  className="rounded-full border-[var(--safe-neutral-border)] text-green-600 focus:ring-green-600/50"
                />
                English
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--safe-text-title)]">
            <input
              type="checkbox"
              checked={saveToDossier}
              onChange={(e) => setSaveToDossier(e.target.checked)}
              className="rounded border-[var(--safe-neutral-border)] text-green-600 focus:ring-green-600/50"
            />
            Enregistrer le document dans le dossier
          </label>

          <Button type="submit" disabled={isPending || !dossierId || !documentTypeCode}>
            {isPending ? "Génération…" : "Générer le document"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader
            title={result.error ? "Erreur" : "Résultat"}
          />
          <CardContent className="space-y-3">
            {result.error && (
              <p className="text-sm text-red-600">{result.error}</p>
            )}
            {result.content && (
              <>
                {result.documentId && (
                  <p className="text-sm text-[var(--safe-text-secondary)]">
                    Document enregistré.{" "}
                    <Link
                      href={routes.dossier(dossierId)}
                      className="text-green-700 underline hover:text-green-800"
                    >
                      Voir le dossier
                    </Link>
                  </p>
                )}
                <textarea
                  readOnly
                  value={result.content}
                  rows={16}
                  className={`${inputBase} font-mono leading-relaxed resize-y min-h-[320px]`}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
