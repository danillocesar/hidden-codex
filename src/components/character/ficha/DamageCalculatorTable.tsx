import type { DamageBreakdown } from '@/domain/rules/damage';
import { cn } from '@/lib/utils/cn';

/**
 * Tabela "Calculadora de Dano" — grade DDA · ½Atr · NV · OUTRO · TOTAL + dano
 * por grau de acerto (graus 1–4, com os intervalos do 2d8). Puramente
 * apresentacional: recebe um `DamageBreakdown` pronto do motor
 * (`calculateDamageBreakdown`) e o renderiza. Usada dentro dos modais de jutsu
 * e de ataque.
 *
 * Spec: 05-UI-SPEC.md §6/§7 + 04-RULES-ENGINE.md §"Calculadora de dano final".
 */

/** Intervalos do 2d8 por grau (rótulos de cabeçalho das colunas de grau). */
const GRADE_RANGES = ['4–8', '9–11', '12–14', '15–16'] as const;

export function DamageCalculatorTable({
  breakdown,
  /** Rótulo da coluna do meio-atributo: "½ For", "½ Des" ou "½ Esp". */
  halfLabel,
}: {
  breakdown: DamageBreakdown;
  halfLabel: string;
}) {
  const { components, total, byGrade } = breakdown;
  const grades = [byGrade.grade1, byGrade.grade2, byGrade.grade3, byGrade.grade4];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <Th>DDA</Th>
            <Th>{halfLabel}</Th>
            <Th>NV</Th>
            {components.elemento !== 0 ? <Th>Elem</Th> : null}
            <Th>Outro</Th>
            <Th total>Total</Th>
            {GRADE_RANGES.map((range) => (
              <Th key={range} grade>
                {range}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>{components.dda}</Td>
            <Td>{components.halfEsp}</Td>
            <Td>{components.nivel}</Td>
            {components.elemento !== 0 ? <Td>{components.elemento}</Td> : null}
            <Td>{components.outro}</Td>
            <Td total>{total}</Td>
            {grades.map((value, i) => (
              <Td key={GRADE_RANGES[i]} grade>
                {value}
              </Td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  total,
  grade,
}: {
  children: React.ReactNode;
  total?: boolean;
  grade?: boolean;
}) {
  return (
    <th
      className={cn(
        'border-b border-border px-2 py-1.5 text-center font-display text-[9px] uppercase tracking-[0.25em]',
        total ? 'text-ice' : 'text-ink-muted',
        grade && 'bg-bg-card/40',
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  total,
  grade,
}: {
  children: React.ReactNode;
  total?: boolean;
  grade?: boolean;
}) {
  return (
    <td
      className={cn(
        'border-b border-border px-2 py-2 text-center font-serif',
        total
          ? 'text-lg font-semibold text-ice-bright'
          : grade
            ? 'text-base font-medium text-ice-bright bg-bg-card/40'
            : 'text-base text-ink-muted',
      )}
    >
      {children}
    </td>
  );
}
