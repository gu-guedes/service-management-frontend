export type PetFilter = 'all' | 'dog' | 'cat' | 'other' | 'vaccine' | 'return';

export interface PetRecord {
  name: string;
  species: 'dog' | 'cat' | 'other';
  summary: string;
  tutor: string;
  tutorInitials: string;
  lastVisit: string;
  status: string;
  statusClass: string;
  statusType: 'vaccine' | 'return' | 'ok';
}

export interface FilterOption {
  key: PetFilter;
  label: string;
}

export interface TimelineEntry {
  date: string;
  title: string;
  description: string;
}

export interface PetCareProfile {
  weightLabel: string;
  allergiesLabel: string;
  alertMessage: string;
  tags: Array<{ label: string; className: string }>;
}
