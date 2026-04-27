'use client';

import { SECTIONS } from '@/lib/audit-questions';
import type { AuditSection, SectionStatus } from '@/lib/audit-types';

interface StepperSidebarProps {
  currentSection: AuditSection;
  currentStepInSection: number;
  sectionStatuses: Record<AuditSection, SectionStatus>;
  progressPercent: number;
  minutesRemaining: number;
  onSaveAndExit: () => void;
}

export function StepperSidebar({
  currentSection,
  currentStepInSection,
  sectionStatuses,
  progressPercent,
  minutesRemaining,
  onSaveAndExit,
}: StepperSidebarProps) {
  return (
    <aside className="bg-white border-r border-slate-200/60 px-5 py-6 flex flex-col">
      <p className="text-[11px] font-medium text-slate-600 tracking-widest uppercase mb-3.5">
        Progression
      </p>

      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-forest-700 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-forest-900">
          {progressPercent}&nbsp;%
        </span>
      </div>

      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        ~{minutesRemaining} min restantes
      </p>

      <nav className="flex flex-col gap-0.5">
        {SECTIONS.map((section) => {
          const status = sectionStatuses[section.id];
          const isCurrent = section.id === currentSection;

          return (
            <StepItem
              key={section.id}
              label={section.label}
              status={status}
              isCurrent={isCurrent}
              currentStep={isCurrent ? currentStepInSection : undefined}
              totalSteps={section.steps}
            />
          );
        })}
      </nav>

      <div className="mt-6 pt-5 border-t border-slate-200/60">
        <button
          onClick={onSaveAndExit}
          className="w-full px-3 py-2 bg-transparent border border-slate-300 rounded-md text-xs text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Sauvegarder et quitter
        </button>
      </div>
    </aside>
  );
}

function StepItem({
  label,
  status,
  isCurrent,
  currentStep,
  totalSteps,
}: {
  label: string;
  status: SectionStatus;
  isCurrent: boolean;
  currentStep?: number;
  totalSteps: number;
}) {
  const containerClass = isCurrent
    ? 'bg-forest-50'
    : 'hover:bg-slate-50';

  return (
    <div className={`px-2.5 py-2 rounded-md flex items-center gap-2.5 ${containerClass}`}>
      <StatusDot status={status} isCurrent={isCurrent} />
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] ${
            status === 'completed' || isCurrent
              ? 'font-medium text-forest-900'
              : 'text-slate-600'
          }`}
        >
          {label}
        </p>
        {isCurrent && (
          <p className="text-[11px] text-forest-700 mt-0.5">
            Étape {currentStep} sur {totalSteps}
          </p>
        )}
        {status === 'completed' && !isCurrent && (
          <p className="text-[11px] text-slate-500 mt-0.5">Complété</p>
        )}
      </div>
    </div>
  );
}

function StatusDot({
  status,
  isCurrent,
}: {
  status: SectionStatus;
  isCurrent: boolean;
}) {
  if (status === 'completed') {
    return (
      <div className="w-[18px] h-[18px] rounded-full bg-forest-700 flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-forest-50">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }

  if (isCurrent) {
    return (
      <div className="w-[18px] h-[18px] rounded-full bg-forest-700 border-2 border-forest-200 flex-shrink-0" />
    );
  }

  return (
    <div className="w-[18px] h-[18px] rounded-full border border-slate-300 flex-shrink-0" />
  );
}
