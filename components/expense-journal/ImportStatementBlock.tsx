"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { importBankStatement } from "@/app/(app)/journal/depenses/actions";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ImportStatementBlock({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("billingCompUi");
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
      toast.error(t("acceptedFormat"));
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      const result = await importBankStatement(file.name, text);
      toast.success(
        t("importResult", {
          detected: result.expensesDetected,
          toValidate: result.toValidate,
        })
      );
      router.refresh();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("importError");
      toast.error(message);
    } finally {
      setUploading(false);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader
        title={t("importBankStatement")}
        className="pb-2"
      />
      <CardContent className="pt-0">
        <p className="text-sm text-[var(--safe-text-muted)] mb-4">
          {t("importBankStatementDescription")}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("importing")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t("importStatement")}
              </>
            )}
          </Button>
          {fileName && !uploading && (
            <span className="text-sm text-[var(--safe-text-muted)]">
              {t("lastFile", { name: fileName })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
