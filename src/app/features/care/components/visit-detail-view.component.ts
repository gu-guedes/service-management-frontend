import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MedicalRecordResponseDTO } from '../../../core/services/medical-records-api.service';
import { toBrDateFromDateOnly } from '../../../shared/utils/pet-tutor-formatting';

@Component({
  selector: 'app-visit-detail-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="care-view">
      <header class="care-topbar">
        <button type="button" class="reg-back" (click)="close.emit()">← Voltar</button>
        <p class="care-crumb">Atendimento · {{ petName || 'Pet' }} · {{ tutorName || 'Tutor' }}</p>
        <p class="reg-logo">VetCare</p>
      </header>

      <div class="visit-detail-body">
        <section class="care-card visit-detail-card" *ngIf="record">
          <div class="care-card-header">
            <h4>{{ petEmoji }} {{ petName || 'Paciente' }}</h4>
            <p>{{ formattedDate }} · {{ formattedTime }}</p>
          </div>

          <div class="info-block">
            <p class="label">Queixa</p>
            <p class="strong">{{ record.complaint }}</p>
          </div>

          <div class="info-block">
            <p class="label">Tratamento</p>
            <p class="strong">{{ record.treatment }}</p>
          </div>

          <div class="info-block" *ngIf="record.weightKg != null">
            <p class="label">Peso</p>
            <p class="strong">{{ record.weightKg }} kg</p>
          </div>

          <div class="info-block" *ngIf="record.followUpDate">
            <p class="label">Retorno</p>
            <p class="strong">
              {{ followUpDateLabel }}
              <span *ngIf="record.followUpDone"> · feito</span>
            </p>
            <button
              type="button"
              class="ghost-btn"
              *ngIf="!record.followUpDone"
              [disabled]="isMarkingFollowUpDone"
              (click)="markFollowUpDone.emit(record.id)"
            >
              {{ isMarkingFollowUpDone ? 'Salvando...' : 'Marcar como feito' }}
            </button>
          </div>
        </section>

        <p class="sub" *ngIf="!record">Atendimento nao encontrado.</p>
      </div>
    </section>
  `
})
export class VisitDetailViewComponent {
  @Input() record: MedicalRecordResponseDTO | null = null;
  @Input() petName = '';
  @Input() petEmoji = '🐾';
  @Input() tutorName = '';
  @Input() isMarkingFollowUpDone = false;

  @Output() close = new EventEmitter<void>();
  @Output() markFollowUpDone = new EventEmitter<number>();

  get followUpDateLabel(): string {
    return toBrDateFromDateOnly(this.record?.followUpDate);
  }

  get formattedDate(): string {
    if (!this.record) return '--/--/----';

    const date = new Date(this.record.recordDate);
    if (Number.isNaN(date.getTime())) return '--/--/----';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  get formattedTime(): string {
    if (!this.record) return '--:--';

    const date = new Date(this.record.recordDate);
    if (Number.isNaN(date.getTime())) return '--:--';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }
}
