// Funcoes puras de formatacao compartilhadas entre o shell (carga inicial da API),
// os modais de ficha/perfil e a pagina de cadastro — evitam duplicar a mesma
// logica de mapeamento em varios arquivos.

export function toUiSpeciesFromApi(species: string): 'dog' | 'cat' | 'other' {
  const normalized = (species || '').toLowerCase();
  if (['dog', 'cao', 'cachorro'].includes(normalized)) return 'dog';
  if (['cat', 'gato'].includes(normalized)) return 'cat';
  return 'other';
}

export function toSpeciesLabel(species: 'dog' | 'cat' | 'other'): string {
  if (species === 'dog') return 'Cao';
  if (species === 'cat') return 'Gato';
  return 'Outro';
}

export function toSexLabel(sex: string | undefined): string {
  const normalized = (sex || '').toLowerCase();
  if (normalized === 'macho' || normalized === 'm') return 'Macho';
  if (normalized === 'femea' || normalized === 'f') return 'Femea';
  return 'Sexo nao informado';
}

// 'macho'/'femea' (API) -> 'M'/'F' (select do form de edicao)
export function toFormSex(sex: string | undefined): 'M' | 'F' {
  return (sex || '').toLowerCase() === 'femea' ? 'F' : 'M';
}

// 'M'/'F' (select do form) -> 'macho'/'femea' (constraint patients_sex_check)
export function toApiSexFromCode(sex: 'M' | 'F'): string {
  return sex === 'F' ? 'femea' : 'macho';
}

// idade aproximada informada pelo tutor, sem calculo — nem todo tutor sabe a data exata de nascimento
export function toAgeLabel(ageYears: number | null | undefined): string {
  if (ageYears === null || ageYears === undefined) return 'Idade nao informada';
  if (ageYears === 0) return 'Menos de 1 ano';
  return ageYears === 1 ? '1 ano' : `${ageYears} anos`;
}

// data-only (yyyy-MM-dd, sem hora) — usa split de string em vez de `new Date(iso)` porque
// esse último interpreta como UTC-meia-noite, e no fuso do Brasil (UTC-3) isso volta um dia
export function toBrDateFromDateOnly(dateOnlyIso: string | null | undefined): string {
  if (!dateOnlyIso) return '--/--/----';

  const [year, month, day] = dateOnlyIso.split('-');
  if (!year || !month || !day) return '--/--/----';

  return `${day}/${month}/${year}`;
}

// mesmo motivo do helper acima: compara mes/dia via string, sem passar por Date/fuso
export function isBirthdayToday(dateOnlyIso: string | null | undefined): boolean {
  if (!dateOnlyIso) return false;

  const monthDay = dateOnlyIso.slice(5, 10);
  const now = new Date();
  const todayMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return monthDay === todayMonthDay;
}

export function toBrDateFromIso(iso: string | null | undefined): string {
  if (!iso) return '--/--/----';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--/--/----';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function toInitials(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function toAddressLabel(address: {
  street?: string | null;
  streetNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  referencePoint?: string | null;
}): string {
  const street = address.street || '';
  const number = address.streetNumber || '';
  const neighborhood = address.neighborhood || '';
  const city = address.city || '';

  const main = [`${street}${number ? ', ' + number : ''}`, neighborhood, city].filter(Boolean).join(' - ');
  const reference = address.referencePoint ? ` (Ref.: ${address.referencePoint})` : '';

  return (main || '--') + reference;
}
