import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

// -------------------------------------------------------------------
// Substituto do confirm() nativo do navegador — mesma ideia (uma
// pergunta, resolve true/false), mas com o visual padrao do app em vez
// do popup feio do navegador. Ver ConfirmDialogComponent, montado uma
// unica vez no app-shell.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    // se por algum motivo ja tiver um dialog pendente, resolve o
    // anterior como cancelado antes de abrir o novo — evita deixar uma
    // promise presa sem nunca resolver
    this._request()?.resolve(false);

    return new Promise<boolean>((resolve) => {
      this._request.set({
        title: options.title ?? 'Confirmar acao',
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        danger: options.danger ?? false,
        resolve
      });
    });
  }

  respond(value: boolean): void {
    const current = this._request();
    if (!current) return;

    this._request.set(null);
    current.resolve(value);
  }
}
