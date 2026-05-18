'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Combobox "creatable" — input com autocomplete sobre uma lista canonica e
 * fallback pra criar valor custom (digite + Enter, ou selecione "Criar").
 *
 * Generico: serve pra vila, cla, e qualquer outro campo do sistema que
 * aceite valor de catalogo OU homebrew.
 *
 * Padrao de uso:
 *
 *   const value: ComboboxValue = clanCode
 *     ? { type: 'canonical', value: clanCode }
 *     : customClanName
 *       ? { type: 'custom', value: customClanName }
 *       : null;
 *
 *   <Combobox options={...} value={value} onChange={...} />
 *
 * Acessivel via teclado (setas pra navegar, Enter pra confirmar, Esc fecha).
 */

export type ComboboxOption = { value: string; label: string };

export type ComboboxValue =
  | { type: 'canonical'; value: string }
  | { type: 'custom'; value: string }
  | null;

export function Combobox({
  options,
  value,
  onChange,
  onBlur,
  placeholder,
  createHint = 'Criar',
  emptyHint = 'Nenhuma opcao encontrada',
  disabled,
  id,
  allowCustom = true,
}: {
  options: ReadonlyArray<ComboboxOption>;
  value: ComboboxValue;
  onChange: (next: ComboboxValue) => void;
  /** Disparado quando o input perde o foco (apos resolver a query). */
  onBlur?: () => void;
  placeholder?: string;
  /** Prefixo do item "criar custom" no dropdown. */
  createHint?: string;
  /** Texto mostrado quando nao ha opcao filtrada (e nao permite custom). */
  emptyHint?: string;
  disabled?: boolean;
  id?: string;
  /** Quando `false`, comporta-se como select puro — sem fallback custom. */
  allowCustom?: boolean;
}) {
  // `query` e o texto cru do input. Sincronizado com `value` quando este muda
  // externamente OU quando o usuario seleciona algo.
  const labelFor = useCallback(
    (v: ComboboxValue): string => {
      if (!v) return '';
      if (v.type === 'custom') return v.value;
      const opt = options.find((o) => o.value === v.value);
      return opt?.label ?? v.value;
    },
    [options],
  );

  const [query, setQuery] = useState<string>(() => labelFor(value));
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza query quando o `value` muda externamente.
  useEffect(() => {
    setQuery(labelFor(value));
  }, [value, labelFor]);

  // Click fora fecha o dropdown e resolve a query pendente.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const trimmed = query.trim();
  const exactMatch = useMemo(
    () => options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase()),
    [options, trimmed],
  );
  const showCreateOption = allowCustom && trimmed.length > 0 && !exactMatch;

  // Itens visiveis = filtered + (opcionalmente) "criar custom" no fim.
  const totalItems = filtered.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    if (highlighted >= totalItems) {
      setHighlighted(Math.max(0, totalItems - 1));
    }
  }, [highlighted, totalItems]);

  const commit = (next: ComboboxValue) => {
    onChange(next);
    setQuery(labelFor(next));
    setIsOpen(false);
  };

  const handleInputChange = (raw: string) => {
    setQuery(raw);
    setIsOpen(true);
    setHighlighted(0);
    // Se o texto bate exatamente com uma opcao, ja seleciona como canonical
    // (sem fechar o dropdown — usuario pode continuar digitando).
    const match = options.find((o) => o.label.toLowerCase() === raw.trim().toLowerCase());
    if (match) {
      onChange({ type: 'canonical', value: match.value });
    } else if (raw.trim() === '') {
      if (value !== null) onChange(null);
    } else if (allowCustom) {
      onChange({ type: 'custom', value: raw.trim() });
    } else if (value !== null) {
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlighted((h) => (totalItems === 0 ? 0 : Math.min(h + 1, totalItems - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (highlighted < filtered.length) {
        const opt = filtered[highlighted]!;
        commit({ type: 'canonical', value: opt.value });
      } else if (showCreateOption) {
        commit({ type: 'custom', value: trimmed });
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery(labelFor(value));
    }
  };

  const handleBlur = () => {
    // Pequeno delay pra permitir click numa option ANTES de fechar.
    setTimeout(() => {
      setIsOpen(false);
      onBlur?.();
    }, 100);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-listbox` : undefined}
          className={cn(
            'h-10 w-full cursor-pointer rounded border border-border bg-bg-card px-3 pr-14 font-body text-sm text-ink placeholder:text-ink-faint focus:border-ice-deep focus:outline-none focus:ring-1 focus:ring-ice/40 disabled:opacity-60',
            value?.type === 'custom' && 'border-ice-deep/60',
          )}
        />
        <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && !disabled ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              aria-label="Limpar"
              className="pointer-events-auto grid h-6 w-6 place-items-center text-ink-muted transition-colors hover:text-ice"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-3.5 w-3.5"
              >
                <path strokeLinecap="round" d="M3 3l10 10M13 3 3 13" />
              </svg>
            </button>
          ) : null}
          <span
            aria-hidden
            className={cn(
              'grid h-6 w-6 place-items-center text-ink-muted transition-transform',
              isOpen && 'rotate-180',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-3.5 w-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
            </svg>
          </span>
        </div>
      </div>
      {value?.type === 'custom' ? (
        <p className="mt-1 font-display text-[9px] uppercase tracking-[0.3em] text-ice">
          custom
        </p>
      ) : null}

      {isOpen && !disabled && totalItems > 0 ? (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-border bg-bg-card shadow-hero"
        >
          {filtered.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={highlighted === i}
              onMouseDown={(e) => {
                // mousedown antes do blur, evita fechar o dropdown.
                e.preventDefault();
                commit({ type: 'canonical', value: opt.value });
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm transition-colors',
                highlighted === i ? 'bg-bg-card-2 text-ice-bright' : 'text-ink',
              )}
            >
              {opt.label}
            </li>
          ))}
          {showCreateOption ? (
            <li
              role="option"
              aria-selected={highlighted === filtered.length}
              onMouseDown={(e) => {
                e.preventDefault();
                commit({ type: 'custom', value: trimmed });
              }}
              onMouseEnter={() => setHighlighted(filtered.length)}
              className={cn(
                'cursor-pointer border-t border-border px-3 py-2 text-sm transition-colors',
                highlighted === filtered.length
                  ? 'bg-bg-card-2 text-ice-bright'
                  : 'text-ink-muted',
              )}
            >
              <span className="font-display text-[9px] uppercase tracking-[0.3em] text-ice-deep">
                {createHint}
              </span>{' '}
              <span className="text-ink">&ldquo;{trimmed}&rdquo;</span>
            </li>
          ) : null}
        </ul>
      ) : null}

      {isOpen && !disabled && totalItems === 0 ? (
        <div className="absolute z-20 mt-1 w-full rounded border border-border bg-bg-card px-3 py-2 text-sm text-ink-muted shadow-hero">
          {emptyHint}
        </div>
      ) : null}
    </div>
  );
}
