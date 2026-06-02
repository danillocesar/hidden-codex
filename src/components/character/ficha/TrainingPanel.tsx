import { Eyebrow } from '@/components/ui/eyebrow';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils/cn';

export type FichaPericia = {
  code: string;
  name: string;
  points: number;
  /** Nivel calculado (⌈atr/2⌉ + pontos). `null` para pericias sociais (calc pendente). */
  level: number | null;
};

export type FichaAptitude = {
  code: string;
  name: string;
  category: string;
  parameter?: string;
  isFree: boolean;
};

export type FichaPower = {
  code: string;
  name: string;
  translation: string | null;
  category: string;
  level: number;
  freeLevel: number;
  /** Efeitos aprendidos deste poder (sub-tecnicas). */
  effects: ReadonlyArray<string>;
};

export function TrainingPanel({
  pericias,
  periciasCountLabel,
  aptitudes,
  powers,
}: {
  pericias: ReadonlyArray<FichaPericia>;
  /** Ex.: "16/16" (pontos gastos/orcamento). Mostrado ao lado do titulo. */
  periciasCountLabel?: string;
  aptitudes: ReadonlyArray<FichaAptitude>;
  powers: ReadonlyArray<FichaPower>;
}) {
  return (
    <section className="grid gap-8 px-6 py-4 md:px-12 lg:grid-cols-[1fr_1fr]">
      <div className="grid gap-8">
        <div>
          <PanelHeader label="Aptidões" count={aptitudes.length} />
          {aptitudes.length > 0 ? (
            <ul className="mt-3 divide-y divide-border">
              {aptitudes.map((item) => (
                <AptitudeLine key={`${item.code}:${item.parameter ?? ''}`} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4 py-8"
              title="Sem aptidoes"
              description="Aptidoes escolhidas no wizard ou editor aparecem aqui."
            />
          )}
        </div>

        <div>
          <PanelHeader label="Poderes" count={powers.length} />
          {powers.length > 0 ? (
            <ul className="mt-3 divide-y divide-border">
              {powers.map((item) => (
                <PowerLine key={item.code} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4 py-8"
              title="Sem poderes"
              description="Poderes comprados ou concedidos aparecem aqui."
            />
          )}
        </div>
      </div>

      <div>
        <PanelHeader label="Perícias" detail={periciasCountLabel ?? String(pericias.length)} />
        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {pericias.map((item) => (
            <PericiaLine key={item.code} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function PanelHeader({ label, count, detail }: { label: string; count?: number; detail?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-2">
      <Eyebrow tone="accent" size="xs" className="tracking-[0.35em]">
        {label}
      </Eyebrow>
      <span className="font-body text-[11px] italic text-ink-muted">{detail ?? count}</span>
    </div>
  );
}

/**
 * Linha de pericia — nome + valor, igual a referencia (`.pericia`): bg-card,
 * borda-esquerda accent. Pericias sem pontos (so base do atributo) ficam
 * esmaecidas (`zero`).
 */
function PericiaLine({ item }: { item: FichaPericia }) {
  const isZero = item.points === 0;
  return (
    <li
      className={cn(
        'flex items-center justify-between gap-3 border-l-2 bg-bg-card px-3 py-2',
        isZero ? 'border-l-ink-faint opacity-40' : 'border-l-ice-deep',
      )}
    >
      <span className="font-body text-[13px] leading-tight text-ink">{item.name}</span>
      <span
        className={cn(
          'font-serif text-lg font-medium leading-none',
          isZero ? 'text-ink-faint' : 'text-ice-bright',
        )}
      >
        {item.level !== null ? item.level : '—'}
      </span>
    </li>
  );
}

function AptitudeLine({ item }: { item: FichaAptitude }) {
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-base font-medium leading-tight text-ink">
          {item.name}
          {item.parameter ? (
            <span className="font-body text-sm italic text-ice-deep">
              {' '}
              ({humanizeParameter(item.parameter)})
            </span>
          ) : null}
        </span>
        <span className="font-body text-[10px] uppercase tracking-[0.24em] text-ice-deep">
          {item.category}
        </span>
        {item.isFree ? (
          <span className="font-body text-[10px] uppercase tracking-[0.24em] text-success">
            gratis
          </span>
        ) : null}
      </div>
    </li>
  );
}

function PowerLine({ item }: { item: FichaPower }) {
  return (
    <li className="py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-base font-medium leading-tight text-ink">
              {item.name}
            </span>
            <span className="font-body text-[10px] uppercase tracking-[0.24em] text-ice-deep">
              {item.category}
            </span>
            {item.freeLevel > 0 ? (
              <span className="font-body text-[10px] uppercase tracking-[0.24em] text-success">
                +{item.freeLevel} gratis
              </span>
            ) : null}
          </div>
          {item.translation ? (
            <p className="mt-0.5 font-body text-xs italic text-ice-deep">{item.translation}</p>
          ) : null}
          {item.effects.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.effects.map((effect) => (
                <li
                  key={effect}
                  className="border-l border-ice-deep/60 bg-bg-card/60 px-2 py-0.5 font-body text-[11px] text-ink-muted"
                >
                  {effect}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <span className="font-serif text-3xl font-medium leading-none text-ice-bright">
          {item.level}
        </span>
      </div>
    </li>
  );
}

function humanizeParameter(parameter: string): string {
  return parameter.replace(/_/g, ' ');
}
