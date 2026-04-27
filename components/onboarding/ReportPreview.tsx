'use client';

import type { ReportSection } from '@/lib/audit-types';

interface ReportPreviewProps {
  sections: ReportSection[];
  currentQuestionContext: string;
}

export function ReportPreview({
  sections,
  currentQuestionContext,
}: ReportPreviewProps) {
  return (
    <aside className="bg-slate-100 border-l border-slate-200/60 px-5 py-6">
      <p className="text-[11px] font-medium text-slate-600 tracking-widest uppercase mb-3">
        Votre rapport
      </p>

      <ReportCard sections={sections} />

      <ContextExplainer content={currentQuestionContext} />

      <SecurityNote />
    </aside>
  );
}

function ReportCard({ sections }: { sections: ReportSection[] }) {
  return (
    <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden mb-5">
      <div className="px-3.5 py-3.5 bg-forest-900 text-forest-50">
        <p className="font-serif italic text-base mb-0.5">Audit SAFE</p>
        <p className="text-[10px] text-forest-200">
          Rapport personnalisé · PDF
        </p>
      </div>
      <div className="p-3.5">
        {sections.map((section, idx) => (
          <ReportLine
            key={section.id}
            label={section.label}
            status={section.status}
            isLast={idx === sections.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function ReportLine({
  label,
  status,
  isLast,
}: {
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  isLast: boolean;
}) {
  const containerClass = `flex items-center gap-2 py-1.5 ${
    !isLast ? 'border-b border-slate-100' : ''
  } ${status === 'pending' ? 'opacity-50' : ''}`;

  return (
    <div className={containerClass}>
      <StatusIcon status={status} />
      <span
        className={`text-[11px] ${
          status === 'in_progress'
            ? 'text-forest-900 font-medium'
            : status === 'completed'
            ? 'text-forest-900'
            : 'text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StatusIcon({
  status,
}: {
  status: 'pending' | 'in_progress' | 'completed';
}) {
  if (status === 'completed') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-forest-700">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (status === 'in_progress') {
    return (
      <div className="w-3 h-3 rounded-full border-[1.5px] border-forest-700 border-t-transparent animate-spin" />
    );
  }

  return <div className="w-3 h-3 rounded-full bg-slate-100" />;
}

function ContextExplainer({ content }: { content: string }) {
  return (
    <div className="bg-white rounded-[10px] border border-slate-200 p-3.5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-forest-900">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-xs font-medium text-forest-900">
          Pourquoi ces questions&nbsp;?
        </p>
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed">{content}</p>
    </div>
  );
}

function SecurityNote() {
  return (
    <div className="p-3 bg-forest-900 rounded-[10px]">
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forest-200">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p className="text-[11px] font-medium text-forest-50">
          Réponses chiffrées
        </p>
      </div>
      <p className="text-[10px] text-forest-200 leading-relaxed">
        Stockées au Québec. Supprimées après 30 jours si vous ne créez pas de
        compte SAFE.
      </p>
    </div>
  );
}
