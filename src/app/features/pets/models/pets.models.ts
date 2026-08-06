export type PetFilter = 'all' | 'dog' | 'cat' | 'other';

// status/statusClass refletem o campo real "active" do paciente na API
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
  status: string;
  statusClass: string;
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
