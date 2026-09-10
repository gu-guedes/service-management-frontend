import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationScenario } from '../../features/registration/models/registration.models';

// -------------------------------------------------------------------
// Modal rapido de atalho, aberto pelo botao "Novo Pet" da topbar (shell)
// — navega pra /app/registration com o cenario escolhido (cliente novo,
// que cadastra tutor + primeiro pet juntos, ou so um pet novo pra um
// tutor ja existente. Nao existe cadastro de tutor sozinho).
// Expõe open*() publico pra topbar chamar via variavel de referencia de template.
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
  `
})
export class QuickRegistrationModalComponent {
  private readonly router = inject(Router);

  readonly petChoiceOpen = signal(false);

  openPetChoice(): void {
    this.petChoiceOpen.set(true);
  }

  close(): void {
    this.petChoiceOpen.set(false);
  }

  startRegistration(scenario: RegistrationScenario): void {
    this.close();
    this.router.navigate(['/app/registration'], { queryParams: { scenario } });
  }
}
