import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedicalRecordResponseDTO {
  id: number;
  patientId: number;
  patientName: string;
  recordDate: string;
  complaint: string;
  treatment: string;
  weightKg: number | null;
  // formato yyyy-MM-dd (sem hora) — opcional, so quando o vet quer lembrete de retorno
  followUpDate: string | null;
  followUpDone: boolean;
  createdAt: string;
}

export interface MedicalRecordRequestDTO {
  patientId: number;
  complaint: string;
  treatment: string;
  weightKg?: number | null;
  followUpDate?: string | null;
  followUpDone?: boolean;
}

// -------------------------------------------------------------------
// Serviço de acesso à API real de prontuário (medical-records)
// Responsabilidade: só chamar o backend, sem lógica de mapeamento de UI
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class MedicalRecordsApiService {
  private readonly http = inject(HttpClient);

  getByPatient(patientId: number): Observable<MedicalRecordResponseDTO[]> {
    return this.http.get<MedicalRecordResponseDTO[]>(`medical-records/patient/${patientId}`);
  }

  // usado pra calcular a ultima visita de cada pet de uma vez, sem 1 chamada por pet
  getAll(): Observable<MedicalRecordResponseDTO[]> {
    return this.http.get<MedicalRecordResponseDTO[]>('medical-records');
  }

  create(payload: MedicalRecordRequestDTO): Observable<MedicalRecordResponseDTO> {
    return this.http.post<MedicalRecordResponseDTO>('medical-records', payload);
  }

  update(id: number, payload: MedicalRecordRequestDTO): Observable<MedicalRecordResponseDTO> {
    return this.http.put<MedicalRecordResponseDTO>(`medical-records/${id}`, payload);
  }
}