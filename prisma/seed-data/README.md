# Seed Data — Lote 4e (Efeitos Novos do Guia Avançado) 🎉 **FECHA O LOTE 4**

Última onda do **Lote 4 (Efeitos)**. Cobre os 7 efeitos novos introduzidos pelo Guia Avançado do Shinobi (GAS) — adições à lista padrão de efeitos universais.

## 📦 Conteúdo desta onda (1 arquivo, 7 efeitos)

| Efeito | Nível | Tipo | Poderes Compatíveis |
|---|:---:|---|---|
| **Dano Contínuo** | 2 | Projétil (DoT) | Katon, Raiton + 10 outros |
| **Deslocamento de Vácuo** | 2 | Suporte (mobilidade) | Doton, Fuuton, Suiton + 4 outros |
| **Purificar** | 2 | Ambiente | Fuuton, Suiton + 4 outros |
| **Repelir** | 2 | Reação defensiva | Ninpou + 15 outros |
| **Projetar** | 3 | Projétil (desloca) | Ninpou + 14 outros |
| **Cegante** | 5 | Projétil (camuflagem no inimigo) | Ninpou + 13 outros |
| **Desastre** | 9 | Concentração épica | Ninpou + 7 elementais |

Total: **7 efeitos** novos.

## 🔑 Pontos importantes

### 1. Repelir é a única ação REATIVA da onda

Junto com Espelho D'Água do Sanbi Suiton (Lote 4c), Repelir é dos poucos efeitos que funcionam como reação defensiva — usa LM com +1 precisão. **Motor precisa entender o trigger reativo** (projétil/toque/golpear chegando contra você ou alguém no alcance).

### 2. Dano Contínuo tem mecânica DoT

Diferente de quase todos os outros efeitos do livro, Dano Contínuo aplica dano **fixo por turno** (não modificável por bônus de dano). É damage-over-time clássico. Vítima pode se livrar com ação completa + Vigor (Dif comum -3) ou esperar 3 turnos sofrendo 3 danos no total.

### 3. Desastre é "limite quebrado"

Nv 9, área 3x comum, dano 3x nível, custo 3x nível, **1x por cena**, NÃO aceita aptidões de técnica. Modelado pra ser um ult cinematográfico de jinchuuriki/lendário. Sinalizei tudo isso em `rules`.

### 4. Poderes ainda NÃO modelados no catálogo

Vários efeitos listam poderes que **ainda não estão no nosso catálogo** (Lote 3):

```
kamijutsu, kujaku_myoho, sumi_ninpou, kumo_ninpou,
hebi_ninpou, ototon, kibaku_nendo, futton_mei,
youton_mei, shakuton, shouton, ranton, dokujutsu
```

Documentei a lista em `_meta.unmodeledPowers`. Quando você adicionar esses poderes no catálogo depois (Lote 4f suplementar ou outro), o seeder vai resolver automaticamente via `availableFor`. Por enquanto, o motor só vai conseguir aplicar Dano Contínuo em Katon/Raiton/Kikai/Mokuton/Dokujutsu/Hyouton (os que JÁ existem no catálogo).

**Não é bug** — é trade-off consciente: cataloguei o efeito completo do livro pra não perder informação, mesmo sabendo que parte das opções fica dormente até catalogarmos os poderes faltantes.

### 5. Não dupliquei efeitos revisados

O GAS também REVISA alguns efeitos universais que já estão no Lote 4a (Orbe Nv 7, Onda Explosiva Nv 8, Inflamável modo contínuo, Correnteza Nv 8, Lança ignora 3 dureza). **Decidi não incluir esses no 4e** porque significaria dois caminhos:
- (a) duplicar entradas no banco (ruim — fica inconsistente)
- (b) sobrescrever os JSONs do 4a (ruim — perde rastreabilidade)

A solução correta é uma **migration de revisão** que atualiza os efeitos existentes pelos novos valores do GAS. Isso fica pra **sessão futura quando você quiser aplicar as revisões oficiais**. Por enquanto, o jogo roda com os valores do Livro Básico, que ainda são canônicos.

Se quiser as revisões aplicadas agora, me sinaliza — eu produzo um JSON `effects-revisions-gas.json` no formato de patch que o seeder consome via upsert.

## ✅ Validação pós-seed

Total no banco depois de aplicar **4a + 4b + 4c + 4d + 4e = 131 + 7 = 138 efeitos**.

Verifique:
- **Dano Contínuo**: `code: "dano_continuo"`, `minLevel: 2`, `rules.damagePerTurn: "nivel_do_poder"`, `availableFor` com 12 poderes
- **Repelir**: `code: "repelir"`, `rules.reactive: true`, `rules.triggers: ["projetil", "toque", "golpear"]`
- **Desastre**: `code: "desastre"`, `minLevel: 9`, `rules.oncePerScene: true`, `rules.noAptidoesDeTecnica: true`
- **Cegante**: `rules.appliesCondition: "camuflagem_parcial_no_inimigo"` (NÃO no usuário — é diferente de Falsa Posição do Magen)
- Tabela `power_effects` tem 138 linhas totais

---

# 🎊 FECHAMENTO DO LOTE 4

Com este zip, **o Lote 4 está completo**. Resumo cumulativo:

