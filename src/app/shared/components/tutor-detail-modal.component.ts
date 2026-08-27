import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ModalStateService } from '../../core/services/modal-state.service';
import { TutorsStateService } from '../../core/services/tutors-state.service';
import { PetsStateService } from '../../core/services/pets-state.service';
import { DirectoryApiService } from '../../core/services/directory-api.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { toAddressLabel } from '../utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Perfil do tutor — modal compartilhado, montado uma vez no shell.
// E aberto tanto da lista de tutores quanto da ficha do pet ("Ver perfil"),
// por isso nao pertence a nenhuma das duas paginas roteadas.
// -------------------------------------------------------------------
@Component({
  selector: 'app-tutor-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section
      *ngIf="modalState.activeModal() === 'tutor' && modalState.selectedTutor() as tutor"
      class="modal-overlay"
      (click)="close()"
    >
      <article class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <h3>Perfil do Tutor</h3>
            <p>Dados e pets vinculados</p>
          </div>
          <div class="pet-actions">
            <button type="button" class="ghost-btn" *ngIf="!editingTutor()" (click)="startEditTutor()">Editar</button>
            <button type="button" class="ghost-btn danger" *ngIf="!editingTutor()" (click)="deleteTutor()">Excluir</button>
            <button type="button" class="modal-close" (click)="close()">X</button>
          </div>
        </header>

        <div class="modal-body">
          <!-- Formulario de edicao do tutor -->
          <form *ngIf="editingTutor()" [formGroup]="editTutorForm" class="wizard-form">
            <label>
              Nome completo <span class="req">*</span>
              <input type="text" formControlName="fullName" />
              <span class="field-error" *ngIf="editTutorForm.controls['fullName'].invalid && editTutorForm.controls['fullName'].touched">
                Informe o nome completo (minimo 3 caracteres).
              </span>
            </label>
            <label>
              WhatsApp / Telefone <span class="req">*</span>
              <input
                type="text"
                formControlName="phone"
                placeholder="(11) 99999-9999"
                maxlength="15"
                (input)="onEditTutorPhoneInput($event)"
              />
              <span class="field-error" *ngIf="editTutorForm.controls['phone'].invalid && editTutorForm.controls['phone'].touched">
                Use o formato (11) 99999-9999.
              </span>
            </label>
            <label>
              CPF
              <input
                type="text"
                formControlName="cpf"
                placeholder="000.000.000-00"
                maxlength="14"
                (input)="onEditTutorCpfInput($event)"
              />
              <span class="field-error" *ngIf="editTutorForm.controls['cpf'].invalid && editTutorForm.controls['cpf'].touched">
                Use o formato 000.000.000-00.
              </span>
            </label>
            <div class="grid-2-col">
              <label>
                Rua <span class="req">*</span>
                <input type="text" formControlName="street" />
                <span class="field-error" *ngIf="editTutorForm.controls['street'].invalid && editTutorForm.controls['street'].touched">
                  Informe a rua.
                </span>
              </label>
              <label>
                Numero <span class="req">*</span>
                <input type="text" formControlName="streetNumber" />
                <span class="field-error" *ngIf="editTutorForm.controls['streetNumber'].invalid && editTutorForm.controls['streetNumber'].touched">
                  Informe o numero.
                </span>
              </label>
              <label>
                Bairro <span class="req">*</span>
                <input type="text" formControlName="neighborhood" />
                <span class="field-error" *ngIf="editTutorForm.controls['neighborhood'].invalid && editTutorForm.controls['neighborhood'].touched">
                  Informe o bairro.
                </span>
              </label>
              <label>
                Cidade <span class="req">*</span>
                <input type="text" formControlName="city" />
                <span class="field-error" *ngIf="editTutorForm.controls['city'].invalid && editTutorForm.controls['city'].touched">
                  Informe a cidade.
                </span>
              </label>
            </div>
            <label>
              Ponto de referencia
              <input type="text" formControlName="referencePoint" />
            </label>
            <footer class="wizard-actions">
              <button type="button" class="ghost-btn" (click)="cancelEditTutor()">Cancelar</button>
              <div class="wizard-actions-right">
                <button type="button" class="primary-btn" [disabled]="isSavingEdit()" (click)="saveEditTutor()">
                  {{ isSavingEdit() ? 'Salvando...' : 'Salvar alteracoes' }}
                </button>
              </div>
            </footer>
          </form>

          <ng-container *ngIf="!editingTutor()">
            <div class="info-grid">
              <div>
                <p class="label">Nome</p>
                <p class="strong">{{ tutor.name }}</p>
              </div>
              <div>
                <p class="label">Contato</p>
                <p class="strong">{{ tutor.phone }}</p>
              </div>
              <div *ngIf="tutor.cpf">
                <p class="label">CPF</p>
                <p class="strong">{{ tutor.cpf }}</p>
              </div>
              <div>
                <p class="label">Endereco</p>
                <p class="strong">{{ tutor.address }}</p>
              </div>
              <div>
                <p class="label">Cadastrado em</p>
                <p class="strong">{{ tutor.registeredAt }}</p>
              </div>
              <div>
                <p class="label">Ultima visita</p>
                <p class="strong">{{ tutor.lastVisit }}</p>
              </div>
            </div>

            <div class="info-block">
              <p class="label">Pets de {{ tutor.name }}</p>
              <div class="pets-inline compact">
                <button
                  type="button"
                  class="pet-chip"
                  *ngFor="let pet of tutor.pets"
                  (click)="modalState.openPetModal(pet.name)"
                >
                  <span>{{ pet.icon }}</span>
                  <span class="strong">{{ pet.name }}</span>
                  <span class="sub">{{ pet.details }}</span>
                </button>
              </div>
            </div>
          </ng-container>
        </div>
      </article>
    </section>
  `
})
export class TutorDetailModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly directoryApi = inject(DirectoryApiService);
  private readonly tutorsState = inject(TutorsStateService);
  private readonly petsState = inject(PetsStateService);
  readonly modalState = inject(ModalStateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  readonly editingTutor = signal(false);
  readonly isSavingEdit = signal(false);

  readonly editTutorForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/)]],
    cpf: ['', [Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
    street: ['', [Validators.required, Validators.minLength(2)]],
    streetNumber: ['', [Validators.required]],
    neighborhood: ['', [Validators.required, Validators.minLength(2)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    referencePoint: ['']
  });

  close(): void {
    this.modalState.close();
    this.editingTutor.set(false);
  }

  async startEditTutor(): Promise<void> {
    const tutor = this.modalState.selectedTutor();
    if (!tutor) return;

    try {
      const customer = await firstValueFrom(this.directoryApi.getCustomerById(Number(tutor.id)));
      this.editTutorForm.reset({
        fullName: customer.name,
        phone: customer.phone ?? '',
        cpf: this.formatCpf(customer.cpf ?? ''),
        street: customer.street ?? '',
        streetNumber: customer.streetNumber ?? '',
        neighborhood: customer.neighborhood ?? '',
        city: customer.city ?? '',
        referencePoint: customer.referencePoint ?? ''
      });
      this.editingTutor.set(true);
    } catch {
      this.toastService.error('Nao foi possivel carregar os dados do tutor.');
    }
  }

  cancelEditTutor(): void {
    this.editingTutor.set(false);
  }

  async saveEditTutor(): Promise<void> {
    if (this.isSavingEdit()) return;

    const tutor = this.modalState.selectedTutor();
    if (!tutor) return;

    if (this.editTutorForm.invalid) {
      this.editTutorForm.markAllAsTouched();
      return;
    }

    this.isSavingEdit.set(true);
    const raw = this.editTutorForm.getRawValue();

    try {
      const updated = await firstValueFrom(
        this.directoryApi.updateCustomer(Number(tutor.id), {
          name: raw.fullName ?? '',
          phone: this.toApiPhone(raw.phone ?? ''),
          cpf: this.toApiCpf(raw.cpf ?? '') || undefined,
          street: raw.street ?? '',
          streetNumber: raw.streetNumber ?? '',
          neighborhood: raw.neighborhood ?? '',
          city: raw.city ?? '',
          referencePoint: raw.referencePoint || undefined
        })
      );

      this.tutorsState.updateRecord(tutor.id, {
        name: updated.name,
        phone: updated.phone || '--',
        cpf: this.formatCpf(updated.cpf ?? ''),
        address: toAddressLabel(updated)
      });

      this.editingTutor.set(false);
      this.toastService.success('Tutor atualizado com sucesso.');
    } catch {
      this.toastService.error('Nao foi possivel salvar as alteracoes do tutor.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  async deleteTutor(): Promise<void> {
    if (this.isSavingEdit()) return;

    const tutor = this.modalState.selectedTutor();
    if (!tutor) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Excluir tutor',
      message: `Excluir ${tutor.name}? Todos os pets desse tutor tambem serao excluidos e essa acao nao pode ser desfeita por aqui.`,
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!confirmed) return;

    this.isSavingEdit.set(true);

    try {
      await firstValueFrom(this.directoryApi.deleteCustomer(Number(tutor.id)));
      tutor.pets.forEach((pet) => this.petsState.removeRecord(pet.id));
      this.tutorsState.removeRecord(tutor.id);
      this.close();
      this.toastService.success('Tutor excluido com sucesso.');
    } catch {
      this.toastService.error('Nao foi possivel excluir o tutor agora.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  // máscara automática do telefone no form de edicao do tutor — mesmo padrao do cadastro
  onEditTutorPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.editTutorForm.controls.phone.setValue(this.formatPhone(digits));
  }

  private formatPhone(digits: string): string {
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  private toApiPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private toApiCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  // mascara automatica do CPF: 000.000.000-00, mesma ideia do telefone
  onEditTutorCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.editTutorForm.controls['cpf'].setValue(this.formatCpf(digits));
  }

  private formatCpf(digits: string): string {
    const onlyDigits = digits.replace(/\D/g, '').slice(0, 11);
    if (!onlyDigits) return '';
    if (onlyDigits.length <= 3) return onlyDigits;
    if (onlyDigits.length <= 6) return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3)}`;
    if (onlyDigits.length <= 9) return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3, 6)}.${onlyDigits.slice(6)}`;
    return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3, 6)}.${onlyDigits.slice(6, 9)}-${onlyDigits.slice(9, 11)}`;
  }
}
