import { Component, inject } from '@angular/core';
import { DashboardViewComponent } from '../components/dashboard-view.component';
import { MedicalRecordsStateService } from '../../../core/services/medical-records-state.service';
import { ProductApplicationsStateService } from '../../../core/services/product-applications-state.service';
import { ProductApplicationModalStateService } from '../../../core/services/product-application-modal-state.service';
import { ExamRequestsStateService } from '../../../core/services/exam-requests-state.service';
import { TutorsStateService } from '../../../core/services/tutors-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { RemindersActionsService } from '../../../core/services/reminders-actions.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DashboardViewComponent],
  template: `
    <app-dashboard-view
      [dueFollowUps]="medicalRecordsState.dueFollowUps()"
      [markingFollowUpDoneIds]="remindersActions.markingFollowUpDoneIds()"
      [expiringProducts]="productApplicationsState.expiringProducts()"
      [pendingExams]="examRequestsState.pendingExamRequests()"
      [todayBirthdays]="tutorsState.todayBirthdays()"
      (markFollowUpDone)="remindersActions.markFollowUpDone($event)"
      (renewProduct)="productApplicationModalState.open($event)"
      (openExamVisit)="remindersActions.openExamVisit($event)"
      (openTutorProfile)="modalState.openTutorModal($event)"
    />
  `
})
export class DashboardPageComponent {
  readonly medicalRecordsState = inject(MedicalRecordsStateService);
  readonly productApplicationsState = inject(ProductApplicationsStateService);
  readonly productApplicationModalState = inject(ProductApplicationModalStateService);
  readonly examRequestsState = inject(ExamRequestsStateService);
  readonly tutorsState = inject(TutorsStateService);
  readonly modalState = inject(ModalStateService);
  readonly remindersActions = inject(RemindersActionsService);
}
