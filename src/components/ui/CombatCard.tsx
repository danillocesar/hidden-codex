import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export interface CombatCardProps {
  name: string;
  portraitUrl?: string | null;
  kind: 'PLAYER' | 'GM_CHARACTER' | 'GENERIC_ENEMY';
  /** HP atual. Null quando é inimigo e o usuário é jogador (HP oculto). */
  currentHp: number | null;
  maxHp: number | null;
  currentChakra?: number | null;
  maxChakra?: number | null;
  initiative: number | null;
  /** GM pode editar iniciativa e HP de inimigos. */
  isGm?: boolean;
  onInitiativeChange?: (value: number | null) => void;
  onHpChange?: (value: number) => void;
  className?: string;
}

/**
 * Card de participante no Tracker de Combate.
 *
 * Jogadores veem HP de aliados mas HP de inimigos fica como "???".
 * GM vê e pode editar tudo. Inputs fazem commit apenas no blur/Enter
 * para evitar chamadas ao servidor a cada tecla.
 */
export function CombatCard({
  name,
  portraitUrl,
  kind,
  currentHp,
  maxHp,
  currentChakra,
  maxChakra,
  initiative,
  isGm = false,
  onInitiativeChange,
  onHpChange,
  className,
}: CombatCardProps) {
  const isEnemy = kind === 'GENERIC_ENEMY' || kind === 'GM_CHARACTER';
  const hpHidden = isEnemy && !isGm;

  return (
    <div
      className={cn(
        'flex w-44 flex-col gap-2 rounded-lg border p-3',
        isEnemy ? 'border-danger/30 bg-bg-card' : 'border-ice/20 bg-bg-card',
        className,
      )}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2',
            isEnemy ? 'border-danger/40' : 'border-ice/40',
          )}
        >
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">{isEnemy ? '⚔️' : '👤'}</span>
          )}
        </div>
        <span
          className={cn(
            'max-w-full truncate text-center text-sm font-medium',
            isEnemy ? 'text-danger/90' : 'text-ink',
          )}
        >
          {name}
        </span>
      </div>

      {/* Barras de HP e Chakra */}
      <div className="flex flex-col gap-1.5">
        {/* HP */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-display uppercase tracking-[0.2em] text-ink-muted">
              ❤️ Vit
            </span>
            {hpHidden ? (
              <span className="text-xs text-ink-muted">???</span>
            ) : isGm && isEnemy && onHpChange ? (
              <CommitOnBlurInput
                value={currentHp ?? 0}
                onCommit={(v) => onHpChange(v)}
                className="w-16 rounded bg-bg-card-2 px-1 py-0 text-right text-xs text-danger focus:outline-none focus:ring-1 focus:ring-danger/50"
              />
            ) : (
              <span className="text-xs text-ink">
                {currentHp ?? 0}
                {maxHp !== null && <span className="text-ink-muted">/{maxHp}</span>}
              </span>
            )}
          </div>
          {!hpHidden && maxHp !== null && maxHp > 0 && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-bg-card-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isEnemy ? 'bg-danger/70' : 'bg-success/70',
                )}
                style={{
                  width: `${Math.max(0, Math.min(100, ((currentHp ?? 0) / maxHp) * 100))}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Chakra (só para personagens com ficha) */}
        {!isEnemy && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-display uppercase tracking-[0.2em] text-ink-muted">
                💧 Chakra
              </span>
              <span className="text-xs text-ink">
                {currentChakra ?? 0}
                {maxChakra !== null && maxChakra !== undefined && (
                  <span className="text-ink-muted">/{maxChakra}</span>
                )}
              </span>
            </div>
            {maxChakra !== null && maxChakra !== undefined && maxChakra > 0 && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-bg-card-2">
                <div
                  className="h-full rounded-full bg-ice/70 transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((currentChakra ?? 0) / maxChakra) * 100))}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Iniciativa */}
      <div className="flex items-center justify-between border-t border-border pt-1.5">
        <span className="text-[10px] font-display uppercase tracking-[0.2em] text-ink-muted">
          Init
        </span>
        {isGm && onInitiativeChange ? (
          <InitiativeInput initiative={initiative} onCommit={onInitiativeChange} />
        ) : (
          <span className="text-sm font-medium text-ice-bright">
            {initiative !== null ? initiative : '–'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Inputs com commit-on-blur ────────────────────────────────────────────────

/**
 * Input numérico que mantém estado local e só chama onCommit no blur/Enter.
 * Evita um round-trip ao servidor a cada tecla digitada.
 */
function CommitOnBlurInput({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (value: number) => void;
  className?: string;
}) {
  const [local, setLocal] = React.useState(String(value));

  // Sincroniza quando o valor externo muda (ex: polling recarregou os dados)
  React.useEffect(() => {
    setLocal(String(value));
  }, [value]);

  function commit() {
    const parsed = Number(local);
    if (!isNaN(parsed) && parsed !== value) onCommit(parsed);
  }

  return (
    <input
      type="number"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
}

function InitiativeInput({
  initiative,
  onCommit,
}: {
  initiative: number | null;
  onCommit: (value: number | null) => void;
}) {
  const [local, setLocal] = React.useState(initiative !== null ? String(initiative) : '');

  React.useEffect(() => {
    setLocal(initiative !== null ? String(initiative) : '');
  }, [initiative]);

  function commit() {
    const trimmed = local.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== initiative) onCommit(isNaN(parsed as number) ? null : parsed);
  }

  return (
    <input
      type="number"
      placeholder="–"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className="w-14 rounded bg-bg-card-2 px-1.5 py-0.5 text-right text-xs text-ink-bright focus:outline-none focus:ring-1 focus:ring-ice/50"
    />
  );
}
