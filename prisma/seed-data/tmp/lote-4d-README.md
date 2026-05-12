# Seed Data — Lote 4d (Poderes Restritos de Clã e Hijutsus de Genjutsu/Cura/Selo)

Quarta onda do **Lote 4 (Efeitos)**. Cobre poderes restritos do Livro Básico que NÃO são elementais nem KGs — são hijutsus específicos de clãs/disciplinas.

## 📦 Conteúdo desta onda (11 arquivos)

| Arquivo | Efeitos | Poder | Tipo |
|---|:---:|---|---|
| `effects-magen.json` | 16 | **Magen** (Ilusão Demoníaca) | Genjutsu restrito |
| `effects-iryou.json` | 4 | **Iryou Ninjutsu** (Médico) | Poder comum |
| `effects-fuuinjutsu.json` | 10 | **Fuuinjutsu** (Selamento) | Poder comum |
| `effects-rasengan.json` | 4 | **Rasengan** | Poder comum |
| `effects-kuchiyose.json` | 2 | **Kuchiyose** (Invocação) | Poder comum |
| `effects-juuken.json` | 8 | **Juuken** (Hyuuga) | Hijutsu de clã |
| `effects-kagejutsu.json` | 5 | **Kagejutsu** (Nara) | Hijutsu de clã |
| `effects-baika.json` | 4 | **Baika Ninpou** (Akimichi) | Hijutsu de clã |
| `effects-kikai.json` | 4 | **Kikai Ninpou** (Aburame) | Hijutsu de clã |
| `effects-shikakyu.json` | 6 | **Shikakyu** (Inuzuka) | Hijutsu de clã |
| `effects-shintenshin.json` | 3 | **Shindenshin** (Yamanaka) | Hijutsu de clã |
| **Total** | **66** | | |

## 🔑 Decisões importantes

### 1. Magen tem 16 efeitos (mais volumoso da onda)

Todos os efeitos níveis 1-5 do Livro Básico p. 235-238. Cada um marcado em `rules.ilusionType` com:
- **fantasma** — ilusão externa sobre o usuário (Falsa Velocidade, Falsa Posição)
- **compulsao** — mental contínua até libertação
- **afliccao** — mental instantânea (2 turnos)

Motor de regras precisa entender esses 3 tipos pra aplicar regras corretas (sobreposição, notar genjutsu, cancelar com Kai ou dano).

### 2. Iryou Ninjutsu — apenas 4 técnicas extras

Iryou é um poder de cura cujo "efeito base" é a própria cura. Modelei apenas as 4 técnicas auxiliares que aparecem como entradas separadas no livro:
- **Chakra no Mesu** (Bisturi de Chakra) — Nv 6, ofensiva
- **In'Yu Shōmestu** — Nv 6, defensiva instantânea (1x/dia)
- **Shousen no Jutsu** — Nv 7, cura ou ofensiva
- **Byakugou no In** — Nv 8, selo da Tsunade (pré-req: Kuchiyose Lesmas)

A "cura padrão" do Iryou está nas `_meta.powerNotes.healingFormula`. O motor calcula automaticamente quando o usuário ativa o poder.

### 3. Fuuinjutsu — 10 técnicas por nível (1-9)

Cada nível dá UMA técnica específica:
- Nv 1: Selo de Armazenamento
- Nv 2: Selo de Armazenamento Maior
- Nv 3: Misshi (Mensageiro)
- Nv 4: Bakudan (Bomba)
- Nv 5: Gensou no In (Selo de Ilusão)
- Nv 6: Ninjutsu no Wana (Armadilha)
- Nv 7: Chakra no Souin (Contenção)
- Nv 8: Kekkai no In (Barreira) + Shishou Fuuin (selar Bijuu)
- Nv 9: Keiyaku Fuuin (Anticontrato)

Esses são "efeitos por nível", não escolhas. Motor entende que ao subir nível Fuuinjutsu, ganha automaticamente o selo correspondente.

### 4. Rasengan — 4 evoluções

Cada uma é "efeito" próprio com `minLevel` correspondente:
- Nv 1: Básico (ação completa, dano = 2 + Nv + Esp/2)
- Nv 6: Completo (ação padrão, dano = Nv + Esp) — pré-req Esp 14
- Nv 7: Oodama (Técnica Poderosa) — pré-req Esp 16
- Nv 9: Elemental (Enka/Raiou/Rasen Shuriken) — pré-req elemento Nv 2

