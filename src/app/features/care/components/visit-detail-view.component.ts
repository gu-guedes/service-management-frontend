import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MedicalRecordResponseDTO } from '../../../core/services/medical-records-api.service';
import { ExamRequestResponseDTO } from '../../../core/services/exam-requests-api.service';
import { toBrDateFromDateOnly, toBrDateFromIso } from '../../../shared/utils/pet-tutor-formatting';

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
            <p class="label">Anamnese</p>
            <p class="strong">{{ record.anamnesis }}</p>
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

          <div class="info-block" *ngIf="examRequests.length">
            <p class="label">Exames</p>
            <div class="due-followups-list">
              <div class="due-followup-item" *ngFor="let exam of examRequests">
                <div>
                  <p class="strong">{{ exam.examName }}</p>
                  <p class="sub">Solicitado em {{ formatExamDate(exam.requestedDate) }}</p>
                  <p class="sub" *ngIf="exam.resultFileName">Resultado anexado em {{ formatUploadedAt(exam.resultUploadedAt) }}</p>
                </div>

                <button
                  type="button"
                  class="ghost-btn"
                  *ngIf="exam.resultFileName"
                  (click)="downloadExamResult.emit(exam)"
                >
                  Baixar resultado
                </button>

                <div class="exam-input-row" *ngIf="!exam.resultFileName">
                  <input type="file" accept="application/pdf" #resultInput />
                  <button
                    type="button"
                    class="ghost-btn"
                    [disabled]="uploadingExamIds.has(exam.id)"
                    (click)="onUploadClick(exam.id, resultInput)"
                  >
                    {{ uploadingExamIds.has(exam.id) ? 'Enviando...' : 'Anexar resultado' }}
                  </button>
                </div>
              </div>
            </div>
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
  @Input() examRequests: ExamRequestResponseDTO[] = [];
  @Input() uploadingExamIds: Set<number> = new Set();

  @Output() close = new EventEmitter<void>();
  @Output() markFollowUpDone = new EventEmitter<number>();
  @Output() uploadExamResult = new EventEmitter<{ examId: number; file: File }>();
  @Output() downloadExamResult = new EventEmitter<ExamRequestResponseDTO>();

  get followUpDateLabel(): string {
    return toBrDateFromDateOnly(this.record?.followUpDate);
  }

  formatExamDate(dateOnlyIso: string | null): string {
    return toBrDateFromDateOnly(dateOnlyIso);
  }

  // resultUploadedAt e um timestamp completo (OffsetDateTime), nao date-only —
  // toBrDateFromDateOnly quebraria (split('-') pega o offset de fuso tambem)
  formatUploadedAt(iso: string | null): string {
    return toBrDateFromIso(iso);
  }

  onUploadClick(examId: number, input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    this.uploadExamResult.emit({ examId, file });
    input.value = '';
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
