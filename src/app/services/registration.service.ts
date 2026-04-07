import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, of, switchMap, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

interface TutorPayload {
  fullName: string;
  cpf: string;
  phone: string;
  email: string;
  city: string;
  address: string;
}

interface PetPayload {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  sex: 'M' | 'F';
  birthDate: string;
  weight: number | null;
}

interface CustomerRequestDTO {
  name: string;
  email: string;
  phone?: string;
}

interface CustomerResponseDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface PatientRequestDTO {
  customerId: number;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  birthDate?: string;
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
  birthDate?: string;
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
    createdAt: string;
  }> {
    if (!environment.useMockApi) {
      const customerPayload: CustomerRequestDTO = {
        name: payload.tutor.fullName,
        email: payload.tutor.email,
        phone: this.toApiPhone(payload.tutor.phone)
      };

      return this.http.post<CustomerResponseDTO>('customers', customerPayload).pipe(
        switchMap((customer) => {
          const patientPayload: PatientRequestDTO = {
            customerId: customer.id,
            name: payload.pet.name,
            species: payload.pet.species,
            breed: payload.pet.breed || undefined,
            sex: payload.pet.sex,
            birthDate: payload.pet.birthDate || undefined,
            weightKg: payload.pet.weight ?? undefined,
            notes: ''
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
                birthDate: patient.birthDate ?? payload.pet.birthDate,
                weight: patient.weightKg ?? payload.pet.weight
              },
              createdAt: this.toBrDate(customer.createdAt)
            }))
          );
        })
      );
    }

    return of({
      tutor: payload.tutor,
      pet: payload.pet,
      createdAt: this.todayBr()
    }).pipe(delay(350));
  }

  addPetToTutor(payload: {
    tutorId: string;
    pet: PetPayload;
  }): Observable<{
    tutorId: string;
    pet: PetPayload;
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
        sex: payload.pet.sex,
        birthDate: payload.pet.birthDate || undefined,
        weightKg: payload.pet.weight ?? undefined,
        notes: ''
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
            birthDate: patient.birthDate ?? payload.pet.birthDate,
            weight: patient.weightKg ?? payload.pet.weight
          },
          createdAt: this.todayBr()
        }))
      );
    }

    return of({
      tutorId: payload.tutorId,
      pet: payload.pet,
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
}
