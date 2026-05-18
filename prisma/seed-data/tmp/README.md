# Seed Data — Lote 6h (Equipamento Geral)

Oitava onda da fase 6. **29 itens** utilitários do dia-a-dia shinobi.

## 📦 Conteúdo

| Arquivo | Itens |
|---|:---:|
| `equipment-general.json` | **29** |

## 🎯 Distribuição

| Subtype | Quantidade | Itens |
|---|:---:|---|
| `ferramenta_comum` | 6 | Algemas, Corda 15m, Instrumento Musical, Lanterna, Caneta, Sela |
| `recipiente` | 2 | Coldre/Bolsa com Cinto (+1 comp), Mochila (+4 comps) |
| `kit` | 4 | Kit de Artesão, Ferramentas, Medicamentos, Laboratório (5 usos cada) |
| `pergaminho_papel` | 3 | Pergaminho de Jutsus, Pergaminho de Escrita, Tarja Especial (em branco) |
| `campismo` | 2 | Saco de Dormir, Ração de Viagem |
| `animal` | 2 | Cão de Guarda, Cavalo |
| `veiculo` | 3 | Carroça, Carruagem, Canoa |
| `servico` | 7 | Bebida, Estadia, Refeição, Mensageiro, Estábulo, Condução Terrestre/Marítima |

## 🔑 Decisões importantes

### 1. Serviços têm `slots: null`

Bebida, Estadia, Refeição, Mensageiro, Estábulo, Condução Terrestre/Marítima são **consumidos no momento da compra** — não ocupam compartimento. Modelei com `slots: null` + `effects.isService: true`. Útil pra UI de loja e controle de despesas, mas não aparecem no inventário do personagem.

### 2. Animais e Veículos também sem slots

Cão de Guarda, Cavalo, Carroça, Carruagem, Canoa — não cabem em "compartimentos" do personagem. Existem no banco como entradas pra economia e referência narrativa. Estatísticas mecânicas (HP do cão, deslocamento do cavalo) ficam **a cargo do Mestre** — não modelei porque o RAW não traz.

### 3. Kits com `effects.uses: 5`

Os 4 kits têm 5 usos cada. Motor deve decrementar a cada uso (ex: criar armadilha consome 1 uso de Kit de Ferramentas).

### 4. Mochila e Coldre com `compartmentBonus`

Mochila: +4 compartimentos. Coldre/Bolsa com Cinto: +1 compartimento. Motor soma esses bônus à capacidade base do personagem (3 comps).

### 5. Pergaminho de Jutsus vs Tarja Especial

São itens diferentes:
- **Pergaminho de Jutsus** (10 Ryos): pra **Fuuinjutsu Nv1** — selos básicos (armazenar itens/jutsus/chakra).
- **Tarja Especial em branco** (10 Ryos): pra **Fuuinjutsu Nv3+** — criar Selos Avançados (Misshi/Bakudan/Gensou/Wana — modelados no 6g).

Ambos são consumíveis (destruídos no uso).

### 6. Pílulas do Soldado NÃO está aqui

Aparece na tabela do Livro Básico p. 140 como item geral, mas já modelei no 6g como `CONSUMABLE`. Não duplica.

### 7. Caneta sem slots

`slots: null` + `effects.negligibleWeight: true`. Item "desprezível" do RAW (não ocupa compartimento). Mesma lógica dos Tampões de Ouvido no 6f.

## ⚠️ Pendências

- **Estatísticas dos animais**: o RAW não dá HP/atributos/deslocamento de Cão de Guarda e Cavalo. Quando o personagem comprar, fica como dado vivo da campanha. Posso modelar templates de PdM separadamente se você quiser.
- **Veículos sem capacidade explícita**: Canoa "1-3 pessoas" é estimativa interpretativa. Carroça/Carruagem não têm número definido no RAW.

## ✅ Validação pós-seed

Total acumulado:
- 6a-6g: 119 equipamentos
- 6h: +29 = **148 equipamentos**

Verifique:
- `mochila.effects.compartmentBonus` = 4
- `kit_de_medicamentos.effects.uses` = 5
- `tarja_especial.subtype` = "pergaminho_papel"
- `cavalo.subtype` = "animal" e `slots` = null
- `bebida.effects.isService` = true
- Caneta tem `slots: null` (item desprezível)

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed-data/
│   │   ├── (anteriores)
│   │   └── equipment-general.json    ← NOVO (6h)
```

---

# 🛠️ Comandos manuais seus

```bash
cd ~/projects/arcana-forge

