import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MedicalRecordResponseDTO } from '../../../core/services/medical-records-api.service';
import { ProductApplicationResponseDTO } from '../../../core/services/product-applications-api.service';
import { dateUrgencyLabel, toBrDateFromDateOnly } from '../../../shared/utils/pet-tutor-formatting';

@Component({
  selector: 'app-pets-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pets-view">
      <article class="card due-followups-card" *ngIf="dueFollowUps.length">
        <header class="card-header pets-header">
          <div>
            <h3>🔔 Retornos pendentes</h3>
            <p>{{ dueFollowUps.length }} {{ dueFollowUps.length === 1 ? 'lembrete' : 'lembretes' }} — hoje, atrasados ou amanha</p>
          </div>
        </header>

        <div class="due-followups-list">
          <div class="due-followup-item" *ngFor="let record of dueFollowUps">
            <div>
              <p class="strong">
                {{ record.patientName }}
                <span class="badge" [ngClass]="urgencyBadgeClass(record.followUpDate)">{{ urgencyLabel(record.followUpDate) }}</span>
              </p>
              <p class="sub">{{ record.treatment }}</p>
              <p class="sub">Retorno: {{ formatFollowUpDate(record.followUpDate) }}</p>
            </div>
            <button
              type="button"
              class="ghost-btn"
              [disabled]="markingFollowUpDoneIds.has(record.id)"
              (click)="markFollowUpDone.emit(record.id)"
            >
              {{ markingFollowUpDoneIds.has(record.id) ? 'Salvando...' : 'Marcar como feito' }}
            </button>
          </div>
        </div>
      </article>

      <article class="card due-followups-card" *ngIf="expiringProducts.length">
        <header class="card-header pets-header">
          <div>
            <h3>🏷️ Produtos vencendo</h3>
            <p>{{ expiringProducts.length }} {{ expiringProducts.length === 1 ? 'produto' : 'produtos' }} — hoje, atrasados ou amanha</p>
          </div>
        </header>

        <div class="due-followups-list">
          <div class="due-followup-item" *ngFor="let product of expiringProducts">
            <div>
              <p class="strong">
                {{ product.patientName }}
                <span class="badge" [ngClass]="urgencyBadgeClass(product.expiresAt)">{{ urgencyLabel(product.expiresAt) }}</span>
              </p>
              <p class="sub">{{ product.productName }}</p>
              <p class="sub">Vence: {{ formatFollowUpDate(product.expiresAt) }}</p>
            </div>
            <button type="button" class="ghost-btn" (click)="addProduct.emit(product.patientName)">
              Renovar
            </button>
          </div>
        </div>
      </article>

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
              <th>Status</th>
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
              <td>
                <span class="badge" [ngClass]="pet.statusClass">{{ pet.status }}</span>
              </td>
              <td class="pet-actions">
                <button type="button" class="ghost-btn" (click)="openPet.emit(pet.name)">
                  Ver ficha
                </button>
                <button type="button" class="primary-btn" (click)="startCare.emit(pet.name)">
                  + Atendimento
                </button>
                <button type="button" class="ghost-btn" (click)="addProduct.emit(pet.name)">
                  + Produto
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
    id: number | null;
    name: string;
    species: 'dog' | 'cat' | 'other';
    summary: string;
    tutor: string;
    tutorInitials: string;
    lastVisit: string;
    status: string;
    statusClass: string;
  }> = [];

  @Input() petFilters: Array<{ key: string; label: string }> = [];
  @Input() activePetFilter = 'all';
  @Input() dueFollowUpPatientIds: Set<number> = new Set();
  @Input() dueFollowUps: MedicalRecordResponseDTO[] = [];
  @Input() markingFollowUpDoneIds: Set<number> = new Set();
  @Input() expiringProducts: ProductApplicationResponseDTO[] = [];
  @Input() expiringProductPatientIds: Set<number> = new Set();

  @Output() petFilterChange = new EventEmitter<string>();
  @Output() openPet = new EventEmitter<string>();
  @Output() startCare = new EventEmitter<string>();
  @Output() markFollowUpDone = new EventEmitter<number>();
  @Output() addProduct = new EventEmitter<string>();

  formatFollowUpDate(dateOnlyIso: string | null): string {
    return toBrDateFromDateOnly(dateOnlyIso);
  }

  urgencyLabel(dateOnlyIso: string | null): string {
    const label = dateUrgencyLabel(dateOnlyIso);
    return label === 'Amanha' ? 'Amanhã' : label;
  }

  urgencyBadgeClass(dateOnlyIso: string | null): string {
    const label = dateUrgencyLabel(dateOnlyIso);
    if (label === 'Atrasado') return 'is-orange';
    if (label === 'Hoje') return 'is-green';
    return 'is-gray';
  }

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
