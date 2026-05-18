/**
 * Sistema generico de exibicao de erros de campo em forms.
 *
 * Padrao "touched on blur + force on submit":
 *   - Erro de campo so aparece se o usuario JA INTERAGIU com aquele input
 *     (saiu via blur), OU se houve uma TENTATIVA DE SUBMIT/AVANCO com erros.
 *
 * Uso:
 *   const errors = useFormErrors();
 *   // ...input onBlur={() => errors.markTouched('name')}
 *   // <Field error={errors.visible(allIssues).name}>
 *   // ao clicar Proximo com invalido: errors.revealAll()
 */

import { useCallback, useMemo, useState } from 'react';

export type FormFieldIssue = { field?: string; message: string };

export type FormErrorsApi = {
  /** Marca um campo como ja-tocado (chame onBlur). */
  markTouched: (field: string) => void;
  /** Revela todos os erros do form (chame ao tentar submeter invalido). */
  revealAll: () => void;
  /** Reseta touched e o flag de reveal. Util ao trocar de step. */
  reset: () => void;
  /** Retorna o flag (false antes do user tentar submit). */
  allRevealed: boolean;
  /**
   * Filtra a lista de issues e retorna um mapa { field: message } com APENAS
   * os campos visiveis (touched OR allRevealed). Issues sem `field` ficam de
   * fora — sao tratadas como erros de bloco (BlockError) e exibidas
   * separadamente.
   */
  visible: (issues: ReadonlyArray<FormFieldIssue>) => Record<string, string>;
};

export function useFormErrors(): FormErrorsApi {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [allRevealed, setAllRevealed] = useState(false);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const revealAll = useCallback(() => setAllRevealed(true), []);

  const reset = useCallback(() => {
    setTouched({});
    setAllRevealed(false);
  }, []);

  const visible = useCallback(
    (issues: ReadonlyArray<FormFieldIssue>): Record<string, string> => {
      const map: Record<string, string> = {};
      for (const issue of issues) {
        if (!issue.field) continue;
        if (allRevealed || touched[issue.field]) {
          // Mantem o primeiro erro por field — multiplos issues no mesmo campo
          // sao raros e a UI mostra um por vez.
          if (map[issue.field] === undefined) {
            map[issue.field] = issue.message;
          }
        }
      }
      return map;
    },
    [allRevealed, touched],
  );

  return useMemo(
    () => ({ markTouched, revealAll, reset, allRevealed, visible }),
    [markTouched, revealAll, reset, allRevealed, visible],
  );
}
