import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { AppliedProductRecord, ProductStatusFilter } from '../../../core/services/products-applied-state.service';
import { toBrDateFromDateOnly } from '../../../shared/utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Produtos Aplicados — visao cross-paciente (a aplicacao mais recente
// de cada par pet+produto), pra nao precisar abrir ficha por ficha
// nem esperar o produto entrar na janela de vencimento em Avisos.
// -------------------------------------------------------------------
@Component({
  selector: 'app-products-applied-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <section class="products-applied-view">
      <article class="card">
        <header class="card-header pets-header">
          <div>
            <h3>Produtos Aplicados</h3>
            <p>{{ totalResults }} produtos exibidos</p>
          </div>
        </header>

        <div class="filters-bar">
          <p>Status:</p>
          <button
            *ngFor="let filter of statusFilters"
            type="button"
            class="filter-chip"
            [class.active]="activeStatusFilter === filter.key"
            (click)="statusFilterChange.emit(filter.key)"
          >
            {{ filter.label }}
          </button>
          <input
            type="search"
            class="search-input"
            placeholder="Buscar por produto, pet ou tutor..."
            [value]="searchTerm"
            (input)="searchTermChange.emit($any($event.target).value)"
          />
        </div>

        <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Pet</th>
              <th>Tutor</th>
              <th>Aplicado em</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of records" class="tutor-row" (click)="openPet.emit(product.patientName)">
              <td class="strong">{{ product.productName }}</td>
              <td>{{ product.patientName }}</td>
              <td>{{ product.tutorName || 'Nao informado' }}</td>
              <td>{{ toBrDateFromDateOnly(product.appliedDate) }}</td>
              <td>
                <span class="badge" [ngClass]="product.expired ? 'is-orange' : 'is-green'">
                  {{ product.expired ? 'Vencido' : 'Valido ate ' + toBrDateFromDateOnly(product.expiresAt) }}
                </span>
              </td>
              <td class="pet-actions">
                <button type="button" class="ghost-btn" (click)="$event.stopPropagation(); openPet.emit(product.patientName)">
                  Ver ficha
                </button>
              </td>
            </tr>
            <tr *ngIf="!records.length">
              <td colspan="6" class="sub">Nenhum produto aplicado encontrado.</td>
            </tr>
          </tbody>
        </table>
        </div>

        <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="pageChange.emit($event)" />
      </article>
    </section>
  `
})
export class ProductsAppliedViewComponent {
  @Input() records: AppliedProductRecord[] = [];
  @Input() totalResults = 0;
  @Input() statusFilters: Array<{ key: ProductStatusFilter; label: string }> = [];
  @Input() activeStatusFilter: ProductStatusFilter = 'all';
  @Input() searchTerm = '';
  @Input() page = 1;
  @Input() totalPages = 1;

  @Output() statusFilterChange = new EventEmitter<ProductStatusFilter>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() openPet = new EventEmitter<string>();

  readonly toBrDateFromDateOnly = toBrDateFromDateOnly;
}
