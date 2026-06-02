import { Eyebrow } from '@/components/ui/eyebrow';
import { COMBAT_SKILLS } from '@/domain/catalog/combatSkills';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

export type CombatStat = {
  code: 'cc' | 'cd' | 'esq' | 'lm';
  value: number;
  base: number;
  attributeLabel: string;
};

export type EnergyStat = {
  current: number;
  max: number;
};

export type SocialStats = {
  carisma: number;
  manipulacao: number;
};

/**
 * Blocos de stats da hero, expostos separadamente pra compor o layout da ficha
 * (esquerda: Energias + Habilidades; direita: Combate Rapido + Sociais).
 *
 * Spec: reference HTML linhas 946-1008.
 */
export function EnergyPanel({ vitality, chakra }: { vitality: EnergyStat; chakra: EnergyStat }) {
  return (
    <div className="flex flex-col">
      <BlockLabel>Energias</BlockLabel>
      <div className="mt-2">
        <EnergyRow
          label="Vit"
          value={`${vitality.current}/${vitality.max}`}
          pct={ratio(vitality.current, vitality.max)}
        />
        <EnergyRow
          label="Chk"
          value={`${chakra.current}/${chakra.max}`}
          pct={ratio(chakra.current, chakra.max)}
        />
      </div>
    </div>
  );
}

export function CombatSkillsPanel({ combatStats }: { combatStats: ReadonlyArray<CombatStat> }) {
  return (
    <div className="flex flex-col">
      <BlockLabel>Habilidades de Combate</BlockLabel>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {combatStats.map((stat) => (
          <CombatTile key={stat.code} stat={stat} />
        ))}
      </div>
    </div>
  );
}

export function SocialPanel({ social }: { social: SocialStats }) {
  const socialScale = Math.max(social.carisma, social.manipulacao, 3);
  return (
    <div className="flex flex-col">
      <BlockLabel>Sociais</BlockLabel>
      <div className="mt-2">
        <EnergyRow
          label="Car"
          value={String(social.carisma)}
          pct={ratio(social.carisma, socialScale)}
        />
        <EnergyRow
          label="Man"
          value={String(social.manipulacao)}
          pct={ratio(social.manipulacao, socialScale)}
        />
      </div>
    </div>
  );
}

function ratio(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function BlockLabel({ children }: { children: ReactNode }) {
  return (
    <Eyebrow
      tone="accent"
      size="xs"
      as="div"
      className="border-b border-dashed border-border pb-1.5 tracking-[0.35em]"
    >
      {children}
    </Eyebrow>
  );
}

function EnergyRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-border py-[5px] first:border-t-0">
      <Eyebrow tone="default" size="xs" className="min-w-14 tracking-[0.25em]">
        {label}
      </Eyebrow>
      <div className="h-[3px] flex-1 overflow-hidden bg-bg-card">
        <div
          className="h-full bg-gradient-to-r from-ice-deep to-ice"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-14 text-right font-serif text-base font-medium leading-none text-ice-bright">
        {value}
      </span>
    </div>
  );
}

function CombatTile({ stat }: { stat: CombatStat }) {
  const skill = COMBAT_SKILLS.find((s) => s.code === stat.code);
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border border-border bg-bg-card px-3 py-2.5',
        stat.code === 'cc' && 'border-ice-deep bg-gradient-to-br from-bg-card to-ice-deep/[0.08]',
      )}
    >
      <div className="flex flex-col">
        <Eyebrow tone="default" size="xs" className="tracking-[0.25em]">
          {skill?.abbreviation ?? stat.code.toUpperCase()}
        </Eyebrow>
        <span className="mt-px font-body text-[10px] italic leading-tight text-ink-faint">
          base {stat.base} + {stat.attributeLabel}
        </span>
      </div>
      <span
        className={cn(
          'font-serif text-[26px] font-medium leading-none',
          stat.code === 'cc' ? 'text-[#e0f0fa]' : 'text-ice-bright',
        )}
      >
        {stat.value}
      </span>
    </div>
  );
}
