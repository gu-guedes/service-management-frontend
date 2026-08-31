import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

// -------------------------------------------------------------------
// Serviço central de notificacoes (toasts) — usado no lugar dos avisos
// inline que ficavam espalhados por cada componente (banner de sucesso,
// <p class="error-message">, etc.), pra ter uma unica aparencia
// consistente de sucesso/erro em qualquer tela do app.
// Ver ToastContainerComponent, montado uma vez no app-shell.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;

  success(message: string, durationMs = 4000): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs = 7000): void {
    this.show('error', message, durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string, durationMs: number): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, type, message }]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
