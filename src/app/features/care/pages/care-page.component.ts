import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CareViewComponent } from '../components/care-view.component';
import { VisitDetailViewComponent } from '../components/visit-detail-view.component';
import { CareStateService } from '../../../core/services/care-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { PetsStateService } from '../../../core/services/pets-state.service';
import { MedicalRecordsApiService } from '../../../core/services/medical-records-api.service';
import { MedicalRecordsStateService } from '../../../core/services/medical-records-state.service';
import { ExamRequestsApiService, ExamRequestResponseDTO } from '../../../core/services/exam-requests-api.service';
import { ExamRequestsStateService } from '../../../core/services/exam-requests-state.service';
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
      [careCompletionMessage]="careState.completionMessage()"
      [weightKg]="careState.weightKg()"
      [weightSuggestionLabel]="careState.weightSuggestionLabel()"
      [complaint]="careState.complaint()"
      [treatment]="careState.treatment()"
      [followUpDate]="careState.followUpDate()"
      [pendingExamNames]="careState.pendingExamNames()"
      [isCompletingVisit]="isCompletingVisit()"
      [submitAttempted]="submitAttempted()"
      (close)="close()"
      (weightKgChange)="careState.setWeightKg($event)"
      (complaintChange)="careState.setComplaint($event)"
      (treatmentChange)="careState.setTreatment($event)"
      (followUpDateChange)="careState.setFollowUpDate($event)"
      (addExamName)="careState.addPendingExamName($event)"
      (removeExam)="careState.removePendingExamName($event)"
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
      (close)="modalState.closeVisitDetail()"
      (markFollowUpDone)="markFollowUpDone($event)"
      (uploadExamResult)="uploadExamResult($event.examId, $event.file)"
      (downloadExamResult)="downloadExamResult($event)"
    />
  `
})
export class CarePageComponent {
  readonly careState = inject(CareStateService);
  readonly modalState = inject(ModalStateService);
  readonly examRequestsState = inject(ExamRequestsStateService);
  private readonly petsState = inject(PetsStateService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);
  private readonly medicalRecordsState = inject(MedicalRecordsStateService);
  private readonly examRequestsApi = inject(ExamRequestsApiService);
  private readonly router = inject(Router);

  readonly isCompletingVisit = signal(false);
  readonly isMarkingFollowUpDone = signal(false);
  readonly uploadingExamIds = signal<Set<number>>(new Set());
  readonly submitAttempted = signal(false);

  close(): void {
    this.careState.close();
    this.modalState.close();
    this.router.navigate(['/app/pets']);
  }

  async completeCareVisit(): Promise<void> {
    this.submitAttempted.set(true);
    const pet = this.modalState.selectedPet();

    if (!pet?.id) {
      this.careState.setCompletionMessage('Nao foi possivel identificar o pet para salvar o atendimento.');
      return;
    }

    const complaint = this.careState.complaint().trim();
    const treatment = this.careState.treatment().trim();

    if (!complaint || !treatment) {
      this.careState.setCompletionMessage('Preencha a queixa e o tratamento antes de salvar.');
      return;
    }

    this.isCompletingVisit.set(true);

    try {
      const record = await firstValueFrom(
        this.medicalRecordsApi.create({
          patientId: pet.id,
          complaint,
          treatment,
          weightKg: this.careState.weightKg(),
          followUpDate: this.careState.followUpDate()
        })
      );

      this.careState.complete();
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
    } catch {
      this.careState.setCompletionMessage('Nao foi possivel salvar o atendimento agora. Tente novamente.');
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
}
