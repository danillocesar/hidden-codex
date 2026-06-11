# FASE 7 — COMPLETA

Encerramento de todos os 10 sub-lotes (7e0/7e1/7e2 + 7f/7f2 + 7g + 7h + 7i + 7j) + cleanup do validador.

## 📊 Estado final do banco

| Tabela | Início Fase 7 | Final Fase 7 | Δ |
|---|---|---|---|
| Aptitudes | 145 | **180** | +35 |
| Powers | 32 | **47** | +15 |
| Effects | 121 | **186** | +65 |
| Equipments | 149 | **151** | +2 |

**Validador final: 0 erros.**

## 📦 Lotes entregues

| Lote | Conteúdo | Arquivos |
|---|---|---|
| **7a** | Samurai (8 aptidões + Armadura) | aptitudes-samurai.json + equipment-armor-samurai.json |
| **7b** | 7 powers órfãos (hachimon, jiton, sabaku, yonbi/sanbi suiton/youton, senjutsu, aoi katon) | powers-orphans.json |
| **7c** | Kaguya (artesão upsert + 6 novas) | aptitudes-kaguya.json |
| **7d** | Fuuma + Yuki congelamento upsert | aptitudes-fuuma-yuki.json |
| **7e0** | Patch Dokujutsu (13 effects RAW vs 16 errados; Energizar Venenoso refator) | (patches) |
| **7e1** | Sharingan stack — Mangekyou power + 6 técnicas + Hipnose Sharingan aptidão + refator Mímica/Reverter Ilusão | powers-uchiha-mangekyou.json + effects-mangekyou-sharingan.json + aptitudes-uchiha-doujutsu.json |
| **7e2** | Suika expandido — 4 effects (Braço de Água, Afogar, Monstro de Água, Clone de Óleo) + Pistola D'Água variant | effects-suika.json + variant no Canhão |
| **7f** | Jinchuuriki base (1 power + 11 effects) | powers-jinchuuriki.json + effects-jinchuuriki.json |
| **7f2** | Bijuus 1-9 (9 aptidões + 2 powers + 20 effects + 2 equipamentos) | 4 arquivos novos + correção factual (Nekozume/Sangoshō movidos) |
| **7g** | Senninka power + 2 effects + juuin_jutsu | powers-senninka.json + effects-senninka.json + patch fuuinjutsu |
| **7h** | Rinnegan + 7 Caminhos + Rinne Ninpou | powers-rinnegan.json + aptitudes-rinnegan.json + effects-rinnegan.json |
| **7i** | Kami Ninpou refino — Shikigami no Mai + 3 effects (Anjo, Julgamento, Emissário Divino) | aptitudes-kami-ninpou.json + effects-kami-ninpou.json |
| **7j** | Nintaijutsu + Hibon Ninpou + Armadura de Raios + 8 effects | powers-nintaijutsu-hibon.json + aptitudes-nintaijutsu.json + effects-nintaijutsu.json |
| **Cleanup** | 7 grants sem bypass + 11 refs parametrizadas declaradas + 3 erros factuais corrigidos | (patches em vários arquivos) |

## 🐛 Erros factuais antigos descobertos e corrigidos

1. **Dokujutsu** (lote 4f): `allowedEffects` tinha 16; RAW lista 13. Removidos `dano_continuo`, `purificar`, `cegante`.
2. **Nekozume** (lote 7b): estava em effects-aoi-katon.json. RAW p.35: técnica do Jinchuuriki Matatabi.
3. **Sangoshō** (lote 7b): estava em effects-sanbi-suiton.json. RAW p.37: técnica do Jinchuuriki Isobu.
4. **7 técnicas Nintaijutsu** (lote 4c): Elbow/Straight/Lariat/Hell Stab/Guillotine Drop/Linger Bomb/Reverse Chop estavam em effects-hachimon.json como técnicas do Hachimon Tonkou. RAW p.62-64: são do Nintaijutsu (que nem existia como power). Erro mais grave do projeto.

## 🔧 Schema patterns novos estabelecidos

