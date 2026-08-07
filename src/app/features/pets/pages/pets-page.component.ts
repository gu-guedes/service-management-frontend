import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PetsViewComponent } from '../components/pets-view.component';
import { PetsStateService } from '../../../core/services/pets-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { CareStateService } from '../../../core/services/care-state.service';
import { MedicalRecordsStateService } from '../../../core/services/medical-records-state.service';
import { ProductApplicationsStateService } from '../../../core/services/product-applications-state.service';
import { ProductApplicationModalStateService } from '../../../core/services/product-application-modal-state.service';
import { ExamRequestsStateService } from '../../../core/services/exam-requests-state.service';

// -------------------------------------------------------------------
// Lista de Pets — os avisos (retorno/produto/exame pendente) tem card
// proprio na pagina de Avisos (ver features/dashboard); aqui so ficam
// os selinhos discretos na linha (🔔/🏷️/🧪), pra dar contexto rapido
// sem repetir o mesmo card em duas paginas.
// -------------------------------------------------------------------
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
      [expiringProductPatientIds]="productApplicationsState.expiringProductPatientIds()"
      [pendingExamPatientIds]="examRequestsState.pendingExamPatientIds()"
      (petFilterChange)="petsState.setFilter($any($event))"
      (openPet)="modalState.openPetModal($event)"
      (startCare)="startCare($event)"
      (addProduct)="productApplicationModalState.open($event)"
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
  private readonly careState = inject(CareStateService);
  private readonly router = inject(Router);

  // atalho da lista de pets: pula direto pro atendimento, sem passar pela ficha
  async startCare(petName: string): Promise<void> {
    await this.modalState.selectPet(petName);
    const pet = this.modalState.selectedPet();
    if (!pet) return;

    const latestWeight = this.modalState.selectedPetLatestWeight();
    this.careState.startForPet(pet, latestWeight);
    this.router.navigate(['/app/care']);
  }
}
