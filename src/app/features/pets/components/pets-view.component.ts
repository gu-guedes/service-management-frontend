import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationComponent } from '../../../shared/components/pagination.component';

// -------------------------------------------------------------------
// Lista de Pets. Os avisos (retorno/produto/exame pendente) tem card
// proprio na pagina de Avisos — aqui so os selinhos discretos na linha
// (🔔/🏷️/🧪) pra dar contexto rapido sem repetir o card em duas paginas.
// -------------------------------------------------------------------
@Component({
  selector: 'app-pets-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <section class="pets-view">
      <article class="card">
        <header class="card-header pets-header">
          <div>
            <h3>Fichas de Pets</h3>
            <p>{{ totalResults }} resultados exibidos</p>
          </div>
        </header>

        <div class="filters-bar">
          <p>Filtrar:</p>
          <button
            *ngFor="let filter of petFilters"
            type="button"
            class="filter-chip"
            [class.active]="activePetFilter === filter.key"
            (click)="petFilterChange.emit(filter.key)"
          >
            {{ filter.label }}
          </button>
          <input
            type="search"
            class="search-input"
            placeholder="Buscar por pet ou tutor..."
            [value]="searchTerm"
            (input)="searchTermChange.emit($any($event.target).value)"
          />
        </div>

        <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Pet</th>
              <th>Tutor</th>
              <th>Ultima Visita</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pet of filteredPetRecords">
              <td>
                <div class="pet-cell">
                  <span class="pet-avatar">{{ getPetEmoji(pet.species) }}</span>
                  <div>
                    <p class="strong">
                      {{ pet.name }}
                      <span *ngIf="pet.id !== null && dueFollowUpPatientIds.has(pet.id)" title="Retorno pendente">🔔</span>
                      <span *ngIf="pet.id !== null && expiringProductPatientIds.has(pet.id)" title="Produto vencendo">🏷️</span>
                      <span *ngIf="pet.id !== null && pendingExamPatientIds.has(pet.id)" title="Exame pendente">🧪</span>
                    </p>
                    <p class="sub">{{ pet.summary }}</p>
                  </div>
                </div>
              </td>
              <td>
                <div class="pet-cell">
                  <span class="tutor-avatar">{{ pet.tutorInitials }}</span>
                  <p class="strong">{{ pet.tutor }}</p>
                </div>
              </td>
              <td>{{ pet.lastVisit }}</td>
              <td class="pet-actions">
                <button type="button" class="ghost-btn" *ngIf="pet.id !== null" (click)="openPet.emit(pet.id)">
                  Ver ficha
                </button>
                <button type="button" class="primary-btn" *ngIf="pet.id !== null" (click)="startCare.emit(pet.id)">
                  + Atendimento
                </button>
                <button type="button" class="ghost-btn" *ngIf="pet.id !== null" (click)="addProduct.emit(pet.id)">
                  + Produto
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <!-- versao mobile da lista acima (mesmos dados/outputs) — ver .table-scroll/.mobile-cards no scss -->
        <div class="mobile-cards">
          <article class="record-card" *ngFor="let pet of filteredPetRecords">
            <div class="pet-cell">
              <span class="pet-avatar">{{ getPetEmoji(pet.species) }}</span>
              <div>
                <p class="strong">
                  {{ pet.name }}
                  <span *ngIf="pet.id !== null && dueFollowUpPatientIds.has(pet.id)" title="Retorno pendente">🔔</span>
                  <span *ngIf="pet.id !== null && expiringProductPatientIds.has(pet.id)" title="Produto vencendo">🏷️</span>
                  <span *ngIf="pet.id !== null && pendingExamPatientIds.has(pet.id)" title="Exame pendente">🧪</span>
                </p>
                <p class="sub">{{ pet.summary }}</p>
              </div>
            </div>
            <dl class="record-card-fields">
              <dt>Tutor</dt>
              <dd>{{ pet.tutor }}</dd>
              <dt>Ultima visita</dt>
              <dd>{{ pet.lastVisit }}</dd>
            </dl>
            <div class="record-card-actions">
              <button type="button" class="ghost-btn" *ngIf="pet.id !== null" (click)="openPet.emit(pet.id)">
                Ver ficha
              </button>
              <button type="button" class="primary-btn" *ngIf="pet.id !== null" (click)="startCare.emit(pet.id)">
                + Atendimento
              </button>
              <button type="button" class="ghost-btn" *ngIf="pet.id !== null" (click)="addProduct.emit(pet.id)">
                + Produto
              </button>
            </div>
          </article>
          <p class="sub" *ngIf="!filteredPetRecords.length">Nenhum pet encontrado.</p>
        </div>

        <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="pageChange.emit($event)" />
      </article>
    </section>
  `
})
export class PetsViewComponent {
  @Input() filteredPetRecords: Array<{
    id: number | null;
    name: string;
    species: 'dog' | 'cat' | 'other';
    summary: string;
    tutor: string;
    tutorInitials: string;
    lastVisit: string;
  }> = [];

  @Input() petFilters: Array<{ key: string; label: string }> = [];
  @Input() activePetFilter = 'all';
  @Input() searchTerm = '';
  @Input() totalResults = 0;
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() dueFollowUpPatientIds: Set<number> = new Set();
  @Input() expiringProductPatientIds: Set<number> = new Set();
  @Input() pendingExamPatientIds: Set<number> = new Set();

  @Output() petFilterChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() openPet = new EventEmitter<number>();
  @Output() startCare = new EventEmitter<number>();
  @Output() addProduct = new EventEmitter<number>();

  getPetEmoji(species: 'dog' | 'cat' | 'other'): string {
    if (species === 'dog') {
      return '🐶';
    }

    if (species === 'cat') {
      return '🐱';
    }

    return '🐾';
  }
}
