import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ModalStateService } from '../../core/services/modal-state.service';
import { PetsStateService } from '../../core/services/pets-state.service';
import { TutorsStateService } from '../../core/services/tutors-state.service';
import { CareStateService } from '../../core/services/care-state.service';
import { DirectoryApiService } from '../../core/services/directory-api.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import {
  toAgeLabel,
  toApiSexFromCode,
  toFormSex,
  toSexLabel,
  toSpeciesLabel,
  toUiSpeciesFromApi
} from '../utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Ficha do pet — modal compartilhado, montado uma vez no shell.
// E aberto tanto da lista de pets quanto do perfil do tutor (chips de pet),
// por isso nao pertence a nenhuma das duas paginas roteadas.
// -------------------------------------------------------------------
@Component({
  selector: 'app-pet-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section
      *ngIf="modalState.activeModal() === 'pet' && modalState.selectedPet() as pet"
      class="modal-overlay"
      (click)="close()"
    >
      <article class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <h3>Ficha do Pet</h3>
            <p>Prontuario e historico de atendimentos</p>
          </div>
          <button type="button" class="modal-close" (click)="close()">X</button>
        </header>

        <div class="modal-body">
          <div class="pet-highlight">
            <span class="pet-avatar large">{{ modalState.selectedPetEmoji() }}</span>
            <div>
              <p class="pet-title">{{ pet.name }}</p>
              <p class="sub">{{ pet.summary }}</p>
            </div>
            <div class="pet-actions" *ngIf="!editingPet()">
              <button type="button" class="ghost-btn" (click)="startEditPet()">Editar</button>
              <button type="button" class="ghost-btn danger" (click)="deletePet()">Excluir</button>
              <button type="button" class="primary-btn" (click)="openCareViewFromPet()">+ Atendimento</button>
            </div>
          </div>

          <!-- Formulario de edicao do pet -->
          <form *ngIf="editingPet()" [formGroup]="editPetForm" class="wizard-form">
            <div class="grid-2-col">
              <label>
                Nome <span class="req">*</span>
                <input type="text" formControlName="name" />
                <span class="field-error" *ngIf="editPetForm.controls['name'].invalid && editPetForm.controls['name'].touched">
                  Informe o nome do pet (minimo 2 caracteres).
                </span>
              </label>
              <label>
                Especie <span class="req">*</span>
                <select formControlName="species">
                  <option value="dog">Cao</option>
                  <option value="cat">Gato</option>
                  <option value="other">Outro</option>
                </select>
              </label>
            </div>
            <div class="grid-2-col">
              <label>
                Raca <span class="req">*</span>
                <input type="text" formControlName="breed" />
                <span class="field-error" *ngIf="editPetForm.controls['breed'].invalid && editPetForm.controls['breed'].touched">
                  Informe a raca.
                </span>
              </label>
              <label>
                Sexo <span class="req">*</span>
                <select formControlName="sex">
                  <option value="M">Macho</option>
                  <option value="F">Femea</option>
                </select>
              </label>
              <label>
                Idade (anos) <span class="req">*</span>
                <input type="number" formControlName="age" step="1" min="0" max="50" />
                <span class="field-error" *ngIf="editPetForm.controls['age'].invalid && editPetForm.controls['age'].touched">
                  Informe a idade (0 a 50 anos).
                </span>
              </label>
              <label>
                Peso (kg) <span class="req">*</span>
                <input type="number" formControlName="weight" step="0.1" min="0.1" max="120" />
                <span class="field-error" *ngIf="editPetForm.controls['weight'].invalid && editPetForm.controls['weight'].touched">
                  Informe o peso (0.1 a 120 kg).
                </span>
              </label>
            </div>
            <label>
              Observacoes <span class="req">*</span>
              <textarea rows="3" formControlName="notes"></textarea>
              <span class="field-error" *ngIf="editPetForm.controls['notes'].invalid && editPetForm.controls['notes'].touched">
                Informe uma observacao sobre o pet.
              </span>
            </label>
            <footer class="wizard-actions">
              <button type="button" class="ghost-btn" (click)="cancelEditPet()">Cancelar</button>
              <div class="wizard-actions-right">
                <button type="button" class="primary-btn" [disabled]="isSavingEdit()" (click)="saveEditPet()">
                  {{ isSavingEdit() ? 'Salvando...' : 'Salvar alteracoes' }}
                </button>
              </div>
            </footer>
          </form>

          <ng-container *ngIf="!editingPet()">
            <div class="info-block">
              <p class="label">Tutor</p>
              <div class="pet-cell between">
                <div class="pet-cell">
                  <span class="tutor-avatar">{{ pet.tutorInitials }}</span>
                  <p class="strong">{{ pet.tutor }}</p>
                </div>
                <button type="button" class="link-btn" (click)="openTutorFromPet()">Ver perfil</button>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <p class="label">Cadastrado em</p>
                <p class="strong">{{ pet.registeredAt }}</p>
              </div>
              <div>
                <p class="label">Ultima visita</p>
                <p class="strong">{{ pet.lastVisit }}</p>
              </div>
            </div>

            <div class="info-block">
              <p class="label">Historico recente</p>
              <div class="timeline" *ngIf="modalState.selectedPetTimeline().length; else noHistory">
                <button
                  type="button"
                  class="timeline-item"
                  *ngFor="let item of modalState.selectedPetTimeline()"
                  (click)="openVisitDetail(item.id)"
                >
                  <p class="sub">{{ item.date }} · {{ item.time }}</p>
                  <p class="strong">{{ item.title }}</p>
                  <p class="sub">{{ item.description }}</p>
                </button>
              </div>
              <ng-template #noHistory>
                <p class="sub">Sem historico registrado para este pet.</p>
              </ng-template>
            </div>
          </ng-container>
        </div>
      </article>
    </section>
  `
})
export class PetDetailModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly directoryApi = inject(DirectoryApiService);
  private readonly petsState = inject(PetsStateService);
  private readonly tutorsState = inject(TutorsStateService);
  private readonly careState = inject(CareStateService);
  readonly modalState = inject(ModalStateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  readonly editingPet = signal(false);
  readonly isSavingEdit = signal(false);
  // customerId do pet em edição — precisa ser reenviado no PUT, mas não faz parte do form
  private editingPetCustomerId: number | null = null;

  readonly editPetForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    species: ['dog', Validators.required],
    breed: ['', Validators.required],
    sex: ['M', Validators.required],
    age: [null as number | null, [Validators.required, Validators.min(0), Validators.max(50)]],
    weight: [null as number | null, [Validators.required, Validators.min(0.1), Validators.max(120)]],
    notes: ['', Validators.required]
  });

  // fecha a ficha e descarta qualquer edicao em andamento
  close(): void {
    this.modalState.close();
    this.editingPet.set(false);
  }

  openCareViewFromPet(): void {
    const pet = this.modalState.selectedPet();
    if (!pet) return;

    const latestWeight = this.modalState.selectedPetLatestWeight();
    // closeOverlay (nao close!) — mantem o pet selecionado, a tela de atendimento precisa dele
    this.modalState.closeOverlay();
    this.careState.startForPet(pet, latestWeight);
    this.router.navigate(['/app/care']);
  }

  openTutorFromPet(): void {
    const pet = this.modalState.selectedPet();
    if (!pet) return;
    const tutor = this.tutorsState.findByName(pet.tutor);
    if (tutor) this.modalState.openTutorModal(tutor.id);
  }

  // abre um atendimento do historico numa pagina inteira — a pagina de detalhe
  // so existe dentro da rota /app/care, por isso precisa navegar pra la.
  // tambem prepara o careState (igual o "+ Atendimento") pra que, se o usuario
  // fechar o detalhe, caia num atendimento novo coerente pro mesmo pet, em vez
  // de dado antigo de uma sessao anterior
  openVisitDetail(visitId: number): void {
    const pet = this.modalState.selectedPet();
    if (!pet) return;

    const latestWeight = this.modalState.selectedPetLatestWeight();
    this.careState.startForPet(pet, latestWeight);
    this.modalState.openVisitDetail(visitId);
    this.router.navigate(['/app/care']);
  }

  async startEditPet(): Promise<void> {
    const pet = this.modalState.selectedPet();
    if (!pet?.id) return;

    try {
      const patient = await firstValueFrom(this.directoryApi.getPatientById(pet.id));
      this.editingPetCustomerId = patient.customerId;
      this.editPetForm.reset({
        name: patient.name,
        species: toUiSpeciesFromApi(patient.species),
        breed: patient.breed ?? '',
        sex: toFormSex(patient.sex),
        age: patient.ageYears ?? null,
        weight: patient.weightKg ?? null,
        notes: patient.notes ?? ''
      });
      this.editingPet.set(true);
    } catch {
      this.toastService.error('Nao foi possivel carregar os dados do pet.');
    }
  }

  cancelEditPet(): void {
    this.editingPet.set(false);
  }

  async saveEditPet(): Promise<void> {
    if (this.isSavingEdit()) return;

    const pet = this.modalState.selectedPet();
    if (!pet?.id || this.editingPetCustomerId === null) return;

    if (this.editPetForm.invalid) {
      this.editPetForm.markAllAsTouched();
      return;
    }

    this.isSavingEdit.set(true);
    const raw = this.editPetForm.getRawValue();

    try {
      const updated = await firstValueFrom(
        this.directoryApi.updatePatient(pet.id, {
          customerId: this.editingPetCustomerId,
          name: raw.name ?? '',
          species: raw.species ?? 'dog',
          breed: raw.breed ?? '',
          sex: toApiSexFromCode((raw.sex ?? 'M') as 'M' | 'F'),
          ageYears: raw.age ?? undefined,
          weightKg: raw.weight ?? undefined,
          notes: raw.notes ?? ''
        })
      );

      const species = toUiSpeciesFromApi(updated.species);
      this.petsState.updateRecord(pet.id, {
        name: updated.name,
        species,
        summary: `${updated.breed || 'Sem raca'} · ${toSpeciesLabel(species)} · ${toSexLabel(updated.sex)} · ${toAgeLabel(updated.ageYears)}`,
        weightKg: updated.weightKg ?? null
      });

      // o pet e resolvido pelo nome no modalState — se o nome mudou, reseleciona pelo novo nome
      if (updated.name !== pet.name) {
        await this.modalState.selectPet(updated.name);
      }

      this.editingPet.set(false);
      this.toastService.success('Pet atualizado com sucesso.');
    } catch {
      this.toastService.error('Nao foi possivel salvar as alteracoes do pet.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  async deletePet(): Promise<void> {
    if (this.isSavingEdit()) return;

    const pet = this.modalState.selectedPet();
    if (!pet?.id) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Excluir pet',
      message: `Excluir ${pet.name}? Ele vai sumir da lista de pets e nao pode ser recuperado por aqui.`,
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!confirmed) return;

    this.isSavingEdit.set(true);

    try {
      await firstValueFrom(this.directoryApi.deletePatient(pet.id));
      this.petsState.removeRecord(pet.id);
      this.tutorsState.removePet(pet.id);
      this.close();
      this.toastService.success('Pet excluido com sucesso.');
    } catch {
      this.toastService.error('Nao foi possivel excluir o pet agora.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }
}
