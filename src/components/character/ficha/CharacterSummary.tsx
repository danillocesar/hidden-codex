import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { ATTRIBUTES } from '@/domain/catalog/attributes';
import { COMBAT_SKILLS } from '@/domain/catalog/combatSkills';
import type { Attributes } from '@/domain/types';
import { cn } from '@/lib/utils/cn';

/**
 * Resumo completo da ficha — mesma hierarquia da view canonica
 * (`arcana-forge-spec/reference/satsuki-ficha-reference.html`).
 *
 * E o componente que renderiza o Step 6 do wizard (revisao final) e tambem
 * sera reusado na pagina de ficha publica (P0.3). E "burro": recebe dados
 * normalizados e renderiza — adaptacao de WizardState/Prisma fica fora.
 */

export type SummaryAptitude = {
  /** Nome canonico. Inclui parametro entre parenteses se aplicavel. */
  name: string;
  /** Categoria pra tag italic (HABILIDADE/COMBATE/MANOBRA/etc). */
  category: string;
  description: string;
  /** Se foi concedida pela origem (clan/KG/vila) — mostra badge "grátis". */
  isFree: boolean;
};

export type SummaryPericia = {
  name: string;
  /** Pontos investidos pelo jogador. */
  points: number;
  /**
   * Nivel total computado. Pode ser > 0 mesmo sem pontos (atributo base).
   * Quando `level === 0` = "sem treino" (pericia `trained` sem pontos);
   * a UI renderiza com opacity 0.4.
   */
  level: number;
};

export type SummaryPower = {
  name: string;
  translation: string | null;
  level: number;
  /** Niveis concedidos pela origem (Hyouton → +1 Fuuton/Suiton). */
  freeLevel: number;
  description: string;
};

export type CharacterSummaryProps = {
  // Header
  clanName: string | null;
  villageName: string | null;

  // Hero
  name: string;
  /** URL relativa do retrato (`/uploads/portraits/...`). Null → placeholder. */
  portraitUrl: string | null;
  kekkeiGenkaiName: string | null;
  age: number | null;
  gender: string | null;
  campaignLevel: number;
  attributes: Attributes;

  // Stats row
  derived: {
    cc: number;
    cd: number;
    esq: number;
    lm: number;
    vit: number;
    chakra: number;
  };
  // Quote
  quote?: string | null;

  // Listas
  aptitudes: ReadonlyArray<SummaryAptitude>;
  pericias: ReadonlyArray<SummaryPericia>;
  powers: ReadonlyArray<SummaryPower>;
};

