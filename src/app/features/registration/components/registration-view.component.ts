import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-registration-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="reg-view">
      <header class="reg-topbar">
        <button type="button" class="reg-back" (click)="close.emit()">← Voltar ao sistema</button>
        <p class="reg-logo">VetCare</p>
      </header>

      <div class="reg-scenario-bar">
        <span class="sc-label">Modo:</span>
        <button type="button" class="sc-btn" [class.active]="registrationScenario === 'new'" (click)="scenarioChange.emit('new')">
          Novo tutor + 1o pet
        </button>
        <button type="button" class="sc-btn" [class.active]="registrationScenario === 'addpet'" (click)="scenarioChange.emit('addpet')">
          Adicionar pet a tutor existente
        </button>
      </div>

      <div class="reg-body">
        <aside class="prog-sidebar">
          <p class="prog-title">Cadastro</p>
          <p class="prog-sub">Fluxo guiado para cadastrar tutor e pet.</p>

          <div class="steps">
            <article class="step-item" [class.s-active]="registrationStep === 1" [class.s-done]="registrationStep > 1">
              <span class="step-circle">1</span>
              <div class="step-text">
                <p class="step-name" *ngIf="registrationScenario === 'new'">Dados do tutor</p>
                <p class="step-name" *ngIf="registrationScenario === 'addpet'">Buscar tutor</p>
              </div>
            </article>
            <article class="step-item" [class.s-active]="registrationStep === 2" [class.s-done]="registrationStep > 2">
              <span class="step-circle">2</span>
              <div class="step-text"><p class="step-name">Dados do pet</p></div>
            </article>
            <article class="step-item" [class.s-active]="registrationStep === 3">
              <span class="step-circle">3</span>
              <div class="step-text"><p class="step-name">Revisao e salvar</p></div>
            </article>
          </div>
        </aside>

        <div class="form-area">
          <form *ngIf="registrationScenario === 'new' && registrationStep === 1" [formGroup]="tutorForm" class="wizard-form">
            <div class="step-tag">Passo 1 de 3</div>
            <h4>Quem e o <em>tutor</em>?</h4>
            <p class="step-hint">Dados do cliente responsavel. Cadastrado uma vez e vinculado aos pets depois.</p>
            <p class="fsec-title">Identificacao</p>
            <label>
              Nome completo <span class="req">*</span>
              <input type="text" formControlName="fullName" placeholder="Ex: Carlos Eduardo Mendes" />
              <span class="field-error" *ngIf="tutorForm.controls['fullName'].invalid && tutorForm.controls['fullName'].touched">
                Informe o nome completo (minimo 3 caracteres).
              </span>
            </label>
            <p class="fsec-title">Contato</p>
            <label>
              WhatsApp / Telefone <span class="req">*</span>
              <input
                type="text"
                formControlName="phone"
                placeholder="(11) 99999-9999"
                maxlength="15"
                (input)="onPhoneInput($event)"
              />
              <span class="field-error" *ngIf="tutorForm.controls['phone'].invalid && tutorForm.controls['phone'].touched">
                Use o formato (11) 99999-9999.
              </span>
            </label>
            <label>
              CPF <span class="req">*</span>
              <input
                type="text"
                formControlName="cpf"
                placeholder="000.000.000-00"
                maxlength="14"
                (input)="onCpfInput($event)"
              />
              <span class="field-error" *ngIf="tutorForm.controls['cpf'].invalid && tutorForm.controls['cpf'].touched">
                Informe o CPF no formato 000.000.000-00.
              </span>
            </label>
            <p class="fsec-title">Endereco</p>
            <div class="grid-2-col">
              <label>
                Rua <span class="req">*</span>
                <input type="text" formControlName="street" placeholder="Ex: Rua das Flores" />
                <span class="field-error" *ngIf="tutorForm.controls['street'].invalid && tutorForm.controls['street'].touched">
                  Informe a rua.
                </span>
              </label>
              <label>
                Numero <span class="req">*</span>
                <input type="text" formControlName="streetNumber" placeholder="Ex: 123" />
                <span class="field-error" *ngIf="tutorForm.controls['streetNumber'].invalid && tutorForm.controls['streetNumber'].touched">
                  Informe o numero.
                </span>
              </label>
              <label>
                Bairro <span class="req">*</span>
                <input type="text" formControlName="neighborhood" placeholder="Ex: Centro" />
                <span class="field-error" *ngIf="tutorForm.controls['neighborhood'].invalid && tutorForm.controls['neighborhood'].touched">
                  Informe o bairro.
                </span>
              </label>
              <label>
                Cidade <span class="req">*</span>
                <input type="text" formControlName="city" placeholder="Ex: Sao Paulo" />
                <span class="field-error" *ngIf="tutorForm.controls['city'].invalid && tutorForm.controls['city'].touched">
                  Informe a cidade.
                </span>
              </label>
            </div>
            <label>
              Ponto de referencia
              <input type="text" formControlName="referencePoint" placeholder="Opcional — Ex: proximo ao mercado" />
            </label>
          </form>

          <form *ngIf="registrationScenario === 'addpet' && registrationStep === 1" [formGroup]="findTutorForm" class="wizard-form">
            <div class="step-tag blue">Novo Pet · Passo 1</div>
            <h4>Para qual <em>tutor</em>?</h4>
            <p class="step-hint">Selecione o tutor cadastrado para vincular o novo pet.</p>
            <label>
              Tutor cadastrado <span class="req">*</span>
              <select formControlName="tutorId">
                <option value="">Selecione</option>
                <option *ngFor="let tutor of tutorRecords" [value]="tutor.id">
                  {{ tutor.name }} · {{ tutor.phone }}
                </option>
              </select>
              <span class="field-error" *ngIf="findTutorForm.controls['tutorId'].invalid && findTutorForm.controls['tutorId'].touched">
                Selecione um tutor para continuar.
              </span>
            </label>
            <div class="search-results">
              <button
                type="button"
                class="search-result-row"
                *ngFor="let tutor of tutorRecords"
                (click)="selectTutor.emit(tutor.id)"
                [class.selected]="findTutorForm.controls['tutorId'].value === tutor.id"
              >
                <span class="tutor-avatar">{{ tutor.initials }}</span>
                <span class="search-main">
                  <strong>{{ tutor.name }}</strong>
                  <small>{{ tutor.phone }}</small>
                </span>
                <span class="sub">{{ tutor.pets.length }} {{ tutor.pets.length === 1 ? 'pet' : 'pets' }}</span>
              </button>
            </div>
          </form>

          <form *ngIf="registrationStep === 2" [formGroup]="petForm" class="wizard-form">
            <div class="step-tag" [class.blue]="registrationScenario === 'addpet'">Passo 2 de 3</div>
            <h4>Dados do <em>novo pet</em></h4>
            <p class="step-hint">Pelo menos um pet e obrigatorio no cadastro. Voce pode adicionar mais depois.</p>
            <p class="fsec-title">Identificacao do pet</p>
            <div class="grid-2-col">
              <label>
                Nome <span class="req">*</span>
                <input type="text" formControlName="name" />
                <span class="field-error" *ngIf="petForm.controls['name'].invalid && petForm.controls['name'].touched">
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
            <p class="fsec-title">Detalhes</p>
            <div class="grid-2-col">
              <label>
                Raca <span class="req">*</span>
                <input type="text" formControlName="breed" />
                <span class="field-error" *ngIf="petForm.controls['breed'].invalid && petForm.controls['breed'].touched">
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
                <input type="number" formControlName="age" step="1" min="0" max="50" placeholder="Ex: 3" />
                <span class="field-error" *ngIf="petForm.controls['age'].invalid && petForm.controls['age'].touched">
                  Informe a idade (0 a 50 anos).
                </span>
              </label>
              <label>
                Peso (kg) <span class="req">*</span>
                <input type="number" formControlName="weight" step="0.1" min="0.1" max="120" />
                <span class="field-error" *ngIf="petForm.controls['weight'].invalid && petForm.controls['weight'].touched">
                  Informe o peso (0.1 a 120 kg).
                </span>
              </label>
            </div>
            <label>
              Observacoes <span class="req">*</span>
              <textarea rows="3" formControlName="notes" placeholder="Ex: alergico a determinado medicamento"></textarea>
              <span class="field-error" *ngIf="petForm.controls['notes'].invalid && petForm.controls['notes'].touched">
                Informe uma observacao sobre o pet.
              </span>
            </label>
          </form>

          <section *ngIf="registrationStep === 3" class="review-panel">
            <div class="step-tag">Passo 3 de 3</div>
            <h4>Tudo <em>certo</em>?</h4>
            <p class="step-hint">Revise os dados antes de salvar. Tudo pode ser editado depois.</p>
            <div class="info-block" *ngIf="registrationScenario === 'new'">
              <p class="label">Tutor</p>
              <p class="strong">{{ tutorForm.controls['fullName'].value }}</p>
              <p class="sub">{{ tutorForm.controls['phone'].value }}</p>
              <p class="sub">{{ tutorAddressPreview }}</p>
            </div>
            <div class="info-block" *ngIf="registrationScenario === 'addpet' && selectedTutorForRegistration">
              <p class="label">Tutor selecionado</p>
              <p class="strong">{{ selectedTutorForRegistration.name }}</p>
            </div>
            <div class="info-block">
              <p class="label">Pet</p>
              <p class="strong">{{ petForm.controls['name'].value }}</p>
              <p class="sub">{{ petSpeciesLabel }} · {{ petForm.controls['breed'].value || 'Sem raca' }} · {{ petSexLabel }}</p>
              <p class="sub" *ngIf="petForm.controls['age'].value !== null">Idade: {{ petForm.controls['age'].value }} {{ petForm.controls['age'].value === 1 ? 'ano' : 'anos' }}</p>
              <p class="sub" *ngIf="petForm.controls['weight'].value">Peso: {{ petForm.controls['weight'].value }} kg</p>
              <p class="sub" *ngIf="petForm.controls['notes'].value">Obs: {{ petForm.controls['notes'].value }}</p>
            </div>
          </section>

          <footer class="wizard-actions">
            <p class="foot-note" *ngIf="registrationStep < 3"><span class="req">*</span> Campos obrigatorios</p>
            <button type="button" class="ghost-btn" (click)="close.emit()">Cancelar</button>
            <div class="wizard-actions-right">
              <button type="button" class="ghost-btn" *ngIf="registrationStep > 1" (click)="previous.emit()">Voltar</button>
              <button type="button" class="primary-btn" *ngIf="registrationStep < 3" (click)="next.emit()">Proximo</button>
              <button type="button" class="primary-btn" *ngIf="registrationStep === 3" (click)="submit.emit()" [disabled]="isSubmittingRegistration">
                {{ isSubmittingRegistration ? 'Salvando...' : 'Salvar cadastro' }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  `
})
export class RegistrationViewComponent {
  @Input() registrationScenario: 'new' | 'addpet' = 'new';
  @Input() registrationStep = 1;
  @Input() tutorForm!: FormGroup;
  @Input() findTutorForm!: FormGroup;
  @Input() petForm!: FormGroup;
  @Input() tutorRecords: Array<{ id: string; name: string; phone: string; initials: string; pets: unknown[] }> = [];
  @Input() selectedTutorForRegistration: { name: string } | null = null;
  @Input() isSubmittingRegistration = false;

  @Output() close = new EventEmitter<void>();
  @Output() scenarioChange = new EventEmitter<'new' | 'addpet'>();
  @Output() selectTutor = new EventEmitter<string>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  // usados na revisao final (passo 3) — leem o valor atual dos forms
  get tutorAddressPreview(): string {
    const raw = this.tutorForm.getRawValue();
    const main = [`${raw.street || ''}${raw.streetNumber ? ', ' + raw.streetNumber : ''}`, raw.neighborhood, raw.city]
      .filter(Boolean)
      .join(' - ');
    const reference = raw.referencePoint ? ` (Ref.: ${raw.referencePoint})` : '';

    return (main || 'Endereco nao informado') + reference;
  }

  get petSpeciesLabel(): string {
    const species = this.petForm.controls['species'].value;
    if (species === 'dog') return 'Cao';
    if (species === 'cat') return 'Gato';
    return 'Outro';
  }

  get petSexLabel(): string {
    return this.petForm.controls['sex'].value === 'F' ? 'Femea' : 'Macho';
  }

  // máscara automática do telefone: sempre formata para (XX) XXXXX-XXXX
  // enquanto o usuário digita, para nunca cair fora do padrão validado no form
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.tutorForm.controls['phone'].setValue(this.formatPhone(digits));
  }

  private formatPhone(digits: string): string {
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  // mascara automatica do CPF: 000.000.000-00, mesma ideia do telefone acima
  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.tutorForm.controls['cpf'].setValue(this.formatCpf(digits));
  }

  private formatCpf(digits: string): string {
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
}
