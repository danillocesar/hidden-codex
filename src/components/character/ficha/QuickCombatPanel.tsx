import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { FichaInventoryItem, FichaJutsu } from '@/lib/character/mapPrismaToCore';

/** Categorias de arma que atacam com Combate a Distancia (CD). Resto usa CC. */
const RANGED_CATEGORIES = new Set(['ARREMESSO', 'DISPARO', 'EXPLOSIVO', 'AREA']);

/**
 * Card "Combate Rapido" — referencia rapida de armas equipadas + jutsus
 * cadastrados. A coluna "Acerto" usa CC ou CD conforme a arma/jutsu (tag ao
 * lado do nome indica qual). Dano = valor cadastrado; calculo completo entra
 * com a calculadora de combate (Fase 4).
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
                <Th>Obs.</Th>
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
                    dano={w.damage ?? '—'}
                    obs={weaponObs(w)}
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
                  dano="—"
                  obs={jutsuObs(j)}
                />
              ))}
            </tbody>
          </table>
          <p className="mt-2 font-body text-[10px] italic text-ink-faint">
            Acerto usa CC/CD/LM do personagem conforme o efeito; dano e mods finos entram com a
            calculadora de combate.
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
  obs,
  accuracyTag,
  powerTag,
}: {
  name: string;
  acerto: string;
  dano: string;
  obs: string;
  /** Tag de acerto ao lado do nome (CC/CD/LM). */
  accuracyTag?: string;
  /** Chip do poder antes do nome (jutsus), ex.: "Hyouton". */
  powerTag?: string | null;
}) {
  return (
    <tr className="border-b border-border last:border-b-0">
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
      <td className="px-2.5 py-2 text-center font-serif text-lg font-medium text-ice-bright">
        {dano}
      </td>
      <td className="px-2.5 py-2 font-body text-[11px] italic text-ink-muted">{obs}</td>
    </tr>
  );
}

function weaponObs(w: FichaInventoryItem): string {
  const parts: string[] = [];
  if (w.damageType) parts.push(w.damageType);
  if (w.range) parts.push(w.range);
  return parts.join(' · ') || '—';
}

function jutsuObs(j: FichaJutsu): string {
  return j.cost !== null ? `${j.cost} chakra` : '—';
}
