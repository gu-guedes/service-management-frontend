import { Injectable, computed, inject, signal } from '@angular/core';
import { MedicalRecordResponseDTO } from './medical-records-api.service';
import { MedicalRecordsStateService } from './medical-records-state.service';
import { PetsStateService } from './pets-state.service';
import {
  toMonthRangeIso,
  toTodayIso,
  toWeekRangeIso,
  toYesterdayIso
} from '../../shared/utils/pet-tutor-formatting';

export interface HistoryRecord extends MedicalRecordResponseDTO {
  tutorName: string;
}

// -------------------------------------------------------------------
// Serviço de estado da aba Histórico de Atendimentos.
// Responsabilidade: filtro por intervalo de datas + busca sobre os
// atendimentos já carregados em MedicalRecordsStateService (lista
// completa da clínica, sem endpoint novo) — mesmo padrão de filtro
// + paginação client-side do PetsStateService.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class HistoryStateService {
  private readonly medicalRecordsState = inject(MedicalRecordsStateService);
  private readonly petsState = inject(PetsStateService);

  private readonly _dateFrom = signal(toTodayIso());
  private readonly _dateTo = signal(toTodayIso());
  private readonly _searchTerm = signal('');
  private readonly _page = signal(1);

  readonly pageSize = 10;

  readonly dateFrom = this._dateFrom.asReadonly();
  readonly dateTo = this._dateTo.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly page = this._page.asReadonly();

  // junta o nome do tutor (nao vem no DTO de atendimento) e ordena mais recente primeiro
  private readonly withTutorName = computed<HistoryRecord[]>(() =>
    this.medicalRecordsState
      .records()
      .map((record) => ({
        ...record,
        tutorName: this.petsState.findById(record.patientId)?.tutor ?? ''
      }))
      .sort((a, b) => (a.recordDate < b.recordDate ? 1 : -1))
  );

  readonly filtered = computed(() => {
    const from = this._dateFrom();
    const to = this._dateTo();
    const term = this._searchTerm().trim().toLowerCase();

    return this.withTutorName().filter((record) => {
      const recordDateOnly = record.recordDate.slice(0, 10);
      if (from && recordDateOnly < from) return false;
      if (to && recordDateOnly > to) return false;

      if (term) {
        const haystack = `${record.patientName} ${record.tutorName} ${record.complaint}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  readonly pagedRecords = computed(() => {
    const start = (this._page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  setDateRange(from: string, to: string): void {
    this._dateFrom.set(from);
    this._dateTo.set(to);
    this._page.set(1);
  }

  setToday(): void {
    const today = toTodayIso();
    this.setDateRange(today, today);
  }

  setYesterday(): void {
    const yesterday = toYesterdayIso();
    this.setDateRange(yesterday, yesterday);
  }

  setThisWeek(): void {
    const { from, to } = toWeekRangeIso();
    this.setDateRange(from, to);
  }

  setThisMonth(): void {
    const { from, to } = toMonthRangeIso();
    this.setDateRange(from, to);
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
    this._page.set(1);
  }

  setPage(page: number): void {
    this._page.set(page);
  }
}
