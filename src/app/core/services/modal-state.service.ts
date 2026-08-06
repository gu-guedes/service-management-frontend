import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PetRecord, TimelineEntry } from '../../features/pets/models/pets.models';
import { TutorRecord } from '../../features/tutors/models/tutors.models';
import { PetsStateService } from './pets-state.service';
import { TutorsStateService } from './tutors-state.service';
import { MedicalRecordsApiService, MedicalRecordResponseDTO } from './medical-records-api.service';

type ActiveModal = 'pet' | 'tutor' | null;

// -------------------------------------------------------------------
// Serviço de estado dos modais
// Responsabilidade: qual modal está aberto e qual registro está selecionado
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ModalStateService {
  // injeta os outros serviços para consultar dados derivados
  private readonly pets = inject(PetsStateService);
  private readonly tutors = inject(TutorsStateService);
  private readonly medicalRecordsApi = inject(MedicalRecordsApiService);

  private readonly _activeModal = signal<ActiveModal>(null);
  private readonly _selectedPetName = signal<string | null>(null);
  private readonly _selectedTutorId = signal<string | null>(null);
  // registros crus, mais recente primeiro (ver MedicalRecordController#getByPatientId) —
  // usados tanto pro historico quanto pra sugerir o peso do proximo atendimento
  private readonly _selectedPetVisitRecords = signal<MedicalRecordResponseDTO[]>([]);
  // id do atendimento aberto na pagina de detalhe (ver openVisitDetail)
  private readonly _selectedVisitId = signal<number | null>(null);

  readonly activeModal = this._activeModal.asReadonly();

  // computed() que dependem de dois signals diferentes:
  // recalcula automaticamente se _selectedPetName ou o array de pets mudar
  readonly selectedPet = computed((): PetRecord | null => {
    const name = this._selectedPetName();
    return name ? this.pets.findByName(name) : null;
  });

  readonly selectedTutor = computed((): TutorRecord | null => {
    const id = this._selectedTutorId();
    return id ? this.tutors.findById(id) : null;
  });

  // histórico real do pet, buscado na API quando a ficha é aberta (ver openPetModal)
  readonly selectedPetTimeline = computed((): TimelineEntry[] =>
    this._selectedPetVisitRecords().map((record) => this.toTimelineEntry(record))
  );

  // peso do atendimento mais recente — usado para sugerir o peso do proximo atendimento
  readonly selectedPetLatestWeight = computed((): number | null => this._selectedPetVisitRecords()[0]?.weightKg ?? null);

  // atendimento aberto na pagina de detalhe (ver care-view + openVisitDetail)
  readonly selectedVisitRecord = computed((): MedicalRecordResponseDTO | null => {
    const id = this._selectedVisitId();
    if (id === null) return null;
    return this._selectedPetVisitRecords().find((record) => record.id === id) ?? null;
  });

  readonly selectedPetEmoji = computed((): string => {
    const pet = this.selectedPet();
    return pet ? this.pets.getPetEmoji(pet.species) : '🐾';
  });

  // ----------------------------------------------------------------
  // Métodos de controle
  // ----------------------------------------------------------------

  openPetModal(petName: string, event?: Event): void {
    event?.stopPropagation();
    void this.selectPet(petName);
    this._activeModal.set('pet');
  }

  // seleciona o pet sem abrir a ficha — usado pelo botao "+ Atendimento"
  // que vai direto pra tela de prontuario. Retorna uma Promise pra quem
  // precisa esperar o historico (e o peso sugerido) antes de continuar.
  async selectPet(petName: string, event?: Event): Promise<void> {
    event?.stopPropagation();
    this._selectedPetName.set(petName);
    this._selectedTutorId.set(null);
    await this.loadSelectedPetVisits();
  }

  openTutorModal(tutorId: string, event?: Event): void {
    event?.stopPropagation();
    this._selectedTutorId.set(tutorId);
    this._selectedPetName.set(null);
    this._activeModal.set('tutor');
  }

  close(): void {
    this._activeModal.set(null);
    this._selectedPetName.set(null);
    this._selectedTutorId.set(null);
    this._selectedPetVisitRecords.set([]);
    this._selectedVisitId.set(null);
  }

  // fecha so o overlay do modal (ficha/perfil), mantendo o pet/tutor selecionado
  // e o historico ja carregado — usado ao navegar pro atendimento, que ainda
  // depende do pet selecionado (ver PetDetailModalComponent.openCareViewFromPet)
  closeOverlay(): void {
    this._activeModal.set(null);
  }

  // recarrega o histórico do pet aberto — chamado depois de salvar um atendimento
  reloadSelectedPetVisits(): void {
    void this.loadSelectedPetVisits();
  }

  // abre a pagina inteira de detalhe de um atendimento do historico
  // fecha o modal (se houver) — a pagina de detalhe fica por cima de tudo,
  // mas mantem _selectedPetName/_selectedPetVisitRecords pro pet/historico continuarem resolvendo
  openVisitDetail(id: number): void {
    this._activeModal.set(null);
    this._selectedVisitId.set(id);
  }

  closeVisitDetail(): void {
    this._selectedVisitId.set(null);
  }

  private async loadSelectedPetVisits(): Promise<void> {
    const pet = this.selectedPet();

    if (!pet?.id) {
      this._selectedPetVisitRecords.set([]);
      return;
    }

    try {
      const records = await firstValueFrom(this.medicalRecordsApi.getByPatient(pet.id));
      this._selectedPetVisitRecords.set(records);
    } catch {
      this._selectedPetVisitRecords.set([]);
    }
  }

  private toTimelineEntry(record: MedicalRecordResponseDTO): TimelineEntry {
    return {
      id: record.id,
      date: this.formatDate(record.recordDate),
      time: this.formatTime(record.recordDate),
      title: record.complaint,
      description: `Tratamento: ${record.treatment}${record.weightKg != null ? ' · Peso: ' + record.weightKg + ' kg' : ''}`
    };
  }

  private formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '--/--/----';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // horario em que o atendimento foi finalizado (recordDate e definido pelo backend ao salvar)
  private formatTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '--:--';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }
}
