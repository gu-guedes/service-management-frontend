import { Injectable, signal } from '@angular/core';
import { PetRecord } from '../../features/pets/models/pets.models';

// previewUrl e gerado uma unica vez (URL.createObjectURL) e revogado ao remover/resetar —
// gerar isso no template a cada change detection vazaria memoria
export interface PendingImage {
  file: File;
  previewUrl: string;
}

// -------------------------------------------------------------------
// Serviço de estado do atendimento (prontuário)
// Responsabilidade: os campos hoje persistidos na API real
// (ver MedicalRecordsApiService) — peso, queixa e tratamento do atendimento
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class CareStateService {
  readonly isOpen = signal(false);
  readonly completionMessage = signal('');
  readonly weightKg = signal<number | null>(null);
  readonly complaint = signal('');
  readonly anamnesis = signal('');
  readonly treatment = signal('');
  readonly weightSuggestionLabel = signal('');
  // opcional — data (yyyy-MM-dd) pra lembrar de avisar o tutor apos o atendimento
  readonly followUpDate = signal<string | null>(null);
  // exames sendo adicionados nesse atendimento em andamento — so viram ExamRequest de
  // verdade depois de salvar (precisam do id do atendimento, que ainda nao existe aqui)
  readonly pendingExamNames = signal<string[]>([]);
  // fotos ja comprimidas, aguardando o atendimento ser salvo pra saber o medicalRecordId
  readonly pendingImages = signal<PendingImage[]>([]);

  open(): void {
    this.isOpen.set(true);
    this.completionMessage.set('');
    this.weightKg.set(null);
    this.complaint.set('');
    this.anamnesis.set('');
    this.treatment.set('');
    this.weightSuggestionLabel.set('');
    this.followUpDate.set(null);
    this.pendingExamNames.set([]);
    this.clearPendingImages();
  }

  close(): void {
    this.isOpen.set(false);
    this.completionMessage.set('');
    this.weightKg.set(null);
    this.complaint.set('');
    this.anamnesis.set('');
    this.treatment.set('');
    this.weightSuggestionLabel.set('');
    this.followUpDate.set(null);
    this.pendingExamNames.set([]);
    this.clearPendingImages();
  }

  // abre o atendimento pra um pet especifico, ja sugerindo o peso (do ultimo
  // atendimento ou, na falta dele, do cadastro) — usado tanto da lista de pets
  // quanto da ficha do pet, pra nao duplicar essa regra nos dois lugares
  startForPet(pet: PetRecord, latestVisitWeight: number | null): void {
    this.open();

    if (latestVisitWeight != null) {
      this.weightKg.set(latestVisitWeight);
      this.weightSuggestionLabel.set(`Peso sugerido do ultimo atendimento: ${latestVisitWeight} kg`);
    } else if (pet.weightKg != null) {
      this.weightKg.set(pet.weightKg);
      this.weightSuggestionLabel.set(`Peso sugerido do cadastro: ${pet.weightKg} kg`);
    }
  }

  setWeightKg(value: number | null): void {
    this.weightKg.set(value);
  }

  setComplaint(value: string): void {
    this.complaint.set(value);
  }

  setAnamnesis(value: string): void {
    this.anamnesis.set(value);
  }

  setTreatment(value: string): void {
    this.treatment.set(value);
  }

  setFollowUpDate(value: string | null): void {
    this.followUpDate.set(value || null);
  }

  addPendingExamName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.pendingExamNames.update((names) => [...names, trimmed]);
  }

  removePendingExamName(index: number): void {
    this.pendingExamNames.update((names) => names.filter((_, i) => i !== index));
  }

  addPendingImage(file: File): void {
    const previewUrl = URL.createObjectURL(file);
    this.pendingImages.update((images) => [...images, { file, previewUrl }]);
  }

  removePendingImage(index: number): void {
    this.pendingImages.update((images) => {
      const removed = images[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return images.filter((_, i) => i !== index);
    });
  }

  private clearPendingImages(): void {
    this.pendingImages().forEach((img) => URL.revokeObjectURL(img.previewUrl));
    this.pendingImages.set([]);
  }

  complete(): void {
    this.completionMessage.set('Atendimento salvo com sucesso.');
  }

  setCompletionMessage(message: string): void {
    this.completionMessage.set(message);
  }
}
