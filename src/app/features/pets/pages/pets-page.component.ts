import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PetsViewComponent } from '../components/pets-view.component';
import { PetsStateService } from '../../../core/services/pets-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { CareStateService } from '../../../core/services/care-state.service';
import { MedicalRecordsStateService } from '../../../core/services/medical-records-state.service';
import { MedicalRecordsApiService } from '../../../core/services/medical-records-api.service';
import { ProductApplicationsStateService } from '../../../core/services/product-applications-state.service';
import { ProductApplicationModalStateService } from '../../../core/services/product-application-modal-state.service';
import { ExamRequestsStateService } from '../../../core/services/exam-requests-state.service';
import { ExamRequestResponseDTO } from '../../../core/services/exam-requests-api.service';

@Component({
  selector: 'app-pets-page',
  standalone: true,
  imports: [PetsViewComponent],
  template: `
    <app-pets-view
      [filteredPetRecords]="petsState.filtered()"
      [petFilters]="petsState.filters"
      [activePetFilter]="petsState.activeFilter()"
      [dueFollowUpPatientIds]="medicalRecordsState.dueFollowUpPatientIds()"
      [dueFollowUps]="medicalRecordsState.dueFollowUps()"
      [markingFollowUpDoneIds]="markingFollowUpDoneIds()"
      [expiringProducts]="productApplicationsState.expiringProducts()"
      [expiringProductPatientIds]="productApplicationsState.expiringProductPatientIds()"
      [pendingExams]="examRequestsState.pendingExamRequests()"
      [pendingExamPatientIds]="examRequestsState.pendingExamPatientIds()"
      (petFilterChange)="petsState.setFilter($any($event))"
      (openPet)="modalState.openPetModal($event)"
      (startCare)="startCare($event)"
      (markFollowUpDone)="markFollowUpDone($event)"
      (addProduct)="productApplicationModalState.open($event)"
      (openExamVisit)="openExamVisit($event)"
    />
  `
})
export class PetsPageComponent {
  readonly petsState = inject(PetsStateService);
  readonly modalState = inject(ModalStateService);
  readonly medicalRecordsState = inject(MedicalRecordsStateService);
  readonly productApplicationsState = inject(ProductApplicationsStateService);
  readonly productApplicationModalState = inject(ProductApplicationModalStateService);
  readonly examRequestsState = inject(ExamRequestsStateService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);
  private readonly careState = inject(CareStateService);
  private readonly router = inject(Router);

  readonly markingFollowUpDoneIds = signal<Set<number>>(new Set());

  // atalho da lista de pets: pula direto pro atendimento, sem passar pela ficha
  async startCare(petName: string): Promise<void> {
    await this.modalState.selectPet(petName);
    const pet = this.modalState.selectedPet();
    if (!pet) return;

    const latestWeight = this.modalState.selectedPetLatestWeight();
    this.careState.startForPet(pet, latestWeight);
    this.router.navigate(['/app/care']);
  }

  // abre o atendimento especifico de um exame pendente, direto do card da lista de Pets
  async openExamVisit(exam: ExamRequestResponseDTO): Promise<void> {
    const pet = this.petsState.findById(exam.patientId);
    if (!pet) return;

    await this.modalState.selectPet(pet.name);
    const latestWeight = this.modalState.selectedPetLatestWeight();
    this.careState.startForPet(pet, latestWeight);
    this.modalState.openVisitDetail(exam.medicalRecordId);
    this.router.navigate(['/app/care']);
  }

  // resolve o lembrete de retorno direto da lista de Pets, sem precisar abrir o prontuario
  async markFollowUpDone(recordId: number): Promise<void> {
    const record = this.medicalRecordsState.records().find((r) => r.id === recordId);
    if (!record) return;

    this.markingFollowUpDoneIds.update((ids) => new Set(ids).add(recordId));

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
    } finally {
      this.markingFollowUpDoneIds.update((ids) => {
        const next = new Set(ids);
        next.delete(recordId);
        return next;
      });
    }
  }
}
