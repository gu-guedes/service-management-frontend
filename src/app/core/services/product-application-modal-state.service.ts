import { Injectable, signal } from '@angular/core';

// -------------------------------------------------------------------
// Serviço de estado do modal rápido de aplicação de produto (coleira,
// vermifugo, vacina...). So guarda pra qual pet o modal foi aberto —
// separado do ModalStateService pra nao carregar o historico de
// visitas do pet, que essa tela nao precisa.
// Por id, nao por nome — com dois pets de mesmo nome, o produto era
// gravado no primeiro cadastrado (findByName resolve so o primeiro).
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ProductApplicationModalStateService {
  private readonly _isOpen = signal(false);
  private readonly _petId = signal<number | null>(null);

  readonly isOpen = this._isOpen.asReadonly();
  readonly petId = this._petId.asReadonly();

  open(petId: number): void {
    this._petId.set(petId);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
    this._petId.set(null);
  }
}
