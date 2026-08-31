import { Injectable, signal } from '@angular/core';
import { MedicalRecordImageResponseDTO } from './medical-record-images-api.service';

// -------------------------------------------------------------------
// Serviço de estado das fotos anexadas a atendimentos. Responsabilidade:
// lista completa de metadados carregada da API (ver AppComponent) —
// sem o binario, que so e buscado sob demanda (blob) na hora de exibir.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class MedicalRecordImagesStateService {
  private readonly _records = signal<MedicalRecordImageResponseDTO[]>([]);

  readonly records = this._records.asReadonly();

  // todas as fotos de um atendimento — pro detalhe do atendimento
  findByMedicalRecordId(medicalRecordId: number): MedicalRecordImageResponseDTO[] {
    return this._records()
      .filter((r) => r.medicalRecordId === medicalRecordId)
      .sort((a, b) => b.id - a.id);
  }

  // substitui a lista inteira — usado ao carregar os dados reais da API
  replaceAll(records: MedicalRecordImageResponseDTO[]): void {
    this._records.set(records);
  }

  addRecord(record: MedicalRecordImageResponseDTO): void {
    this._records.update((records) => [record, ...records]);
  }

  removeRecord(id: number): void {
    this._records.update((records) => records.filter((r) => r.id !== id));
  }
}
