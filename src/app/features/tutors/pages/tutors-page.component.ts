import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TutorsViewComponent } from '../components/tutors-view.component';
import { TutorsStateService } from '../../../core/services/tutors-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';

@Component({
  selector: 'app-tutors-page',
  standalone: true,
  imports: [TutorsViewComponent],
  template: `
    <app-tutors-view
      [tutorRecords]="tutorsState.filtered()"
      [expandedTutorId]="tutorsState.expandedId()"
      [birthdayTodayIds]="tutorsState.todayBirthdayIds()"
      [searchTerm]="tutorsState.searchTerm()"
      (toggleTutor)="tutorsState.toggleExpanded($event)"
      (openTutor)="modalState.openTutorModal($event)"
      (openPet)="modalState.openPetModal($event)"
      (addPet)="goToAddPet()"
      (searchTermChange)="tutorsState.setSearchTerm($event)"
    />
  `
})
export class TutorsPageComponent {
  readonly tutorsState = inject(TutorsStateService);
  readonly modalState = inject(ModalStateService);
  private readonly router = inject(Router);

  goToAddPet(): void {
    this.router.navigate(['/app/registration'], { queryParams: { scenario: 'addpet' } });
  }
}
