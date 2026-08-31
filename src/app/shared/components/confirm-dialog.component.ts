import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

// -------------------------------------------------------------------
// Modal de confirmacao com o visual do app, no lugar do confirm()
// nativo do navegador. Montado uma unica vez no app-shell; abre sozinho
// quando o ConfirmDialogService tem um pedido pendente.
// -------------------------------------------------------------------
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" *ngIf="dialog.request() as req" (click)="dialog.respond(false)">
      <div class="confirm-card" (click)="$event.stopPropagation()">
        <h4>{{ req.title }}</h4>
        <p>{{ req.message }}</p>
        <footer class="confirm-actions">
          <button type="button" class="ghost-btn" (click)="dialog.respond(false)">{{ req.cancelLabel }}</button>
          <button
            type="button"
            [class.primary-btn]="!req.danger"
            [class.danger-btn]="req.danger"
            (click)="dialog.respond(true)"
          >
            {{ req.confirmLabel }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 22, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 1rem;
    }

    .confirm-card {
      background: var(--surface, #fff);
      border-radius: 0.9rem;
      padding: 1.4rem;
      max-width: 26rem;
      width: 100%;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);
    }

    .confirm-card h4 {
      margin: 0 0 0.5rem;
      font-size: 1.05rem;
      color: var(--text, #1a1714);
    }

    .confirm-card p {
      margin: 0 0 1.2rem;
      font-size: 0.88rem;
      color: var(--muted, #8a8077);
      line-height: 1.45;
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
    }

    .danger-btn {
      background: var(--accent2);
      color: #fff;
      border: 1px solid var(--accent2);
      border-radius: 0.6rem;
      padding: 0.5rem 1rem;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .danger-btn:hover {
      opacity: 0.9;
    }
  `]
})
export class ConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);
}
