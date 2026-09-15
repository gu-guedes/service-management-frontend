import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { HistoryRecord } from '../../../core/services/history-state.service';
import { toBrDateFromIso, toTimeFromIso } from '../../../shared/utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Historico de Atendimentos — visao cross-paciente (todo o movimento
// da clinica num periodo), diferente do "Historico recente" dentro do
// atendimento (esse e por pet, ver care-view.component.ts).
// -------------------------------------------------------------------
@Component({
  selector: 'app-history-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <section class="history-view">
      <article class="card">
        <header class="card-header pets-header">
          <div>
            <h3>Historico de Atendimentos</h3>
            <p>{{ totalResults }} atendimentos exibidos</p>
          </div>
        </header>

        <div class="filters-bar">
          <p>Periodo:</p>
          <button type="button" class="filter-chip" (click)="presetToday.emit()">Hoje</button>
          <button type="button" class="filter-chip" (click)="presetYesterday.emit()">Ontem</button>
          <button type="button" class="filter-chip" (click)="presetWeek.emit()">Esta semana</button>
          <button type="button" class="filter-chip" (click)="presetMonth.emit()">Este mes</button>
        </div>

        <div class="filters-bar">
          <p>De:</p>
          <input type="date" [value]="dateFrom" (input)="dateFromChange.emit($any($event.target).value)" />
          <p>Ate:</p>
          <input type="date" [value]="dateTo" (input)="dateToChange.emit($any($event.target).value)" />
          <input
            type="search"
            class="search-input"
            placeholder="Buscar por pet, tutor ou queixa..."
            [value]="searchTerm"
            (input)="searchTermChange.emit($any($event.target).value)"
          />
        </div>

        <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Pet</th>
              <th>Tutor</th>
              <th>Queixa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let record of records" class="tutor-row" (click)="openRecord.emit(record)">
              <td>{{ toBrDateFromIso(record.recordDate) }}</td>
              <td>{{ toTimeFromIso(record.recordDate) }}</td>
              <td>{{ record.patientName }}</td>
              <td>{{ record.tutorName || 'Nao informado' }}</td>
              <td>{{ record.complaint }}</td>
              <td class="pet-actions">
                <button type="button" class="ghost-btn" (click)="$event.stopPropagation(); openRecord.emit(record)">
                  Abrir
                </button>
              </td>
            </tr>
            <tr *ngIf="!records.length">
              <td colspan="6" class="sub">Nenhum atendimento nesse periodo.</td>
            </tr>
          </tbody>
        </table>
        </div>

        <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="pageChange.emit($event)" />
      </article>
    </section>
  `
})
export class HistoryViewComponent {
  @Input() records: HistoryRecord[] = [];
  @Input() totalResults = 0;
  @Input() dateFrom = '';
  @Input() dateTo = '';
  @Input() searchTerm = '';
  @Input() page = 1;
  @Input() totalPages = 1;

  @Output() dateFromChange = new EventEmitter<string>();
  @Output() dateToChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() openRecord = new EventEmitter<HistoryRecord>();
  @Output() presetToday = new EventEmitter<void>();
  @Output() presetYesterday = new EventEmitter<void>();
  @Output() presetWeek = new EventEmitter<void>();
  @Output() presetMonth = new EventEmitter<void>();

  readonly toBrDateFromIso = toBrDateFromIso;
  readonly toTimeFromIso = toTimeFromIso;
}
