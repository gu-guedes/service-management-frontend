import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductApplicationModalStateService } from '../../core/services/product-application-modal-state.service';
import { ProductApplicationsApiService } from '../../core/services/product-applications-api.service';
import { ProductApplicationsStateService } from '../../core/services/product-applications-state.service';
import { PetsStateService } from '../../core/services/pets-state.service';
import { toTodayIso } from '../utils/pet-tutor-formatting';

const PRODUCT_PRESETS = ['Coleira Leishmaniose', 'Vermifugo', 'Vacina'];

// -------------------------------------------------------------------
// Registro rapido de venda/aplicacao de produto com validade (coleira,
// vermifugo, vacina...) — sem abrir um atendimento completo. Montado
// uma vez no shell, aberto pelo botao "+ Produto" na lista de Pets.
// -------------------------------------------------------------------
@Component({
  selector: 'app-product-application-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section *ngIf="modalState.isOpen()" class="modal-overlay" (click)="close()">
      <article class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <h3>Registrar produto</h3>
            <p>{{ modalState.petName() }}</p>
          </div>
          <button type="button" class="modal-close" (click)="close()">X</button>
        </header>

        <div class="modal-body">
          <p class="error-message" *ngIf="error()">{{ error() }}</p>

          <form [formGroup]="form" class="wizard-form">
            <label>
              Produto <span class="req">*</span>
              <select formControlName="productPreset">
                <option *ngFor="let preset of productPresets" [value]="preset">{{ preset }}</option>
                <option value="outro">Outro...</option>
              </select>
            </label>
            <label *ngIf="form.controls['productPreset'].value === 'outro'">
              Qual produto? <span class="req">*</span>
              <input type="text" formControlName="productNameOther" placeholder="Ex: Antipulgas" />
              <span class="field-error" *ngIf="form.controls['productNameOther'].invalid && form.controls['productNameOther'].touched">
                Informe o nome do produto.
              </span>
            </label>
            <div class="grid-2-col">
              <label>
                Aplicado em
                <input type="date" formControlName="appliedDate" />
              </label>
              <label>
                Vence em <span class="req">*</span>
                <input type="date" formControlName="expiresAt" />
                <span class="field-error" *ngIf="form.controls['expiresAt'].invalid && form.controls['expiresAt'].touched">
                  Informe a data de vencimento.
                </span>
              </label>
            </div>
            <label>
              Observacoes
              <textarea rows="2" formControlName="notes"></textarea>
            </label>
          </form>
        </div>

        <footer class="wizard-actions">
          <button type="button" class="ghost-btn" (click)="close()">Cancelar</button>
          <div class="wizard-actions-right">
            <button type="button" class="primary-btn" [disabled]="isSaving()" (click)="save()">
              {{ isSaving() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </footer>
      </article>
    </section>
  `
})
export class ProductApplicationModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productApplicationsApi = inject(ProductApplicationsApiService);
  private readonly productApplicationsState = inject(ProductApplicationsStateService);
  private readonly petsState = inject(PetsStateService);
  readonly modalState = inject(ProductApplicationModalStateService);

  readonly productPresets = PRODUCT_PRESETS;
  readonly isSaving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    productPreset: [PRODUCT_PRESETS[0], Validators.required],
    productNameOther: [''],
    appliedDate: [toTodayIso()],
    expiresAt: ['', Validators.required],
    notes: ['']
  });

  close(): void {
    this.modalState.close();
    this.error.set('');
    this.form.reset({
      productPreset: PRODUCT_PRESETS[0],
      productNameOther: '',
      appliedDate: toTodayIso(),
      expiresAt: '',
      notes: ''
    });
  }

  async save(): Promise<void> {
    this.error.set('');

    const preset = this.form.controls.productPreset.value;
    const isOther = preset === 'outro';

    if (isOther) {
      this.form.controls.productNameOther.addValidators(Validators.required);
      this.form.controls.productNameOther.updateValueAndValidity();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const petName = this.modalState.petName();
    const pet = petName ? this.petsState.findByName(petName) : null;

    if (!pet?.id) {
      this.error.set('Nao foi possivel identificar o pet para salvar.');
      return;
    }

    this.isSaving.set(true);
    const raw = this.form.getRawValue();
    const productName = isOther ? (raw.productNameOther ?? '').trim() : (preset ?? '');

    try {
      const created = await firstValueFrom(
        this.productApplicationsApi.create({
          patientId: pet.id,
          productName,
          appliedDate: raw.appliedDate || undefined,
          expiresAt: raw.expiresAt ?? '',
          notes: raw.notes || undefined
        })
      );

      this.productApplicationsState.addRecord(created);
      this.close();
    } catch {
      this.error.set('Nao foi possivel salvar agora. Tente novamente.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
