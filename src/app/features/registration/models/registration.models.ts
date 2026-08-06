export type RegistrationScenario = 'new' | 'addpet';

export interface RegistrationPetPayload {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  sex: 'M' | 'F';
  age: number | null;
  weight: number | null;
  notes: string;
}