export function CharacterSummary({
  clanName,
  villageName,
  name,
  portraitUrl,
  kekkeiGenkaiName,
  age,
  gender,
  campaignLevel,
  attributes,
  derived,
  quote,
  aptitudes,
  pericias,
  powers,
}: CharacterSummaryProps) {
  const { firstName, lastName } = splitName(name);
  const highlightThreshold = Math.ceil(campaignLevel / 2);

  return (
    <div className="overflow-hidden rounded border border-border bg-bg-deep">
      <header className="border-b border-border px-6 py-8 md:px-12">
        <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
          <div>
            <Eyebrow tone="default" className="tracking-[0.4em]">
              Cla
            </Eyebrow>
            <span className="ml-2 font-body text-base text-ice">{clanName ?? '—'}</span>
          </div>
          <Eyebrow tone="strong" size="md" className="tracking-[0.5em]">
            Resumo da Ficha
          </Eyebrow>
          <div className="md:text-right">
            <Eyebrow tone="default" className="tracking-[0.4em]">
              Vila
            </Eyebrow>
            <span className="ml-2 font-body text-base text-ice">{villageName ?? '—'}</span>
          </div>
        </div>
      </header>

      <section className="grid gap-9 px-6 py-10 md:grid-cols-[280px_1fr] md:px-12">
        <HeroImage portraitUrl={portraitUrl} alt={name} />
        <Stack gap="lg">
          <div>
            {kekkeiGenkaiName ? (
              <div className="mb-2 flex items-center gap-3">
                <Eyebrow tone="accent" className="tracking-[0.45em]">
                  Kekkei Genkai · {kekkeiGenkaiName}
                </Eyebrow>
                <span aria-hidden className="h-px max-w-20 flex-1 bg-ice-deep/50" />
              </div>
            ) : null}
            <h1 className="font-serif text-5xl font-normal leading-[0.92] tracking-tight text-ink md:text-6xl">
              {firstName}
              {lastName ? (
                <>
                  {' '}
                  <span className="font-light italic text-ice-bright">{lastName}</span>
                </>
              ) : null}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            <QuickFact label="Idade" value={age != null ? String(age) : '—'} />
            <QuickFact label="NC" value={String(campaignLevel)} />
            {gender ? <QuickFact label="Genero" value={gender} /> : null}
          </div>

          <ul className="grid grid-cols-7 gap-2">
            {ATTRIBUTES.map((a) => {
              const value = attributes[a.code];
              const isHighlight = value >= highlightThreshold && value > 1;
              return (
                <li
                  key={a.code}
                  className={cn(
                    'border bg-bg-card px-2 py-3 text-center transition-colors',
                    isHighlight ? 'border-border-strong' : 'border-border',
                  )}
                  title={a.description}
                >
                  <p className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">
                    {a.abbreviation}
                  </p>
                  <p
                    className={cn(
                      'mt-1 font-serif text-3xl font-medium leading-none',
                      isHighlight ? 'text-[#d4e4f0]' : 'text-ice-bright',
                    )}
                  >
                    {value}
                  </p>
                  <p className="mt-1 font-jp text-[10px] text-ice-deep">{a.kanji}</p>
                </li>
              );
            })}
          </ul>

          <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
            <div>
              <Eyebrow tone="accent" className="mb-2 tracking-[0.35em]">
                Energias
              </Eyebrow>
              <EnergyRow label="Vit" current={derived.vit} max={derived.vit} />
              <EnergyRow label="Chk" current={derived.chakra} max={derived.chakra} />
            </div>
            <div>
              <Eyebrow tone="accent" className="mb-2 tracking-[0.35em]">
                Habilidades de Combate
              </Eyebrow>
              <div className="grid grid-cols-2 gap-1.5">
                {COMBAT_SKILLS.map((cs) => (
                  <SkillCard key={cs.code} name={cs.abbreviation} value={derived[cs.code]} />
                ))}
              </div>
            </div>
          </div>

          {quote ? (
            <blockquote className="relative border-l-2 border-ice px-5 py-3.5 font-serif text-lg italic text-ink">
              <span
                aria-hidden
                className="absolute left-2 top-1 font-serif text-2xl text-ice/40"
              >
                &ldquo;
              </span>
              {quote}
            </blockquote>
          ) : null}
        </Stack>
      </section>

      <BannerDivider kanji="才能 · 技能" label="Aptidões · Perícias" />

      <section className="grid gap-9 px-6 py-10 md:grid-cols-[1.2fr_1fr] md:px-12">
        <AptitudeColumn items={aptitudes} />
        <PericiaColumn items={pericias} />
      </section>

      {powers.length > 0 ? (
        <>
          <BannerDivider kanji="力" label="Poderes" />
          <section className="px-6 py-10 md:px-12">
            <Eyebrow
              tone="accent"
              className="mb-4 border-b border-dashed border-border pb-1.5 tracking-[0.4em]"
            >
              Poderes ({powers.length})
            </Eyebrow>
            <ul className="grid gap-0 md:grid-cols-2 md:gap-x-9">
              {powers.map((p, i) => (
                <PowerLine key={p.name} item={p} isLast={i === powers.length - 1} />
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function AptitudeColumn({ items }: { items: ReadonlyArray<SummaryAptitude> }) {
  return (
    <div>
      <Eyebrow
        tone="accent"
        className="mb-4 border-b border-dashed border-border pb-1.5 tracking-[0.4em]"
      >
        Aptidões ({items.length})
      </Eyebrow>
      {items.length === 0 ? (
        <Text variant="muted" size="xs">
          Nenhuma aptidão.
        </Text>
      ) : (
        <ul>
          {items.map((a, i) => (
            <li
              key={a.name}
              className={cn('py-2', i < items.length - 1 && 'border-b border-border')}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-base font-medium text-ink">{a.name}</span>
                <span className="font-body text-xs italic text-ice-deep">{a.category}</span>
                {a.isFree ? (
                  <Badge tone="success" size="xs">
                    grátis
                  </Badge>
                ) : null}
              </div>
              <Text variant="muted" size="xs" className="mt-0.5 leading-snug">
                {a.description}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PericiaColumn({ items }: { items: ReadonlyArray<SummaryPericia> }) {
  return (
    <div>
      <Eyebrow
        tone="accent"
        className="mb-4 border-b border-dashed border-border pb-1.5 tracking-[0.4em]"
      >
        Perícias ({items.length})
      </Eyebrow>
      <ul className="grid grid-cols-2 gap-1.5">
        {items.map((p) => (
          <PericiaItem key={p.name} {...p} />
        ))}
      </ul>
    </div>
  );
}

function PericiaItem({ name, points, level }: SummaryPericia) {
  const untrained = level === 0;
  const invested = points > 0;
  return (
    <li
      className={cn(
        'flex items-center justify-between bg-bg-card py-2 pr-3',
        untrained
          ? 'border-l-2 border-l-ink-faint pl-3 opacity-40'
          : invested
            ? 'border-l-4 border-l-ice-bright pl-[10px]'
            : 'border-l-2 border-l-ice-deep pl-3',
      )}
    >
      <span className="text-[13px] text-ink">{name}</span>
      <span
        className={cn(
          'font-serif text-lg font-medium leading-none',
          untrained ? 'text-ink-faint' : 'text-ice-bright',
        )}
      >
        {level}
      </span>
    </li>
  );
}

function PowerLine({ item, isLast }: { item: SummaryPower; isLast: boolean }) {
  return (
    <li className={cn('py-3', !isLast && 'border-b border-border')}>
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-lg font-medium text-ink">{item.name}</span>
        {item.translation ? (
          <span className="font-body text-xs italic text-ice-deep">{item.translation}</span>
        ) : null}
        {item.freeLevel > 0 ? (
          <Badge tone="success" size="xs">
            +{item.freeLevel} grátis
          </Badge>
        ) : null}
        <span className="ml-auto font-serif text-2xl font-medium leading-none text-ice-bright">
          {item.level}
        </span>
      </div>
      <Text variant="muted" size="xs" className="mt-1 leading-snug">
        {item.description}
      </Text>
    </li>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Eyebrow tone="default" size="xs" className="tracking-[0.3em]">
        {label}
      </Eyebrow>
      <p className="mt-0.5 font-serif text-xl font-medium leading-none text-ice-bright">
        {value}
      </p>
    </div>
  );
}

function EnergyRow({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2.5 border-t border-border py-1.5 first:border-t-0">
      <Eyebrow tone="default" size="xs" className="w-9 tracking-[0.25em]">
        {label}
      </Eyebrow>
      <div className="relative h-[3px] flex-1 overflow-hidden bg-bg-card">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-ice-deep to-ice"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-serif text-base font-medium text-ice-bright">
        {current === max ? current : `${current}/${max}`}
      </span>
    </div>
  );
}

function SkillCard({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center justify-between border border-border bg-bg-card px-3 py-2">
      <span className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">
        {name}
      </span>
      <span className="font-serif text-2xl font-medium leading-none text-ice-bright">
        {value}
      </span>
    </div>
  );
}

function HeroImage({ portraitUrl, alt }: { portraitUrl: string | null; alt: string }) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-bg-card via-bg-paper to-bg-deep shadow-hero">
      {portraitUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portraitUrl}
          alt={`Retrato de ${alt}`}
          className="h-full w-full object-cover object-[center_20%]"
          style={{ filter: 'contrast(1.05) brightness(0.92) saturate(0.85)' }}
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center font-jp text-[110px] font-bold text-ice-deep/30"
        >
          忍者
        </span>
      )}
      <div
        aria-hidden
        className="absolute right-4 top-4 grid h-14 w-14 -rotate-6 place-items-center border-2 border-seal bg-seal/30 backdrop-blur-sm"
      >
        <span className="font-jp text-xl font-bold text-ink">影</span>
      </div>
    </div>
  );
}

function BannerDivider({ kanji, label }: { kanji: string; label: string }) {
  return (
    <div className="relative h-[140px] overflow-hidden border-y border-border bg-bg-paper">
      <div className="grid h-full place-items-center text-center">
        <div>
          <p className="font-jp text-4xl font-bold text-ice-deep/40">{kanji}</p>
          <Eyebrow tone="accent" size="md" className="mt-2 tracking-[0.5em]">
            {label}
          </Eyebrow>
        </div>
      </div>
    </div>
  );
}

function splitName(full: string): { firstName: string; lastName: string | null } {
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}