1. **Power virtual sem progressão** (7e1 Mangekyou Sharingan) — flag `isVirtualPower: true` + `noLevelProgression: true` + `fixedLevelForDifficulty: 10`.
2. **subTechnique compartilhada entre effects** (7e1 kamui_teletransporte) — flag `sharedAcrossKamuiEffects: true`. Motor dedup runtime.
3. **variants dentro de effect universal** (7e0/7e2 Energizar Venenoso, Pistola D'Água) — `rules.variants.<aptitude_ou_power>` aplica overrides condicionais.
4. **Marker aptitude com tabela embutida** (7f2 jinchuuriki_<bijuu>) — `effects.bijuuTable: Record<nivel, string[]>`. Motor consulta tabela ao subir nível.
5. **Power virtual que NÃO segue regras de Ninpou** (7f2b Gobi Futton) — flag `doesNotFollowNinpouRules: true`.

## ❌ Edo Tensei NÃO modelado

Verificado nos 3 PDFs (Básico, Hijutsus, GAS): zero matches. O que funcionalmente equivale é **Reanimação** dentro do Caminho Gedō (Rinnegan), que já está modelado. Se houver fonte canônica do Edo Tensei separada (Fuuinjutsu de selamento da alma estilo Tobirama), pode ser modelada em lote separado.

## 📋 Decisões de não-modelagem (com justificativa)

- **Sumi/Kumo/Hebi Ninpou refino**: zero conteúdo factual fora de citações em listas universais. Sem effects exclusivos pra modelar.
- **Quimeras dedicadas**: Cachorro Quimera + Camaleão Quimera já modelados como creatures[] no Caminho Chikushōdō. Sem fonte adicional.
- **Juuinka III**: não existe no RAW. Apenas Juuinka I e II.

## 📁 Total de arquivos novos em prisma/seed-data/ (Fase 7)

```
aptitudes-fuuma-yuki.json
aptitudes-jinchuuriki-bijuus.json
aptitudes-kaguya.json
aptitudes-kami-ninpou.json
aptitudes-nintaijutsu.json
aptitudes-rinnegan.json
aptitudes-samurai.json
aptitudes-uchiha-doujutsu.json
effects-jinchuuriki.json
effects-jinchuuriki-bijuus.json
effects-kami-ninpou.json
effects-mangekyou-sharingan.json
effects-nintaijutsu.json
effects-rinnegan.json
effects-senninka.json
effects-suika.json
equipment-armor-samurai.json
equipment-jinchuuriki-bijuus.json
powers-jinchuuriki.json
powers-jinchuuriki-bijuus.json
powers-nintaijutsu-hibon.json
powers-orphans.json
powers-rinnegan.json
powers-senninka.json
powers-uchiha-mangekyou.json
```

25 arquivos.

## 📋 Prompt pro Claude Code aplicar

```bash
# Backup completo antes de aplicar fase inteira
docker exec arcana-forge-db pg_dump -U postgres arcana_forge > /tmp/pre-fase7-FULL-backup.sql

# Aplicar seeds
cd /path/to/arcanaforge
pnpm prisma db seed

# Verificar via Prisma Studio:
# - aptitudes:  180 entries
# - powers:     47 entries
# - power_effects: 186 entries
# - equipments: 151 entries
```

## 🔗 Pendências pós-Fase 7

Refs parametrizadas (`<aptidao>_<param>`) ainda declaradas como `unmodeledAptitudes` em vários arquivos. Padrão semântico do projeto sem documentação canônica em SCHEMA-PATTERNS §2. Decisão pra próxima sessão de motor de regras: ou converter pra `{aptitude, parameter}` objetos OU adicionar parser de split no motor.

11 refs ativas:
- `guerreiro_pesadas`, `guerreiro_longas` (em manuevers)
- `usar_arma_nunchaku`, `usar_arma_cimitarra`, `usar_arma_florete`, `usar_arma_espada_longa`, `usar_arma_chicote`, `usar_arma_corrente_com_cravos`, `usar_arma_machado`, `usar_arma_martelo_de_guerra`, `usar_arma_leque_gigante`, `usar_arma_espada_de_duas_laminas`, `usar_arma_besta_pesada` (em weapons-gas)
- `maestria_fuuton`, `usar_arma_leque_gigante` (em fuuton)
- `perito_medicina`, `pericia_inata_medicina` (em iryou)
- `clone_moku_bunshin` (em mokuton)
- `resistencia_maior_vigor` (em orphans)

Nenhuma dessas bloqueia a Fase 7 — todas declaradas em `_meta.unmodeledAptitudes` dos arquivos respectivos.
