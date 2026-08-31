import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedicalRecordImageResponseDTO {
  id: number;
  medicalRecordId: number;
  patientId: number;
  patientName: string;
  fileName: string;
  contentType: string;
  createdAt: string;
}

// -------------------------------------------------------------------
// Serviço de acesso à API real de fotos anexadas num atendimento —
// upload ja com o conteudo (diferente do exame, que primeiro "pede"
// e so depois recebe o resultado)
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class MedicalRecordImagesApiService {
  private readonly http = inject(HttpClient);

  getByMedicalRecord(medicalRecordId: number): Observable<MedicalRecordImageResponseDTO[]> {
    return this.http.get<MedicalRecordImageResponseDTO[]>(`medical-records/${medicalRecordId}/images`);
  }

  // usado pra carregar todos os metadados de uma vez (sem o binario), ver AppComponent
  getAll(): Observable<MedicalRecordImageResponseDTO[]> {
    return this.http.get<MedicalRecordImageResponseDTO[]>('medical-records/images');
  }

  upload(medicalRecordId: number, file: File): Observable<MedicalRecordImageResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MedicalRecordImageResponseDTO>(`medical-records/${medicalRecordId}/images`, formData);
  }

  // responseType 'blob' e necessario aqui — um <img src> puro nao levaria o header de autenticacao
  getImageBlob(id: number): Observable<Blob> {
    return this.http.get(`medical-records/images/${id}`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`medical-records/images/${id}`);
  }
}
