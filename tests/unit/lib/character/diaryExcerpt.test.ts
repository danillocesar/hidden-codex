import { describe, it, expect } from 'vitest';
import { diaryExcerpt } from '@/lib/character/diaryExcerpt';

describe('diaryExcerpt', () => {
  it('extrai texto de blocos com content inline', () => {
    const doc = JSON.stringify([
      { type: 'heading', content: [{ type: 'text', text: 'Missão em Kiri' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Chegamos ao anoitecer.' }] },
    ]);
    expect(diaryExcerpt(doc)).toBe('Missão em Kiri Chegamos ao anoitecer.');
  });

  it('caminha por children aninhados', () => {
    const doc = JSON.stringify([
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'pai' }],
        children: [{ type: 'paragraph', content: [{ type: 'text', text: 'filho' }] }],
      },
    ]);
    expect(diaryExcerpt(doc)).toBe('pai filho');
  });

  it('ignora blocos sem texto (ex.: imagem) e nao quebra', () => {
    const doc = JSON.stringify([
      { type: 'image', props: { url: '/uploads/diary/x.webp' } },
      { type: 'paragraph', content: [{ type: 'text', text: 'legenda' }] },
    ]);
    expect(diaryExcerpt(doc)).toBe('legenda');
  });

  it('respeita o maxLen', () => {
    const doc = JSON.stringify([
      { type: 'paragraph', content: [{ type: 'text', text: 'a'.repeat(500) }] },
    ]);
    expect(diaryExcerpt(doc, 50)).toHaveLength(50);
  });

  it('trata JSON invalido como texto cru', () => {
    expect(diaryExcerpt('texto   legado\nsem json')).toBe('texto legado sem json');
  });

  it('retorna vazio quando o JSON nao e um array', () => {
    expect(diaryExcerpt('{"foo":"bar"}')).toBe('');
  });
});
