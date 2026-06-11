'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/ariakit';
import { pt } from '@blocknote/core/locales';
import { multiColumnDropCursor, locales as multiColumnLocales } from '@blocknote/xl-multi-column';

import { diarySchema, type DiaryBlock, type DiaryPartialBlock } from './diarySchema';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/ariakit/style.css';
import './diary-editor.css';

/**
 * Sobe uma imagem inline do editor pro filesystem local e devolve a URL pública.
 * Lança em erro pra que o BlockNote mostre o estado de falha do bloco.
 */
async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/diary-image', { method: 'POST', body: form });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Falha no upload da imagem.');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/**
 * Editor de blocos estilo Notion (BlockNote, variante Ariakit — compatível com
 * React 18). Digita e renderiza ao vivo, menu "/" pra comandos, blocos
 * arrastáveis, imagens inline com upload local, e **colunas**: arraste um bloco
 * pro lado de outro pra colocá-los lado a lado (texto ao lado da imagem), com as
 * larguras ajustáveis arrastando a divisória.
 *
 * NÃO pode renderizar no servidor (depende de ProseMirror/DOM) — o consumidor
 * importa via `next/dynamic` com `ssr: false`.
 *
 * O documento é entregue pro pai via `onChange` (array de blocos); o pai
 * serializa pra JSON e persiste em `DiaryEntry.body`.
 */
export function DiaryEditor({
  initialContent,
  onChange,
}: {
  initialContent: DiaryPartialBlock[] | undefined;
  onChange: (blocks: DiaryBlock[]) => void;
}) {
  const editor = useCreateBlockNote({
    schema: diarySchema,
    dropCursor: multiColumnDropCursor,
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
    uploadFile,
    dictionary: { ...pt, multi_column: multiColumnLocales.pt },
  });

  return (
    <BlockNoteView editor={editor} theme="dark" onChange={() => onChange(editor.document)} />
  );
}