### 5. Kuchiyose — modelado de forma reduzida

Apenas 2 entradas (`kuchiyose_no_jutsu` + `gyaku_kuchiyose`). **O grosso do poder são as criaturas invocáveis** (Gamabunta, Manda, Katsuyu, etc.) que precisam ser modeladas como entidades próprias em lote suplementar — não cabem em "efeitos de poder".

Sinalizei isso em `_meta.todoNotes`. Quando rolar lote de criaturas/companheiros, modela elas separadamente.

### 6. Hijutsus de clã

Cada arquivo tem `_meta.powerNotes.clan` com o nome do clã dono — útil pro motor cruzar com o catálogo de clãs.

**Pontos sutis:**
- **Juuken** precisa de Byakugan ATIVO (sinalizado em `rules.requiresByakuganActive`). Motor precisa checar essa condição em runtime.
- **Shikakyu** funciona análogo ao Juuken (Força em vez de Destreza). Tabela de dano de arma idêntica.
- **Kage Mane** tem evoluções "inline" (Sombra Preparada Nv 7, Guiada Nv 8, Perfeita Nv 9) — modeladas no array `evolutions` do JSON.
- **Shinranshin** anula penalidades do Shintenshin (corpo do Yamanaka indefeso). Vítima mantém consciência mas perde controle físico.

## ⚠️ O que NÃO entrou (transparência)

Pra ser honesto sobre cortes deliberados:

1. **Dokujutsu** (Arte dos Venenos do Sasori) — variação de Ninpou descrita p. 201-202. Tem efeitos próprios (Energizar Venenoso etc.) mas é um sub-poder pequeno. Cabe lote suplementar se quiser.

2. **Hibon Ninpou** (Arte Ninja Única) — p. 212 — sub-variação de Ninpou. Pequena.

3. **Tensai** (Genialidade) — p. 241 — é hijutsu de aptidões, não tem efeitos próprios. Vai ser modelado como aptidão restrita no Lote 5 (Aptidões).

4. **Versatilidade** — p. 242 — meta-poder que permite ter 2 poderes. Não tem efeitos próprios.

5. **Bijuu específicos** (Gobi Futton, Rokubi Suiton, Kyuubi Cura, Hachibi Tinta) — formatos diferentes (técnicas individuais). Cabem lote suplementar de Jinchuuriki.

6. **Aptidões restritas** ligadas a estes poderes (Tenketsu Byakugan, Sharingan, Mangekyou, Senjutsu Aptitudes, Estilo da Lótus, Hakken no Jutsu, Companheiro Animal) — vão no **Lote 5 (Aptidões)**.

7. **Criaturas de Kuchiyose** (Gamabunta, Manda, Katsuyu, Bull, Enma, Pakkun) — entidades próprias, lote suplementar.

8. **Técnicas avançadas específicas de Kuchiyose** (Henge Kongōnyoi do Enma, Pó de Prata, Espinhos do Pakkun, Modo Sapo Sennin via Ma/Pa, etc.) — vinculadas a invocações específicas.

Se você quiser TUDO TUDO mesmo (Dokujutsu, Bijuus completos, técnicas de invocações específicas), me sinaliza e eu faço **Lote 4f suplementar** depois do 4e.

## 📋 Shape mantido

Mesmo shape dos lotes anteriores. JSONB resolve qualquer estrutura diferente em `rules`.

## 🔧 Padrão de seed atualizado

```typescript
async function seedPowerEffects() {
  const files = [
    // 4a + 4b + 4c (anteriores)
    'effects-ninpou-universal.json',
    'effects-suiton.json',
    'effects-doton.json',
    'effects-katon.json',
    'effects-fuuton.json',
    'effects-raiton.json',
    'effects-hyouton.json',
    'effects-mokuton.json',
    'effects-sabaku.json',
    'effects-jiton.json',
    'effects-yonbi-youton.json',
    'effects-aoi-katon.json',
    'effects-sanbi-suiton.json',
    'effects-senjutsu.json',
    'effects-hachimon.json',
    // 4d (novos)
    'effects-magen.json',
    'effects-iryou.json',
    'effects-fuuinjutsu.json',
    'effects-rasengan.json',
    'effects-kuchiyose.json',
    'effects-juuken.json',
    'effects-kagejutsu.json',
    'effects-baika.json',
    'effects-kikai.json',
    'effects-shikakyu.json',
    'effects-shintenshin.json',
    // 4e virá depois
  ];
  // resto igual
}
```

