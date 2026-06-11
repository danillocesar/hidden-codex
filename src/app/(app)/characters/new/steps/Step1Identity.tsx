'use client';

import { useCallback, useMemo, useState } from 'react';
import { Field, Input, Select } from '@/components/ui/field';
import { Combobox, type ComboboxValue } from '@/components/ui/combobox';
import { Stack } from '@/components/ui/stack';
import { InfoButton } from '@/components/character/wizard/InfoButton';
import { InfoDrawer } from '@/components/character/wizard/InfoDrawer';
import { PortraitUpload } from '@/components/character/ficha/PortraitUpload';
import type {
  WizardClanOption,
  WizardKekkeiGenkaiOption,
  WizardPowerOption,
  WizardVillageOption,
} from '@/server/queries/wizardCatalogs';
import type { CreateCharacterIdentity } from '@/schemas/character/create';
import type { WizardAction, WizardState } from '../wizardState';

const NC_MIN = 4;
const NC_MAX = 20;

/**
 * Step 1 — Identidade.
 *
 * Vila e Cla usam <Combobox> creatable: o usuario pode escolher uma opcao
 * canonica OU digitar um nome livre + Enter pra criar custom. Sem campos
 * separados.
 */
export function Step1Identity({
  state,
  dispatch,
  catalogs,
  errors,
  onBlurField,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  catalogs: {
    clans: ReadonlyArray<WizardClanOption>;
    villages: ReadonlyArray<WizardVillageOption>;
    kekkeiGenkais: ReadonlyArray<WizardKekkeiGenkaiOption>;
    powers: ReadonlyArray<WizardPowerOption>;
  };
  errors: Record<string, string | null>;
  onBlurField: (field: string) => void;
}) {
  const { identity } = state;
  const [clanDrawerOpen, setClanDrawerOpen] = useState(false);

  const selectedClan = useMemo(
    () => catalogs.clans.find((c) => c.code === identity.clanCode) ?? null,
    [catalogs.clans, identity.clanCode],
  );
  const selectedKg = useMemo(
    () =>
      catalogs.kekkeiGenkais.find((k) => k.code === identity.kekkeiGenkaiCode) ?? null,
    [catalogs.kekkeiGenkais, identity.kekkeiGenkaiCode],
  );

  // Hijutsus sao poderes (category HIJUTSU). No campo combinado "Linhagem /
  // Hijutsu" eles funcionam como atalho: selecionar adiciona o poder em
  // state.powers (nivel 1) — depois e comprado/ajustado normalmente no Step 5.
  const hijutsus = useMemo(
    () => catalogs.powers.filter((p) => p.category === 'HIJUTSU'),
    [catalogs.powers],
  );
  const hijutsuByCode = useMemo(() => new Map(hijutsus.map((p) => [p.code, p])), [hijutsus]);
  const selectedHijutsus = useMemo(
    () => state.powers.filter((p) => hijutsuByCode.has(p.code)),
    [state.powers, hijutsuByCode],
  );

  // Helpers pra converter o par (canonicalCode, customName) em ComboboxValue
  // e vice-versa. Usado em vila e cla.
  const villageValue: ComboboxValue = identity.villageCode
    ? { type: 'canonical', value: identity.villageCode }
    : identity.customVillageName
      ? { type: 'custom', value: identity.customVillageName }
      : null;

  const clanValue: ComboboxValue = identity.clanCode
    ? { type: 'canonical', value: identity.clanCode }
    : identity.customClanName
      ? { type: 'custom', value: identity.customClanName }
      : null;

  const patch = useCallback(
    (p: Partial<CreateCharacterIdentity>) => dispatch({ type: 'patchIdentity', patch: p }),
    [dispatch],
  );

  const setVillage = (v: ComboboxValue) => {
    if (v === null) {
      patch({ villageCode: null, customVillageName: null });
    } else if (v.type === 'canonical') {
      patch({ villageCode: v.value, customVillageName: null });
    } else {
      patch({ villageCode: null, customVillageName: v.value });
    }
  };

  const setClan = (v: ComboboxValue) => {
    if (v === null) {
      patch({ clanCode: null, customClanName: null });
      return;
    }
    if (v.type === 'canonical') {
      const clan = catalogs.clans.find((c) => c.code === v.value);
      const benefits = (clan?.benefits ?? {}) as Record<string, unknown>;
      const kgFromClan =
        typeof benefits.kekkeiGenkai === 'string' ? benefits.kekkeiGenkai : null;
      patch({
        clanCode: v.value,
        customClanName: null,
        kekkeiGenkaiCode: kgFromClan ?? identity.kekkeiGenkaiCode,
      });
    } else {
      patch({ clanCode: null, customClanName: v.value });
    }
  };

  // Campo combinado: value vem marcado (`kg:<code>` / `hj:<code>` / '') pra
  // distinguir Kekkei Genkai (FK em kekkeiGenkaiCode) de Hijutsu (poder). KG e
  // single; hijutsu e acao de adicionar (vira chip). Nunca remove hijutsu ao
  // trocar o KG — so o "x" do chip remove.
  const onLineageChange = (raw: string) => {
    if (!raw) {
      patch({ kekkeiGenkaiCode: null });
      return;
    }
    const [kind, code] = raw.split(/:(.+)/);
    if (kind === 'kg') {
      patch({ kekkeiGenkaiCode: code ?? null });
    } else if (kind === 'hj' && code) {
      if (!state.powers.some((p) => p.code === code)) {
        dispatch({ type: 'setPowers', powers: [...state.powers, { code, level: 1 }] });
      }
    }
  };

  const removeHijutsu = (code: string) => {
    dispatch({ type: 'setPowers', powers: state.powers.filter((p) => p.code !== code) });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <Stack gap="xs" data-tour="identity-portrait">
        <PortraitUpload
          value={identity.portraitUrl ?? null}
          onChange={(url) => patch({ portraitUrl: url })}
        />
      </Stack>

      <div className="space-y-4">
        <Field label="Nome" htmlFor="char-name" required error={errors.name}>
          <Input
            id="char-name"
            autoFocus
            value={identity.name}
            onChange={(e) => patch({ name: e.target.value })}
            onBlur={() => onBlurField('name')}
            placeholder="Ex: Satsuki Yuki"
            maxLength={80}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Idade" htmlFor="char-age">
            <Input
              id="char-age"
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              value={identity.age ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                patch({ age: v === '' ? null : Number.parseInt(v, 10) });
              }}
            />
          </Field>

          <Field label="Genero" htmlFor="char-gender">
            <Input
              id="char-gender"
              value={identity.gender ?? ''}
              onChange={(e) => patch({ gender: e.target.value || null })}
              placeholder="feminino / masculino / outro"
              maxLength={60}
            />
          </Field>

          <Field label="NC inicial" htmlFor="char-nc">
            <Select
              id="char-nc"
              value={String(identity.campaignLevel)}
              onChange={(e) =>
                patch({ campaignLevel: Number.parseInt(e.target.value, 10) })
              }
            >
              {Array.from({ length: NC_MAX - NC_MIN + 1 }, (_, i) => NC_MIN + i).map(
                (nc) => (
                  <option key={nc} value={String(nc)}>
                    NC {nc}
                  </option>
                ),
              )}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2" data-tour="identity-origin">
          <Field label={<span className="flex h-4 items-center">Vila</span>}>
            <Combobox
              id="char-village"
              placeholder="Selecione ou digite uma vila"
              options={catalogs.villages.map((v) => ({
                value: v.code,
                label: v.translation ? `${v.name} — ${v.translation}` : v.name,
              }))}
              value={villageValue}
              onChange={setVillage}
              onBlur={() => onBlurField('village')}
              createHint="Criar vila"
            />
          </Field>

          <Field
            label={
              <span className="flex h-4 items-center gap-2">
                Cla
                <InfoButton
                  ariaLabel="Ver descricao do cla selecionado"
                  onClick={() => setClanDrawerOpen(true)}
                  disabled={!selectedClan}
                />
              </span>
            }
          >
            <Combobox
              id="char-clan"
              placeholder="Selecione ou digite um cla"
              options={catalogs.clans.map((c) => ({
                value: c.code,
                label: c.name,
              }))}
              value={clanValue}
              onChange={setClan}
              onBlur={() => onBlurField('clan')}
              createHint="Criar cla"
            />
          </Field>
        </div>

        <Field label="Linhagem / Hijutsu" htmlFor="char-lineage">
          <Select
            id="char-lineage"
            value={identity.kekkeiGenkaiCode ? `kg:${identity.kekkeiGenkaiCode}` : ''}
            onChange={(e) => onLineageChange(e.target.value)}
          >
            <option value="">— Nenhuma —</option>
            <optgroup label="Kekkei Genkai (linhagem)">
              {catalogs.kekkeiGenkais.map((k) => (
                <option key={k.code} value={`kg:${k.code}`}>
                  {k.translation ? `${k.name} — ${k.translation}` : k.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Hijutsu (técnica secreta)">
              {hijutsus.map((p) => (
                <option key={p.code} value={`hj:${p.code}`}>
                  {p.translation ? `${p.name} — ${p.translation}` : p.name}
                </option>
              ))}
            </optgroup>
          </Select>
          {selectedKg?.shortDescription ? (
            <p className="mt-1 text-sm text-ink-muted">{selectedKg.shortDescription}</p>
          ) : null}
          {selectedHijutsus.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedHijutsus.map((p) => {
                const def = hijutsuByCode.get(p.code);
                return (
                  <span
                    key={p.code}
                    className="inline-flex items-center gap-1 rounded border border-ice-deep bg-bg-card px-2 py-0.5 text-xs text-ink"
                  >
                    {def?.name ?? p.code}
                    <button
                      type="button"
                      onClick={() => removeHijutsu(p.code)}
                      aria-label={`Remover ${def?.name ?? p.code}`}
                      className="text-ink-muted transition-colors hover:text-danger"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-ink-faint">
            Hijutsus são poderes normais — custam pontos e o nível é ajustado na etapa Poderes.
          </p>
        </Field>
      </div>

      <InfoDrawer
        open={clanDrawerOpen}
        onClose={() => setClanDrawerOpen(false)}
        title={selectedClan?.name ?? ''}
        subtitle="Cla"
      >
        {selectedClan ? (
          <p className="whitespace-pre-wrap">{selectedClan.description}</p>
        ) : null}
      </InfoDrawer>
    </div>
  );
}
