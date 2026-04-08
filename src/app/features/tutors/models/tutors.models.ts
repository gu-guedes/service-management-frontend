export interface TutorPet {
  name: string;
  details: string;
  icon: string;
}

export interface TutorRecord {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  initials: string;
  lastVisit: string;
  pets: TutorPet[];
}
