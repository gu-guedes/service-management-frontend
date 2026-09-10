import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationComponent } from '../../../shared/components/pagination.component';

@Component({
  selector: 'app-tutors-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <section class="tutors-view">
      <article class="card">
        <header class="card-header pets-header">
          <div>
            <h3>Tutores / Clientes</h3>
            <p>{{ totalResults }} resultados exibidos</p>
          </div>
        </header>

        <div class="filters-bar">
          <input
            type="search"
            class="search-input"
            placeholder="Buscar por nome, telefone ou CPF..."
            [value]="searchTerm"
            (input)="searchTermChange.emit($any($event.target).value)"
          />
        </div>

        <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tutor</th>
              <th>Contato</th>
              <th>Pets</th>
              <th>Ultima Visita</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let tutor of tutorRecords">
              <tr class="tutor-row" (click)="toggleTutor.emit(tutor.id)">
                <td>
                  <div class="pet-cell">
                    <span class="tutor-avatar">{{ tutor.initials }}</span>
                    <div>
                      <p class="strong">
                        {{ tutor.name }}
                        <span *ngIf="birthdayTodayIds.has(tutor.id)" title="Aniversario hoje">🎂</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td>{{ tutor.phone }}</td>
                <td>
                  <span class="badge is-gray">{{ tutor.pets.length }} {{ tutor.pets.length === 1 ? 'pet' : 'pets' }}</span>
                </td>
                <td>{{ tutor.lastVisit }}</td>
                <td>
                  <button type="button" class="ghost-btn" (click)="$event.stopPropagation(); openTutor.emit(tutor.id)">
                    Ver perfil
                  </button>
                </td>
              </tr>

              <tr *ngIf="expandedTutorId === tutor.id" class="expand-row">
                <td colspan="5">
                  <div class="pets-inline">
                    <button
                      type="button"
                      class="pet-chip"
                      *ngFor="let pet of tutor.pets"
                      (click)="$event.stopPropagation(); openPet.emit(pet.name)"
                    >
                      <span>{{ pet.icon }}</span>
                      <span class="strong">{{ pet.name }}</span>
                      <span class="sub">{{ pet.details }}</span>
                    </button>
                    <button type="button" class="pet-chip add" (click)="$event.stopPropagation(); addPet.emit()">
                      + Adicionar pet
                    </button>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
        </div>

        <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="pageChange.emit($event)" />
      </article>
    </section>
  `
})
export class TutorsViewComponent {
  @Input() tutorRecords: Array<{
    id: string;
    name: string;
    phone: string;
    initials: string;
    lastVisit: string;
    pets: Array<{ name: string; details: string; icon: string }>;
  }> = [];

  @Input() expandedTutorId: string | null = null;
  @Input() birthdayTodayIds: Set<string> = new Set();
  @Input() searchTerm = '';
  @Input() totalResults = 0;
  @Input() page = 1;
  @Input() totalPages = 1;

  @Output() toggleTutor = new EventEmitter<string>();
  @Output() openTutor = new EventEmitter<string>();
  @Output() openPet = new EventEmitter<string>();
  @Output() addPet = new EventEmitter<void>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
}
