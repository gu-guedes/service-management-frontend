import { Injectable, computed, signal } from '@angular/core';
import { MedicalRecordResponseDTO } from './medical-records-api.service';
import { toTodayIso } from '../../shared/utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Serviço de estado dos prontuários (medical records)
// Responsabilidade: lista completa carregada da API (ver AppComponent) —
// hoje usada so pra derivar quais pets tem retorno pendente, sem chamada
// de API nova (mesmo padrao do todayBirthdayIds em TutorsStateService).
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class MedicalRecordsStateService {
  private readonly _records = signal<MedicalRecordResponseDTO[]>([]);

  readonly records = this._records.asReadonly();

  // ids dos pets com retorno vencendo hoje ou atrasado, ainda nao marcado como feito
  readonly dueFollowUpPatientIds = computed(() => {
    const today = toTodayIso();
    return new Set(
      this._records()
        .filter((r) => r.followUpDate && !r.followUpDone && r.followUpDate <= today)
        .map((r) => r.patientId)
    );
  });

  // substitui a lista inteira — usado ao carregar os dados reais da API
  replaceAll(records: MedicalRecordResponseDTO[]): void {
    this._records.set(records);
  }

  addRecord(record: MedicalRecordResponseDTO): void {
    this._records.update((records) => [record, ...records]);
  }

  updateRecord(id: number, patch: Partial<MedicalRecordResponseDTO>): void {
    this._records.update((records) => records.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
}
