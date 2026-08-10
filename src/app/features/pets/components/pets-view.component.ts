import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pets-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pets-view">
      <article class="card">
        <header class="card-header pets-header">
          <div>
            <h3>Fichas de Pets</h3>
            <p>{{ filteredPetRecords.length }} resultados exibidos</p>
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
        </div>

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
                    <p class="strong">{{ pet.name }}</p>
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
                <button type="button" class="ghost-btn" (click)="openPet.emit(pet.name)">
                  Ver ficha
                </button>
                <button type="button" class="primary-btn" (click)="startCare.emit(pet.name)">
                  + Atendimento
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  `
})
export class PetsViewComponent {
  @Input() filteredPetRecords: Array<{
    name: string;
    species: 'dog' | 'cat' | 'other';
    summary: string;
    tutor: string;
    tutorInitials: string;
    lastVisit: string;
  }> = [];

  @Input() petFilters: Array<{ key: string; label: string }> = [];
  @Input() activePetFilter = 'all';

  @Output() petFilterChange = new EventEmitter<string>();
  @Output() openPet = new EventEmitter<string>();
  @Output() startCare = new EventEmitter<string>();

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
