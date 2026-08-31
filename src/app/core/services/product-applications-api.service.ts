import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductApplicationResponseDTO {
  id: number;
  patientId: number;
  patientName: string;
  productName: string;
  appliedDate: string | null;
  expiresAt: string;
  notes: string | null;
  createdAt: string;
}

export interface ProductApplicationRequestDTO {
  patientId: number;
  productName: string;
  appliedDate?: string;
  expiresAt: string;
  notes?: string;
}

// -------------------------------------------------------------------
// Serviço de acesso à API real de aplicações de produto (coleira,
// vermifugo, vacina...) — venda pontual, sem vinculo com atendimento
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ProductApplicationsApiService {
  private readonly http = inject(HttpClient);

  getByPatient(patientId: number): Observable<ProductApplicationResponseDTO[]> {
    return this.http.get<ProductApplicationResponseDTO[]>(`product-applications/patient/${patientId}`);
  }

  // usado pra montar o painel de produtos vencendo de uma vez, sem 1 chamada por pet
  getAll(): Observable<ProductApplicationResponseDTO[]> {
    return this.http.get<ProductApplicationResponseDTO[]>('product-applications');
  }

  create(payload: ProductApplicationRequestDTO): Observable<ProductApplicationResponseDTO> {
    return this.http.post<ProductApplicationResponseDTO>('product-applications', payload);
  }
}
