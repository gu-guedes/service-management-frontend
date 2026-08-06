export interface TutorPet {
  name: string;
  details: string;
  icon: string;
}

// lastVisit = visita mais recente entre os pets do tutor; registeredAt = data de cadastro do tutor
export interface TutorRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  initials: string;
  lastVisit: string;
  registeredAt: string;
  // formato ISO (yyyy-MM-dd), como vem do backend — sem hora, evita bug de fuso na comparacao de aniversario
  birthDate: string | null;
  pets: TutorPet[];
}
