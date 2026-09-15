import { Component, inject } from '@angular/core';
import { HistoryViewComponent } from '../components/history-view.component';
import { HistoryStateService } from '../../../core/services/history-state.service';
import { RemindersActionsService } from '../../../core/services/reminders-actions.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [HistoryViewComponent],
  template: `
    <app-history-view
      [records]="historyState.pagedRecords()"
      [totalResults]="historyState.filtered().length"
      [dateFrom]="historyState.dateFrom()"
      [dateTo]="historyState.dateTo()"
      [searchTerm]="historyState.searchTerm()"
      [page]="historyState.page()"
      [totalPages]="historyState.totalPages()"
      (dateFromChange)="historyState.setDateRange($event, historyState.dateTo())"
      (dateToChange)="historyState.setDateRange(historyState.dateFrom(), $event)"
      (searchTermChange)="historyState.setSearchTerm($event)"
      (pageChange)="historyState.setPage($event)"
      (openRecord)="remindersActions.openMedicalRecordVisit($event)"
      (presetToday)="historyState.setToday()"
      (presetYesterday)="historyState.setYesterday()"
      (presetWeek)="historyState.setThisWeek()"
      (presetMonth)="historyState.setThisMonth()"
    />
  `
})
export class HistoryPageComponent {
  readonly historyState = inject(HistoryStateService);
  readonly remindersActions = inject(RemindersActionsService);
}
