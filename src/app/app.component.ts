import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DashboardViewComponent } from './features/dashboard/components/dashboard-view.component';
import { CareViewComponent } from './features/care/components/care-view.component';
import { PetsViewComponent } from './features/pets/components/pets-view.component';
import { RegistrationViewComponent } from './features/registration/components/registration-view.component';
import { TutorsViewComponent } from './features/tutors/components/tutors-view.component';
import { Appointment, StatItem, VaccineAlert } from './features/dashboard/models/dashboard.models';
import {
  FilterOption,
  PetCareProfile,
  PetFilter,
  PetRecord,
  TimelineEntry
} from './features/pets/models/pets.models';
import { TutorRecord } from './features/tutors/models/tutors.models';
import { AuthService } from './services/auth.service';
import { RegistrationService } from './services/registration.service';

type MainTab = 'dashboard' | 'pets' | 'tutors';

interface NavItem {
  label: string;
  icon: string;
  badge?: string;
}

type ActiveModal = 'pet' | 'tutor' | null;
type RegistrationScenario = 'new' | 'addpet';

interface RegistrationPetPayload {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  sex: 'M' | 'F';
  birthDate: string;
  weight: number | null;
}

type CareSection =
  | 'anamnesis'
  | 'exam'
  | 'diagnosis'
  | 'prescription'
  | 'tests'
  | 'procedures'
  | 'notes';

interface CareNavItem {
  key: CareSection;
  label: string;
}

interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
}

interface CareTestItem {
  name: string;
  urgency: 'normal' | 'urgent';
}

interface CareProcedureItem {
  name: string;
  done: boolean;
}


