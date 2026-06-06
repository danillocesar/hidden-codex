import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { loadCharacterById } from '@/server/queries/characterById';
import { loadEquipmentCatalog } from '@/server/queries/equipmentCatalog';
import { getActiveShareLink } from '@/server/queries/shareLinks';
import { FichaView } from '@/components/character/ficha/FichaView';

/**
 * Ficha — `/characters/[id]`.
 *
 * Server Component. Faz auth + ownership check + fetch + mapeia pra view model
 * e delega o render pro `FichaView` (compartilhado com a rota publica
 * `/share/[token]`). Tudo que e edicao e gateado por `display.isOwner`.
 *
 * Personagens publicos (`isPublicOnProfile`) sao acessiveis sem ser dono.
 * 404 quando nao encontrado OU sem permissao (nao vaza existencia).
 */
export default async function CharacterFichaPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  const result = await loadCharacterById(params.id, session?.user.id ?? null);

  if (!result.ok) notFound();

  const { display } = result.viewModel;

  // Catálogo de equipamento + estado do link de compartilhamento só pro dono.
  const [equipmentCatalog, activeShareLink] = display.isOwner
    ? await Promise.all([loadEquipmentCatalog(), getActiveShareLink(display.id)])
    : [[], null];

  return (
    <FichaView
      viewModel={result.viewModel}
      equipmentCatalog={equipmentCatalog}
      activeShareLink={activeShareLink}
    />
  );
}
