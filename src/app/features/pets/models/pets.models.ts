export type PetFilter = 'all' | 'dog' | 'cat' | 'other';

// lastVisit = data do atendimento mais recente (medical-records); registeredAt = data de cadastro do pet
export interface PetRecord {
  id: number | null;
  name: string;
  species: 'dog' | 'cat' | 'other';
  summary: string;
  tutor: string;
  tutorInitials: string;
  lastVisit: string;
  registeredAt: string;
  weightKg: number | null;
}

export interface FilterOption {
  key: PetFilter;
  label: string;
}

export interface TimelineEntry {
  id: number;
  date: string;
  time: string;
  title: string;
  description: string;
}