@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RegistrationViewComponent,
    CareViewComponent,
    DashboardViewComponent,
    PetsViewComponent,
    TutorsViewComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly registrationService = inject(RegistrationService);

  activeTab: MainTab = 'dashboard';
  activePetFilter: PetFilter = 'all';
  expandedTutorId: string | null = null;
  activeModal: ActiveModal = null;
  selectedPetName: string | null = null;
  selectedTutorId: string | null = null;
  newPetChoiceModalOpen = false;
  newTutorInfoModalOpen = false;
  registrationOpen = false;
  registrationStep = 1;
  registrationScenario: RegistrationScenario = 'new';
  registrationError = '';
  isSubmittingRegistration = false;
  careOpen = false;
  activeCareSection: CareSection = 'anamnesis';
  careCompletionMessage = '';
  medications: MedicationItem[] = [
    { name: 'Carprofeno', dose: '2 mg/kg', frequency: '12/12h por 5 dias' }
  ];
  tests: CareTestItem[] = [
    { name: 'Raio-x de quadril', urgency: 'urgent' },
    { name: 'Hemograma completo', urgency: 'normal' }
  ];
  procedures: CareProcedureItem[] = [
    { name: 'Coleta de sangue', done: true },
    { name: 'Aplicacao analgesico', done: false }
  ];

  readonly tutorForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/)]],
    email: ['', [Validators.email]],
    city: [''],
    address: ['']
  });

  readonly findTutorForm = this.fb.group({
    tutorId: ['', Validators.required]
  });

  readonly petForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    species: ['dog', Validators.required],
    breed: [''],
    sex: ['M', Validators.required],
    birthDate: [''],
    weight: [null as number | null, [Validators.min(0.1), Validators.max(120)]],
    notes: ['']
  });

  readonly returnForm = this.fb.group({
    date: [''],
    type: ['Retorno clinico'],
    notes: ['']
  });

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '⊞' },
    { label: 'Fichas de Pets', icon: '🐾', badge: '3' },
    { label: 'Tutores', icon: '👥' },
    { label: 'Agenda', icon: '📅' },
    { label: 'Procedimentos', icon: '🩺' },
    { label: 'Prescricoes', icon: '💊' }
  ];

  readonly careSections: CareNavItem[] = [
    { key: 'anamnesis', label: 'Anamnese' },
    { key: 'exam', label: 'Exame Fisico' },
    { key: 'diagnosis', label: 'Diagnostico' },
    { key: 'prescription', label: 'Prescricao' },
    { key: 'tests', label: 'Exames' },
    { key: 'procedures', label: 'Procedimentos' },
    { key: 'notes', label: 'Observacoes' }
  ];

  readonly statItems: StatItem[] = [
    {
      label: 'Pets Cadastrados',
      value: '248',
      delta: '12 este mes',
      icon: '🐶',
      iconClass: 'is-green'
    },
    {
      label: 'Tutores Ativos',
      value: '189',
      delta: '8 este mes',
      icon: '👥',
      iconClass: 'is-blue'
    },
    {
      label: 'Consultas Hoje',
      value: '6',
      delta: '3 restantes',
      icon: '📅',
      iconClass: 'is-yellow'
    },
    {
      label: 'Vacinas Pendentes',
      value: '14',
      delta: 'Atencao',
      icon: '💉',
      iconClass: 'is-orange'
    }
  ];

  readonly appointments: Appointment[] = [
    {
      time: '08:30',
      pet: 'Thor',
      tutor: 'Carlos Mendes',
      procedure: 'Consulta de rotina',
      status: 'Concluido',
      statusClass: 'is-green'
    },
    {
      time: '10:00',
      pet: 'Luna',
      tutor: 'Ana Lima',
      procedure: 'Vacinacao V4',
      status: 'Aguardando',
      statusClass: 'is-yellow'
    },
    {
      time: '14:00',
      pet: 'Mel',
      tutor: 'Rodrigo Sousa',
      procedure: 'Castracao',
      status: 'Proximo',
      statusClass: 'is-orange'
    }
  ];

  readonly vaccineAlerts: VaccineAlert[] = [
    {
      pet: 'Luna · Persa',
      detail: 'V4 vence em 3 dias',
      urgency: 'Urgente',
      urgencyClass: 'is-orange'
    },
    {
      pet: 'Simba · Siames',
      detail: 'Antirrabica em 12 dias',
      urgency: 'Atencao',
      urgencyClass: 'is-yellow'
    },
    {
      pet: 'Bolinha · Coelho',
      detail: 'V8 em 28 dias',
      urgency: 'Ok',
      urgencyClass: 'is-gray'
    }
  ];

  readonly petFilters: FilterOption[] = [
    { key: 'all', label: 'Todos' },
    { key: 'dog', label: 'Caes' },
    { key: 'cat', label: 'Gatos' },
    { key: 'other', label: 'Outros' },
    { key: 'vaccine', label: 'Vacina' },
    { key: 'return', label: 'Retorno' }
  ];

  petRecords: PetRecord[] = [
    {
      name: 'Thor',
      species: 'dog',
      summary: 'Golden Retriever · 4a · M · Castrado',
      tutor: 'Carlos Mendes',
      tutorInitials: 'CM',
      lastVisit: '15/02/2026',
      status: 'Em dia',
      statusClass: 'is-green',
      statusType: 'ok'
    },
    {
      name: 'Luna',
      species: 'cat',
      summary: 'Persa · 2a · F',
      tutor: 'Ana Lima',
      tutorInitials: 'AL',
      lastVisit: '20/02/2026',
      status: 'Vacina',
      statusClass: 'is-orange',
      statusType: 'vaccine'
    },
    {
      name: 'Mel',
      species: 'dog',
      summary: 'SRD · 7a · F',
      tutor: 'Rodrigo Sousa',
      tutorInitials: 'RS',
      lastVisit: '10/01/2026',
      status: 'Retorno',
      statusClass: 'is-yellow',
      statusType: 'return'
    },
    {
      name: 'Bolinha',
      species: 'other',
      summary: 'Coelho · 1a · M',
      tutor: 'Fernanda Dias',
      tutorInitials: 'FD',
      lastVisit: '05/02/2026',
      status: 'Em dia',
      statusClass: 'is-green',
      statusType: 'ok'
    },
    {
      name: 'Simba',
      species: 'cat',
      summary: 'Siames · 5a · M',
      tutor: 'Paula Ramos',
      tutorInitials: 'PR',
      lastVisit: '22/02/2026',
      status: 'Vacina',
      statusClass: 'is-orange',
      statusType: 'vaccine'
    }
  ];

  tutorRecords: TutorRecord[] = [
    {
      id: 'carlos-mendes',
      name: 'Carlos Mendes',
      cpf: '012.345.678-90',
      phone: '(11) 99234-5678',
      initials: 'CM',
      lastVisit: '15/02/2026',
      pets: [
        { name: 'Thor', details: 'Golden · 4a', icon: '🐶' },
        { name: 'Mimi', details: 'Persa · 2a', icon: '🐱' },
        { name: 'Bob', details: 'Poodle · 6a', icon: '🐶' }
      ]
    },
    {
      id: 'ana-lima',
      name: 'Ana Lima',
      cpf: '023.456.789-01',
      phone: '(11) 98765-4321',
      initials: 'AL',
      lastVisit: '20/02/2026',
      pets: [{ name: 'Luna', details: 'Persa · 2a', icon: '🐱' }]
    },
    {
      id: 'rodrigo-sousa',
      name: 'Rodrigo Sousa',
      cpf: '034.567.890-12',
      phone: '(11) 97654-3210',
      initials: 'RS',
      lastVisit: '10/01/2026',
      pets: [
        { name: 'Mel', details: 'SRD · 7a', icon: '🐶' },
        { name: 'Tank', details: 'Jabuti · 10a', icon: '🐢' }
      ]
    },
    {
      id: 'fernanda-dias',
      name: 'Fernanda Dias',
      cpf: '045.678.901-23',
      phone: '(11) 96543-2109',
      initials: 'FD',
      lastVisit: '05/02/2026',
      pets: [{ name: 'Bolinha', details: 'Coelho · 1a', icon: '🐰' }]
    }
  ];

  readonly petTimeline: Record<string, TimelineEntry[]> = {
    Thor: [
      {
        date: '15/02/2026',
        title: 'Consulta de rotina',
        description: 'Peso estavel. Suplemento articular mantido por mais 30 dias.'
      },
      {
        date: '10/01/2026',
        title: 'Vacinacao V10',
        description: 'Aplicacao sem intercorrencias. Proximo reforco em 12 meses.'
      }
    ],
    Luna: [
      {
        date: '20/02/2026',
        title: 'Vacinacao V4',
        description: 'Paciente sensivel a manipulacao, recomendado retorno controlado.'
      }
    ],
    Mel: [
      {
        date: '10/01/2026',
        title: 'Retorno ortopedico',
        description: 'Reavaliar em 30 dias por claudicacao intermitente.'
      }
    ]
  };

  readonly petCareProfiles: Record<string, PetCareProfile> = {
    Thor: {
      weightLabel: '28.5 kg',
      allergiesLabel: 'Dipirona',
      alertMessage: 'Retorno solicitado em 15/01 — avaliar resposta ao suplemento articular.',
      tags: [
        { label: 'Vacinado', className: 'is-green' },
        { label: 'Castrado', className: 'is-blue' }
      ]
    },
    Luna: {
      weightLabel: '3.2 kg',
      allergiesLabel: 'Nenhuma',
      alertMessage: 'Vacina V4 em acompanhamento. Reavaliar sensibilidade pos-vacina.',
      tags: [
        { label: 'Vacina', className: 'is-orange' },
        { label: 'Em observacao', className: 'is-yellow' }
      ]
    },
    Mel: {
      weightLabel: '18.1 kg',
      allergiesLabel: 'Nimesulida',
      alertMessage: 'Retorno ortopedico em 30 dias para controle de dor e mobilidade.',
      tags: [
        { label: 'Retorno', className: 'is-yellow' },
        { label: 'Historico cronico', className: 'is-gray' }
      ]
    }
  };

  get filteredPetRecords(): PetRecord[] {
    if (this.activePetFilter === 'all') {
      return this.petRecords;
    }

    if (this.activePetFilter === 'vaccine' || this.activePetFilter === 'return') {
      return this.petRecords.filter((pet) => pet.statusType === this.activePetFilter);
    }

    return this.petRecords.filter((pet) => pet.species === this.activePetFilter);
  }

  get selectedTutorForRegistration(): TutorRecord | null {
    const id = this.findTutorForm.controls.tutorId.value;
    if (!id) {
      return null;
    }

    return this.tutorRecords.find((tutor) => tutor.id === id) ?? null;
  }

  setTab(tab: MainTab): void {
    this.activeTab = tab;
  }

  openCareViewFromPet(): void {
    if (!this.selectedPetRecord) {
      return;
    }

    this.closeModal();
    this.careOpen = true;
    this.activeCareSection = 'anamnesis';
    this.careCompletionMessage = '';
    this.returnForm.reset({
      date: '',
      type: 'Retorno clinico',
      notes: ''
    });
  }

  closeCareView(): void {
    this.careOpen = false;
    this.activeCareSection = 'anamnesis';
    this.careCompletionMessage = '';
  }

  setCareSection(section: CareSection): void {
    this.activeCareSection = section;
  }

  completeCare(): void {
    const returnData = this.returnForm.getRawValue();
    const dateLabel = returnData.date || 'sem data definida';
    const typeLabel = returnData.type || 'retorno clinico';

    this.careCompletionMessage = `Atendimento concluido. Retorno: ${typeLabel} em ${dateLabel}.`;
  }

  getCareSectionState(section: CareSection): 'done' | 'now' | 'pending' {
    const activeIndex = this.careSections.findIndex((item) => item.key === this.activeCareSection);
    const sectionIndex = this.careSections.findIndex((item) => item.key === section);

    if (sectionIndex < activeIndex) {
      return 'done';
    }

    if (sectionIndex === activeIndex) {
      return 'now';
    }

    return 'pending';
  }

  readonly careSectionState = (sectionId: string): 'done' | 'now' | 'pending' =>
    this.getCareSectionState(sectionId as CareSection);

  addMedication(): void {
    this.medications = [...this.medications, { name: 'Novo medicamento', dose: '', frequency: '' }];
  }

  removeMedication(index: number): void {
    this.medications = this.medications.filter((_, itemIndex) => itemIndex !== index);
  }

  addTest(): void {
    this.tests = [...this.tests, { name: 'Novo exame', urgency: 'normal' }];
  }

  removeTest(index: number): void {
    this.tests = this.tests.filter((_, itemIndex) => itemIndex !== index);
  }

  setTestUrgency(index: number, urgency: 'normal' | 'urgent'): void {
    this.tests = this.tests.map((test, itemIndex) =>
      itemIndex === index
        ? {
            ...test,
            urgency
          }
        : test
    );
  }

  addProcedure(): void {
    this.procedures = [...this.procedures, { name: 'Novo procedimento', done: false }];
  }

  removeProcedure(index: number): void {
    this.procedures = this.procedures.filter((_, itemIndex) => itemIndex !== index);
  }

  toggleProcedure(index: number): void {
    this.procedures = this.procedures.map((procedure, itemIndex) =>
      itemIndex === index
        ? {
            ...procedure,
            done: !procedure.done
          }
        : procedure
    );
  }

  getActiveCareSectionLabel(): string {
    return this.careSections.find((section) => section.key === this.activeCareSection)?.label ?? 'Secao';
  }

  openRegistration(scenario: RegistrationScenario): void {
    this.registrationScenario = scenario;
    this.registrationStep = 1;
    this.registrationError = '';
    this.registrationOpen = true;

    this.tutorForm.reset({
      fullName: '',
      cpf: '',
      phone: '',
      email: '',
      city: '',
      address: ''
    });
    this.petForm.reset({
      name: '',
      species: 'dog',
      breed: '',
      sex: 'M',
      birthDate: '',
      weight: null,
      notes: ''
    });
    this.findTutorForm.reset({ tutorId: '' });
  }

  openNewPetChoiceModal(): void {
    this.newPetChoiceModalOpen = true;
  }

  openNewTutorInfoModal(): void {
    this.newTutorInfoModalOpen = true;
  }

  closeQuickRegistrationModals(): void {
    this.newPetChoiceModalOpen = false;
    this.newTutorInfoModalOpen = false;
  }

  startRegistrationFromModal(scenario: RegistrationScenario): void {
    this.closeQuickRegistrationModals();
    this.openRegistration(scenario);
  }

  closeRegistration(): void {
    this.registrationOpen = false;
    this.registrationError = '';
    this.isSubmittingRegistration = false;
  }

  setRegistrationScenario(scenario: RegistrationScenario): void {
    if (this.registrationScenario === scenario) {
      return;
    }

    this.registrationScenario = scenario;
    this.registrationStep = 1;
    this.registrationError = '';
    this.findTutorForm.reset({ tutorId: '' });
  }

  goRegistrationStep(step: number): void {
    this.registrationError = '';
    this.registrationStep = step;
  }

  nextRegistrationStep(): void {
    if (this.registrationScenario === 'new' && this.registrationStep === 1) {
      if (this.tutorForm.invalid) {
        this.tutorForm.markAllAsTouched();
        return;
      }
      this.registrationStep = 2;
      return;
    }

    if (this.registrationScenario === 'addpet' && this.registrationStep === 1) {
      if (this.findTutorForm.invalid) {
        this.findTutorForm.markAllAsTouched();
        return;
      }
      this.registrationStep = 2;
      return;
    }

    if (this.registrationStep === 2) {
      if (this.petForm.invalid) {
        this.petForm.markAllAsTouched();
        return;
      }
      this.registrationStep = 3;
    }
  }

  previousRegistrationStep(): void {
    this.registrationError = '';
    if (this.registrationStep > 1) {
      this.registrationStep -= 1;
    }
  }

  isNavItemActive(label: string): boolean {
    if (label === 'Dashboard') {
      return this.activeTab === 'dashboard';
    }

    if (label === 'Fichas de Pets') {
      return this.activeTab === 'pets';
    }

    if (label === 'Tutores') {
      return this.activeTab === 'tutors';
    }

    return false;
  }

  toggleTutorRow(tutorId: string): void {
    this.expandedTutorId = this.expandedTutorId === tutorId ? null : tutorId;
  }

  isTutorExpanded(tutorId: string): boolean {
    return this.expandedTutorId === tutorId;
  }

  setPetFilter(filter: PetFilter): void {
    this.activePetFilter = filter;
  }

  async submitRegistration(): Promise<void> {
    this.registrationError = '';

    if (this.petForm.invalid) {
      this.petForm.markAllAsTouched();
      return;
    }

    if (this.registrationScenario === 'new' && this.tutorForm.invalid) {
      this.tutorForm.markAllAsTouched();
      return;
    }

    if (this.registrationScenario === 'addpet' && this.findTutorForm.invalid) {
      this.findTutorForm.markAllAsTouched();
      return;
    }

    this.isSubmittingRegistration = true;

    try {
      const petPayload = this.getRegistrationPetPayload();

      if (this.registrationScenario === 'new') {
        const tutorRaw = this.tutorForm.getRawValue();
        const response = await firstValueFrom(
          this.registrationService.createTutorWithPet({
            tutor: {
              fullName: tutorRaw.fullName ?? '',
              cpf: tutorRaw.cpf ?? '',
              phone: tutorRaw.phone ?? '',
              email: tutorRaw.email ?? '',
              city: tutorRaw.city ?? '',
              address: tutorRaw.address ?? ''
            },
            pet: petPayload
          })
        );

        const tutorId = this.toTutorId(response.tutor.fullName);
        const tutorInitials = this.toInitials(response.tutor.fullName);
        const petStatus = this.toStatusBySpecies(petPayload.species);

        this.tutorRecords = [
          {
            id: tutorId,
            name: response.tutor.fullName,
            cpf: response.tutor.cpf,
            phone: response.tutor.phone,
            initials: tutorInitials,
            lastVisit: response.createdAt,
            pets: [{ name: response.pet.name, details: this.toPetDetails(petPayload), icon: this.getPetEmoji(petPayload.species) }]
          },
          ...this.tutorRecords
        ];

        this.petRecords = [
          {
            name: response.pet.name,
            species: petPayload.species,
            summary: this.toPetSummary(petPayload),
            tutor: response.tutor.fullName,
            tutorInitials,
            lastVisit: response.createdAt,
            status: petStatus.label,
            statusClass: petStatus.className,
            statusType: petStatus.type
          },
          ...this.petRecords
        ];
      } else {
        const selectedTutor = this.selectedTutorForRegistration;

        if (!selectedTutor) {
          this.registrationError = 'Selecione um tutor para continuar.';
          return;
        }

        const response = await firstValueFrom(
          this.registrationService.addPetToTutor({
            tutorId: selectedTutor.id,
            pet: petPayload
          })
        );

        const petStatus = this.toStatusBySpecies(petPayload.species);

        this.tutorRecords = this.tutorRecords.map((tutor) => {
          if (tutor.id !== selectedTutor.id) {
            return tutor;
          }

          return {
            ...tutor,
            lastVisit: response.createdAt,
            pets: [
              ...tutor.pets,
              {
                name: response.pet.name,
                details: this.toPetDetails(petPayload),
                icon: this.getPetEmoji(petPayload.species)
              }
            ]
          };
        });

        this.petRecords = [
          {
            name: response.pet.name,
            species: petPayload.species,
            summary: this.toPetSummary(petPayload),
            tutor: selectedTutor.name,
            tutorInitials: selectedTutor.initials,
            lastVisit: response.createdAt,
            status: petStatus.label,
            statusClass: petStatus.className,
            statusType: petStatus.type
          },
          ...this.petRecords
        ];
      }

      this.closeRegistration();
      this.activeTab = 'pets';
      this.activePetFilter = 'all';
    } catch {
      this.registrationError = 'Nao foi possivel salvar agora. Tente novamente.';
    } finally {
      this.isSubmittingRegistration = false;
    }
  }

  openPetModal(petName: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedPetName = petName;
    this.selectedTutorId = null;
    this.activeModal = 'pet';
  }

  openTutorModal(tutorId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedTutorId = tutorId;
    this.selectedPetName = null;
    this.activeModal = 'tutor';
  }

  closeModal(): void {
    this.activeModal = null;
    this.selectedPetName = null;
    this.selectedTutorId = null;
  }

  openTutorFromPet(): void {
    const pet = this.selectedPetRecord;

    if (!pet) {
      return;
    }

    const tutor = this.tutorRecords.find((record) => record.name === pet.tutor);

    if (!tutor) {
      return;
    }

    this.openTutorModal(tutor.id);
  }

  getPetEmoji(species: PetRecord['species']): string {
    if (species === 'dog') {
      return '🐶';
    }

    if (species === 'cat') {
      return '🐱';
    }

    return '🐾';
  }

  getTutorPetsLabel(totalPets: number): string {
    return totalPets === 1 ? '1 pet' : `${totalPets} pets`;
  }

  private getRegistrationPetPayload(): RegistrationPetPayload {
    const petRaw = this.petForm.getRawValue();
    const species = (petRaw.species ?? 'dog') as 'dog' | 'cat' | 'other';
    const sex = (petRaw.sex ?? 'M') as 'M' | 'F';

    return {
      name: petRaw.name ?? '',
      species,
      breed: petRaw.breed ?? '',
      sex,
      birthDate: petRaw.birthDate ?? '',
      weight: petRaw.weight ?? null
    };
  }

  private toTutorId(fullName: string): string {
    return fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
  }

  private toInitials(fullName: string): string {
    const parts = fullName.split(' ').filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  private toPetSummary(pet: RegistrationPetPayload): string {
    const speciesLabel = pet.species === 'dog' ? 'Cao' : pet.species === 'cat' ? 'Gato' : 'Outro';
    const sexLabel = pet.sex === 'M' ? 'M' : 'F';
    const breed = pet.breed || 'Sem raca';

    return `${speciesLabel} · ${breed} · ${sexLabel}`;
  }

  private toPetDetails(pet: RegistrationPetPayload): string {
    const breed = pet.breed || 'Sem raca';
    return `${breed} · ${pet.sex === 'M' ? 'Macho' : 'Femea'}`;
  }

  private toStatusBySpecies(species: 'dog' | 'cat' | 'other'): {
    label: string;
    className: string;
    type: 'ok' | 'vaccine' | 'return';
  } {
    if (species === 'cat') {
      return { label: 'Vacina', className: 'is-orange', type: 'vaccine' };
    }

    if (species === 'other') {
      return { label: 'Retorno', className: 'is-yellow', type: 'return' };
    }

    return { label: 'Em dia', className: 'is-green', type: 'ok' };
  }

  get selectedPetRecord(): PetRecord | null {
    if (!this.selectedPetName) {
      return null;
    }

    return this.petRecords.find((pet) => pet.name === this.selectedPetName) ?? null;
  }

  get selectedPetCareProfile(): PetCareProfile {
    const petName = this.selectedPetRecord?.name;

    if (petName && this.petCareProfiles[petName]) {
      return this.petCareProfiles[petName];
    }

    return {
      weightLabel: '-- kg',
      allergiesLabel: 'Nao informado',
      alertMessage: 'Sem alerta clinico registrado para este pet.',
      tags: [{ label: 'Sem status', className: 'is-gray' }]
    };
  }

  get selectedTutorRecord(): TutorRecord | null {
    if (!this.selectedTutorId) {
      return null;
    }

    return this.tutorRecords.find((tutor) => tutor.id === this.selectedTutorId) ?? null;
  }

  get selectedPetTimeline(): TimelineEntry[] {
    const pet = this.selectedPetRecord;

    if (!pet) {
      return [];
    }

    return this.petTimeline[pet.name] ?? [];
  }

  async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
