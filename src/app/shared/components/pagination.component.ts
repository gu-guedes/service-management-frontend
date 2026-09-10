import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

// -------------------------------------------------------------------
// Paginação simples e reutilizável (Anterior/Próxima + "Página X de Y").
// Sem estado próprio — quem usa controla a página atual e escuta pageChange.
// -------------------------------------------------------------------
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination" *ngIf="totalPages > 1">
      <button type="button" class="ghost-btn" [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">
        Anterior
      </button>
      <span class="pagination-info">Pagina {{ page }} de {{ totalPages }}</span>
      <button type="button" class="ghost-btn" [disabled]="page >= totalPages" (click)="pageChange.emit(page + 1)">
        Proxima
      </button>
    </div>
  `
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();
}