# Confirma 6a-6g aplicados (119 equipamentos)
pnpm tsx scripts/validate-seed-data.ts

# Descompacta 6h
unzip ~/Downloads/seed-data-lote-6h.zip -d /tmp/

cp /tmp/seed-data-lote-6h/equipment-general.json prisma/seed-data/
cp /tmp/seed-data-lote-6h/README.md /tmp/lote-6h-README.md
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 6h: Equipamento Geral (29 itens)

Penúltimo lote da fase 6. Itens utilitários gerais + animais + veículos + serviços.

## Arquivos novos

- `prisma/seed-data/equipment-general.json` — 29 itens

## Antes de codar

1. **Leia `/tmp/lote-6h-README.md`**
2. Confirme 6a-6g aplicados (119 equipamentos)
3. Schema NÃO muda — usa mesmo model Equipment

## Tarefas

### 1. Atualizar lista em prisma/seed.ts

```typescript
const equipmentFiles = [
  // ... anteriores
  'equipment-general.json',                // 6h
];
```

### 2. Rodar seed

```bash
pnpm prisma db seed
```

### 3. Verificar

```sql
-- Total
SELECT COUNT(*) FROM equipments;
-- Esperado: 148

-- Por kind
SELECT kind, COUNT(*) FROM equipments GROUP BY kind;
-- Esperado: GENERAL=29, WEAPON=58, ARMOR=6, TOOL=9, AMMO=3, CONSUMABLE=35
-- (Os números podem variar levemente. O importante: GENERAL=29)

-- Serviços
SELECT code FROM equipments 
WHERE kind = 'GENERAL' AND effects->>'isService' = 'true';
-- Esperado: 7 (bebida, estadia, refeição, mensageiro, estábulo, condução terrestre/marítima)
```

### 4. Testes mínimos

```typescript
describe('Seed: Lote 6h - Equipamento Geral', () => {
  it('tem 148 equipamentos totais', async () => {
    const count = await prisma.equipment.count();
    expect(count).toBe(148);
  });

  it('Mochila dá +4 compartimentos', async () => {
    const m = await prisma.equipment.findUnique({ where: { code: 'mochila' } });
    expect(m?.effects?.compartmentBonus).toBe(4);
  });

  it('Kits têm 5 usos', async () => {
    const kits = await prisma.equipment.findMany({
      where: { subtype: 'kit' }
    });
    for (const kit of kits) {
      expect(kit.effects?.uses).toBe(5);
    }
  });

  it('Caneta é item de peso desprezível (sem slots)', async () => {
    const c = await prisma.equipment.findUnique({ where: { code: 'caneta' } });
    expect(c?.slots).toBe(null);
    expect(c?.effects?.negligibleWeight).toBe(true);
  });

  it('Serviços não ocupam compartimento', async () => {
    const servicos = await prisma.equipment.findMany({
      where: { subtype: 'servico' }
    });
    expect(servicos.length).toBe(7);
    for (const s of servicos) {
      expect(s.slots).toBe(null);
      expect(s.effects?.isService).toBe(true);
    }
  });

  it('Tarja Especial é consumível pra Fuuinjutsu Nv3+', async () => {
    const t = await prisma.equipment.findUnique({ where: { code: 'tarja_especial' } });
    expect(t?.subtype).toBe('pergaminho_papel');
    expect((t?.effects?.compatibleWith as string[])).toContain('fuuinjutsu_nv3_plus');
  });
});
```

## ⛔ Limites

- **NÃO modele** armas/armaduras de hijutsu (6i) ainda — último lote da fase

## Após aplicar

Atualize SESSION-LOG.md:

```markdown
## Lote 6h (Equipamento Geral) — APLICADO
- 29 itens utilitários
- Kits (4), recipientes (2), ferramentas (6), pergaminhos em branco (3), campismo (2)
- Animais (2), veículos (3), serviços (7)
- Total: 148 equipamentos
- Próximo: 6i (Armas/Armaduras exclusivas de Hijutsu) — ÚLTIMO LOTE DA FASE 6
```
```
