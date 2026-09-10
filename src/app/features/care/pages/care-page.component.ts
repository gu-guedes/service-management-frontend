import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CareViewComponent } from '../components/care-view.component';
import { VisitDetailViewComponent, VisitEditPayload } from '../components/visit-detail-view.component';
import { CareStateService } from '../../../core/services/care-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { PetsStateService } from '../../../core/services/pets-state.service';
import { MedicalRecordsApiService } from '../../../core/services/medical-records-api.service';
import { MedicalRecordsStateService } from '../../../core/services/medical-records-state.service';
import { ExamRequestsApiService, ExamRequestResponseDTO } from '../../../core/services/exam-requests-api.service';
import { ExamRequestsStateService } from '../../../core/services/exam-requests-state.service';
import { MedicalRecordImagesApiService } from '../../../core/services/medical-record-images-api.service';
import { MedicalRecordImagesStateService } from '../../../core/services/medical-record-images-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { toBrDateFromIso } from '../../../shared/utils/pet-tutor-formatting';

@Component({
  selector: 'app-care-page',
  standalone: true,
  imports: [CommonModule, CareViewComponent, VisitDetailViewComponent],
  template: `
    <app-care-view
      *ngIf="!modalState.selectedVisitRecord()"
      [selectedPetRecord]="modalState.selectedPet()"
      [selectedTutorRecord]="modalState.selectedTutor()"
      [selectedPetTimeline]="modalState.selectedPetTimeline()"
      [selectedPetEmoji]="modalState.selectedPetEmoji()"
      [weightKg]="careState.weightKg()"
      [weightSuggestionLabel]="careState.weightSuggestionLabel()"
      [complaint]="careState.complaint()"
      [anamnesis]="careState.anamnesis()"
      [treatment]="careState.treatment()"
      [followUpDate]="careState.followUpDate()"
      [pendingExamNames]="careState.pendingExamNames()"
      [pendingImages]="careState.pendingImages()"
      [isCompletingVisit]="isCompletingVisit()"
      [submitAttempted]="submitAttempted()"
      (close)="close()"
      (weightKgChange)="careState.setWeightKg($event)"
      (complaintChange)="careState.setComplaint($event)"
      (anamnesisChange)="careState.setAnamnesis($event)"
      (treatmentChange)="careState.setTreatment($event)"
      (followUpDateChange)="careState.setFollowUpDate($event)"
      (addExamName)="careState.addPendingExamName($event)"
      (removeExam)="careState.removePendingExamName($event)"
      (addImage)="careState.addPendingImage($event)"
      (removeImage)="careState.removePendingImage($event)"
      (complete)="completeCareVisit()"
      (openVisit)="modalState.openVisitDetail($event)"
    />

    <app-visit-detail-view
      *ngIf="modalState.selectedVisitRecord() as record"
      [record]="record"
      [petName]="modalState.selectedPet()?.name || ''"
      [petEmoji]="modalState.selectedPetEmoji()"
      [tutorName]="modalState.selectedPet()?.tutor || ''"
      [isMarkingFollowUpDone]="isMarkingFollowUpDone()"
      [examRequests]="examRequestsState.findByMedicalRecordId(record.id)"
      [uploadingExamIds]="uploadingExamIds()"
      [images]="medicalRecordImagesState.findByMedicalRecordId(record.id)"
      [isUploadingImages]="isUploadingImages()"
      [isSavingEdit]="isSavingVisitEdit()"
      [isDeletingRecord]="isDeletingVisit()"
      (close)="closeVisitDetail()"
      (markFollowUpDone)="markFollowUpDone($event)"
      (uploadExamResult)="uploadExamResult($event.examId, $event.file)"
      (downloadExamResult)="downloadExamResult($event)"
      (uploadImage)="uploadImageToVisit(record.id, $event)"
      (saveEdit)="saveEditedVisit($event)"
      (deleteRecord)="deleteVisit($event)"
    />
  `
})
export class CarePageComponent {
  readonly careState = inject(CareStateService);
  readonly modalState = inject(ModalStateService);
  readonly examRequestsState = inject(ExamRequestsStateService);
  readonly medicalRecordImagesState = inject(MedicalRecordImagesStateService);
  private readonly petsState = inject(PetsStateService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);
  private readonly medicalRecordsState = inject(MedicalRecordsStateService);
  private readonly examRequestsApi = inject(ExamRequestsApiService);
  private readonly medicalRecordImagesApi = inject(MedicalRecordImagesApiService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly isCompletingVisit = signal(false);
  readonly isMarkingFollowUpDone = signal(false);
  readonly uploadingExamIds = signal<Set<number>>(new Set());
  readonly isUploadingImages = signal(false);
  readonly submitAttempted = signal(false);

  readonly isSavingVisitEdit = signal(false);
  readonly isDeletingVisit = signal(false);

  close(): void {
    this.careState.close();
    this.modalState.close();
    this.router.navigate(['/app/pets']);
  }

  // fecha o detalhe do atendimento — pra onde volta depende de como chegou aqui
  // (ver ModalStateService.openVisitDetail): da ficha do pet, dos Avisos, ou
  // clicado dentro da propria tela de atendimento (nesse caso so revela o
  // "Novo atendimento" que ja estava por baixo, sem navegar pra lugar nenhum)
  closeVisitDetail(): void {
    const origin = this.modalState.visitDetailOrigin();
    const petName = this.modalState.selectedPet()?.name;
    this.modalState.closeVisitDetail();

    if (origin === 'avisos') {
      this.router.navigate(['/app/dashboard']);
    } else if (origin === 'pet-ficha' && petName) {
      this.modalState.openPetModal(petName);
      this.router.navigate(['/app/pets']);
    }
  }

  async completeCareVisit(): Promise<void> {
    // guarda contra clique duplo — sem isso, dois cliques rapidos no botao disparavam
    // dois POSTs antes do primeiro terminar e desabilitar o botao a tempo
    if (this.isCompletingVisit()) return;

    this.submitAttempted.set(true);
    const pet = this.modalState.selectedPet();

    if (!pet?.id) {
      this.toastService.error('Nao foi possivel identificar o pet para salvar o atendimento.');
      return;
    }

    const complaint = this.careState.complaint().trim();
    const anamnesis = this.careState.anamnesis().trim();
    const treatment = this.careState.treatment().trim();

    if (!complaint || !anamnesis || !treatment) {
      this.toastService.error('Preencha a queixa, a anamnese e o tratamento antes de salvar.');
      return;
    }

    this.isCompletingVisit.set(true);

    try {
      const record = await firstValueFrom(
        this.medicalRecordsApi.create({
          patientId: pet.id,
          complaint,
          anamnesis,
          treatment,
          weightKg: this.careState.weightKg(),
          followUpDate: this.careState.followUpDate()
        })
      );

      this.careState.complete();
      // reseta a flag de "ja tentei salvar" — sem isso, o formulario limpo
      // (agora vazio) ficava mostrando "Informe a queixa/anamnese/tratamento"
      // em vermelho de graca, mesmo sem o usuario ter tentado salvar de novo
      this.submitAttempted.set(false);
      this.toastService.success('Atendimento salvo com sucesso.');
      this.modalState.reloadSelectedPetVisits();
      this.medicalRecordsState.addRecord(record);
      this.petsState.updateLastVisit(pet.id, toBrDateFromIso(record.recordDate));

      const examNames = this.careState.pendingExamNames();
      if (examNames.length) {
        const created = await Promise.all(
          examNames.map((examName) =>
            firstValueFrom(this.examRequestsApi.create({ medicalRecordId: record.id, examName }))
          )
        );
        created.forEach((exam) => this.examRequestsState.addRecord(exam));
      }

      const pendingImages = this.careState.pendingImages();
      if (pendingImages.length) {
        const createdImages = await Promise.all(
          pendingImages.map((img) => firstValueFrom(this.medicalRecordImagesApi.upload(record.id, img.file)))
        );
        createdImages.forEach((img) => this.medicalRecordImagesState.addRecord(img));
      }
    } catch {
      this.toastService.error('Nao foi possivel salvar o atendimento agora. Tente novamente.');
    } finally {
      this.isCompletingVisit.set(false);
    }
  }

  // marca o lembrete de retorno de um atendimento como resolvido, sem reabrir o form de edicao completo
  async markFollowUpDone(recordId: number): Promise<void> {
    const record = this.modalState.selectedVisitRecord();
    if (!record || record.id !== recordId) return;

    this.isMarkingFollowUpDone.set(true);

    try {
      await firstValueFrom(
        this.medicalRecordsApi.update(recordId, {
          patientId: record.patientId,
          complaint: record.complaint,
          anamnesis: record.anamnesis,
          treatment: record.treatment,
          weightKg: record.weightKg,
          followUpDate: record.followUpDate,
          followUpDone: true
        })
      );

      this.medicalRecordsState.updateRecord(recordId, { followUpDone: true });
      this.modalState.reloadSelectedPetVisits();
    } finally {
      this.isMarkingFollowUpDone.set(false);
    }
  }

  // anexa uma foto depois que o atendimento ja foi salvo (aberto no historico) —
  // mesmo endpoint do upload feito logo apos salvar, so que com o medicalRecordId ja existente
  async uploadImageToVisit(medicalRecordId: number, file: File): Promise<void> {
    this.isUploadingImages.set(true);

    try {
      const created = await firstValueFrom(this.medicalRecordImagesApi.upload(medicalRecordId, file));
      this.medicalRecordImagesState.addRecord(created);
    } finally {
      this.isUploadingImages.set(false);
    }
  }

  async uploadExamResult(examId: number, file: File): Promise<void> {
    this.uploadingExamIds.update((ids) => new Set(ids).add(examId));

    try {
      const updated = await firstValueFrom(this.examRequestsApi.uploadResult(examId, file));
      this.examRequestsState.updateRecord(examId, {
        resultFileName: updated.resultFileName,
        resultUploadedAt: updated.resultUploadedAt
      });
    } finally {
      this.uploadingExamIds.update((ids) => {
        const next = new Set(ids);
        next.delete(examId);
        return next;
      });
    }
  }

  // baixa via blob (nao um <a href> direto) pra levar o header de autenticacao
  async downloadExamResult(exam: ExamRequestResponseDTO): Promise<void> {
    const blob = await firstValueFrom(this.examRequestsApi.downloadResult(exam.id));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exam.resultFileName || 'resultado.pdf';
    link.click();
    URL.revokeObjectURL(url);
  }

  async saveEditedVisit(payload: VisitEditPayload): Promise<void> {
    if (this.isSavingVisitEdit()) return;

    const current = this.modalState.selectedVisitRecord();
    if (!current) return;

    this.isSavingVisitEdit.set(true);

    try {
      const updated = await firstValueFrom(
        this.medicalRecordsApi.update(payload.id, {
          patientId: current.patientId,
          complaint: payload.complaint,
          anamnesis: payload.anamnesis,
          treatment: payload.treatment,
          weightKg: payload.weightKg
        })
      );

      this.medicalRecordsState.updateRecord(payload.id, updated);
      this.toastService.success('Atendimento atualizado com sucesso.');
      this.modalState.reloadSelectedPetVisits();

      const pet = this.modalState.selectedPet();
      if (pet?.id) {
        this.petsState.updateLastVisit(pet.id, toBrDateFromIso(updated.recordDate));
      }
    } catch {
      this.toastService.error('Nao foi possivel salvar as alteracoes. Tente novamente.');
    } finally {
      this.isSavingVisitEdit.set(false);
    }
  }

  async deleteVisit(id: number): Promise<void> {
    if (this.isDeletingVisit()) return;

    this.isDeletingVisit.set(true);

    try {
      await firstValueFrom(this.medicalRecordsApi.delete(id));
      this.medicalRecordsState.removeRecord(id);
      this.toastService.success('Atendimento excluido com sucesso.');
      this.modalState.closeVisitDetail();
      this.modalState.reloadSelectedPetVisits();
    } catch {
      this.toastService.error('Nao foi possivel excluir o atendimento. Tente novamente.');
    } finally {
      this.isDeletingVisit.set(false);
    }
  }
}
