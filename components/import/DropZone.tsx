"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileSpreadsheet, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".txt"];
const ACCEPTED_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
];

type SelectedFile = {
  file: File;
  name: string;
  size: string;
  ext: string;
};

function formatSize(bytes: number, units: { b: string; kb: string; mb: string }): string {
  if (bytes < 1024) return `${bytes} ${units.b}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${units.kb}`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${units.mb}`;
}

function getIcon(ext: string) {
  if (ext === "xlsx" || ext === "xls") return FileSpreadsheet;
  return FileText;
}

export function DropZone({
  onFilesSelected,
  disabled = false,
}: {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("import");
  const sizeUnits = { b: t("sizeBytes"), kb: t("sizeKB"), mb: t("sizeMB") };
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const valid = files.filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        return ACCEPTED_EXTENSIONS.includes(`.${ext}`) || ACCEPTED_MIME.includes(f.type);
      });
      if (valid.length === 0) return;

      const selected: SelectedFile[] = valid.map((f) => ({
        file: f,
        name: f.name,
        size: formatSize(f.size, sizeUnits),
        ext: f.name.split(".").pop()?.toLowerCase() ?? "",
      }));
      setSelectedFiles((prev) => [...prev, ...selected]);
      onFilesSelected(valid);
    },
    [onFilesSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [processFiles],
  );

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-3 py-12 px-6
          rounded-[var(--safe-radius-xl)] border-2 border-dashed
          transition-all duration-200 cursor-pointer
          ${dragOver
            ? "border-[var(--safe-green-600)] bg-[var(--safe-green-50)]/60"
            : "border-[var(--safe-neutral-border)] bg-white/40 hover:border-[var(--safe-green-600)]/40 hover:bg-white/60"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
        <div className="w-12 h-12 rounded-full bg-[var(--safe-green-50)] border border-[var(--safe-green-100)] flex items-center justify-center">
          <Upload className="w-5 h-5 text-[var(--safe-icon-default)]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium safe-text-title">
            {t("dropzoneTitle")}
          </p>
          <p className="text-xs safe-text-secondary mt-1">
            {t("dropzoneSubtitle")}
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((sf, i) => {
            const Icon = getIcon(sf.ext);
            return (
              <div
                key={`${sf.name}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-[var(--safe-radius-md)] bg-white/70 border border-[var(--safe-neutral-border)]/60"
              >
                <Icon className="w-4 h-4 text-[var(--safe-icon-default)] shrink-0" />
                <span className="text-sm safe-text-title truncate flex-1">{sf.name}</span>
                <span className="text-xs safe-text-secondary shrink-0">{sf.size}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--safe-neutral-100)] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[var(--safe-neutral-500)]" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
