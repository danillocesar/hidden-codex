'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/ariakit';
import { pt } from '@blocknote/core/locales';
import { locales as multiColumnLocales } from '@blocknote/xl-multi-column';

import { diarySchema } from './diarySchema';
import { parseDiaryDoc } from './diaryDoc';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/ariakit/style.css';
import './diary-editor.css';

/**
 * Renderiza o corpo de uma entrada de diario em modo LEITURA (BlockNote com
 * `editable={false}`) — mesmo schema/colunas do editor, garantindo fidelidade
 * visual (texto rico, imagens, layout em colunas) sem nenhum controle de edicao.
 *
 * Depende do DOM (ProseMirror) — o consumidor importa via `next/dynamic` com
 * `ssr: false`.
 */
export function DiaryEntryBody({ body }: { body: string }) {
  const editor = useCreateBlockNote({
    schema: diarySchema,
    initialContent: parseDiaryDoc(body),
    dictionary: { ...pt, multi_column: multiColumnLocales.pt },
  });

  return <BlockNoteView editor={editor} editable={false} theme="dark" />;
}
