import { Injectable, computed, signal } from '@angular/core';
import { TutorRecord } from '../../features/tutors/models/tutors.models';
import { isBirthdayToday } from '../../shared/utils/pet-tutor-formatting';

// -------------------------------------------------------------------
// Serviço de estado dos tutores
// Responsabilidade: lista de tutores (carregada da API real, ver AppComponent) e qual linha está expandida
// -------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class TutorsStateService {
  private readonly _records = signal<TutorRecord[]>([]);
  private readonly _expandedId = signal<string | null>(null);
  private readonly _searchTerm = signal('');

  readonly records = this._records.asReadonly();
  readonly expandedId = this._expandedId.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();

  // tutores que fazem aniversario hoje — so filtra o que ja esta carregado, sem chamada de API nova
  readonly todayBirthdays = computed(() => this._records().filter((tutor) => isBirthdayToday(tutor.birthDate)));

  // ids dos tutores aniversariantes — usado pro emoji na linha da tabela
  readonly todayBirthdayIds = computed(() => new Set(this.todayBirthdays().map((tutor) => tutor.id)));

  // busca por texto (nome, telefone ou cpf) — recalcula quando _records ou _searchTerm mudam
  readonly filtered = computed(() => {
    const term = this._searchTerm().trim().toLowerCase();
    const records = this._records();

    if (!term) return records;

    return records.filter(
      (tutor) =>
        tutor.name.toLowerCase().includes(term) ||
        tutor.phone.toLowerCase().includes(term) ||
        tutor.cpf.toLowerCase().includes(term)
    );
  });

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  // toggle: se clicou no mesmo tutor, fecha; se clicou em outro, abre aquele
  toggleExpanded(tutorId: string): void {
    this._expandedId.update((id) => (id === tutorId ? null : tutorId));
  }

  addRecord(record: TutorRecord): void {
    this._records.update((records) => [record, ...records]);
  }

  // substitui a lista inteira — usado ao carregar os dados reais da API
  replaceAll(records: TutorRecord[]): void {
    this._records.set(records);
  }

  addPetToTutor(tutorId: string, pet: { id: number; name: string; details: string; icon: string }): void {
    this._records.update((records) =>
      records.map((tutor) =>
        tutor.id === tutorId ? { ...tutor, pets: [...tutor.pets, pet] } : tutor
      )
    );
  }

  updateLastVisit(tutorId: string, date: string): void {
    this._records.update((records) =>
      records.map((tutor) => (tutor.id === tutorId ? { ...tutor, lastVisit: date } : tutor))
    );
  }

  // aplica um patch parcial — usado apos editar um tutor
  updateRecord(tutorId: string, patch: Partial<TutorRecord>): void {
    this._records.update((records) =>
      records.map((tutor) => (tutor.id === tutorId ? { ...tutor, ...patch } : tutor))
    );
  }

  // usado apos excluir um tutor — some da lista de vez
  removeRecord(tutorId: string): void {
    this._records.update((records) => records.filter((tutor) => tutor.id !== tutorId));
  }

  // usado apos excluir um pet direto da ficha dele — tira o pet da lista de chips
  // (embutida em cada TutorRecord) sem precisar saber de qual tutor ele e
  removePet(petId: number): void {
    this._records.update((records) =>
      records.map((tutor) => ({ ...tutor, pets: tutor.pets.filter((pet) => pet.id !== petId) }))
    );
  }

  findById(id: string): TutorRecord | null {
    return this._records().find((tutor) => tutor.id === id) ?? null;
  }

  findByName(name: string): TutorRecord | null {
    return this._records().find((tutor) => tutor.name === name) ?? null;
  }
}
