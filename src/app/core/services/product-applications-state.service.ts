import { Injectable, computed, signal } from '@angular/core';
import { ProductApplicationResponseDTO } from './product-applications-api.service';
import { toTodayIso, toTomorrowIso } from '../../shared/utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Serviço de estado das aplicações de produto (coleira, vermifugo,
// vacina...). Responsabilidade: lista completa carregada da API (ver
// AppComponent) — so a aplicacao mais recente de cada produto por pet
// conta pra decidir se esta vencendo (renovar = registro novo, sem
// campo de "resolvido"), mesmo espirito do MedicalRecordsStateService.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ProductApplicationsStateService {
  private readonly _records = signal<ProductApplicationResponseDTO[]>([]);

  readonly records = this._records.asReadonly();

  // so a aplicacao mais recente (por ordem de criacao, nao pela data de vencimento —
  // um registro corrigido/atrasado pode ter expiresAt menor que uma venda anterior)
  // de cada par (patientId, productName)
  private readonly latestPerPatientAndProduct = computed(() => {
    const latest = new Map<string, ProductApplicationResponseDTO>();

    for (const record of this._records()) {
      const key = `${record.patientId}::${record.productName}`;
      const current = latest.get(key);
      if (!current || record.id > current.id) {
        latest.set(key, record);
      }
    }

    return [...latest.values()];
  });

  // produtos vencendo hoje, atrasados ou amanha — pro painel de destaque
  readonly expiringProducts = computed(() => {
    const tomorrow = toTomorrowIso();
    return this.latestPerPatientAndProduct()
      .filter((r) => r.expiresAt <= tomorrow)
      .sort((a, b) => (a.expiresAt < b.expiresAt ? -1 : 1));
  });

  // ids dos pets com produto vencendo hoje ou atrasado (sem amanha) — pro badge da linha
  readonly expiringProductPatientIds = computed(() => {
    const today = toTodayIso();
    return new Set(
      this.latestPerPatientAndProduct()
        .filter((r) => r.expiresAt <= today)
        .map((r) => r.patientId)
    );
  });

  // historico completo (todas as aplicacoes, nao so a mais recente por produto) de um pet —
  // usado na ficha do pet, mais recente primeiro
  findByPatientId(patientId: number): ProductApplicationResponseDTO[] {
    return this._records()
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => b.id - a.id);
  }

  // substitui a lista inteira — usado ao carregar os dados reais da API
  replaceAll(records: ProductApplicationResponseDTO[]): void {
    this._records.set(records);
  }

  addRecord(record: ProductApplicationResponseDTO): void {
    this._records.update((records) => [record, ...records]);
  }
}
