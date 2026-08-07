import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MedicalRecordResponseDTO } from '../../../core/services/medical-records-api.service';
import { ProductApplicationResponseDTO } from '../../../core/services/product-applications-api.service';
import { ExamRequestResponseDTO } from '../../../core/services/exam-requests-api.service';
import { dateUrgencyLabel, toBrDateFromDateOnly } from '../../../shared/utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Painel de avisos — reune num lugar so os cards que antes ficavam
// espalhados nas listas de Pets e Tutores (retorno pendente, produto
// vencendo, exame pendente, aniversariante do dia).
// -------------------------------------------------------------------
@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pets-view">
      <p class="sub" *ngIf="isEmpty">Nenhum aviso no momento — tudo em dia.</p>

      <div class="avisos-grid">
      <article class="card due-followups-card" *ngIf="dueFollowUps.length">
        <header class="card-header pets-header">
          <div>
            <h3>🔔 Retornos pendentes</h3>
            <p>{{ dueFollowUps.length }} {{ dueFollowUps.length === 1 ? 'lembrete' : 'lembretes' }} — hoje, atrasados ou amanha</p>
          </div>
        </header>

        <div class="due-followups-list">
          <div class="due-followup-item" *ngFor="let record of dueFollowUps">
            <div>
              <p class="strong">
                {{ record.patientName }}
                <span class="badge" [ngClass]="urgencyBadgeClass(record.followUpDate)">{{ urgencyLabel(record.followUpDate) }}</span>
              </p>
              <p class="sub">{{ record.treatment }}</p>
              <p class="sub">Retorno: {{ formatDateOnly(record.followUpDate) }}</p>
            </div>
            <button
              type="button"
              class="ghost-btn"
              [disabled]="markingFollowUpDoneIds.has(record.id)"
              (click)="markFollowUpDone.emit(record.id)"
            >
              {{ markingFollowUpDoneIds.has(record.id) ? 'Salvando...' : 'Marcar como feito' }}
            </button>
          </div>
        </div>
      </article>

      <article class="card due-followups-card" *ngIf="expiringProducts.length">
        <header class="card-header pets-header">
          <div>
            <h3>🏷️ Produtos vencendo</h3>
            <p>{{ expiringProducts.length }} {{ expiringProducts.length === 1 ? 'produto' : 'produtos' }} — hoje, atrasados ou amanha</p>
          </div>
        </header>

        <div class="due-followups-list">
          <div class="due-followup-item" *ngFor="let product of expiringProducts">
            <div>
              <p class="strong">
                {{ product.patientName }}
                <span class="badge" [ngClass]="urgencyBadgeClass(product.expiresAt)">{{ urgencyLabel(product.expiresAt) }}</span>
              </p>
              <p class="sub">{{ product.productName }}</p>
              <p class="sub">Vence: {{ formatDateOnly(product.expiresAt) }}</p>
            </div>
            <button type="button" class="ghost-btn" (click)="renewProduct.emit(product.patientName)">
              Renovar
            </button>
          </div>
        </div>
      </article>

      <article class="card due-followups-card" *ngIf="pendingExams.length">
        <header class="card-header pets-header">
          <div>
            <h3>🧪 Exames pendentes</h3>
            <p>{{ pendingExams.length }} {{ pendingExams.length === 1 ? 'exame aguardando resultado' : 'exames aguardando resultado' }}</p>
          </div>
        </header>

        <div class="due-followups-list">
          <div class="due-followup-item" *ngFor="let exam of pendingExams">
            <div>
              <p class="strong">{{ exam.patientName }}</p>
              <p class="sub">{{ exam.examName }}</p>
              <p class="sub">Solicitado em {{ formatDateOnly(exam.requestedDate) }}</p>
            </div>
            <button type="button" class="ghost-btn" (click)="openExamVisit.emit(exam)">
              Abrir atendimento
            </button>
          </div>
        </div>
      </article>

      <article class="card due-followups-card" *ngIf="todayBirthdays.length">
        <header class="card-header pets-header">
          <div>
            <h3>🎂 Aniversariantes de hoje</h3>
            <p>{{ todayBirthdays.length }} {{ todayBirthdays.length === 1 ? 'tutor' : 'tutores' }}</p>
          </div>
        </header>

        <div class="due-followups-list">
          <div class="due-followup-item" *ngFor="let tutor of todayBirthdays">
            <div>
              <p class="strong">{{ tutor.name }}</p>
              <p class="sub">{{ tutor.phone }}</p>
            </div>
            <button type="button" class="ghost-btn" (click)="openTutorProfile.emit(tutor.id)">
              Ver perfil
            </button>
          </div>
        </div>
      </article>
      </div>
    </section>
  `
})
export class DashboardViewComponent {
  @Input() dueFollowUps: MedicalRecordResponseDTO[] = [];
  @Input() markingFollowUpDoneIds: Set<number> = new Set();
  @Input() expiringProducts: ProductApplicationResponseDTO[] = [];
  @Input() pendingExams: ExamRequestResponseDTO[] = [];
  @Input() todayBirthdays: Array<{ id: string; name: string; phone: string }> = [];

  @Output() markFollowUpDone = new EventEmitter<number>();
  @Output() renewProduct = new EventEmitter<string>();
  @Output() openExamVisit = new EventEmitter<ExamRequestResponseDTO>();
  @Output() openTutorProfile = new EventEmitter<string>();

  get isEmpty(): boolean {
    return !this.dueFollowUps.length && !this.expiringProducts.length && !this.pendingExams.length && !this.todayBirthdays.length;
  }

  formatDateOnly(dateOnlyIso: string | null): string {
    return toBrDateFromDateOnly(dateOnlyIso);
  }

  urgencyLabel(dateOnlyIso: string | null): string {
    const label = dateUrgencyLabel(dateOnlyIso);
    return label === 'Amanha' ? 'Amanhã' : label;
  }

  urgencyBadgeClass(dateOnlyIso: string | null): string {
    const label = dateUrgencyLabel(dateOnlyIso);
    if (label === 'Atrasado') return 'is-orange';
    if (label === 'Hoje') return 'is-green';
    return 'is-gray';
  }
}
