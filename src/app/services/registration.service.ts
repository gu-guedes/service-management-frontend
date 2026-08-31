import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, of, switchMap, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';

interface TutorPayload {
  fullName: string;
  phone: string;
  cpf: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  referencePoint: string;
  birthDate: string;
}

interface PetPayload {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  sex: 'M' | 'F';
  age: number | null;
  weight: number | null;
  notes: string;
}

interface CustomerRequestDTO {
  name: string;
  phone?: string;
  cpf?: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  referencePoint?: string;
  birthDate: string;
}

interface CustomerResponseDTO {
  id: number;
  name: string;
  phone: string;
  cpf: string | null;
  street: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  referencePoint: string | null;
  createdAt: string;
}

interface PatientRequestDTO {
  customerId: number;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  ageYears?: number;
  weightKg?: number;
  notes?: string;
}

interface PatientResponseDTO {
  id: number;
  customerId: number;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  ageYears?: number;
  weightKg?: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private readonly http: HttpClient) {}

  createTutorWithPet(payload: {
    tutor: TutorPayload;
    pet: PetPayload;
  }): Observable<{
    tutor: TutorPayload;
    pet: PetPayload;
    customerId: number | null;
    patientId: number | null;
    createdAt: string;
  }> {
    if (!environment.useMockApi) {
      const customerPayload: CustomerRequestDTO = {
        name: payload.tutor.fullName,
        phone: this.toApiPhone(payload.tutor.phone),
        cpf: this.toApiCpf(payload.tutor.cpf) || undefined,
        street: payload.tutor.street,
        streetNumber: payload.tutor.streetNumber,
        neighborhood: payload.tutor.neighborhood,
        city: payload.tutor.city,
        referencePoint: payload.tutor.referencePoint || undefined,
        birthDate: payload.tutor.birthDate
      };

      return this.http.post<CustomerResponseDTO>('customers', customerPayload).pipe(
        switchMap((customer) => {
          const patientPayload: PatientRequestDTO = {
            customerId: customer.id,
            name: payload.pet.name,
            species: payload.pet.species,
            breed: payload.pet.breed || undefined,
            sex: this.toApiSex(payload.pet.sex),
            ageYears: payload.pet.age ?? undefined,
            weightKg: payload.pet.weight ?? undefined,
            notes: payload.pet.notes
          };

          return this.http.post<PatientResponseDTO>('patients', patientPayload).pipe(
            map((patient) => ({
              tutor: payload.tutor,
              pet: {
                ...payload.pet,
                name: patient.name,
                species: this.toUiSpecies(patient.species),
                breed: patient.breed ?? payload.pet.breed,
                sex: this.toUiSex(patient.sex),
                age: patient.ageYears ?? payload.pet.age,
                weight: patient.weightKg ?? payload.pet.weight
              },
              customerId: customer.id,
              patientId: patient.id,
              createdAt: this.toBrDate(customer.createdAt)
            }))
          );
        })
      );
    }

    return of({
      tutor: payload.tutor,
      pet: payload.pet,
      customerId: null,
      patientId: null,
      createdAt: this.todayBr()
    }).pipe(delay(350));
  }

  addPetToTutor(payload: {
    tutorId: string;
    pet: PetPayload;
  }): Observable<{
    tutorId: string;
    pet: PetPayload;
    patientId: number | null;
    createdAt: string;
  }> {
    if (!environment.useMockApi) {
      const customerId = this.toCustomerId(payload.tutorId);

      if (!customerId) {
        return throwError(() => new Error('Tutor selecionado sem ID numerico para API.'));
      }

      const patientPayload: PatientRequestDTO = {
        customerId,
        name: payload.pet.name,
        species: payload.pet.species,
        breed: payload.pet.breed || undefined,
        sex: this.toApiSex(payload.pet.sex),
        ageYears: payload.pet.age ?? undefined,
        weightKg: payload.pet.weight ?? undefined,
        notes: payload.pet.notes
      };

      return this.http.post<PatientResponseDTO>('patients', patientPayload).pipe(
        map((patient) => ({
          tutorId: payload.tutorId,
          pet: {
            ...payload.pet,
            name: patient.name,
            species: this.toUiSpecies(patient.species),
            breed: patient.breed ?? payload.pet.breed,
            sex: this.toUiSex(patient.sex),
            age: patient.ageYears ?? payload.pet.age,
            weight: patient.weightKg ?? payload.pet.weight
          },
          patientId: patient.id,
          createdAt: this.todayBr()
        }))
      );
    }

    return of({
      tutorId: payload.tutorId,
      pet: payload.pet,
      patientId: null,
      createdAt: this.todayBr()
    }).pipe(delay(300));
  }

  private todayBr(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private toApiPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private toApiCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private toBrDate(dateTime: string): string {
    if (!dateTime) {
      return this.todayBr();
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return this.todayBr();
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private toCustomerId(tutorId: string): number | null {
    const parsed = Number(String(tutorId).replace(/\D/g, ''));

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private toUiSpecies(species: string): 'dog' | 'cat' | 'other' {
    const normalized = (species || '').toLowerCase();

    if (normalized === 'dog' || normalized === 'cao') {
      return 'dog';
    }

    if (normalized === 'cat' || normalized === 'gato') {
      return 'cat';
    }

    return 'other';
  }

  private toUiSex(sex: string | undefined): 'M' | 'F' {
    return String(sex || '').toUpperCase() === 'F' ? 'F' : 'M';
  }

  // o banco só aceita 'macho'/'femea' (constraint patients_sex_check)
  private toApiSex(sex: 'M' | 'F'): string {
    return sex === 'F' ? 'femea' : 'macho';
  }
}
