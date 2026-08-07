import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExamRequestResponseDTO {
  id: number;
  medicalRecordId: number;
  patientId: number;
  patientName: string;
  examName: string;
  requestedDate: string | null;
  resultFileName: string | null;
  resultUploadedAt: string | null;
  createdAt: string;
}

export interface ExamRequestRequestDTO {
  medicalRecordId: number;
  examName: string;
  requestedDate?: string;
}

// -------------------------------------------------------------------
// Serviço de acesso à API real de exames solicitados num atendimento —
// pedido + (depois) resultado em PDF anexado
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ExamRequestsApiService {
  private readonly http = inject(HttpClient);

  getByMedicalRecord(medicalRecordId: number): Observable<ExamRequestResponseDTO[]> {
    return this.http.get<ExamRequestResponseDTO[]>(`exam-requests/medical-record/${medicalRecordId}`);
  }

  // usado pra montar o painel de exames pendentes de uma vez, sem 1 chamada por atendimento
  getAll(): Observable<ExamRequestResponseDTO[]> {
    return this.http.get<ExamRequestResponseDTO[]>('exam-requests');
  }

  create(payload: ExamRequestRequestDTO): Observable<ExamRequestResponseDTO> {
    return this.http.post<ExamRequestResponseDTO>('exam-requests', payload);
  }

  uploadResult(id: number, file: File): Observable<ExamRequestResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ExamRequestResponseDTO>(`exam-requests/${id}/result`, formData);
  }

  // responseType 'blob' e necessario aqui — um <a href> puro nao levaria o header de autenticacao
  downloadResult(id: number): Observable<Blob> {
    return this.http.get(`exam-requests/${id}/result`, { responseType: 'blob' });
  }
}
