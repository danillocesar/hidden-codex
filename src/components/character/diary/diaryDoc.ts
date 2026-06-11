import type { DiaryPartialBlock } from './diarySchema';

/**
 * JSON do body BlockNote -> blocos pro editor. Vazio/inválido => `undefined`
 * (editor em branco). Compartilhado entre editor, leitor e anotacoes.
 */
export function parseDiaryDoc(body: string): DiaryPartialBlock[] | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as DiaryPartialBlock[]) : undefined;
  } catch {
    return undefined;
  }
}
