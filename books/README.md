# 📖 Livros do Sistema Shinobi no Sho 4.1b

Esta pasta contém os PDFs oficiais do sistema de RPG que o Arcana Forge implementa. São **referência de consulta**, não código.

## ⚖️ Sobre copyright

Os PDFs aqui são propriedade dos autores originais do sistema **Shinobi no Sho 4.1b**. Esta pasta está incluída no `.gitignore` por padrão — **nunca commite os PDFs em repositório público**.

Quem clona este repositório precisa obter os livros separadamente para ter acesso à referência completa.

## 📚 Arquivos esperados

| Arquivo | Conteúdo principal |
|---|---|
| `livro-basico-4.1b.pdf` | Regras core: atributos, perícias, combate, aptidões comuns, poderes elementais, equipamentos, criação de personagem, evolução |
| `livro-hijutsus-4.1b.pdf` | Técnicas secretas, kekkei genkais (Hyouton, Sharingan, Mokuton, etc.), Jinchuuriki, Senjutsu, Edo Tensei |
| `guia-avancado-4.1b.pdf` | Regras opcionais, expansões, regras de XP alternativas, criação avançada, hijutsus exclusivos |

## 🎯 Quando consultar (resumo)

Consulte os livros **apenas** quando:

- Aparece regra/técnica não detalhada em `arcana-forge-spec/`
- Conflito aparente entre dois pontos da spec (livro é desempate)
- Precisa texto exato pra descrição no seed do banco
- Valida fórmula que parece estranha

**NÃO consulte para:**
- Decidir arquitetura de software
- Refazer regras já documentadas em `04-RULES-ENGINE.md`
- "Inspiração" pra features fora do MVP

Veja a seção completa "Livros do sistema" em `CLAUDE.md` na raiz.

## 🔍 Como consultar eficientemente

1. **Busca por palavra-chave** dentro do PDF (Ctrl+F / Cmd+F).
2. **Sumário primeiro** para identificar a seção certa.
3. **Cite página** quando documentar extração (ex: "Livro Básico p. 87").
4. **Não copie integralmente.** Use como entendimento, escreva descrição própria.

## 🚨 Quando o livro contradiz a spec

Documente a divergência em `SESSION-LOG.md` e **continue seguindo a spec** até decisão humana.
