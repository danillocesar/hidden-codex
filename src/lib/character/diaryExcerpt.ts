/**
 * Extrai um trecho de texto puro do documento de uma entrada de diario.
 *
 * O `body` guarda o documento do editor (BlockNote) como JSON — um array de
 * blocos, cada um com `content` (nos inline) e possivelmente `children`. Para a
 * lista de entradas precisamos de um preview legivel sem instanciar o editor.
 * Esta funcao caminha pelos nos de texto e devolve as primeiras `maxLen` chars.
 *
 * Tolerante a lixo: se `body` nao for JSON valido, trata como texto cru (cobre
 * dados legados ou entradas salvas como markdown antes do editor de blocos).
 */
type InlineNode = { text?: unknown; content?: unknown };
type BlockNode = { content?: unknown; children?: unknown };

export function diaryExcerpt(body: string, maxLen = 220): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return body.replace(/\s+/g, ' ').trim().slice(0, maxLen);
  }
  if (!Array.isArray(parsed)) return '';

  const parts: string[] = [];

  const walkInline = (nodes: unknown): void => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      if (n && typeof n === 'object') {
        const node = n as InlineNode;
        if (typeof node.text === 'string') parts.push(node.text);
        if (Array.isArray(node.content)) walkInline(node.content);
      }
    }
  };

  const walkBlocks = (blocks: unknown[]): void => {
    for (const b of blocks) {
      if (parts.join(' ').length > maxLen) return;
      if (b && typeof b === 'object') {
        const block = b as BlockNode;
        if (Array.isArray(block.content)) walkInline(block.content);
        if (Array.isArray(block.children)) walkBlocks(block.children);
      }
    }
  };

  walkBlocks(parsed);
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}
