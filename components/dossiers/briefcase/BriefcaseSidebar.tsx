"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileSignature,
  FileText,
  FolderOpen,
  FolderClosed,
  Scale,
  Gavel,
  Mail,
  Wallet,
  StickyNote,
  Archive,
  Globe,
  BookOpen,
  Calendar,
  Receipt,
  Search,
  ClipboardList,
  MessageSquareWarning,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  Loader2,
  LucideIcon,
} from "lucide-react";
import { ImportMandatDialog } from "../detail/ImportMandatDialog";

const ICON_MAP: Record<string, LucideIcon> = {
  FileSignature,
  FileText,
  FolderOpen,
  FolderClosed,
  Scale,
  Gavel,
  Mail,
  Wallet,
  StickyNote,
  Archive,
  Globe,
  BookOpen,
  Calendar,
  Receipt,
  Search,
  ClipboardList,
  MessageSquareWarning,
};

interface DocumentItem {
  id: string;
  title: string;
  type: "document" | "rich-document";
  documentType?: string;
  hasContent: boolean;
  isRequired?: boolean;
}

interface RuntimeSection {
  id: string;
  sectionKey: string;
  label: string;
  icone: string | null;
  items: DocumentItem[];
}

export interface SectionDef {
  id: string;
  sectionKey: string;
  label: string;
  ordre: number;
  origine: string;
  sourceReglementaire: string | null;
  icone: string | null;
  description: string | null;
  privilegiee: boolean;
}

export interface BriefcaseSidebarProps {
  dossierId: string;
  sections: SectionDef[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
}

export function BriefcaseSidebar({
  dossierId,
  sections,
  selectedItemId,
  onSelectItem,
}: BriefcaseSidebarProps) {
  const t = useTranslations("miscUi");
  const tm = useTranslations("matterDetailUi");
  const router = useRouter();
  const [creatingMandat, setCreatingMandat] = useState(false);
  const [showImportMandat, setShowImportMandat] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([sections[0]?.sectionKey ?? "mandat"])
  );

  const createMandat = async () => {
    setCreatingMandat(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/mandat`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) throw new Error(data?.error ?? tm("mandateError"));
      router.push(`/edition/${dossierId}/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tm("mandateError"));
      setCreatingMandat(false);
    }
  };
  const [runtimeSections, setRuntimeSections] = useState<RuntimeSection[]>(
    sections.map((s) => ({ id: s.id, sectionKey: s.sectionKey, label: s.label, icone: s.icone, items: [] }))
  );

  useEffect(() => {
    const fetchBriefcaseData = async () => {
      try {
        const { getBriefcaseData } = await import("@/lib/actions/dossier-briefcase");
        const data = await getBriefcaseData(dossierId);

        setRuntimeSections(
          sections.map((s) => ({
            id: s.id,
            sectionKey: s.sectionKey,
            label: s.label,
            icone: s.icone,
            items: (data[s.sectionKey]?.items ?? []) as DocumentItem[],
          }))
        );
      } catch {
        // keep empty items on error
      }
    };

    fetchBriefcaseData();
  }, [dossierId, sections]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  };

  return (
    <div className="flex h-full w-full flex-col border-b border-si-line bg-si-canvas/50 p-4 lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
      <h2 className="mb-4 text-sm font-semibold text-si-ink">{t("briefcaseTitle")}</h2>

      <nav className="space-y-1">
        {runtimeSections.map((section) => {
          const iconName = section.icone ?? "FileText";
          const Icon = ICON_MAP[iconName] ?? FileText;
          const isExpanded = expandedSections.has(section.sectionKey);

          return (
            <div key={section.sectionKey}>
              <button
                onClick={() => toggleSection(section.sectionKey)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-si-ink hover:bg-si-surface transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{section.label}</span>
                {section.items.length > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-si-canvas px-1.5 py-0.5 text-[10px] font-semibold text-si-muted">
                    {section.items.length}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="ml-6 space-y-0.5 py-1">
                  {section.items.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-si-muted/60 italic">
                      {t("noDocument")}
                    </div>
                  ) : (
                    section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectItem(item.id)}
                        className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedItemId === item.id
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                            : "text-si-ink hover:bg-si-surface"
                        }`}
                      >
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current" />
                        <span className="truncate">{item.title}</span>
                        {item.isRequired && (
                          <span className="ml-auto shrink-0 text-xs font-semibold text-[#B84A3E]">*</span>
                        )}
                      </button>
                    ))
                  )}

                  {section.sectionKey === "mandat" && (
                    <div className="mt-1 space-y-1 border-t border-si-line/60 pt-2">
                      <button
                        onClick={createMandat}
                        disabled={creatingMandat}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-si-primary hover:bg-si-primary/5 disabled:opacity-60"
                      >
                        {creatingMandat ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">
                          {creatingMandat ? tm("mandateCreating") : tm("mandateCreateButton")}
                        </span>
                      </button>
                      <button
                        onClick={() => setShowImportMandat(true)}
                        disabled={creatingMandat}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-si-ink hover:bg-si-surface disabled:opacity-60"
                      >
                        <Upload className="h-4 w-4 shrink-0" />
                        <span className="truncate">{tm("mandateImportButton")}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {showImportMandat && (
        <ImportMandatDialog
          dossierId={dossierId}
          onClose={() => setShowImportMandat(false)}
          onImported={(id, warning) => {
            setShowImportMandat(false);
            if (warning) toast.warning(warning);
            router.push(`/edition/${dossierId}/${id}`);
          }}
        />
      )}
    </div>
  );
}
