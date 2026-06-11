import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Wrappers minimalistas pra forms — label + input + select + textarea com
 * estilo dark+ice consistente. Sem dependencia de RHF; o consumidor controla
 * o state.
 */

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'block font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted',
      className,
    )}
    {...props}
  />
));
Label.displayName = 'Label';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded border border-border bg-bg-card px-3 font-body text-sm text-ink placeholder:text-ink-faint focus:border-ice-deep focus:outline-none focus:ring-1 focus:ring-ice/40 disabled:opacity-60',
        // Remove os spinners nativos brancos de input[type=number] — destoam
        // do tema dark+ice. Para subir/descer use NumberStepper.
        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-20 w-full rounded border border-border bg-bg-card px-3 py-2 font-body text-sm text-ink placeholder:text-ink-faint focus:border-ice-deep focus:outline-none focus:ring-1 focus:ring-ice/40 disabled:opacity-60',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

/**
 * Select estilizado pra casar visualmente com `<Combobox>`: esconde a seta
 * nativa do browser (que varia por SO/tema) e renderiza um chevron custom
 * via SVG na mesma posicao do Combobox.
 *
 * Mantem `ref` no `<select>` interno (React.forwardRef).
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, disabled, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      disabled={disabled}
      className={cn(
        'h-10 w-full cursor-pointer appearance-none rounded border border-border bg-bg-card px-3 pr-10 font-body text-sm text-ink focus:border-ice-deep focus:outline-none focus:ring-1 focus:ring-ice/40 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center text-ink-muted',
        disabled && 'opacity-60',
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
));
Select.displayName = 'Select';

/**
 * Mensagem de erro renderizada abaixo do input. So aparece quando ha mensagem
 * — sem reservar altura, sem layout shift na renderizacao inicial. Quando o
 * erro aparece dinamicamente o conteudo abaixo desloca por ~18px.
 */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      className="mt-0.5 text-xs leading-4 text-danger"
    >
      {message}
    </p>
  );
}

export function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-ink-muted">{children}</p>;
}

/**
 * Wrapper canonico de campo: Label (com erro inline) + children (input/select)
 * + help opcional.
 *
 * A mensagem de erro aparece **na propria linha do label**, ao lado do `*`
 * de campo obrigatorio (ou logo apos o label quando nao required). Isso
 * elimina layout shift sem precisar reservar area abaixo do input.
 *
 *   <Field label="Nome" htmlFor="nome" required error={errors.name}>
 *     <Input id="nome" onBlur={...} />
 *   </Field>
 */
export function Field({
  label,
  htmlFor,
  required,
  error,
  help,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  /** Mensagem de erro inline. Renderizada no header (junto ao label). */
  error?: string | null;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </Label>
      {children}
      {help ? <FieldHelp>{help}</FieldHelp> : null}
      <FieldError message={error} />
    </div>
  );
}
