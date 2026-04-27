import type { SectionConfig, Question } from './audit-types';

export const SECTIONS: SectionConfig[] = [
  { id: 'cabinet',     label: 'Cabinet',       steps: 5 },
  { id: 'pratique',    label: 'Pratique',      steps: 4 },
  { id: 'facturation', label: 'Facturation',   steps: 3 },
  { id: 'fideicommis', label: 'Fidéicommis',   steps: 4 },
  { id: 'equipe',      label: 'Équipe',        steps: 2 },
  { id: 'outils',      label: 'Outils actuels', steps: 2 },
  { id: 'priorites',   label: 'Priorités',     steps: 1 },
  { id: 'contact',     label: 'Contact',       steps: 2 },
];

export const QUESTIONS: Question[] = [
  {
    id: 'cabinet_name',
    section: 'cabinet',
    type: 'text',
    bubble: 'Quel est le nom de votre cabinet ?',
    placeholder: 'ex. Cabinet Derisier',
  },
  {
    id: 'lawyer_name',
    section: 'cabinet',
    type: 'text',
    bubble: 'Quel est votre nom complet (avocat principal) ?',
    placeholder: 'ex. Me Marie-Anne Derisier',
  },
  {
    id: 'email',
    section: 'cabinet',
    type: 'email',
    bubble: 'Quel est votre courriel professionnel ?',
    placeholder: 'nom@cabinet.ca',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  {
    id: 'barreau_number',
    section: 'cabinet',
    type: 'text',
    bubble: 'Quel est votre numéro de membre du Barreau ?',
    hint: 'Barreau du Québec : 5 chiffres · Law Society of Ontario : 7 chiffres',
  },
  {
    id: 'province',
    section: 'cabinet',
    type: 'card_select',
    bubble: 'Dans quelle province exercez-vous ?',
    options: [
      { id: 'qc', label: 'Québec',  description: 'Barreau du Québec' },
      { id: 'on', label: 'Ontario', description: 'Law Society of Ontario' },
    ],
  },
  {
    id: 'practice_areas',
    section: 'pratique',
    type: 'multi_select',
    bubble: 'Quels domaines de droit pratiquez-vous ? Sélectionnez-en autant que pertinent.',
    options: [
      { id: 'family',     label: 'Droit familial' },
      { id: 'realestate', label: 'Immobilier' },
      { id: 'civil',      label: 'Civil' },
      { id: 'criminal',   label: 'Criminel' },
      { id: 'labour',     label: 'Travail' },
      { id: 'immigration', label: 'Immigration' },
      { id: 'corporate',  label: 'Corporatif' },
      { id: 'other',      label: 'Autre' },
    ],
  },
  {
    id: 'active_cases',
    section: 'pratique',
    type: 'card_select',
    bubble: 'Combien de dossiers actifs gérez-vous en moyenne par mois ?',
    options: [
      { id: 'small',   label: '1–10',  description: 'Solo débutant' },
      { id: 'medium',  label: '11–30', description: 'Solo établi' },
      { id: 'large',   label: '31–80', description: 'Petit cabinet' },
      { id: 'xlarge',  label: '80+',   description: 'Cabinet établi' },
    ],
  },
];
