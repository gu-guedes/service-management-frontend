import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RegistrationViewComponent } from '../components/registration-view.component';
import { RegistrationService } from '../../../services/registration.service';
import { PetsStateService } from '../../../core/services/pets-state.service';
import { TutorsStateService } from '../../../core/services/tutors-state.service';
import { TutorRecord } from '../../tutors/models/tutors.models';
import { RegistrationPetPayload, RegistrationScenario } from '../models/registration.models';
import { toAddressLabel, toAgeLabel, toInitials } from '../../../shared/utils/pet-tutor-formatting';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [RegistrationViewComponent],
  template: `
    <app-registration-view
      [registrationScenario]="registrationScenario()"
      [registrationStep]="registrationStep()"
      [tutorForm]="tutorForm"
      [findTutorForm]="findTutorForm"
      [petForm]="petForm"
      [tutorRecords]="tutorsState.records()"
      [selectedTutorForRegistration]="selectedTutorForRegistration"
      [registrationError]="registrationError()"
      [isSubmittingRegistration]="isSubmittingRegistration()"
      (close)="close()"
      (scenarioChange)="setRegistrationScenario($event)"
      (selectTutor)="findTutorForm.controls.tutorId.setValue($event)"
      (previous)="previousStep()"
      (next)="nextStep()"
      (submit)="submit()"
    />
  `
})
export class RegistrationPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registrationService = inject(RegistrationService);
  readonly petsState = inject(PetsStateService);
  readonly tutorsState = inject(TutorsStateService);

  readonly registrationStep = signal(1);
  readonly registrationScenario = signal<RegistrationScenario>('new');
  readonly registrationError = signal('');
  readonly isSubmittingRegistration = signal(false);

  readonly tutorForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/)]],
    street: ['', [Validators.required, Validators.minLength(2)]],
    streetNumber: ['', [Validators.required]],
    neighborhood: ['', [Validators.required, Validators.minLength(2)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    referencePoint: [''],
    birthDate: ['', Validators.required]
  });

  readonly findTutorForm = this.fb.group({
    tutorId: ['', Validators.required]
  });

  readonly petForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    species: ['dog', Validators.required],
    breed: ['', Validators.required],
    sex: ['M', Validators.required],
    age: [null as number | null, [Validators.required, Validators.min(0), Validators.max(50)]],
    weight: [null as number | null, [Validators.required, Validators.min(0.1), Validators.max(120)]],
    notes: ['', Validators.required]
  });

  // o cenario chega por query param (ver QuickRegistrationModalComponent / TutorsPageComponent)
  ngOnInit(): void {
    const scenarioParam = this.route.snapshot.queryParamMap.get('scenario');
    this.registrationScenario.set(scenarioParam === 'addpet' ? 'addpet' : 'new');
    this.registrationStep.set(1);
    this.registrationError.set('');

    this.tutorForm.reset({ fullName: '', phone: '', street: '', streetNumber: '', neighborhood: '', city: '', referencePoint: '', birthDate: '' });
    this.petForm.reset({ name: '', species: 'dog', breed: '', sex: 'M', age: null, weight: null, notes: '' });
    this.findTutorForm.reset({ tutorId: '' });
  }

  get selectedTutorForRegistration(): TutorRecord | null {
    const id = this.findTutorForm.controls.tutorId.value;
    if (!id) return null;
    return this.tutorsState.findById(id) ?? null;
  }

  close(): void {
    this.router.navigate(['/app/pets']);
  }

  setRegistrationScenario(scenario: RegistrationScenario): void {
    if (this.registrationScenario() === scenario) return;
    this.registrationScenario.set(scenario);
    this.registrationStep.set(1);
    this.registrationError.set('');
    this.findTutorForm.reset({ tutorId: '' });
  }

  previousStep(): void {
    this.registrationError.set('');
    if (this.registrationStep() > 1) {
      this.registrationStep.update((step) => step - 1);
    }
  }

  nextStep(): void {
    if (this.registrationScenario() === 'new' && this.registrationStep() === 1) {
      if (this.tutorForm.invalid) { this.tutorForm.markAllAsTouched(); return; }
      this.registrationStep.set(2);
      return;
    }

    if (this.registrationScenario() === 'addpet' && this.registrationStep() === 1) {
      if (this.findTutorForm.invalid) { this.findTutorForm.markAllAsTouched(); return; }
      this.registrationStep.set(2);
      return;
    }

    if (this.registrationStep() === 2) {
      if (this.petForm.invalid) { this.petForm.markAllAsTouched(); return; }
      this.registrationStep.set(3);
    }
  }

  async submit(): Promise<void> {
    this.registrationError.set('');

    if (this.petForm.invalid) { this.petForm.markAllAsTouched(); return; }
    if (this.registrationScenario() === 'new' && this.tutorForm.invalid) { this.tutorForm.markAllAsTouched(); return; }
    if (this.registrationScenario() === 'addpet' && this.findTutorForm.invalid) { this.findTutorForm.markAllAsTouched(); return; }

    this.isSubmittingRegistration.set(true);

    try {
      const petPayload = this.getRegistrationPetPayload();

      if (this.registrationScenario() === 'new') {
        const tutorRaw = this.tutorForm.getRawValue();
        const response = await firstValueFrom(
          this.registrationService.createTutorWithPet({
            tutor: {
              fullName: tutorRaw.fullName ?? '',
              phone: tutorRaw.phone ?? '',
              street: tutorRaw.street ?? '',
              streetNumber: tutorRaw.streetNumber ?? '',
              neighborhood: tutorRaw.neighborhood ?? '',
              city: tutorRaw.city ?? '',
              referencePoint: tutorRaw.referencePoint ?? '',
              birthDate: tutorRaw.birthDate ?? ''
            },
            pet: petPayload
          })
        );

        const tutorId = response.customerId !== null ? String(response.customerId) : this.toTutorId(response.tutor.fullName);
        const tutorInitials = toInitials(response.tutor.fullName);

        // atualiza os serviços de estado — cada serviço gerencia seus próprios dados
        this.tutorsState.addRecord({
          id: tutorId,
          name: response.tutor.fullName,
          phone: response.tutor.phone,
          address: toAddressLabel(response.tutor),
          initials: tutorInitials,
          lastVisit: 'Sem atendimentos',
          registeredAt: response.createdAt,
          birthDate: response.tutor.birthDate || null,
          pets: [{
            name: response.pet.name,
            details: this.toPetDetails(petPayload),
            icon: this.petsState.getPetEmoji(petPayload.species)
          }]
        });

        this.petsState.addRecord({
          id: response.patientId,
          name: response.pet.name,
          species: petPayload.species,
          summary: this.toPetSummary(petPayload),
          tutor: response.tutor.fullName,
          tutorInitials,
          lastVisit: 'Sem atendimentos',
          registeredAt: response.createdAt,
          status: 'Ativo',
          statusClass: 'is-green',
          weightKg: petPayload.weight
        });

      } else {
        const selectedTutor = this.selectedTutorForRegistration;

        if (!selectedTutor) {
          this.registrationError.set('Selecione um tutor para continuar.');
          return;
        }

        const response = await firstValueFrom(
          this.registrationService.addPetToTutor({
            tutorId: selectedTutor.id,
            pet: petPayload
          })
        );

        this.tutorsState.addPetToTutor(selectedTutor.id, {
          name: response.pet.name,
          details: this.toPetDetails(petPayload),
          icon: this.petsState.getPetEmoji(petPayload.species)
        });

        this.petsState.addRecord({
          id: response.patientId,
          name: response.pet.name,
          species: petPayload.species,
          summary: this.toPetSummary(petPayload),
          tutor: selectedTutor.name,
          tutorInitials: selectedTutor.initials,
          lastVisit: 'Sem atendimentos',
          registeredAt: response.createdAt,
          status: 'Ativo',
          statusClass: 'is-green',
          weightKg: petPayload.weight
        });
      }

      this.petsState.setFilter('all');
      this.router.navigate(['/app/pets']);

    } catch {
      this.registrationError.set('Nao foi possivel salvar agora. Tente novamente.');
    } finally {
      this.isSubmittingRegistration.set(false);
    }
  }

  private getRegistrationPetPayload(): RegistrationPetPayload {
    const petRaw = this.petForm.getRawValue();
    return {
      name: petRaw.name ?? '',
      species: (petRaw.species ?? 'dog') as 'dog' | 'cat' | 'other',
      breed: petRaw.breed ?? '',
      sex: (petRaw.sex ?? 'M') as 'M' | 'F',
      age: petRaw.age ?? null,
      weight: petRaw.weight ?? null,
      notes: petRaw.notes ?? ''
    };
  }

  private toTutorId(fullName: string): string {
    return fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
  }

  private toPetSummary(pet: RegistrationPetPayload): string {
    const speciesLabel = pet.species === 'dog' ? 'Cao' : pet.species === 'cat' ? 'Gato' : 'Outro';
    return `${speciesLabel} · ${pet.breed || 'Sem raca'} · ${pet.sex === 'M' ? 'M' : 'F'} · ${toAgeLabel(pet.age)}`;
  }

  private toPetDetails(pet: RegistrationPetPayload): string {
    return `${pet.breed || 'Sem raca'} · ${pet.sex === 'M' ? 'Macho' : 'Femea'}`;
  }
}
