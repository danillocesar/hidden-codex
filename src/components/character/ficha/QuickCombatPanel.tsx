import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { FichaInventoryItem, FichaJutsu } from '@/lib/character/mapPrismaToCore';

/** Categorias de arma que atacam com Combate a Distancia (CD). Resto usa CC. */
const RANGED_CATEGORIES = new Set(['ARREMESSO', 'DISPARO', 'EXPLOSIVO', 'AREA']);

/**
 * Card "Combate Rapido" — referencia rapida de armas equipadas + jutsus, com
 * colunas Acerto (CC/CD/LM do personagem), Dano, Chakra e Níveis. Os valores
 * vêm do que está cadastrado (efeito/arma); o cálculo fino entra com a
 * calculadora de combate (Fase 4).
 *
 * Spec: reference HTML linhas 1164-1184 (`.ataques-table`).
 */
export function QuickCombatPanel({
  weapons,
  jutsus,
  cc,
  cd,
  lm,
}: {
  weapons: ReadonlyArray<FichaInventoryItem>;
  jutsus: ReadonlyArray<FichaJutsu>;
  /** Acertos do personagem, reusados conforme o tipo de cada arma/jutsu. */
  cc: number;
  cd: number;
  lm: number;
}) {
  const acertoByType = { cc, cd, lm } as const;
  const hasRows = weapons.length > 0 || jutsus.length > 0;

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
                  />
                );
              })}
              {jutsus.map((j) => (
                <Row
                  key={j.id}
                  name={j.name}
                  powerTag={j.powerName}
                  accuracyTag={j.acerto ? j.acerto.toUpperCase() : undefined}
                  acerto={j.acerto ? String(acertoByType[j.acerto]) : '—'}
                  dano={j.damage ?? '—'}
                  chakra={j.chakraCost ?? '—'}
                  levels={j.levels.length > 0 ? j.levels.join(' · ') : '—'}
                />
              ))}
            </tbody>
          </table>
          <p className="mt-2 font-body text-[10px] italic text-ink-faint">
            Acerto, dano e chakra vêm do efeito/arma cadastrados; o cálculo fino (bônus, ½Esp) entra
            com a calculadora de combate.
          </p>
        </div>
      ) : (
        <p className="mt-3 font-body text-sm text-ink-muted">
          Nenhuma arma equipada ou jutsu cadastrado.
        </p>
      )}
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
}: {
  name: string;
  acerto: string;
  dano: string;
  chakra: string;
  levels: string;
  /** Tag de acerto ao lado do nome (CC/CD/LM). */
  accuracyTag?: string;
  /** Chip do poder antes do nome (jutsus), ex.: "Hyouton". */
  powerTag?: string | null;
}) {
  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <td className="px-2.5 py-2">
        <span className="flex flex-wrap items-center gap-1.5">
          {powerTag ? (
            <Badge tone="accent" variant="soft" size="xs">
              {powerTag}
            </Badge>
          ) : null}
          <span className="font-serif text-[15px] font-medium text-ink">{name}</span>
          {accuracyTag ? (
            <Badge tone="neutral" variant="outline" size="xs">
              {accuracyTag}
            </Badge>
          ) : null}
        </span>
      </td>
      <td className="px-2.5 py-2 text-center font-serif text-lg font-medium text-ice-bright">
        {acerto}
      </td>
      <td className="px-2.5 py-2 text-center font-body text-xs text-ice-bright">{dano}</td>
      <td className="px-2.5 py-2 text-center font-body text-xs text-ink-muted">{chakra}</td>
      <td className="px-2.5 py-2 text-center font-serif text-sm font-medium text-ice-bright">
        {levels}
      </td>
    </tr>
  );
}