## ✅ Validação pós-seed

Total no banco depois de aplicar **4a + 4b + 4c + 4d = 65 + 66 = 131 efeitos**.

Verifique:
- **Êxtase** (Magen): `availableFor: ["magen"]`, `minLevel: 1`, `rules.ilusionType: "compulsao"`
- **Paralisar (Magen)**: code `paralisar_magen` (note o sufixo pra não conflitar com aptidões/condições)
- **Chakra no Mesu**: `availableFor: ["iryou_ninjutsu"]`, `rules.threeHitsCondition.appliesConditions: ["lento", "debilitado"]`
- **Byakugou no In**: pré-req aparece em `rules.prerequisites.powers.kuchiyose: 6` e `kuchiyoseRestricted: "lesmas"`
- **Selo de Armazenamento Maior**: `rules.objectSizeByPowerLevel: { "3": "medio", "5": "grande" }`
- **Rasengan Elemental**: `rules.variants` tem 3 tipos (Enka/Raiou/Rasen Shuriken)
- **Juuken Nv 1**: `rules.weaponDamageByLevel: { "1": 1, "4": 2, "5": 3, "6": 4 }`
- **Kage Mane**: 3 evoluções no array `evolutions`
- Tabela tem 131 linhas totais

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                  ← atualizar lista
│   ├── seed-data/
│   │   ├── (arquivos anteriores 1, 2, 3, 4a, 4b, 4c)
│   │   ├── effects-magen.json                   ← NOVO (4d)
│   │   ├── effects-iryou.json                   ← NOVO
│   │   ├── effects-fuuinjutsu.json              ← NOVO
│   │   ├── effects-rasengan.json                ← NOVO
│   │   ├── effects-kuchiyose.json               ← NOVO
│   │   ├── effects-juuken.json                  ← NOVO
│   │   ├── effects-kagejutsu.json               ← NOVO
│   │   ├── effects-baika.json                   ← NOVO
│   │   ├── effects-kikai.json                   ← NOVO
│   │   ├── effects-shikakyu.json                ← NOVO
│   │   └── effects-shintenshin.json             ← NOVO
```

---

# 🛠️ Comandos manuais seus

```bash
cd ~/projects/arcana-forge

# 1. Confirma lote 4c aplicado
pnpm prisma studio &
# power_effects deve ter 65 linhas
# Ctrl+C

# 2. Descompacta lote 4d
unzip ~/Downloads/seed-data-lote-4d.zip -d /tmp/

# 3. Copia os 11 JSONs novos
cp /tmp/seed-data-lote-4d/effects-magen.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-iryou.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-fuuinjutsu.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-rasengan.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-kuchiyose.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-juuken.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-kagejutsu.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-baika.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-kikai.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-shikakyu.json prisma/seed-data/
cp /tmp/seed-data-lote-4d/effects-shintenshin.json prisma/seed-data/

# 4. Guarda README
cp /tmp/seed-data-lote-4d/README.md /tmp/lote-4d-README.md

# 5. Confere
ls prisma/seed-data/effects-*.json
# Esperado: 26 arquivos (1 universal + 5 4b + 9 4c + 11 4d)
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 4d do Seed: Poderes Restritos de Clã e Hijutsus de Genjutsu/Cura/Selo

Onda 4d do Lote 4 pronta. 11 arquivos novos.

## Arquivos novos (66 efeitos totais)

