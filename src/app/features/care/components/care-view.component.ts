import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-care-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="care-view">
      <header class="care-topbar">
        <button type="button" class="reg-back" (click)="close.emit()">← Voltar</button>
        <p class="care-crumb">Atendimento · {{ selectedPetRecord?.name || 'Pet' }} · {{ selectedPetRecord?.tutor || 'Tutor' }}</p>
        <p class="reg-logo">VetCare</p>
      </header>

      <div class="care-body">
        <aside class="care-left">
          <div class="care-pet-header">
            <span class="pet-avatar large">{{ selectedPetEmoji }}</span>
            <p class="pet-title">{{ selectedPetRecord?.name || 'Paciente' }}</p>
            <p class="sub">{{ selectedPetRecord?.summary || 'Dados do pet' }}</p>
          </div>

          <div class="info-block compact">
            <p class="label">Tutor</p>
            <div class="pet-cell">
              <span class="tutor-avatar">{{ selectedPetRecord?.tutorInitials || '--' }}</span>
              <p class="strong">{{ selectedPetRecord?.tutor || 'Nao informado' }}</p>
            </div>
          </div>

          <div class="info-block compact">
            <p class="label">Historico recente</p>
            <div class="care-history-list">
              <button
                type="button"
                class="care-history-item"
                *ngFor="let item of selectedPetTimeline"
                (click)="openVisit.emit(item.id)"
              >
                <span class="sub care-history-time">{{ item.date }} · {{ item.time }}</span>
                <span class="strong">{{ item.title }}</span>
                <span class="sub">{{ item.description }}</span>
              </button>
              <p class="sub" *ngIf="!selectedPetTimeline.length">Sem atendimentos registrados.</p>
            </div>
          </div>
        </aside>

        <main class="care-center">
          <section class="care-card">
            <div class="care-card-header">
              <h4>Novo atendimento</h4>
              <p>Queixa, anamnese, tratamento e peso do atendimento</p>
            </div>
            <div class="wizard-form care-form">
              <label>
                Peso (kg)
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="28.5"
                  [value]="weightKg ?? ''"
                  (input)="onWeightInput($event)"
                />
                <span class="sub" *ngIf="weightSuggestionLabel">{{ weightSuggestionLabel }} — confirme ou ajuste.</span>
              </label>
              <label>
                Queixa <span class="req">*</span>
                <textarea
                  rows="4"
                  placeholder="Motivo do atendimento — o que o tutor relatou"
                  [value]="complaint"
                  [class.invalid]="submitAttempted && !complaint.trim()"
                  (input)="onComplaintInput($event)"
                ></textarea>
                <span class="field-error" *ngIf="submitAttempted && !complaint.trim()">
                  Informe a queixa.
                </span>
              </label>
              <label>
                Anamnese <span class="req">*</span>
                <textarea
                  rows="4"
                  placeholder="Historico clinico relatado pelo tutor"
                  [value]="anamnesis"
                  [class.invalid]="submitAttempted && !anamnesis.trim()"
                  (input)="onAnamnesisInput($event)"
                ></textarea>
                <span class="field-error" *ngIf="submitAttempted && !anamnesis.trim()">
                  Informe a anamnese.
                </span>
              </label>
              <label>
                Tratamento <span class="req">*</span>
                <textarea
                  rows="4"
                  placeholder="Conduta, medicacao e orientacoes"
                  [value]="treatment"
                  [class.invalid]="submitAttempted && !treatment.trim()"
                  (input)="onTreatmentInput($event)"
                ></textarea>
                <span class="field-error" *ngIf="submitAttempted && !treatment.trim()">
                  Informe o tratamento.
                </span>
              </label>
            </div>
            <button type="button" class="primary-btn" [disabled]="isCompletingVisit" (click)="complete.emit()">
              {{ isCompletingVisit ? 'Salvando...' : 'Salvar atendimento' }}
            </button>
            <p class="sub" *ngIf="careCompletionMessage">{{ careCompletionMessage }}</p>
          </section>
        </main>
      </div>
    </section>
  `
})
export class CareViewComponent {
  @Input() selectedPetRecord:
    | {
        name: string;
        species: 'dog' | 'cat' | 'other';
        summary: string;
        tutor: string;
        tutorInitials: string;
        lastVisit: string;
      }
    | null = null;
  @Input() selectedTutorRecord: { name: string; phone: string } | null = null;
  @Input() selectedPetTimeline: Array<{ id: number; title: string; date: string; time: string; description: string }> = [];
  @Input() selectedPetEmoji = '🐾';
  @Input() careCompletionMessage = '';
  @Input() weightKg: number | null = null;
  @Input() weightSuggestionLabel = '';
  @Input() complaint = '';
  @Input() anamnesis = '';
  @Input() treatment = '';
  @Input() isCompletingVisit = false;
  @Input() submitAttempted = false;

  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<void>();
  @Output() openVisit = new EventEmitter<number>();
  @Output() weightKgChange = new EventEmitter<number | null>();
  @Output() complaintChange = new EventEmitter<string>();
  @Output() anamnesisChange = new EventEmitter<string>();
  @Output() treatmentChange = new EventEmitter<string>();

  onWeightInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.weightKgChange.emit(raw === '' ? null : Number(raw));
  }

  onComplaintInput(event: Event): void {
    this.complaintChange.emit((event.target as HTMLTextAreaElement).value);
  }

  onAnamnesisInput(event: Event): void {
    this.anamnesisChange.emit((event.target as HTMLTextAreaElement).value);
  }

  onTreatmentInput(event: Event): void {
    this.treatmentChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
