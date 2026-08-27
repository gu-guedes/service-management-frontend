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
      [isSavingEdit]="isSavingVisitEdit()"
      [isDeletingRecord]="isDeletingVisit()"
      (close)="modalState.closeVisitDetail()"
      (saveEdit)="saveEditedVisit($event)"
      (deleteRecord)="deleteVisit($event)"
    />
  `
})
export class CarePageComponent {
  readonly careState = inject(CareStateService);
  readonly modalState = inject(ModalStateService);
  private readonly petsState = inject(PetsStateService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly isCompletingVisit = signal(false);
  readonly submitAttempted = signal(false);

  readonly isSavingVisitEdit = signal(false);
  readonly isDeletingVisit = signal(false);

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
          weightKg: this.careState.weightKg()
        })
      );

      this.careState.complete();
      // reseta a flag de "ja tentei salvar" — sem isso, o formulario limpo
      // (agora vazio) ficava mostrando "Informe a queixa/anamnese/tratamento"
      // em vermelho de graca, mesmo sem o usuario ter tentado salvar de novo
      this.submitAttempted.set(false);
      this.toastService.success('Atendimento salvo com sucesso.');
      this.modalState.reloadSelectedPetVisits();
      this.petsState.updateLastVisit(pet.id, toBrDateFromIso(record.recordDate));
    } catch {
      this.toastService.error('Nao foi possivel salvar o atendimento agora. Tente novamente.');
    } finally {
      this.isCompletingVisit.set(false);
    }
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
