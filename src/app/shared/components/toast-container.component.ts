import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

// -------------------------------------------------------------------
// Pilha de toasts fixada no canto da tela — montado uma unica vez no
// app-shell (fora do <router-outlet>), fica disponivel em qualquer
// pagina do app, inclusive na tela de login.
// -------------------------------------------------------------------
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      <div
        class="toast-item"
        *ngFor="let toast of toastService.toasts()"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
      >
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '⚠' }}</span>
        <span class="toast-text">{{ toast.message }}</span>
        <button
          type="button"
          class="toast-close"
          (click)="toastService.dismiss(toast.id)"
          aria-label="Fechar aviso"
        >
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 22rem;
    }

    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      padding: 0.75rem 0.9rem;
      border-radius: 0.7rem;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
      animation: toast-in 0.18s ease-out;
    }

    .toast-success {
      background: var(--accent-light);
      color: var(--accent);
      border: 1px solid var(--accent);
    }

    .toast-error {
      background: var(--accent2-light);
      color: var(--accent2);
      border: 1px solid var(--accent2);
    }

    .toast-icon {
      flex-shrink: 0;
    }

    .toast-text {
      flex: 1;
      line-height: 1.35;
    }

    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.75rem;
      color: inherit;
      opacity: 0.65;
      padding: 0;
      line-height: 1;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
