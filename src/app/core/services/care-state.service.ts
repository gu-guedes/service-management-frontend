import { Injectable, signal } from '@angular/core';
import { PetRecord } from '../../features/pets/models/pets.models';

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
  // opcional — historico clinico relatado pelo tutor
  readonly anamnesis = signal('');
  readonly treatment = signal('');
  readonly weightSuggestionLabel = signal('');
  // opcional — data (yyyy-MM-dd) pra lembrar de avisar o tutor apos o atendimento
  readonly followUpDate = signal<string | null>(null);
  // exames sendo adicionados nesse atendimento em andamento — so viram ExamRequest de
  // verdade depois de salvar (precisam do id do atendimento, que ainda nao existe aqui)
  readonly pendingExamNames = signal<string[]>([]);

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

  complete(): void {
    this.completionMessage.set('Atendimento salvo com sucesso.');
  }

  setCompletionMessage(message: string): void {
    this.completionMessage.set(message);
  }
}
