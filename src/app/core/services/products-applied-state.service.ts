import { Injectable, computed, inject, signal } from '@angular/core';
import { ProductApplicationResponseDTO } from './product-applications-api.service';
import { ProductApplicationsStateService } from './product-applications-state.service';
import { PetsStateService } from './pets-state.service';
import { toTodayIso } from '../../shared/utils/pet-tutor-formatting';

export type ProductStatusFilter = 'all' | 'expired' | 'valid';

export interface AppliedProductRecord extends ProductApplicationResponseDTO {
  tutorName: string;
  expired: boolean;
}

// -------------------------------------------------------------------
// Serviço de estado da aba Produtos Aplicados.
// Responsabilidade: filtro por status + busca sobre a aplicacao mais
// recente de cada par (pet, produto) — ver
// ProductApplicationsStateService.latestPerPatientAndProduct (dado ja
// carregado no boot, sem endpoint novo) — mesmo padrao de filtro +
// paginacao client-side do HistoryStateService.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ProductsAppliedStateService {
  private readonly productApplicationsState = inject(ProductApplicationsStateService);
  private readonly petsState = inject(PetsStateService);

  private readonly _statusFilter = signal<ProductStatusFilter>('all');
  private readonly _searchTerm = signal('');
  private readonly _page = signal(1);

  readonly pageSize = 10;

  readonly statusFilter = this._statusFilter.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly page = this._page.asReadonly();

  readonly statusFilters: Array<{ key: ProductStatusFilter; label: string }> = [
    { key: 'all', label: 'Todos' },
    { key: 'expired', label: 'Vencidos' },
    { key: 'valid', label: 'Validos' }
  ];

  // junta nome do tutor e status de vencimento (mesmo criterio da ficha do pet:
  // expiresAt < hoje), ordenado por vencimento mais proximo primeiro
  private readonly withTutorAndStatus = computed<AppliedProductRecord[]>(() => {
    const today = toTodayIso();

    return this.productApplicationsState
      .latestPerPatientAndProduct()
      .map((record) => ({
        ...record,
        tutorName: this.petsState.findById(record.patientId)?.tutor ?? '',
        expired: record.expiresAt < today
      }))
      .sort((a, b) => (a.expiresAt < b.expiresAt ? -1 : 1));
  });

  readonly filtered = computed(() => {
    const status = this._statusFilter();
    const term = this._searchTerm().trim().toLowerCase();

    return this.withTutorAndStatus().filter((record) => {
      if (status === 'expired' && !record.expired) return false;
      if (status === 'valid' && record.expired) return false;

      if (term) {
        const haystack = `${record.productName} ${record.patientName} ${record.tutorName}`.toLowerCase();
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

  setStatusFilter(status: ProductStatusFilter): void {
    this._statusFilter.set(status);
    this._page.set(1);
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
    this._page.set(1);
  }

  setPage(page: number): void {
    this._page.set(page);
  }
}
