'use client';

import { useMemo, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';
import { calculateDamageBreakdown, calculateMultiAttackDamage } from '@/domain/rules/damage';
import { withTotal } from '@/lib/character/damageDisplay';
import type { FichaInventoryItem } from '@/lib/character/mapPrismaToCore';
import { DamageCalculatorTable } from './DamageCalculatorTable';

/**
 * Modal de ataque com arma física — só calculadora (armas não custam chakra).
 * Toggles de Ataque Poderoso (+1 dano) e Ataque Múltiplo (divide o dano base).
 *
 * Spec: 05-UI-SPEC.md §7.
 */
export function WeaponAttackModal({
  open,
  onClose,
  weapon,
  attributes,
  accuracy,
  hasAtaquePoderoso,
  hasAtaqueMultiplo,
  hasAcuidadeHomebrew,
}: {
  open: boolean;
  onClose: () => void;
  weapon: FichaInventoryItem;
  attributes: { for: number; des: number };
  accuracy: { value: number; label: string } | null;
  /** Personagem possui a aptidão Ataque Poderoso. */
  hasAtaquePoderoso: boolean;
  /** Personagem possui a aptidão Ataque Múltiplo. */
  hasAtaqueMultiplo: boolean;
  /** Personagem possui a aptidão Acuidade (Homebrew) — Destreza no dano de CC. */
  hasAcuidadeHomebrew: boolean;
}) {
  const [ataquePoderoso, setAtaquePoderoso] = useState(false);
  const [multi, setMulti] = useState<0 | 2 | 3>(0);

  const attackKind = weapon.attackKind ?? 'cc';
  const weaponDamage = weapon.weaponDamageValue ?? 0;
  // Homebrew: Destreza no dano de CC, só em arma de CC que aceita Acuidade.
  const ccUsesDex = attackKind === 'cc' && hasAcuidadeHomebrew && weapon.acceptsAcuidade;
  const halfLabel = attackKind === 'cc' ? (ccUsesDex ? '½ Des' : '½ For') : '½ Des';
  // Ataque Poderoso: manobra corpo-a-corpo (só armas CC) e exige a aptidão.
  const canAtaquePoderoso = attackKind === 'cc' && hasAtaquePoderoso;

  const breakdown = useMemo(() => {
    const base = calculateDamageBreakdown({
      damageType: attackKind,
      attackerForce: attributes.for,
      attackerDexterity: attributes.des,
      attackerEspirito: 0,
      weaponDamage,
      ataquePoderoso: canAtaquePoderoso && ataquePoderoso,
      ccDamageUsesDex: ccUsesDex,
    });
    if (multi === 0) return base;
    return withTotal(base, calculateMultiAttackDamage(base.total, multi));
  }, [attackKind, attributes, weaponDamage, ataquePoderoso, multi, canAtaquePoderoso, ccUsesDex]);

  const subtitle =
    [weapon.damageType, weapon.damage].filter(Boolean).join(' · ') || weapon.subtype || undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={weapon.name}
      description={subtitle}
      size="lg"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <StatBox label={accuracy ? `Precisão (${accuracy.label})` : 'Precisão'}>
            {accuracy ? accuracy.value : '—'}
          </StatBox>
          <StatBox label="Dano da arma">{weapon.damage ?? '—'}</StatBox>
        </div>

        <div>
          <Eyebrow tone="accent" size="xs" as="div" className="mb-2 tracking-[0.3em]">
            Calculadora de Dano
          </Eyebrow>
          <DamageCalculatorTable breakdown={breakdown} halfLabel={halfLabel} />
        </div>

        {canAtaquePoderoso || hasAtaqueMultiplo ? (
          <div className="flex flex-col gap-2">
            {canAtaquePoderoso ? (
              <Checkbox
                checked={ataquePoderoso}
                onChange={setAtaquePoderoso}
                label="Ataque Poderoso (+1 dano)"
              />
            ) : null}
            {hasAtaqueMultiplo ? (
              <div className="flex items-center gap-2">
                <Eyebrow tone="default" size="xs" className="tracking-[0.25em]">
                  Ataque Múltiplo
                </Eyebrow>
                {([0, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMulti(n)}
                    className={cn(
                      'h-8 min-w-12 border px-2 font-display text-[10px] uppercase tracking-[0.2em] transition-colors',
                      multi === n
                        ? 'border-ice bg-ice-deep/40 text-ice-bright'
                        : 'border-border text-ink-muted hover:border-ice-deep',
                    )}
                  >
                    {n === 0 ? 'Não' : `${n}×`}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function StatBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-bg-card px-3 py-2.5">
      <p className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-medium leading-none text-ice-bright">{children}</p>
    </div>
  );
}
