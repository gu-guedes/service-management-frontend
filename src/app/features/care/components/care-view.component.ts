import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PendingImage } from '../../../core/services/care-state.service';
import { compressImage } from '../../../shared/utils/image-compression';

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
              <label>
                Lembrar de retorno em
                <input type="date" [value]="followUpDate ?? ''" (input)="onFollowUpDateInput($event)" />
                <span class="sub">Opcional — ex: avisar o tutor apos o fim de um tratamento.</span>
              </label>
              <label>
                Exames solicitados
                <div class="exam-input-row">
                  <input
                    type="text"
                    #examInput
                    placeholder="Ex: Hemograma completo"
                    (keydown.enter)="$event.preventDefault(); addExam(examInput)"
                  />
                  <button type="button" class="ghost-btn" (click)="addExam(examInput)">+ Adicionar</button>
                </div>
                <div class="pets-inline compact" *ngIf="pendingExamNames.length">
                  <span class="pet-chip" *ngFor="let name of pendingExamNames; let i = index">
                    <span class="strong">{{ name }}</span>
                    <button type="button" class="chip-remove" (click)="removeExam.emit(i)">×</button>
                  </span>
                </div>
                <span class="sub">Opcional — resultado (PDF) pode ser anexado depois, no detalhe do atendimento.</span>
              </label>
              <label>
                Fotos
                <input type="file" accept="image/*" multiple (change)="onImagesSelected($event)" />
                <div class="photo-thumbs" *ngIf="pendingImages.length">
                  <div class="photo-thumb" *ngFor="let img of pendingImages; let i = index">
                    <img [src]="img.previewUrl" alt="Previa da foto anexada" />
                    <button type="button" class="chip-remove" (click)="removeImage.emit(i)">×</button>
                  </div>
                </div>
                <span class="sub">Opcional — tambem pode ser anexado depois, no detalhe do atendimento.</span>
              </label>
            </div>
            <button type="button" class="primary-btn" [disabled]="isCompletingVisit" (click)="complete.emit()">
              {{ isCompletingVisit ? 'Salvando...' : 'Salvar atendimento' }}
            </button>
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
  @Input() weightKg: number | null = null;
  @Input() weightSuggestionLabel = '';
  @Input() complaint = '';
  @Input() anamnesis = '';
  @Input() treatment = '';
  @Input() followUpDate: string | null = null;
  @Input() pendingExamNames: string[] = [];
  @Input() pendingImages: PendingImage[] = [];
  @Input() isCompletingVisit = false;
  @Input() submitAttempted = false;

  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<void>();
  @Output() openVisit = new EventEmitter<number>();
  @Output() weightKgChange = new EventEmitter<number | null>();
  @Output() complaintChange = new EventEmitter<string>();
  @Output() anamnesisChange = new EventEmitter<string>();
  @Output() treatmentChange = new EventEmitter<string>();
  @Output() followUpDateChange = new EventEmitter<string | null>();
  @Output() addExamName = new EventEmitter<string>();
  @Output() removeExam = new EventEmitter<number>();
  @Output() addImage = new EventEmitter<File>();
  @Output() removeImage = new EventEmitter<number>();

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

  onFollowUpDateInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.followUpDateChange.emit(raw || null);
  }

  addExam(input: HTMLInputElement): void {
    const name = input.value.trim();
    if (!name) return;
    this.addExamName.emit(name);
    input.value = '';
  }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    for (const file of files) {
      const compressed = await compressImage(file);
      this.addImage.emit(compressed);
    }
  }
}
