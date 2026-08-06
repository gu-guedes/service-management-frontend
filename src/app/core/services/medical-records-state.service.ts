import { Injectable, computed, signal } from '@angular/core';
import { MedicalRecordResponseDTO } from './medical-records-api.service';
import { toTodayIso, toTomorrowIso } from '../../shared/utils/pet-tutor-formatting';

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

  // atendimentos com retorno atrasado, vencendo hoje ou amanha, ainda nao marcado como feito —
  // usado pra mostrar o painel de retornos pendentes sem precisar abrir o prontuario
  readonly dueFollowUps = computed(() => {
    const tomorrow = toTomorrowIso();
    return this._records()
      .filter((r) => r.followUpDate && !r.followUpDone && r.followUpDate <= tomorrow)
      .sort((a, b) => (a.followUpDate as string) < (b.followUpDate as string) ? -1 : 1);
  });

  // ids dos pets com retorno vencendo hoje ou atrasado (sem amanha) — usado pro badge
  // na linha do pet, que deve sinalizar so o que precisa de acao agora
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
