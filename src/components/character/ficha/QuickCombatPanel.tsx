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
 * Card "Combate Rapido" — referencia rapida de armas equipadas + jutsus, com
 * colunas Acerto (CC/CD/LM do personagem), Dano, Chakra e Níveis. Para o dono,
 * cada linha abre a calculadora de dano (modal de jutsu/ataque). Para visitante,
 * é só leitura.
 *
 * Spec: reference HTML linhas 1164-1184 + 05-UI-SPEC.md §6/§7.
 */
export function QuickCombatPanel({
  weapons,
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
  const hasRows = weapons.length > 0 || jutsus.length > 0;
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

      {hasRows ? (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Arma / Jutsu</Th>
                <Th center>Acerto</Th>
                <Th center>Dano</Th>
                <Th center>Chakra</Th>
                <Th center>Níveis</Th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((w) => {
                const ranged = w.category ? RANGED_CATEGORIES.has(w.category) : false;
                return (
                  <Row
                    key={w.id}
                    name={w.name}
                    accuracyTag={ranged ? 'CD' : 'CC'}
                    acerto={String(ranged ? cd : cc)}
                    dano={[w.damage, w.damageType].filter(Boolean).join(' · ') || '—'}
                    chakra="—"
                    levels="—"
                    onClick={isOwner ? () => setActive({ type: 'weapon', item: w }) : undefined}
                  />
                );
              })}
              {jutsus.map((j) => (
                <Row
                  key={j.id}
                  name={j.name}
                  powerTag={j.powerName}
                  effectTag={j.effectName}
                  accuracyTag={j.acerto ? j.acerto.toUpperCase() : undefined}
                  acerto={j.acerto ? String(acertoByType[j.acerto]) : '—'}
                  dano={
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
                  chakra={j.chakraCost ?? '—'}
                  levels={j.levels.length > 0 ? j.levels.join(' · ') : '—'}
                  onClick={isOwner ? () => setActive({ type: 'jutsu', item: j }) : undefined}
                />
              ))}
            </tbody>
          </table>
          <p className="mt-2 font-body text-[10px] italic text-ink-faint">
            {isOwner
              ? 'Clique numa linha pra abrir a calculadora de dano e usar o jutsu.'
              : 'Acerto, dano e chakra vêm do efeito/arma cadastrados.'}
          </p>
        </div>
      ) : (
        <p className="mt-3 font-body text-sm text-ink-muted">
          Nenhuma arma equipada ou jutsu cadastrado.
        </p>
      )}

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
          accuracy={{
            value: active.item.attackKind === 'cd_thrown' ? cd : cc,
            label: active.item.attackKind === 'cd_thrown' ? 'CD' : 'CC',
          }}
          hasAtaquePoderoso={abilities.ataquePoderoso}
          hasAtaqueMultiplo={abilities.ataqueMultiplo}
          hasAcuidadeHomebrew={abilities.acuidadeHomebrew}
        />
      ) : null}
    </section>
  );
}

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th
      className={`border-b border-border px-2.5 py-1.5 font-display text-[9px] uppercase tracking-[0.3em] text-ink-muted ${
        center ? 'text-center' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function Row({
  name,
  acerto,
  dano,
  chakra,
  levels,
  accuracyTag,
  powerTag,
  effectTag,
  onClick,
}: {
  name: string;
  acerto: string;
  dano: ReactNode;
  chakra: string;
  levels: string;
  /** Tag de acerto (CC/CD/LM), exibida ao lado do valor de acerto. */
  accuracyTag?: string;
  /** Chip do poder antes do nome (jutsus), ex.: "Hyouton". */
  powerTag?: string | null;
  /** Chip do efeito após o nome (jutsus), ex.: "Canhão". */
  effectTag?: string | null;
  /** Abre a calculadora; ausente = linha não-clicável (visitante). */
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        'border-b border-border align-top last:border-b-0',
        onClick && 'cursor-pointer transition-colors hover:bg-bg-card/50',
      )}
      onClick={onClick}
    >
      <td className="px-2.5 py-2">
        <span className="flex flex-wrap items-center gap-1.5">
          {powerTag ? (
            <Badge tone="accent" variant="soft" size="xs">
              {powerTag}
            </Badge>
          ) : null}
          <span className="font-serif text-[15px] font-medium text-ink">{name}</span>
          {effectTag ? (
            <span className="font-body text-[11px] italic text-ink-faint">{effectTag}</span>
          ) : null}
        </span>
      </td>
      <td className="px-2.5 py-2 text-center">
        <span className="inline-flex items-center justify-center gap-1.5">
          <span className="font-serif text-lg font-medium text-ice-bright">{acerto}</span>
          {accuracyTag ? (
            <Badge tone="neutral" variant="outline" size="xs">
              {accuracyTag}
            </Badge>
          ) : null}
        </span>
      </td>
      <td className="px-2.5 py-2 text-center font-body text-xs text-ice-bright">{dano}</td>
      <td className="px-2.5 py-2 text-center font-body text-xs text-ink-muted">{chakra}</td>
      <td className="px-2.5 py-2 text-center font-serif text-sm font-medium text-ice-bright">
        {levels}
      </td>
    </tr>
  );
}
