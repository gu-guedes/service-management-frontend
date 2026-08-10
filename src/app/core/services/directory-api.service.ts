import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CustomerResponseDTO {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  street: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  referencePoint: string | null;
  birthDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequestDTO {
  name: string;
  email?: string;
  phone?: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  referencePoint?: string;
  birthDate: string;
}

export interface PatientResponseDTO {
  id: number;
  customerId: number;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  ageYears?: number;
  weightKg?: number;
  neutered: boolean;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface PatientRequestDTO {
  customerId: number;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  ageYears?: number;
  weightKg?: number;
  neutered?: boolean;
  notes?: string;
  active?: boolean;
}

// -------------------------------------------------------------------
// Serviço de acesso à API real de clientes (tutores) e pacientes (pets)
// Responsabilidade: só chamar o backend, sem lógica de mapeamento de UI
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class DirectoryApiService {
  private readonly http = inject(HttpClient);

  getCustomers(): Observable<CustomerResponseDTO[]> {
    return this.http.get<CustomerResponseDTO[]>('customers');
  }

  getCustomerById(id: number): Observable<CustomerResponseDTO> {
    return this.http.get<CustomerResponseDTO>(`customers/${id}`);
  }

  updateCustomer(id: number, dto: CustomerRequestDTO): Observable<CustomerResponseDTO> {
    return this.http.put<CustomerResponseDTO>(`customers/${id}`, dto);
  }

  getPatients(): Observable<PatientResponseDTO[]> {
    return this.http.get<PatientResponseDTO[]>('patients');
  }

  getPatientById(id: number): Observable<PatientResponseDTO> {
    return this.http.get<PatientResponseDTO>(`patients/${id}`);
  }

  updatePatient(id: number, dto: PatientRequestDTO): Observable<PatientResponseDTO> {
    return this.http.put<PatientResponseDTO>(`patients/${id}`, dto);
  }

  // "Excluir": some da lista de pets de vez (nao apaga a linha, preserva historico); nao mexe no tutor
  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`patients/${id}`);
  }

  // "Excluir": some da lista de tutores de vez, e cascade some todos os pets desse tutor tambem
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`customers/${id}`);
  }
}
