import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CareStateService } from './care-state.service';
import { ModalStateService } from './modal-state.service';
import { PetsStateService } from './pets-state.service';
import { MedicalRecordsApiService } from './medical-records-api.service';
import { MedicalRecordsStateService } from './medical-records-state.service';
import { ExamRequestResponseDTO } from './exam-requests-api.service';

// -------------------------------------------------------------------
// Acoes de orquestracao dos avisos (retorno pendente, exame pendente)
// usadas tanto na lista de Pets quanto na pagina de Avisos — centralizado
// aqui pra nao duplicar a logica entre as duas paginas.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class RemindersActionsService {
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);
  private readonly medicalRecordsState = inject(MedicalRecordsStateService);
  private readonly petsState = inject(PetsStateService);
  private readonly modalState = inject(ModalStateService);
  private readonly careState = inject(CareStateService);
  private readonly router = inject(Router);

  readonly markingFollowUpDoneIds = signal<Set<number>>(new Set());

  // resolve o lembrete de retorno direto da lista (Pets ou Avisos), sem precisar abrir o prontuario
  async markFollowUpDone(recordId: number): Promise<void> {
    const record = this.medicalRecordsState.records().find((r) => r.id === recordId);
    if (!record) return;

    this.markingFollowUpDoneIds.update((ids) => new Set(ids).add(recordId));

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
    } finally {
      this.markingFollowUpDoneIds.update((ids) => {
        const next = new Set(ids);
        next.delete(recordId);
        return next;
      });
    }
  }

  // abre o atendimento especifico de um exame pendente, direto do card
  async openExamVisit(exam: ExamRequestResponseDTO): Promise<void> {
    const pet = this.petsState.findById(exam.patientId);
    if (!pet) return;

    await this.modalState.selectPet(pet.name);
    const latestWeight = this.modalState.selectedPetLatestWeight();
    this.careState.startForPet(pet, latestWeight);
    this.modalState.openVisitDetail(exam.medicalRecordId, 'avisos');
    this.router.navigate(['/app/care']);
  }
}
