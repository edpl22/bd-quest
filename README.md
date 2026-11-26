# BD Quest — Banco de Dados I

Site de treino para a VF de Banco de Dados I (09913), seguindo os assuntos da FOE:
conceitos básicos, arquitetura, modelagem conceitual e lógica, modelo ER, modelo relacional,
mapeamento ER→relacional, álgebra relacional, SQL (DDL e DML) e triggers.

- **Teoria**: resumo do material de aula, na notação usada pelo professor (cardinalidade Heuser/brModelo, notação resumida).
- **Trilha**: ~70 níveis com correção automática e passo a passo.
- **Boss final**: 3 projetos completos no formato da prova — conceitual → lógico → DDL → consultas → gatilho.
- **Playground**: SQL, álgebra relacional e editor ER livres.

## Como funciona (sem servidor)

É um site 100% estático. O "backend" roda no navegador:

| Peça | O que faz |
|---|---|
| [PGlite](https://pglite.dev) (PostgreSQL compilado para WebAssembly) | executa SQL de verdade, inclusive `CREATE TRIGGER` / PL/pgSQL |
| `js/algebra.js` | interpreta álgebra relacional (σ π ρ ⋈ × ∪ ∩ − ÷ γ ⟕ ⟖ ⟗) traduzindo para SQL |
| `js/er.js` | editor ER estilo brModelo + corretor do modelo conceitual |
| `js/relational.js` | lê a notação resumida (`TABELA (#pk, ...)` / `x referencia T`) e compara com o gabarito |
| `js/sqlcheck.js` | corrige SQL comparando com a solução de referência (resultados, catálogo e testes de restrições/gatilhos) |

O progresso fica no `localStorage` do navegador.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `bd-quest`).
2. Envie estes arquivos para a branch `main`:
   ```bash
   git init
   git add .
   git commit -m "BD Quest"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/bd-quest.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, pasta `/ (root)`. Salve.
4. Em ~1 minuto o site estará em `https://SEU_USUARIO.github.io/bd-quest/`.

O arquivo `.nojekyll` evita que o GitHub processe o site com Jekyll.

## Rodar localmente

Qualquer servidor estático serve (módulos ES não funcionam via `file://`):

```bash
python -m http.server 8765
```

e abra `http://localhost:8765`.

## Estrutura

```
index.html
css/style.css
js/main.js            páginas e rotas (#/trilha, #/nivel/2-2, #/teoria/er, #/boss/b1/0 ...)
js/content/theory.js  teoria
js/content/levels.js  níveis da trilha
js/content/bosses.js  os 3 bosses
js/data/seeds.js      bancos: emp (script da disciplina), ar (álgebra), vazio
js/data/clube.js      banco clubdata (pgexercises)
```

Para adicionar um nível, acrescente um objeto em `js/content/levels.js` (tipos: `quiz`, `er`, `map`, `ra`, `sql`).
