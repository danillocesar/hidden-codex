'use client';

import { useMemo, useState, useTransition } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { softDeleteCharacter } from '@/server/actions/characters/delete';
import type { DashboardCharacter } from '@/server/queries/userCharacters';
import { CharacterCard } from './CharacterCard';

/**
 * Grade de personagens do dashboard com busca por nome + filtros (NC e origem)
 * client-side, e soft delete com modal de confirmacao. A lista vem por prop do
 * server component; apos deletar, `revalidatePath` re-renderiza com a prop nova.
 */
export function DashboardCharacters({
  characters,
}: {
  characters: ReadonlyArray<DashboardCharacter>;
}) {
  const [query, setQuery] = useState('');
  const [nc, setNc] = useState('all');
  const [origin, setOrigin] = useState('all');
  const [pending, setPending] = useState<DashboardCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();

  const ncOptions = useMemo(
    () => Array.from(new Set(characters.map((c) => c.campaignLevel))).sort((a, b) => a - b),
    [characters],
  );

  const originOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of characters) {
      if (c.clanName) set.add(c.clanName);
      if (c.villageName) set.add(c.villageName);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [characters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return characters.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (nc !== 'all' && c.campaignLevel !== Number(nc)) return false;
      if (origin !== 'all' && c.clanName !== origin && c.villageName !== origin) return false;
      return true;
    });
  }, [characters, query, nc, origin]);

  const confirmDelete = () => {
    if (!pending) return;
    setError(null);
    startTransition(async () => {
      const result = await softDeleteCharacter(pending.id);
      if (result.ok) {
        setPending(null);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Buscar por nome…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
          aria-label="Buscar personagem por nome"
        />
        <Select
          value={nc}
          onChange={(e) => setNc(e.target.value)}
          className="sm:max-w-[160px]"
          aria-label="Filtrar por NC"
        >
          <option value="all">Todos os NCs</option>
          {ncOptions.map((value) => (
            <option key={value} value={String(value)}>
              NC {value}
            </option>
          ))}
        </Select>
        <Select
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="sm:max-w-[200px]"
          aria-label="Filtrar por clã ou vila"
        >
          <option value="all">Todas as origens</option>
          {originOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((character) => (
            <li key={character.id}>
              <CharacterCard character={character} onRequestDelete={setPending} />
            </li>
          ))}
        </ul>
      ) : (
        <Text variant="muted" className="mt-10 block text-center">
          Nenhum personagem corresponde aos filtros.
        </Text>
      )}

      <Modal
        open={pending !== null}
        onClose={() => {
          if (!isDeleting) setPending(null);
        }}
        title="Apagar personagem?"
        description="O personagem some da lista. Esta ação não pode ser desfeita pela interface."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="seal" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Apagando…' : 'Apagar'}
            </Button>
          </>
        }
      >
        <Text>
          Tem certeza que deseja apagar{' '}
          <span className="font-serif text-ice-bright">{pending?.name}</span>?
        </Text>
        {error ? (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        ) : null}
      </Modal>
    </div>
  );
}
