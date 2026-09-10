import { Injectable, computed, signal } from '@angular/core';
import { FilterOption, PetFilter, PetRecord } from '../../features/pets/models/pets.models';

// -------------------------------------------------------------------
// Serviço de estado dos pets
// Responsabilidade: lista de pets (carregada da API real, ver AppComponent) e filtro ativo
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class PetsStateService {
  // signal() = equivalente ao useState do React
  private readonly _records = signal<PetRecord[]>([]);
  private readonly _activeFilter = signal<PetFilter>('all');
  private readonly _searchTerm = signal('');
  private readonly _page = signal(1);

  // quantidade de linhas por pagina — paginacao e so client-side por enquanto
  // (ver plano: backend ainda nao tem Pageable/search nos endpoints de customers/patients)
  readonly pageSize = 10;

  // asReadonly() expõe o signal sem permitir .set() de fora
  readonly records = this._records.asReadonly();
  readonly activeFilter = this._activeFilter.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly page = this._page.asReadonly();

  // computed() = equivalente ao useMemo do React
  // recalcula automaticamente quando _records, _activeFilter ou _searchTerm mudam
  readonly filtered = computed(() => {
    const filter = this._activeFilter();
    const term = this._searchTerm().trim().toLowerCase();
    let records = this._records();

    if (filter !== 'all') {
      records = records.filter((pet) => pet.species === filter);
    }

    if (term) {
      records = records.filter(
        (pet) => pet.name.toLowerCase().includes(term) || pet.tutor.toLowerCase().includes(term)
      );
    }

    return records;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  // fatia de filtered() referente a pagina atual — o que a tabela de fato renderiza
  readonly pagedRecords = computed(() => {
    const start = (this._page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  // dados estáticos de UI (não precisam de signal — nunca mudam)
  readonly filters: FilterOption[] = [
    { key: 'all', label: 'Todos' },
    { key: 'dog', label: 'Caes' },
    { key: 'cat', label: 'Gatos' },
    { key: 'other', label: 'Outros' }
  ];

  setFilter(filter: PetFilter): void {
    this._activeFilter.set(filter);
    this._page.set(1);
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
    this._page.set(1);
  }

  setPage(page: number): void {
    this._page.set(page);
  }

  // update() = forma de alterar signal usando o valor anterior (como setState funcional)
  addRecord(record: PetRecord): void {
    this._records.update((records) => [record, ...records]);
  }

  // substitui a lista inteira — usado ao carregar os dados reais da API
  replaceAll(records: PetRecord[]): void {
    this._records.set(records);
  }

  findByName(name: string): PetRecord | null {
    return this._records().find((pet) => pet.name === name) ?? null;
  }

  findById(id: number): PetRecord | null {
    return this._records().find((pet) => pet.id === id) ?? null;
  }

  // atualiza a ultima visita de um pet — chamado depois de salvar um atendimento
  updateLastVisit(petId: number, date: string): void {
    this._records.update((records) =>
      records.map((pet) => (pet.id === petId ? { ...pet, lastVisit: date } : pet))
    );
  }

  // aplica um patch parcial — usado apos editar ou inativar um pet
  updateRecord(petId: number, patch: Partial<PetRecord>): void {
    this._records.update((records) =>
      records.map((pet) => (pet.id === petId ? { ...pet, ...patch } : pet))
    );
  }

  // usado apos excluir um pet (ou todos os pets de um tutor excluido) — some da lista de vez
  removeRecord(petId: number): void {
    this._records.update((records) => records.filter((pet) => pet.id !== petId));
  }

  getPetEmoji(species: PetRecord['species']): string {
    if (species === 'dog') return '🐶';
    if (species === 'cat') return '🐱';
    return '🐾';
  }
}
