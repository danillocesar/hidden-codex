'use client';

import { useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { cn } from '@/lib/utils/cn';
import type { FichaInventoryItem, FichaJutsu } from '@/lib/character/mapPrismaToCore';
import { EffectInfo } from './EffectInfo';
import { JutsuUseModal } from './JutsuUseModal';
import { WeaponAttackModal } from './WeaponAttackModal';

/** Categorias de arma que atacam com Combate a Distancia (CD). Resto usa CC. */
const RANGED_CATEGORIES = new Set(['ARREMESSO', 'DISPARO', 'EXPLOSIVO', 'AREA']);

type ActiveModal =
  | { type: 'jutsu'; item: FichaJutsu }
  | { type: 'weapon'; item: FichaInventoryItem }
  | null;

/**
 * "Combate Rápido" — referência rápida em duas colunas: Jutsus à esquerda,
 * Armas à direita. Cada entrada é um card com os valores distribuídos (sem
 * tabela). Pro dono, clicar abre a calculadora de dano (modal de jutsu/ataque).
 *
 * Spec: reference HTML linhas 1164-1184 + 05-UI-SPEC.md §6/§7.
 */
export function QuickCombatPanel({
  weapons,
  weaponAccuracyById,
  jutsus,
  cc,
  cd,
  lm,
  characterId,
  isOwner,
  attributes,
  currentChakra,
  abilities,
}: {
  weapons: ReadonlyArray<FichaInventoryItem>;
  /**
   * Acerto pré-calculado por arma (id → valor + rótulo), já com o +1 de
   * Especialista da categoria e a Acuidade própria da arma. Sem entrada, a arma
   * cai no CC/CD genérico da ficha.
   */
  weaponAccuracyById: ReadonlyMap<string, { value: number; label: string }>;
  jutsus: ReadonlyArray<FichaJutsu>;
  /** Acertos do personagem, reusados conforme o tipo de cada arma/jutsu. */
  cc: number;
  cd: number;
  lm: number;
  characterId: string;
  isOwner: boolean;
  attributes: { for: number; des: number; esp: number };
  currentChakra: number;
  /** Aptidões de combate que o personagem possui (gateiam toggles/regras dos modais). */
  abilities: { ataquePoderoso: boolean; ataqueMultiplo: boolean; acuidadeHomebrew: boolean };
}) {
  const acertoByType = { cc, cd, lm } as const;
  const [active, setActive] = useState<ActiveModal>(null);

  return (
    <section className="pt-1">
      <Eyebrow
        tone="accent"
        size="xs"
        as="div"
        className="border-b border-dashed border-border pb-1.5 tracking-[0.35em]"
      >
        Combate Rápido
      </Eyebrow>

      <div className="mt-2 grid gap-x-5 gap-y-3 md:grid-cols-2">
        {/* ── Jutsus ── */}
        <Column label="Jutsus" empty={jutsus.length === 0 ? 'Nenhum jutsu cadastrado.' : null}>
          {jutsus.map((j) => (
            <CombatCard
              key={j.id}
              onClick={isOwner ? () => setActive({ type: 'jutsu', item: j }) : undefined}
              header={
                <span className="flex flex-wrap items-center gap-1.5">
                  {j.powerName ? (
                    <Badge tone="accent" variant="soft" size="xs">
                      {j.powerName}
                    </Badge>
                  ) : null}
                  <span className="font-serif text-[15px] font-medium text-ink">{j.name}</span>
                  {j.effectName ? (
                    <span className="font-body text-[11px] italic text-ink-faint">
                      {j.effectName}
                    </span>
                  ) : null}
                </span>
              }
            >
              <Stat
                label="Acerto"
                value={j.acerto ? String(acertoByType[j.acerto]) : '—'}
                tag={j.acerto ? j.acerto.toUpperCase() : undefined}
              />
              <Stat
                label="Dano"
                value={
                  j.damage === 'ver descrição' ? (
                    <EffectInfo
                      variant="link"
                      title={j.name}
                      subtitle={[j.powerName, j.effectName].filter(Boolean).join(' · ') || null}
                      description={j.effectDescription}
                    />
                  ) : (
                    (j.damage ?? '—')
                  )
                }
              />
              <Stat label="Chakra" value={j.chakraCost ?? '—'} muted />
              <Stat label="Níveis" value={j.levels.length > 0 ? j.levels.join(' · ') : '—'} />
            </CombatCard>
          ))}
        </Column>

        {/* ── Armas ── */}
        <Column label="Armas" empty={weapons.length === 0 ? 'Nenhuma arma.' : null}>
          {weapons.map((w) => {
            const ranged = w.category ? RANGED_CATEGORIES.has(w.category) : false;
            const acc = weaponAccuracyById.get(w.id) ?? {
              value: ranged ? cd : cc,
              label: ranged ? 'CD' : 'CC',
            };
            return (
              <CombatCard
                key={w.id}
                onClick={isOwner ? () => setActive({ type: 'weapon', item: w }) : undefined}
                header={
                  <span className="font-serif text-[15px] font-medium text-ink">{w.name}</span>
                }
              >
                <Stat label="Acerto" value={String(acc.value)} tag={acc.label} />
                <Stat label="Dano" value={w.damage ?? '—'} />
              </CombatCard>
            );
          })}
        </Column>
      </div>

      {isOwner ? (
        <p className="mt-2 font-body text-[10px] italic text-ink-faint">
          Clique num card pra abrir a calculadora de dano.
        </p>
      ) : null}

      {active?.type === 'jutsu' ? (
        <JutsuUseModal
          open
          onClose={() => setActive(null)}
          jutsu={active.item}
          characterId={characterId}
          isOwner={isOwner}
          attributes={attributes}
          accuracy={
            active.item.acerto
              ? {
                  value: acertoByType[active.item.acerto],
                  label: active.item.acerto.toUpperCase(),
                }
              : null
          }
          currentChakra={currentChakra}
          hasAtaquePoderoso={abilities.ataquePoderoso}
        />
      ) : null}

      {active?.type === 'weapon' ? (
        <WeaponAttackModal
          open
          onClose={() => setActive(null)}
          weapon={active.item}
          attributes={{ for: attributes.for, des: attributes.des }}
          accuracy={
            weaponAccuracyById.get(active.item.id) ?? {
              value: active.item.attackKind === 'cd_thrown' ? cd : cc,
              label: active.item.attackKind === 'cd_thrown' ? 'CD' : 'CC',
            }
          }
          hasAtaquePoderoso={abilities.ataquePoderoso}
          hasAtaqueMultiplo={abilities.ataqueMultiplo}
          hasAcuidadeHomebrew={abilities.acuidadeHomebrew}
        />
      ) : null}
    </section>
  );
}

function Column({
  label,
  empty,
  children,
}: {
  label: string;
  empty: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <Eyebrow tone="deep" size="xs" as="div" className="mb-1.5 tracking-[0.3em]">
        {label}
      </Eyebrow>
      {empty ? (
        <p className="font-body text-xs text-ink-muted">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}

function CombatCard({
  header,
  onClick,
  children,
}: {
  header: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded border border-border bg-bg-card-2 p-2.5',
        onClick &&
          'cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-border-strong hover:shadow-hero focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice',
      )}
    >
      {header}
      <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  tag,
  muted,
}: {
  label: string;
  value: ReactNode;
  tag?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-[8px] uppercase tracking-[0.25em] text-ink-muted">
        {label}
      </span>
      <span
        className={cn(
          'flex items-center gap-1 font-serif text-base font-medium leading-tight',
          muted ? 'text-ink-muted' : 'text-ice-bright',
        )}
      >
        {value}
        {tag ? (
          <Badge tone="neutral" variant="outline" size="xs">
            {tag}
          </Badge>
        ) : null}
      </span>
    </div>
  );
}
