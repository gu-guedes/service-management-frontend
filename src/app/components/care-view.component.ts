import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-care-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="care-view">
      <header class="care-topbar">
        <button type="button" class="reg-back" (click)="close.emit()">← Agenda</button>
        <p class="reg-logo">VetCare</p>
        <p class="care-crumb">Atendimento · {{ selectedPetRecord?.name || 'Pet' }} · {{ selectedPetRecord?.tutor || 'Tutor' }}</p>
      </header>

      <div class="care-body">
        <aside class="care-left">
          <div class="care-pet-header">
            <span class="pet-avatar large">{{ selectedPetEmoji }}</span>
            <p class="pet-title">{{ selectedPetRecord?.name || 'Paciente' }}</p>
            <p class="sub">{{ selectedPetRecord?.summary || 'Dados do pet' }}</p>
            <div class="care-pet-tags">
              <span class="badge" *ngFor="let tag of selectedPetCareProfile?.tags || []" [ngClass]="tag.className">
                {{ tag.label }}
              </span>
            </div>
          </div>

          <div class="mini-vitals-grid">
            <div class="mini-vital-box">
              <p class="label">Peso</p>
              <p class="strong">{{ selectedPetCareProfile?.weightLabel || '-- kg' }}</p>
            </div>
            <div class="mini-vital-box">
              <p class="label">Ultima visita</p>
              <p class="strong">{{ selectedPetRecord?.lastVisit || '--/--/----' }}</p>
            </div>
            <div class="mini-vital-box full">
              <p class="label">Alergias</p>
              <p class="strong">{{ selectedPetCareProfile?.allergiesLabel || 'Nao informado' }}</p>
            </div>
          </div>

          <div class="care-alert-box">
            <p class="sub">{{ selectedPetCareProfile?.alertMessage || 'Sem alerta clinico registrado para este pet.' }}</p>
          </div>

          <div class="info-block compact">
            <p class="label">Tutor</p>
            <div class="pet-cell">
              <span class="tutor-avatar">{{ selectedPetRecord?.tutorInitials || '--' }}</span>
              <p class="strong">{{ selectedPetRecord?.tutor || 'Nao informado' }}</p>
            </div>
          </div>

          <div class="info-block compact">
            <p class="label">Historico recente</p>
            <div class="care-history-list">
              <button type="button" class="care-history-item" *ngFor="let item of selectedPetTimeline">
                <span class="sub">{{ item.date }}</span>
                <span class="strong">{{ item.title }}</span>
              </button>
            </div>
          </div>
        </aside>

        <main class="care-center">
          <nav class="care-nav">
            <button
              type="button"
              class="care-nav-btn"
              *ngFor="let item of careSections"
              [class.active]="activeCareSection === item.key"
              (click)="sectionChange.emit(item.key)"
            >
              {{ item.label }}
            </button>
          </nav>

          <section class="care-card" *ngIf="activeCareSection === 'anamnesis'">
            <div class="care-card-header">
              <h4>Anamnese</h4>
              <p>Queixa e historico</p>
            </div>
            <div class="wizard-form care-form">
              <label>
                Queixa principal
                <input type="text" placeholder="Dificuldade de locomocao no membro posterior direito" />
              </label>
              <div class="grid-2-col">
                <label>Inicio dos sintomas<input type="date" /></label>
                <label>
                  Evolucao
                  <select>
                    <option>Progressiva</option>
                    <option>Estavel</option>
                    <option>Melhora</option>
                  </select>
                </label>
              </div>
              <label>
                Historico relevante
                <textarea rows="3" placeholder="Em uso de suplemento articular desde 15/01"></textarea>
              </label>
              <label>
                Alimentacao / Agua
                <textarea rows="2" placeholder="Racao premium adulto, apetite preservado"></textarea>
              </label>
            </div>
          </section>

          <section class="care-card" *ngIf="activeCareSection === 'exam'">
            <div class="care-card-header">
              <h4>Exame Fisico</h4>
              <p>Parametros e achados</p>
            </div>
            <div class="vitals-grid">
              <label>Peso<input type="number" placeholder="28.5" /></label>
              <label>Temperatura<input type="number" placeholder="38.6" /></label>
              <label>FC<input type="number" placeholder="88" /></label>
              <label>FR<input type="number" placeholder="22" /></label>
              <label>TPC<input type="number" placeholder="2" /></label>
            </div>
            <div class="wizard-form care-form">
              <div class="grid-2-col">
                <label>Cardiovascular<textarea rows="2"></textarea></label>
                <label>Respiratorio<textarea rows="2"></textarea></label>
                <label>Locomotor<textarea rows="2"></textarea></label>
                <label>Outros achados<textarea rows="2"></textarea></label>
              </div>
            </div>
          </section>

          <section class="care-card" *ngIf="activeCareSection === 'diagnosis'">
            <div class="care-card-header">
              <h4>Diagnostico</h4>
              <p>Definitivo ou presuntivo</p>
            </div>
            <div class="wizard-form care-form">
              <label>Diagnostico principal<input type="text" placeholder="Displasia coxofemoral — suspeita" /></label>
              <div class="grid-2-col">
                <label>CID<input type="text" placeholder="M16.1" /></label>
                <label>
                  Prognostico
                  <select>
                    <option>Favoravel</option>
                    <option>Reservado</option>
                    <option>Aguardando exames</option>
                  </select>
                </label>
              </div>
              <label>Diferenciais<textarea rows="2"></textarea></label>
            </div>
          </section>

          <section class="care-card" *ngIf="activeCareSection === 'prescription'">
            <div class="care-card-header">
              <h4>Prescricao</h4>
              <p>Medicamentos e orientacoes</p>
            </div>
            <div class="care-list-header">
              <span>Medicamento</span>
              <span>Dose</span>
              <span>Frequencia</span>
              <span></span>
            </div>
            <div class="care-list">
              <div class="care-list-row meds" *ngFor="let item of medications; let i = index">
                <input type="text" [value]="item.name" />
                <input type="text" [value]="item.dose" />
                <input type="text" [value]="item.frequency" />
                <button type="button" class="row-remove" (click)="removeMedication.emit(i)">✕</button>
              </div>
            </div>
            <button type="button" class="add-row-btn" (click)="addMedication.emit()">+ Adicionar medicamento</button>
            <label class="wizard-form care-form">Orientacoes<textarea rows="4" placeholder="Orientacoes ao tutor"></textarea></label>
          </section>

          <section class="care-card" *ngIf="activeCareSection === 'tests'">
            <div class="care-card-header">
              <h4>Exames</h4>
              <p>Solicitacoes e prioridade</p>
            </div>
            <div class="care-list">
              <div class="care-list-row tests" *ngFor="let exam of tests; let i = index">
                <p class="strong">{{ exam.name }}</p>
                <div class="urgency-group">
                  <button
                    type="button"
                    class="urgency-btn"
                    [class.active]="exam.urgency === 'normal'"
                    (click)="setTestUrgency.emit({ index: i, urgency: 'normal' })"
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    class="urgency-btn danger"
                    [class.active]="exam.urgency === 'urgent'"
                    (click)="setTestUrgency.emit({ index: i, urgency: 'urgent' })"
                  >
                    Urgente
                  </button>
                </div>
                <button type="button" class="row-remove" (click)="removeTest.emit(i)">✕</button>
              </div>
            </div>
            <button type="button" class="add-row-btn" (click)="addTest.emit()">+ Solicitar exame</button>
          </section>

          <section class="care-card" *ngIf="activeCareSection === 'procedures'">
            <div class="care-card-header">
              <h4>Procedimentos</h4>
              <p>Condutas executadas</p>
            </div>
            <div class="care-list">
              <div class="care-list-row procedures" *ngFor="let procedure of procedures; let i = index">
                <button type="button" class="check-btn" [class.done]="procedure.done" (click)="toggleProcedure.emit(i)">
                  {{ procedure.done ? '✓' : '' }}
                </button>
                <p class="strong">{{ procedure.name }}</p>
                <button type="button" class="row-remove" (click)="removeProcedure.emit(i)">✕</button>
              </div>
            </div>
            <button type="button" class="add-row-btn" (click)="addProcedure.emit()">+ Adicionar procedimento</button>
          </section>

          <section class="care-card" *ngIf="activeCareSection === 'notes'">
            <div class="care-card-header">
              <h4>Observacoes</h4>
              <p>Notas finais do atendimento</p>
            </div>
            <div class="wizard-form care-form">
              <label>Observacoes<textarea rows="6" placeholder="Orientacoes ao tutor e recomendacoes adicionais"></textarea></label>
            </div>
          </section>
        </main>

        <aside class="care-right">
          <div class="care-rs">
            <p class="label">Atendimento</p>
            <div class="timer-box">
              <p class="timer-value">24:18</p>
              <p class="sub">Consulta em andamento</p>
            </div>
          </div>
          <div class="care-rs">
            <p class="label">Progresso</p>
            <div class="care-progress-list">
              <div
                class="care-progress-item"
                *ngFor="let section of careSections"
                [class.done]="getCareSectionState(section.key) === 'done'"
                [class.now]="getCareSectionState(section.key) === 'now'"
                [class.pending]="getCareSectionState(section.key) === 'pending'"
              >
                <span class="care-progress-bullet">
                  {{ getCareSectionState(section.key) === 'done' ? '✓' : getCareSectionState(section.key) === 'now' ? '•' : '○' }}
                </span>
                <span class="care-progress-label">{{ section.label }}</span>
              </div>
            </div>
          </div>
          <div class="care-rs">
            <p class="label">Agendar Retorno</p>
            <div class="return-box" [formGroup]="returnForm">
              <label>
                Data
                <input type="date" class="care-side-input" formControlName="date" />
              </label>
              <label>
                Tipo
                <select class="care-side-input" formControlName="type">
                  <option>Retorno clinico</option>
                  <option>Reavaliacao ortopedica</option>
                  <option>Vacina</option>
                  <option>Exame</option>
                </select>
              </label>
              <label>
                Observacao
                <input
                  type="text"
                  class="care-side-input"
                  formControlName="notes"
                  placeholder="Ex: avaliar resposta ao tratamento"
                />
              </label>
            </div>
          </div>
          <button type="button" class="primary-btn" (click)="complete.emit()">Concluir atendimento</button>
          <p class="sub" *ngIf="careCompletionMessage">{{ careCompletionMessage }}</p>
        </aside>
      </div>
    </section>
  `
})
export class CareViewComponent {
  @Input() selectedPetRecord:
    | {
        name: string;
        species: 'dog' | 'cat' | 'other';
        summary: string;
        tutor: string;
        tutorInitials: string;
        lastVisit: string;
      }
    | null = null;
  @Input() selectedTutorRecord: { name: string; phone: string } | null = null;
  @Input() selectedPetCareProfile: {
    weightLabel: string;
    allergiesLabel: string;
    alertMessage: string;
    tags: Array<{ label: string; className: string }>;
  } | null = null;
  @Input() selectedPetTimeline: Array<{ title: string; date: string; description: string }> = [];
  @Input() selectedPetEmoji = '🐾';
  @Input() careSections: Array<{ key: string; label: string }> = [];
  @Input() activeCareSection = '';
  @Input() medications: Array<{ name: string; dose: string; frequency: string }> = [];
  @Input() tests: Array<{ name: string; urgency: 'normal' | 'urgent' }> = [];
  @Input() procedures: Array<{ name: string; done: boolean }> = [];
  @Input() returnForm!: FormGroup;
  @Input() careCompletionMessage = '';
  @Input() getCareSectionState: (sectionId: string) => 'done' | 'now' | 'pending' = () => 'pending';

  @Output() close = new EventEmitter<void>();
  @Output() sectionChange = new EventEmitter<string>();
  @Output() addMedication = new EventEmitter<void>();
  @Output() removeMedication = new EventEmitter<number>();
  @Output() addTest = new EventEmitter<void>();
  @Output() removeTest = new EventEmitter<number>();
  @Output() setTestUrgency = new EventEmitter<{ index: number; urgency: 'normal' | 'urgent' }>();
  @Output() addProcedure = new EventEmitter<void>();
  @Output() removeProcedure = new EventEmitter<number>();
  @Output() toggleProcedure = new EventEmitter<number>();
  @Output() complete = new EventEmitter<void>();
}
