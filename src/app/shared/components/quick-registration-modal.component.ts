import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationScenario } from '../../features/registration/models/registration.models';

// -------------------------------------------------------------------
// Modais rapidos de atalho, abertos pelos botoes "Novo Tutor"/"Novo Pet"
// da topbar (shell) — navegam pra /app/registration com o cenario escolhido.
// Expõe open*() publicos pra topbar chamar via variavel de referencia de template.
// -------------------------------------------------------------------
@Component({
  selector: 'app-quick-registration-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal rápido: escolha de caminho de cadastro -->
    <section *ngIf="petChoiceOpen()" class="modal-overlay" (click)="close()">
      <article class="modal-card quick-modal" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <h3>Adicionar Pet</h3>
            <p>Escolha o caminho de cadastro</p>
          </div>
          <button type="button" class="modal-close" (click)="close()">X</button>
        </header>
        <div class="modal-body">
          <button type="button" class="choice-card" (click)="startRegistration('new')">
            <span class="choice-icon">🧑‍⚕️</span>
            <span>
              <strong>Cliente novo</strong>
              <small>Cadastrar tutor e primeiro pet juntos</small>
            </span>
            <span class="choice-arrow">→</span>
          </button>
          <button type="button" class="choice-card" (click)="startRegistration('addpet')">
            <span class="choice-icon">🐾</span>
            <span>
              <strong>Cliente ja cadastrado</strong>
              <small>Buscar tutor e adicionar novo pet</small>
            </span>
            <span class="choice-arrow">→</span>
          </button>
        </div>
      </article>
    </section>

    <!-- Modal rápido: informação sobre cadastro de tutor -->
    <section *ngIf="tutorInfoOpen()" class="modal-overlay" (click)="close()">
      <article class="modal-card quick-modal" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <h3>Novo Tutor</h3>
            <p>Cadastro completo em etapas com pelo menos 1 pet</p>
          </div>
          <button type="button" class="modal-close" (click)="close()">X</button>
        </header>
        <div class="modal-body">
          <div class="info-block">
            <p class="sub">O cadastro completo inclui dados do tutor e vinculacao do primeiro pet.</p>
          </div>
        </div>
        <footer class="wizard-actions">
          <button type="button" class="ghost-btn" (click)="close()">Cancelar</button>
          <button type="button" class="primary-btn" (click)="startRegistration('new')">Abrir formulario</button>
        </footer>
      </article>
    </section>
  `
})
export class QuickRegistrationModalComponent {
  private readonly router = inject(Router);

  readonly petChoiceOpen = signal(false);
  readonly tutorInfoOpen = signal(false);

  openPetChoice(): void {
    this.petChoiceOpen.set(true);
  }

  openTutorInfo(): void {
    this.tutorInfoOpen.set(true);
  }

  close(): void {
    this.petChoiceOpen.set(false);
    this.tutorInfoOpen.set(false);
  }

  startRegistration(scenario: RegistrationScenario): void {
    this.close();
    this.router.navigate(['/app/registration'], { queryParams: { scenario } });
  }
}
