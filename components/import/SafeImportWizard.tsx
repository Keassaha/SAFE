"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DropZone } from "./DropZone";
import { FileClassificationCard } from "./FileClassificationCard";
import { ColumnMappingForm } from "./ColumnMappingForm";
import { PreviewTable } from "./PreviewTable";
import { ImportResultSummary } from "./ImportResultSummary";
import { ImportHistoryTable } from "./ImportHistoryTable";
import { analyzeFile, generatePreview } from "@/lib/import/pipeline";
import { detectColumns, getFieldLabels } from "@/lib/import/detect-columns";
import { executeImport } from "@/app/(app)/import/actions";
import { Loader2, Upload, ArrowRight, ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";
import type {
  DocumentType,
  ColumnMapping,
  NormalizedRow,
  ImportResult,
} from "@/lib/import/types";
import type { AnalysisResult } from "@/lib/import/pipeline";

type Step = "upload" | "classify" | "mapping" | "preview" | "importing" | "result";
type Tab = "import" | "history";

export function SafeImportWizard() {
  const t = useTranslations("import");
  const tc = useTranslations("common");

  const STEPS: { id: Step; label: string }[] = [
    { id: "upload", label: t("stepFile") },
    { id: "classify", label: t("stepAnalysis") },
    { id: "mapping", label: t("stepMapping") },
    { id: "preview", label: t("stepPreview") },
    { id: "result", label: t("stepResult") },
  ];
  const [activeTab, setActiveTab] = useState<Tab>("import");
  const [step, setStep] = useState<Step>("upload");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [docType, setDocType] = useState<DocumentType>("registre_clients");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<NormalizedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0]!;
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = await analyzeFile(buffer, file.name);
      setAnalysis(result);
      setDocType(result.classification.type);
      setMapping(result.mapping);
      setFieldLabels(result.fieldLabels);
      setStep("classify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("analyzeError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleTypeChange = useCallback((type: DocumentType) => {
    if (!analysis) return;
    setDocType(type);
    const newMapping = detectColumns(analysis.parsed.headers, type);
    const newLabels = getFieldLabels(type);
    setMapping(newMapping);
    setFieldLabels(newLabels);
  }, [analysis]);

  const handleMappingChange = useCallback((field: string, column: string | null) => {
    setMapping((prev) => ({ ...prev, [field]: column }));
  }, []);

  const goToPreview = useCallback(() => {
    if (!analysis) return;
    const preview = generatePreview(analysis.parsed, docType, mapping, 50);
    setPreviewRows(preview.preview);
    setStep("preview");
  }, [analysis, docType, mapping]);

  const handleExecuteImport = useCallback(async () => {
    if (!analysis) return;
    setStep("importing");
    setLoading(true);

    try {
      const result = await executeImport(
        analysis.parsed.rows,
        docType,
        mapping,
        analysis.parsed.fileName,
      );
      setImportResult(result);
      setStep("result");
      if (result.errors.length === 0) {
        toast.success(t("importSuccessCount", { count: result.created }));
      } else {
        toast.warning(t("importResult", { created: result.created, errors: result.errors.length }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("importError"));
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }, [analysis, docType, mapping, t]);

  const reset = useCallback(() => {
    setStep("upload");
    setAnalysis(null);
    setDocType("registre_clients");
    setMapping({});
    setFieldLabels({});
    setPreviewRows([]);
    setImportResult(null);
  }, []);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step || (step === "importing" && s.id === "preview"));

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <PageHeader
        title={t("safeImportTitle")}
        description={t("safeImportDescription")}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[var(--safe-radius-lg)] bg-white/40 border border-[var(--safe-neutral-border)]/40 w-fit">
        <button
          onClick={() => setActiveTab("import")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--safe-radius-md)] text-sm font-medium transition-all duration-200 ${
            activeTab === "import"
              ? "bg-white shadow-sm safe-text-title"
              : "safe-text-secondary hover:safe-text-title hover:bg-white/50"
          }`}
        >
          <Upload className="w-4 h-4" />
          {t("newImport")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--safe-radius-md)] text-sm font-medium transition-all duration-200 ${
            activeTab === "history"
              ? "bg-white shadow-sm safe-text-title"
              : "safe-text-secondary hover:safe-text-title hover:bg-white/50"
          }`}
        >
          <History className="w-4 h-4" />
          {t("history")}
        </button>
      </div>

      {activeTab === "import" && (
        <>
          {/* Stepper */}
          <div className="flex justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    i <= currentStepIndex
                      ? "bg-[var(--safe-green-700)] scale-110 shadow-sm"
                      : "bg-[var(--safe-neutral-border)]"
                  }`}
                />
                <span className="text-[10px] md:text-xs safe-text-secondary hidden sm:inline">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Step: Upload */}
          {step === "upload" && (
            <Card>
              <CardHeader title={t("selectFile")} />
              <CardContent>
                <DropZone onFilesSelected={handleFilesSelected} disabled={loading} />
                {loading && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--safe-icon-default)]" />
                    <span className="text-sm safe-text-secondary">{t("analyzing")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step: Classification */}
          {step === "classify" && analysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader title={t("fileAnalysis")} />
                <CardContent>
                  <FileClassificationCard
                    fileName={analysis.parsed.fileName}
                    classification={{ ...analysis.classification, type: docType }}
                    totalRows={analysis.parsed.rows.length}
                    onTypeChange={handleTypeChange}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="tertiary" onClick={reset}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("restart")}
                </Button>
                <Button variant="primary" onClick={() => setStep("mapping")}>
                  {t("configureMapping")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === "mapping" && analysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader title={t("columnMapping")} />
                <CardContent>
                  <ColumnMappingForm
                    mapping={mapping}
                    fieldLabels={fieldLabels}
                    fileHeaders={analysis.parsed.headers}
                    onChange={handleMappingChange}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="tertiary" onClick={() => setStep("classify")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {tc("back")}
                </Button>
                <Button variant="primary" onClick={goToPreview}>
                  {t("dataPreview")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && analysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader title={t("previewBeforeImport")} />
                <CardContent>
                  <PreviewTable
                    rows={previewRows}
                    fieldLabels={fieldLabels}
                    totalRows={analysis.parsed.rows.length}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="tertiary" onClick={() => setStep("mapping")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("editMapping")}
                </Button>
                <Button variant="primary" onClick={handleExecuteImport} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t("importInProgress")}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t("importLines", { count: analysis.parsed.rows.length })}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--safe-icon-default)]" />
                  <p className="text-sm safe-text-secondary">{t("importInProgressWait")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Result */}
          {step === "result" && importResult && (
            <ImportResultSummary result={importResult} onReset={reset} />
          )}
        </>
      )}

      {activeTab === "history" && <ImportHistoryTable />}
    </div>
  );
}
