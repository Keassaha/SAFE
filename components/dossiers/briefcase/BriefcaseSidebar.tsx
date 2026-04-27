"use client";

import { useEffect, useState } from "react";
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
  Search,
  ClipboardList,
  MessageSquareWarning,
  ChevronDown,
  ChevronRight,
  LucideIcon,
} from "lucide-react";

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([sections[0]?.sectionKey ?? "mandat"])
  );
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
    <div className="flex h-full w-full flex-col border-b border-slate-200/70 bg-slate-50/50 p-4 lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Cartables</h2>

      <nav className="space-y-1">
        {runtimeSections.map((section) => {
          const iconName = section.icone ?? "FileText";
          const Icon = ICON_MAP[iconName] ?? FileText;
          const isExpanded = expandedSections.has(section.sectionKey);

          return (
            <div key={section.sectionKey}>
              <button
                onClick={() => toggleSection(section.sectionKey)}
                className="flex w-full items-center gap-2 rounded-safe-sm px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{section.label}</span>
                {section.items.length > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {section.items.length}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="ml-6 space-y-0.5 py-1">
                  {section.items.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                      Aucun document
                    </div>
                  ) : (
                    section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectItem(item.id)}
                        className={`flex w-full items-start gap-2 rounded-safe-sm px-3 py-2 text-left text-sm transition-colors ${
                          selectedItemId === item.id
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                            : "text-slate-700 hover:bg-white"
                        }`}
                      >
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current" />
                        <span className="truncate">{item.title}</span>
                        {item.isRequired && (
                          <span className="ml-auto shrink-0 text-xs font-semibold text-red-600">*</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