| Onda | Tema | Arquivos | Efeitos |
|---|---|:---:|:---:|
| 4a | Universais de Ninpou | 1 | 18 |
| 4b | Elementais (Suiton/Doton/Katon/Fuuton/Raiton) | 5 | 14 |
| 4c | KGs e Hijutsus complexos (Hyouton/Mokuton/Sabaku/Jiton/Bijuus/Senjutsu/Hachimon) | 9 | 33 |
| 4d | Poderes restritos de clã (Magen/Iryou/Fuuinjutsu/Rasengan/Kuchiyose/Juuken/Kagejutsu/Baika/Kikai/Shikakyu/Shintenshin) | 11 | 66 |
| 4e | Novos do Guia Avançado | 1 | 7 |
| **TOTAL** | | **27** | **138** |

138 efeitos catalogados, 27 arquivos JSON estruturados, ~5000+ linhas de seed data. **Fica só faltando aplicar.**

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                  ← atualizar lista (última vez)
│   ├── seed-data/
│   │   ├── (arquivos anteriores 1, 2, 3, 4a, 4b, 4c, 4d)
│   │   └── effects-guia-avancado.json           ← NOVO (4e)
```

---

# 🛠️ Comandos manuais seus

```bash
cd ~/projects/arcana-forge

# 1. Confirma lote 4d aplicado
pnpm prisma studio &
# power_effects deve ter 131 linhas
# Ctrl+C

# 2. Descompacta lote 4e
unzip ~/Downloads/seed-data-lote-4e.zip -d /tmp/

# 3. Copia o JSON novo
cp /tmp/seed-data-lote-4e/effects-guia-avancado.json prisma/seed-data/

# 4. Guarda README
cp /tmp/seed-data-lote-4e/README.md /tmp/lote-4e-README.md

# 5. Confere
ls prisma/seed-data/effects-*.json
# Esperado: 27 arquivos
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 4e do Seed: Efeitos Novos do Guia Avançado (FECHA O LOTE 4)

Última onda do Lote 4. 1 arquivo novo com 7 efeitos do Guia Avançado do Shinobi (GAS).

## Arquivos novos

- `effects-guia-avancado.json` (7 efeitos):
  - Dano Contínuo (Nv 2) — projétil DoT
  - Deslocamento de Vácuo (Nv 2) — suporte mobilidade
  - Purificar (Nv 2) — ambiente
  - Repelir (Nv 2) — reação defensiva
  - Projetar (Nv 3) — projétil desloca alvo
  - Cegante (Nv 5) — projétil aplica camuflagem
  - Desastre (Nv 9) — concentração épica

## Antes de codar

1. **Leia `/tmp/lote-4e-README.md`** — pontos importantes:
   - Repelir é REATIVO (trigger: projétil/toque/golpear contra você ou alguém no alcance)
   - Dano Contínuo aplica dano FIXO por turno (não modificável por bônus)
   - Desastre tem `rules.oncePerScene: true` + `noAptidoesDeTecnica: true`
   - Cegante aplica camuflagem NO INIMIGO (não no usuário) — comportamento inverso de Falsa Posição/Magen
   - Vários poderes em `availableFor` não existem no catálogo ainda (Kamijutsu, Sumi, Kumo, Hebi, Ototon, Shouton etc.) — está documentado em `_meta.unmodeledPowers`. **Comportamento esperado**: seeder grava o efeito mesmo assim; quando o poder for catalogado depois, vínculo automático. Não tente validar/filtrar isso agora.

2. **Schema não muda** — sem migration.

3. **NÃO incluir revisões** dos efeitos existentes (Orbe Nv 7, Onda Explosiva Nv 8, Lança ignora 3 dureza etc.) — isso fica pra migration de revisão futura.

## Tarefas

1. Atualizar `seedPowerEffects()` em `prisma/seed.ts` pra incluir o arquivo novo
2. Rodar `pnpm prisma db seed`
3. Validar no Prisma Studio:
   - Tabela `power_effects` tem 138 linhas totais (131 anteriores + 7 novos)
   - **Dano Contínuo**: `availableFor` com 12 entradas, `rules.damagePerTurn: "nivel_do_poder"`
   - **Repelir**: `rules.reactive: true`, `rules.triggers` com 3 itens
   - **Desastre**: `minLevel: 9`, `rules.oncePerScene: true`

## ⛔ Limites

- **NÃO modele** poderes faltantes (Kamijutsu, Sumi Ninpou, Kumo Ninpou etc.) ainda
- **NÃO crie** migration de revisão dos efeitos antigos do 4a
- **NÃO toque** em outros JSONs
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Total final de efeitos no banco: **138**
- LOTE 4 (Efeitos) está COMPLETO
- Poderes mencionados em `availableFor` que ainda não existem no banco (lista em `_meta.unmodeledPowers`)
- Revisões do GAS aos efeitos existentes (Orbe Nv 7, Onda Explosiva Nv 8 etc.) ainda PENDENTES — vão em migration de revisão
- Próximo passo sugerido: **Lote 5 (Aptidões ~80)** — Comuns, de Combate, de Manobra, Restritas (Byakugan, Sharingan, Tenketsu Byakugan, Hakken no Jutsu, Companheiro Animal, Corpulência, Resiliência, Kikaichuu, etc.)
```
