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
        <p class="reg-logo">VetCare</p>
        <button type="button" class="reg-back" (click)="close.emit()">← Voltar ao sistema</button>
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
            <div class="grid-2-col">
              <label>
                Nome completo <span class="req">*</span>
                <input type="text" formControlName="fullName" placeholder="Ex: Carlos Eduardo Mendes" />
              </label>
              <label>
                CPF <span class="req">*</span>
                <input type="text" formControlName="cpf" placeholder="000.000.000-00" />
              </label>
            </div>
            <p class="fsec-title">Contato</p>
            <div class="grid-2-col">
              <label>
                WhatsApp / Telefone <span class="req">*</span>
                <input type="text" formControlName="phone" placeholder="(11) 99999-9999" />
              </label>
              <label>
                E-mail
                <input type="email" formControlName="email" placeholder="email@dominio.com" />
              </label>
            </div>
            <p class="fsec-title">Endereco</p>
            <label>
              Endereco
              <input type="text" formControlName="address" placeholder="Rua, numero e bairro" />
            </label>
            <label>
              Cidade
              <input type="text" formControlName="city" placeholder="Ex: Sao Paulo, SP" />
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
                  <small>{{ tutor.phone }} · CPF {{ tutor.cpf }}</small>
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
                Raca
                <input type="text" formControlName="breed" />
              </label>
              <label>
                Sexo
                <select formControlName="sex">
                  <option value="M">Macho</option>
                  <option value="F">Femea</option>
                </select>
              </label>
              <label>
                Data de nascimento
                <input type="date" formControlName="birthDate" />
              </label>
              <label>
                Peso (kg)
                <input type="number" formControlName="weight" step="0.1" min="0.1" max="120" />
              </label>
            </div>
          </form>

          <section *ngIf="registrationStep === 3" class="review-panel">
            <div class="step-tag">Passo 3 de 3</div>
            <h4>Tudo <em>certo</em>?</h4>
            <p class="step-hint">Revise os dados antes de salvar. Tudo pode ser editado depois.</p>
            <div class="info-block" *ngIf="registrationScenario === 'new'">
              <p class="label">Tutor</p>
              <p class="strong">{{ tutorForm.controls['fullName'].value }}</p>
              <p class="sub">{{ tutorForm.controls['phone'].value }}</p>
            </div>
            <div class="info-block" *ngIf="registrationScenario === 'addpet' && selectedTutorForRegistration">
              <p class="label">Tutor selecionado</p>
              <p class="strong">{{ selectedTutorForRegistration.name }}</p>
            </div>
            <div class="info-block">
              <p class="label">Pet</p>
              <p class="strong">{{ petForm.controls['name'].value }}</p>
              <p class="sub">{{ petForm.controls['breed'].value || 'Sem raca' }}</p>
            </div>
          </section>

          <p class="error-message" *ngIf="registrationError">{{ registrationError }}</p>

          <footer class="wizard-actions">
            <p class="foot-note"><span class="req">*</span> Campos obrigatorios</p>
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
  @Input() tutorRecords: Array<{ id: string; name: string; cpf: string; phone: string; initials: string; pets: unknown[] }> = [];
  @Input() selectedTutorForRegistration: { name: string } | null = null;
  @Input() registrationError = '';
  @Input() isSubmittingRegistration = false;

  @Output() close = new EventEmitter<void>();
  @Output() scenarioChange = new EventEmitter<'new' | 'addpet'>();
  @Output() selectTutor = new EventEmitter<string>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
}
