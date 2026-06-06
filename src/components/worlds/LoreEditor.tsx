'use client';

import * as React from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/ariakit';
import { withMultiColumn } from '@blocknote/xl-multi-column';
import { BlockNoteSchema } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/ariakit/style.css';

const schema = BlockNoteSchema.create();
const schemaWithColumns = withMultiColumn(schema);

interface LoreEditorProps {
  initialContent?: string;
  onChange: (blocks: unknown[]) => void;
}

/**
 * Editor BlockNote para a Lore do Mundo.
 * Usa o mesmo schema do DiaryEditor (BlockNote + multi-coluna).
 * Lazy-loaded via next/dynamic com ssr: false.
 */
export function LoreEditor({ initialContent, onChange }: LoreEditorProps) {
  const parsedContent = React.useMemo(() => {
    if (!initialContent) return undefined;
    try {
      const parsed = JSON.parse(initialContent);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [initialContent]);

  const editor = useCreateBlockNote({
    schema: schemaWithColumns,
    initialContent: parsedContent,
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="dark"
      onChange={() => onChange(editor.document)}
    />
  );
}
