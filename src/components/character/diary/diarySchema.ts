import { BlockNoteSchema } from '@blocknote/core';
import { withMultiColumn } from '@blocknote/xl-multi-column';

/**
 * Schema do editor de diário: blocos padrão do BlockNote + colunas (multi-column).
 *
 * A extensão `@blocknote/xl-multi-column` adiciona os blocos `column`/`columnList`
 * e o comportamento "arrasta um bloco pro lado de outro → vira coluna" (igual ao
 * Notion). É um pacote GPL-3.0 — ver nota de licença no README/CLAUDE.md.
 *
 * Centralizado aqui pra que editor (valor) e workspace (só tipos) compartilhem o
 * mesmo schema sem duplicar a config.
 */
export const diarySchema = withMultiColumn(BlockNoteSchema.create());

export type DiaryBlock = typeof diarySchema.Block;
export type DiaryPartialBlock = typeof diarySchema.PartialBlock;
