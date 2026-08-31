import { Injectable, computed, signal } from '@angular/core';
import { ExamRequestResponseDTO } from './exam-requests-api.service';

// -------------------------------------------------------------------
// Serviço de estado dos exames solicitados. Responsabilidade: lista
// completa carregada da API (ver AppComponent) — pendente = ainda nao
// tem resultado anexado (resultFileName null). Sem campo de "resolvido"
// separado: anexar o PDF ja tira o exame da lista de pendentes.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ExamRequestsStateService {
  private readonly _records = signal<ExamRequestResponseDTO[]>([]);

  readonly records = this._records.asReadonly();

  // exames sem resultado anexado ainda — pro painel de destaque
  readonly pendingExamRequests = computed(() =>
    this._records()
      .filter((r) => !r.resultFileName)
      .sort((a, b) => b.id - a.id)
  );

  // ids dos pets com exame pendente — pro badge na linha do pet
  readonly pendingExamPatientIds = computed(() => new Set(this.pendingExamRequests().map((r) => r.patientId)));

  // todos os exames (pendentes e resolvidos) de um atendimento — pro detalhe do atendimento
  findByMedicalRecordId(medicalRecordId: number): ExamRequestResponseDTO[] {
    return this._records()
      .filter((r) => r.medicalRecordId === medicalRecordId)
      .sort((a, b) => b.id - a.id);
  }

  // substitui a lista inteira — usado ao carregar os dados reais da API
  replaceAll(records: ExamRequestResponseDTO[]): void {
    this._records.set(records);
  }

  addRecord(record: ExamRequestResponseDTO): void {
    this._records.update((records) => [record, ...records]);
  }

  updateRecord(id: number, patch: Partial<ExamRequestResponseDTO>): void {
    this._records.update((records) => records.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
}
