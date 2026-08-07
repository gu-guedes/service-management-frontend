import { Injectable, signal } from '@angular/core';

// -------------------------------------------------------------------
// Serviço de estado do modal rápido de aplicação de produto (coleira,
// vermifugo, vacina...). So guarda pra qual pet o modal foi aberto —
// separado do ModalStateService pra nao carregar o historico de
// visitas do pet, que essa tela nao precisa.
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ProductApplicationModalStateService {
  private readonly _isOpen = signal(false);
  private readonly _petName = signal<string | null>(null);

  readonly isOpen = this._isOpen.asReadonly();
  readonly petName = this._petName.asReadonly();

  open(petName: string): void {
    this._petName.set(petName);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
    this._petName.set(null);
  }
}
