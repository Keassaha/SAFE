/**
 * Types partagés pour le parcours d'audit
 */

export type AuditSection =
  | 'cabinet'
  | 'pratique'
  | 'facturation'
  | 'fideicommis'
  | 'equipe'
  | 'outils'
  | 'priorites'
  | 'contact';

export type SectionStatus = 'pending' | 'in_progress' | 'completed';

export interface SectionConfig {
  id: AuditSection;
  label: string;
  steps: number;
}

export interface QuestionBase {
  id: string;
  section: AuditSection;
  bubble: string;
  hint?: string;
}

export interface TextQuestion extends QuestionBase {
  type: 'text' | 'email' | 'tel';
  placeholder?: string;
  validation?: RegExp;
}

export interface ChipsQuestion extends QuestionBase {
  type: 'multi_select';
  options: Array<{ id: string; label: string }>;
}

export interface CardSelectQuestion extends QuestionBase {
  type: 'card_select';
  options: Array<{ id: string; label: string; description?: string }>;
}

export type Question = TextQuestion | ChipsQuestion | CardSelectQuestion;

export interface AuditResult {
  complianceScore: number;
  monthlyHoursReclaimable: number;
  monthlyRevenueGain: number;
  priorities: Array<{
    severity: 'danger' | 'warning' | 'info';
    title: string;
    description: string;
  }>;
}

export interface ReportSection {
  id: string;
  label: string;
  status: SectionStatus;
}
