import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { forkJoin } from 'rxjs';
import { AuthService } from './services/auth.service';
import { PetsStateService } from './core/services/pets-state.service';
import { TutorsStateService } from './core/services/tutors-state.service';
import { DirectoryApiService, CustomerResponseDTO, PatientResponseDTO } from './core/services/directory-api.service';
import { MedicalRecordsApiService } from './core/services/medical-records-api.service';
import { PetRecord } from './features/pets/models/pets.models';
import { TutorRecord } from './features/tutors/models/tutors.models';
import { PetDetailModalComponent } from './shared/components/pet-detail-modal.component';
import { TutorDetailModalComponent } from './shared/components/tutor-detail-modal.component';
import { QuickRegistrationModalComponent } from './shared/components/quick-registration-modal.component';
import {
  toAddressLabel,
  toAgeLabel,
  toBrDateFromIso,
  toInitials,
  toSexLabel,
  toSpeciesLabel,
  toUiSpeciesFromApi
} from './shared/utils/pet-tutor-formatting';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

// -------------------------------------------------------------------
// Shell do app: menu lateral, topbar, <router-outlet> das paginas por
// feature (pets/tutors/registration/care) e os modais compartilhados
// (ficha do pet, perfil do tutor, atalhos de cadastro — ver shared/components).
// Tambem faz a carga inicial de pets/tutores da API ao abrir o app.
// -------------------------------------------------------------------
@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    PetDetailModalComponent,
    TutorDetailModalComponent,
    QuickRegistrationModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly directoryApi = inject(DirectoryApiService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);

  readonly petsState = inject(PetsStateService);
  readonly tutorsState = inject(TutorsStateService);

  // paginas de atendimento e cadastro sao tela cheia — sem sidebar/topbar/tabs
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isFullScreenRoute = computed(() => {
    const url = this.currentUrl();
    return url.includes('/app/care') || url.includes('/app/registration');
  });

  readonly navItems: NavItem[] = [
    { label: 'Fichas de Pets', icon: '🐾', route: '/app/pets' },
    { label: 'Tutores', icon: '👥', route: '/app/tutors' }
  ];

  // ----------------------------------------------------------------
  // Carrega tutores e pets reais da API ao abrir o app
  // ----------------------------------------------------------------
  ngOnInit(): void {
    this.loadDirectory();
  }

  private loadDirectory(): void {
    forkJoin({
      customers: this.directoryApi.getCustomers(),
      patients: this.directoryApi.getPatients(),
      medicalRecords: this.medicalRecordsApi.getAll()
    }).subscribe({
      next: ({ customers, patients, medicalRecords }) => {
        const customerNameById = new Map(customers.map((c) => [c.id, c.name]));
        const lastVisitByPatientId = this.toLastVisitMap(medicalRecords);

        this.petsState.replaceAll(
          patients.map((patient) =>
            this.toPetRecordFromApi(patient, customerNameById.get(patient.customerId), lastVisitByPatientId.get(patient.id))
          )
        );

        this.tutorsState.replaceAll(
          customers.map((customer) => {
            const customerPets = patients.filter((p) => p.customerId === customer.id);
            const tutorLastVisit = this.toMostRecentIso(
              customerPets.map((p) => lastVisitByPatientId.get(p.id)).filter((d): d is string => !!d)
            );
            return this.toTutorRecordFromApi(customer, customerPets, tutorLastVisit);
          })
        );
      },
      error: () => {
        // API fora do ar: mantém a lista mock que já está carregada
      }
    });
  }

  // mapeia patientId -> data (ISO) do atendimento mais recente
  private toLastVisitMap(records: Array<{ patientId: number; recordDate: string }>): Map<number, string> {
    const map = new Map<number, string>();

    for (const record of records) {
      const current = map.get(record.patientId);
      if (!current || new Date(record.recordDate).getTime() > new Date(current).getTime()) {
        map.set(record.patientId, record.recordDate);
      }
    }

    return map;
  }

  private toMostRecentIso(dates: string[]): string | undefined {
    if (!dates.length) return undefined;
    return dates.reduce((latest, d) => (new Date(d).getTime() > new Date(latest).getTime() ? d : latest));
  }

  private toPetRecordFromApi(
    patient: PatientResponseDTO,
    tutorName: string | undefined,
    lastVisitIso: string | undefined
  ): PetRecord {
    const species = toUiSpeciesFromApi(patient.species);
    return {
      id: patient.id,
      name: patient.name,
      species,
      summary: `${patient.breed || 'Sem raca'} · ${toSpeciesLabel(species)} · ${toSexLabel(patient.sex)} · ${toAgeLabel(patient.ageYears)}`,
      tutor: tutorName ?? 'Tutor nao encontrado',
      tutorInitials: toInitials(tutorName ?? ''),
      lastVisit: lastVisitIso ? toBrDateFromIso(lastVisitIso) : 'Sem atendimentos',
      registeredAt: toBrDateFromIso(patient.createdAt),
      status: patient.active ? 'Ativo' : 'Inativo',
      statusClass: patient.active ? 'is-green' : 'is-gray',
      weightKg: patient.weightKg ?? null
    };
  }

  private toTutorRecordFromApi(
    customer: CustomerResponseDTO,
    pets: PatientResponseDTO[],
    lastVisitIso: string | undefined
  ): TutorRecord {
    return {
      id: String(customer.id),
      name: customer.name,
      phone: customer.phone || '--',
      address: toAddressLabel(customer),
      initials: toInitials(customer.name),
      lastVisit: lastVisitIso ? toBrDateFromIso(lastVisitIso) : 'Sem atendimentos',
      registeredAt: toBrDateFromIso(customer.createdAt),
      pets: pets.map((pet) => ({
        name: pet.name,
        details: `${pet.breed || 'Sem raca'} · ${toSexLabel(pet.sex)}`,
        icon: this.petsState.getPetEmoji(toUiSpeciesFromApi(pet.species))
      }))
    };
  }

  async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