- `effects-magen.json` (16: Êxtase, Amedrontar, Confundir, Fadigar, Segurar, Adormecer, Anular Sentido, Desequilibrar, Desorientar, Falsa Velocidade, Aliviamento, Falsa Posição, Petrificar, Adoecer, Atordoar, Paralisar Magen)
- `effects-iryou.json` (4: Chakra no Mesu, In'Yu Shōmestu, Shousen no Jutsu, Byakugou no In)
- `effects-fuuinjutsu.json` (10: Selo Armaz, Selo Maior, Misshi, Bakudan, Gensou, Ninjutsu Wana, Chakra Souin, Kekkai, Shishou Fuuin, Keiyaku Fuuin)
- `effects-rasengan.json` (4: Básico, Completo, Oodama, Elemental)
- `effects-kuchiyose.json` (2: Kuchiyose, Gyaku Kuchiyose)
- `effects-juuken.json` (8: Juuken Nv1, Ichigekishin, Kaiten, 32 pontos, Kuushou, 64 pontos, Soushiken, 128 pontos)
- `effects-kagejutsu.json` (5: Kage Shibari, Kage Mane, Kage Mane Shuriken, Kage Kubishibari, Kageyose)
- `effects-baika.json` (4: Baika no Jutsu, Nikudan Sensha, Bunbun Baika, Choudan Bakugeki)
- `effects-kikai.json` (4: Mushi Bunshin, Mushi Kame, Mushidama, Senro)
- `effects-shikakyu.json` (6: Shikakyu Nv1, Juujin Bunshin, Gatsuuga, Soutourou, Santorou, Ooiga Gatenga)
- `effects-shintenshin.json` (3: Shintenshin, Shinten Bunshin, Shinranshin)

## Antes de codar

1. **Leia `/tmp/lote-4d-README.md`** — pontos importantes:
   - Magen tem 3 tipos de ilusão (`fantasma`, `compulsao`, `afliccao`) marcados em `rules.ilusionType`
   - Juuken requer Byakugan ATIVO em runtime (`rules.requiresByakuganActive`)
   - Kuchiyose tem entradas mínimas — invocações específicas (Gamabunta, Katsuyu) vão em lote suplementar
   - Iryou padrão (cura) está no `_meta.powerNotes.healingFormula`, não como efeito individual
   - Fuuinjutsu: cada nível dá UM selo específico (não é escolha)
   - Rasengan: 4 evoluções com pré-reqs progressivos de Esp

2. **Schema não muda** — tabela `PowerEffect` do 4a serve. Sem migration.

3. **Pré-requisitos cruzados detectados** (NÃO validar em código ainda, só documentar):
   - Byakugou no In requer Kuchiyose 6 (Lesmas) + Iryou 8 + Fuuinjutsu 5 — cross-power restrito
   - Rasengan Elemental requer Katon/Raiton/Fuuton Nv 2
   - Senpou Rasengan requer Senjutsu
   - Mushi Bunshin requer aptidão Clone + Kikaichuu
   - Juujin Bunshin requer Companheiro Animal
   - Shinranshin é evolução de Shintenshin

## Tarefas

1. Atualizar `seedPowerEffects()` em `prisma/seed.ts` pra incluir os 11 arquivos novos
2. Rodar `pnpm prisma db seed`
3. Validar no Prisma Studio:
   - Tabela `power_effects` tem 131 linhas totais (65 anteriores + 66 novos)
   - Magen tem 16 entradas
   - Fuuinjutsu tem 10 entradas (Nv 1 ao Nv 9)
   - Juuken tem 8 entradas (Nv 1 ao Nv 8)
   - Paralisar de Magen tem `code: "paralisar_magen"` (com sufixo)
   - Rasengan Elemental tem `rules.variants` com 3 chaves

## ⛔ Limites

- **NÃO modele** invocações específicas (Gamabunta etc.) ainda — vão em lote separado
- **NÃO modele** aptidões restritas (Byakugan, Sharingan, Tenketsu Byakugan etc.) — Lote 5
- **NÃO implemente** validações de pré-requisitos cruzados
- **NÃO toque** em outros JSONs
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Total de efeitos no banco (131)
- Pré-requisitos cruzados detectados (Byakugou exige 3 poderes; Rasengan Elemental exige elemento)
- Power_codes que ainda NÃO existem na tabela `Power` (precisam ser adicionados ao seed de poderes ou já estão lá): magen, iryou_ninjutsu, fuuinjutsu, rasengan, kuchiyose, juuken, kagejutsu, baika_ninpou, kikai_ninpou, shikakyu, shindenshin
- Próximo passo: ondas 4e (efeitos novos do Guia Avançado) e depois Lote 5 (Aptidões)
```
