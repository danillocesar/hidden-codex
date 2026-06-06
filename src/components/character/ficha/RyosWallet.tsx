'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useToast } from '@/components/ui/toast';
import { setRyos } from '@/server/actions/characters/ryos';

const MAX_RYOS = 99_999_999;

/**
 * Carteira de Ryos — linha sutil exibida junto ao inventario. Visitantes veem só
 * o saldo; o dono edita direto no campo (digita/apaga/faz a própria conta). O
 * valor é absoluto e imposto pelo servidor (`setRyos`) com piso 0; aqui só
 * clampamos + otimismo. Commit no blur ou Enter, e só persiste se mudou.
 */
export function RyosWallet({
  characterId,
  ryos,
  canEdit,
}: {
  characterId: string;
  ryos: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [value, setValue] = useState(String(ryos));
  useEffect(() => setValue(String(ryos)), [ryos]);

  const commit = () => {
    const parsed = Number.parseInt(value, 10);
    const next = Number.isFinite(parsed) ? Math.max(0, Math.min(MAX_RYOS, parsed)) : 0;
    if (next === ryos) {
      setValue(String(ryos)); // normaliza entrada vazia/inválida sem persistir
      return;
    }
    setValue(String(next));
    startTransition(async () => {
      const res = await setRyos({ characterId, value: next });
      if (!res.ok) {
        toast(`Falha ao atualizar Ryos: ${res.error}`, 'danger');
        setValue(String(ryos));
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-baseline gap-2">
      <Eyebrow tone="deep" size="xs" as="span" className="tracking-[0.3em]">
        Carteira
      </Eyebrow>
      {canEdit ? (
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          aria-label="Saldo de Ryos"
          className="w-24 border-0 border-b border-border bg-transparent text-right font-serif text-lg text-ice-bright transition-colors focus:border-ice focus:outline-none"
        />
      ) : (
        <span className="font-serif text-lg text-ice-bright">{ryos.toLocaleString('pt-BR')}</span>
      )}
      <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ice-deep">Ryos</span>
    </div>
  );
}
