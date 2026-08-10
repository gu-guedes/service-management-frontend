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
      [anamnesis]="careState.anamnesis()"
      [treatment]="careState.treatment()"
      [isCompletingVisit]="isCompletingVisit()"
      [submitAttempted]="submitAttempted()"
      (close)="close()"
      (weightKgChange)="careState.setWeightKg($event)"
      (complaintChange)="careState.setComplaint($event)"
      (anamnesisChange)="careState.setAnamnesis($event)"
      (treatmentChange)="careState.setTreatment($event)"
      (complete)="completeCareVisit()"
      (openVisit)="modalState.openVisitDetail($event)"
    />

    <app-visit-detail-view
      *ngIf="modalState.selectedVisitRecord()"
      [record]="modalState.selectedVisitRecord()"
      [petName]="modalState.selectedPet()?.name || ''"
      [petEmoji]="modalState.selectedPetEmoji()"
      [tutorName]="modalState.selectedPet()?.tutor || ''"
      (close)="modalState.closeVisitDetail()"
    />
  `
})
export class CarePageComponent {
  readonly careState = inject(CareStateService);
  readonly modalState = inject(ModalStateService);
  private readonly petsState = inject(PetsStateService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);
  private readonly router = inject(Router);

  readonly isCompletingVisit = signal(false);
  readonly submitAttempted = signal(false);

  close(): void {
    this.careState.close();
    this.modalState.close();
    this.router.navigate(['/app/pets']);
  }

  async completeCareVisit(): Promise<void> {
    // guarda contra clique duplo — sem isso, dois cliques rapidos no botao disparavam
    // dois POSTs antes do primeiro terminar e desabilitar o botao a tempo
    if (this.isCompletingVisit()) return;

    this.submitAttempted.set(true);
    const pet = this.modalState.selectedPet();

    if (!pet?.id) {
      this.careState.setCompletionMessage('Nao foi possivel identificar o pet para salvar o atendimento.');
      return;
    }

    const complaint = this.careState.complaint().trim();
    const anamnesis = this.careState.anamnesis().trim();
    const treatment = this.careState.treatment().trim();

    if (!complaint || !anamnesis || !treatment) {
      this.careState.setCompletionMessage('Preencha a queixa, a anamnese e o tratamento antes de salvar.');
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
          weightKg: this.careState.weightKg()
        })
      );

      this.careState.complete();
      this.modalState.reloadSelectedPetVisits();
      this.petsState.updateLastVisit(pet.id, toBrDateFromIso(record.recordDate));
    } catch {
      this.careState.setCompletionMessage('Nao foi possivel salvar o atendimento agora. Tente novamente.');
    } finally {
      this.isCompletingVisit.set(false);
    }
  }
}
