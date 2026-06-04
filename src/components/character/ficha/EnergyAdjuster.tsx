'use client';

import { useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { EnergyStat } from './MechanicsPanel';
import { EnergyAdjustModal } from './EnergyAdjustModal';

/**
 * Versão interativa do bloco "Energias" (dono): barras de Vitalidade e Chakra
 * clicáveis que abrem o modal de ajuste (tomar dano/curar, gastar/restaurar).
 * Visitantes veem o `EnergyPanel` read-only.
 */
export function EnergyAdjuster({
  characterId,
  vitality,
  chakra,
}: {
  characterId: string;
  vitality: EnergyStat;
  chakra: EnergyStat;
}) {
  const [open, setOpen] = useState<'vitality' | 'chakra' | null>(null);

  return (
    <div className="flex flex-col">
      <Eyebrow
        tone="accent"
        size="xs"
        as="div"
        className="border-b border-dashed border-border pb-1.5 tracking-[0.35em]"
      >
        Energias
      </Eyebrow>
      <div className="mt-2">
        <EnergyRow
          label="Vit"
          stat={vitality}
          onClick={() => setOpen('vitality')}
        />
        <EnergyRow label="Chk" stat={chakra} onClick={() => setOpen('chakra')} />
      </div>

      {open ? (
        <EnergyAdjustModal
          open
          onClose={() => setOpen(null)}
          characterId={characterId}
          resource={open}
          current={open === 'vitality' ? vitality.current : chakra.current}
          max={open === 'vitality' ? vitality.max : chakra.max}
        />
      ) : null}
    </div>
  );
}

function ratio(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function EnergyRow({
  label,
  stat,
  onClick,
}: {
  label: string;
  stat: EnergyStat;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ajustar"
      className="flex w-full items-center gap-2.5 border-t border-border py-[5px] text-left transition-colors first:border-t-0 hover:bg-bg-card/40"
    >
      <Eyebrow tone="default" size="xs" className="min-w-14 tracking-[0.25em]">
        {label}
      </Eyebrow>
      <div className="h-[3px] flex-1 overflow-hidden bg-bg-card">
        <div
          className="h-full bg-gradient-to-r from-ice-deep to-ice"
          style={{ width: `${ratio(stat.current, stat.max)}%` }}
        />
      </div>
      <span className="min-w-14 text-right font-serif text-base font-medium leading-none text-ice-bright">
        {stat.current}/{stat.max}
      </span>
    </button>
  );
}
