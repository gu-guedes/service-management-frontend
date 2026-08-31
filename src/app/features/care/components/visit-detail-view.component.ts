import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { MedicalRecordResponseDTO } from '../../../core/services/medical-records-api.service';
import { ExamRequestResponseDTO } from '../../../core/services/exam-requests-api.service';
import { MedicalRecordImageResponseDTO, MedicalRecordImagesApiService } from '../../../core/services/medical-record-images-api.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { compressImage } from '../../../shared/utils/image-compression';
import { toBrDateFromDateOnly, toBrDateFromIso } from '../../../shared/utils/pet-tutor-formatting';
import { firstValueFrom } from 'rxjs';

export interface VisitEditPayload {
  id: number;
  complaint: string;
  anamnesis: string;
  treatment: string;
  weightKg: number | null;
}

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

          <!-- Formulario de edicao do atendimento -->
          <div class="wizard-form care-form" *ngIf="editing()">
            <label>
              Peso (kg)
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="28.5"
                [value]="editWeightKg() ?? ''"
                (input)="onEditWeightInput($event)"
              />
            </label>
            <label>
              Queixa <span class="req">*</span>
              <textarea
                rows="4"
                [value]="editComplaint()"
                [class.invalid]="editSubmitAttempted() && !editComplaint().trim()"
                (input)="onEditComplaintInput($event)"
              ></textarea>
              <span class="field-error" *ngIf="editSubmitAttempted() && !editComplaint().trim()">
                Informe a queixa.
              </span>
            </label>
            <label>
              Anamnese <span class="req">*</span>
              <textarea
                rows="4"
                [value]="editAnamnesis()"
                [class.invalid]="editSubmitAttempted() && !editAnamnesis().trim()"
                (input)="onEditAnamnesisInput($event)"
              ></textarea>
              <span class="field-error" *ngIf="editSubmitAttempted() && !editAnamnesis().trim()">
                Informe a anamnese.
              </span>
            </label>
            <label>
              Tratamento <span class="req">*</span>
              <textarea
                rows="4"
                [value]="editTreatment()"
                [class.invalid]="editSubmitAttempted() && !editTreatment().trim()"
                (input)="onEditTreatmentInput($event)"
              ></textarea>
              <span class="field-error" *ngIf="editSubmitAttempted() && !editTreatment().trim()">
                Informe o tratamento.
              </span>
            </label>
            <footer class="wizard-actions">
              <button type="button" class="ghost-btn" [disabled]="isSavingEdit" (click)="cancelEdit()">Cancelar</button>
              <div class="wizard-actions-right">
                <button type="button" class="primary-btn" [disabled]="isSavingEdit" (click)="onSaveEdit()">
                  {{ isSavingEdit ? 'Salvando...' : 'Salvar alteracoes' }}
                </button>
              </div>
            </footer>
          </div>

          <ng-container *ngIf="!editing()">
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

            <div class="info-block">
              <p class="label">Fotos</p>
              <div class="photo-thumbs" *ngIf="images.length">
                <a
                  *ngFor="let img of images"
                  class="photo-thumb"
                  [href]="imageUrls.get(img.id)"
                  target="_blank"
                  rel="noopener"
                >
                  <img *ngIf="imageUrls.get(img.id) as url" [src]="url" alt="{{ img.fileName }}" />
                </a>
              </div>
              <p class="sub" *ngIf="!images.length">Nenhuma foto anexada.</p>
              <div class="exam-input-row">
                <input type="file" accept="image/*" multiple #imageInput />
                <button
                  type="button"
                  class="ghost-btn"
                  [disabled]="isUploadingImages"
                  (click)="onAddImagesClick(imageInput)"
                >
                  {{ isUploadingImages ? 'Enviando...' : 'Adicionar foto' }}
                </button>
              </div>
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

            <footer class="wizard-actions">
              <button type="button" class="ghost-btn danger" [disabled]="isDeletingRecord" (click)="onDeleteRecord()">
                {{ isDeletingRecord ? 'Excluindo...' : 'Excluir atendimento' }}
              </button>
              <div class="wizard-actions-right">
                <button type="button" class="ghost-btn" (click)="startEdit()">Editar</button>
              </div>
            </footer>
          </ng-container>
        </section>

        <p class="sub" *ngIf="!record">Atendimento nao encontrado.</p>
      </div>
    </section>
  `
})
export class VisitDetailViewComponent implements OnChanges, OnDestroy {
  private readonly medicalRecordImagesApi = inject(MedicalRecordImagesApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  @Input() record: MedicalRecordResponseDTO | null = null;
  @Input() petName = '';
  @Input() petEmoji = '🐾';
  @Input() tutorName = '';
  @Input() isMarkingFollowUpDone = false;
  @Input() examRequests: ExamRequestResponseDTO[] = [];
  @Input() uploadingExamIds: Set<number> = new Set();
  @Input() images: MedicalRecordImageResponseDTO[] = [];
  @Input() isUploadingImages = false;
  @Input() isSavingEdit = false;
  @Input() isDeletingRecord = false;

  @Output() close = new EventEmitter<void>();
  @Output() markFollowUpDone = new EventEmitter<number>();
  @Output() uploadExamResult = new EventEmitter<{ examId: number; file: File }>();
  @Output() downloadExamResult = new EventEmitter<ExamRequestResponseDTO>();
  @Output() uploadImage = new EventEmitter<File>();
  @Output() saveEdit = new EventEmitter<VisitEditPayload>();
  @Output() deleteRecord = new EventEmitter<number>();

  // cache de blob-url por imagem — buscadas sob demanda (precisam do header de
  // autenticacao, um <img src> puro nao levaria), revogadas ao trocar/destruir
  readonly imageUrls = new Map<number, string>();

  readonly editing = signal(false);
  readonly editSubmitAttempted = signal(false);
  readonly editWeightKg = signal<number | null>(null);
  readonly editComplaint = signal('');
  readonly editAnamnesis = signal('');
  readonly editTreatment = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    // se o registro do atendimento mudar enquanto a edicao estava aberta, sai do
    // modo de edicao. Isso cobre dois casos: (1) o usuario trocou de item no
    // historico enquanto editava outro; (2) o pai salvou com sucesso e recarregou
    // o historico (reloadSelectedPetVisits), o que troca a referencia do objeto
    // `record` mesmo mantendo o mesmo id — nao precisa de um sinal extra de
    // "sucesso", a propria atualizacao do registro fecha o formulario.
    if (changes['record'] && this.editing()) {
      this.editing.set(false);
    }

    if (!changes['images']) return;

    const currentIds = new Set(this.images.map((img) => img.id));

    for (const [id, url] of this.imageUrls) {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(url);
        this.imageUrls.delete(id);
      }
    }

    for (const img of this.images) {
      if (this.imageUrls.has(img.id)) continue;
      firstValueFrom(this.medicalRecordImagesApi.getImageBlob(img.id)).then((blob) => {
        this.imageUrls.set(img.id, URL.createObjectURL(blob));
      });
    }
  }

  ngOnDestroy(): void {
    this.imageUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  async onAddImagesClick(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []);
    input.value = '';

    for (const file of files) {
      const compressed = await compressImage(file);
      this.uploadImage.emit(compressed);
    }
  }

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

  startEdit(): void {
    if (!this.record) return;

    this.editSubmitAttempted.set(false);
    this.editWeightKg.set(this.record.weightKg);
    this.editComplaint.set(this.record.complaint);
    this.editAnamnesis.set(this.record.anamnesis);
    this.editTreatment.set(this.record.treatment);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  onEditWeightInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.editWeightKg.set(raw === '' ? null : Number(raw));
  }

  onEditComplaintInput(event: Event): void {
    this.editComplaint.set((event.target as HTMLTextAreaElement).value);
  }

  onEditAnamnesisInput(event: Event): void {
    this.editAnamnesis.set((event.target as HTMLTextAreaElement).value);
  }

  onEditTreatmentInput(event: Event): void {
    this.editTreatment.set((event.target as HTMLTextAreaElement).value);
  }

  onSaveEdit(): void {
    if (!this.record) return;

    this.editSubmitAttempted.set(true);
    const complaint = this.editComplaint().trim();
    const anamnesis = this.editAnamnesis().trim();
    const treatment = this.editTreatment().trim();

    if (!complaint || !anamnesis || !treatment) return;

    this.saveEdit.emit({
      id: this.record.id,
      complaint,
      anamnesis,
      treatment,
      weightKg: this.editWeightKg()
    });
  }

  async onDeleteRecord(): Promise<void> {
    if (!this.record) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Excluir atendimento',
      message: 'Excluir este atendimento? Essa acao nao pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!confirmed) return;

    this.deleteRecord.emit(this.record.id);
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
