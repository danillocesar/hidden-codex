export const SECTION_COVER_KEYS = ['fundamentos', 'talentos', 'tecnicas', 'arquivo'] as const;

export type SectionCoverKey = (typeof SECTION_COVER_KEYS)[number];

export type SectionCovers = Readonly<Record<SectionCoverKey, string>>;

export type SectionCoverImage = {
  id: string;
  url: string;
  label: string | null;
};

export const DEFAULT_SECTION_COVERS: SectionCovers = {
  fundamentos: '/assets/section-covers/fundamentos.svg',
  talentos: '/assets/section-covers/talentos.svg',
  tecnicas: '/assets/section-covers/tecnicas.svg',
  arquivo: '/assets/section-covers/arquivo.svg',
};

export function isSectionCoverKey(value: string): value is SectionCoverKey {
  return (SECTION_COVER_KEYS as readonly string[]).includes(value);
}

export function isAllowedSectionCoverUrl(value: string): boolean {
  return value.startsWith('/assets/section-covers/') || value.startsWith('/uploads/characters/');
}

export function resolveSectionCovers(uiState: unknown): SectionCovers {
  const sectionCovers = readSectionCoverRecord(uiState);

  return {
    fundamentos: pickCover(sectionCovers, 'fundamentos'),
    talentos: pickCover(sectionCovers, 'talentos'),
    tecnicas: pickCover(sectionCovers, 'tecnicas'),
    arquivo: pickCover(sectionCovers, 'arquivo'),
  };
}

export function mergeSectionCoverUiState(
  uiState: unknown,
  key: SectionCoverKey,
  url: string | null,
): Record<string, unknown> {
  const base = isRecord(uiState) ? { ...uiState } : {};
  const currentCovers = isRecord(base.sectionCovers) ? base.sectionCovers : {};
  const nextCovers: Record<string, unknown> = { ...currentCovers };

  if (url) {
    nextCovers[key] = url;
  } else {
    delete nextCovers[key];
  }

  base.sectionCovers = nextCovers;
  return base;
}

// ── Posição da imagem de capa (object-position) ─────────────────────────────

export type SectionCoverPositions = Readonly<Record<SectionCoverKey, string>>;

export const DEFAULT_COVER_POSITION = '50% 50%';

/** Valida "X% Y%" com X/Y inteiros 0–100. */
export function isValidCoverPosition(value: string): boolean {
  const match = /^(\d{1,3})% (\d{1,3})%$/.exec(value);
  if (!match) return false;
  const x = Number(match[1]);
  const y = Number(match[2]);
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

export function resolveSectionCoverPositions(uiState: unknown): SectionCoverPositions {
  const positions = readRecordField(uiState, 'sectionCoverPositions');
  return {
    fundamentos: pickPosition(positions, 'fundamentos'),
    talentos: pickPosition(positions, 'talentos'),
    tecnicas: pickPosition(positions, 'tecnicas'),
    arquivo: pickPosition(positions, 'arquivo'),
  };
}

export function mergeSectionCoverPositionUiState(
  uiState: unknown,
  key: SectionCoverKey,
  position: string,
): Record<string, unknown> {
  const base = isRecord(uiState) ? { ...uiState } : {};
  const current = isRecord(base.sectionCoverPositions) ? base.sectionCoverPositions : {};
  base.sectionCoverPositions = { ...current, [key]: position };
  return base;
}

function pickPosition(record: Record<string, unknown>, key: SectionCoverKey): string {
  const value = record[key];
  return typeof value === 'string' && isValidCoverPosition(value) ? value : DEFAULT_COVER_POSITION;
}

function readRecordField(uiState: unknown, field: string): Record<string, unknown> {
  if (!isRecord(uiState) || !isRecord(uiState[field])) return {};
  return uiState[field] as Record<string, unknown>;
}

function pickCover(sectionCovers: Record<string, unknown>, key: SectionCoverKey): string {
  const value = sectionCovers[key];
  return typeof value === 'string' && isAllowedSectionCoverUrl(value)
    ? value
    : DEFAULT_SECTION_COVERS[key];
}

function readSectionCoverRecord(uiState: unknown): Record<string, unknown> {
  if (!isRecord(uiState) || !isRecord(uiState.sectionCovers)) return {};
  return uiState.sectionCovers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
