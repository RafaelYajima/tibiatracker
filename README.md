# ⚔️ TibiaTracker — Boss Rotation Profit Tracker

App web para rastrear lucros de rotações de boss no **Tibia**. Ao final de cada sessão,
cole o texto do **Hunt Analyser** (botão *Copy to Clipboard* do client) e o app faz o
parsing automático de sessão, loot, supplies, balance (profit), XP e da lista de itens
dropados — substituindo o bloco de notas do time.

![stack](https://img.shields.io/badge/Next.js-App%20Router-black) ![db](https://img.shields.io/badge/PostgreSQL-Supabase%20ready-336791) ![ui](https://img.shields.io/badge/Tailwind-v4-38bdf8)

## Funcionalidades

- **Personagens reais via TibiaData API**: busque o boneco pelo nome exato e o app
  puxa level, vocação e mundo direto da API da comunidade
  ([TibiaData](https://tibiadata.com), dados oficiais do tibia.com) — com fallback
  automático para o ambiente `dev` se a produção estiver instável.
- **Profit organizado por boneco**: cada hunt salva é vinculada a um personagem e o
  Dashboard/Histórico ganham filtro por char (página **Personagens** mostra sessões,
  profit e XP acumulados de cada um, com botão de atualizar os dados).
- **Colar → Preview instantâneo**: parse de `Session`, `XP Gain`, `XP/h`, `Loot`,
  `Supplies`, `Balance` e de todos os itens da seção real `Looted Items:`
  (`Nx a/an item name`), mantendo compatibilidade com o formato legado.
- **Dashboard**: 4 stat cards (Profit, Loot, Gasto, Sessões), gráfico de área do
  profit por dia e top 8 itens mais dropados (Recharts).
- **Histórico completo**: tabela paginada, expansível por linha para ver os itens
  de cada hunt.
- **Filtros de período**: Hoje · 7 Dias · 30 Dias · Este Mês · Tudo
  (a query de data é aplicada no banco).
- **Formatação de GP estilo Tibia**: `1.50kk`, `250.0k`, `950 gp`.
- **Mobile-first** com sidebar fixa no desktop + gaveta no celular (feito para
  usar durante a rotação).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- PostgreSQL via **Drizzle ORM** (funciona em qualquer Postgres — inclusive Supabase)
- Recharts · date-fns · lucide-react

## Guia completo de conexão e deploy

Se esta é sua primeira vez usando essas ferramentas, siga o guia detalhado:

**[Conectar GitHub + Supabase + Vercel, passo a passo](./docs/DEPLOYMENT.md)**

Ele inclui criação das contas/projetos, proteção de senhas, publicação automática,
configuração da Vercel, checklist e solução dos erros mais comuns.

## Setup rápido (Supabase + local)

1. **Crie o projeto no Supabase** (grátis): <https://supabase.com>

2. **Crie as tabelas** — no Dashboard do Supabase, abra **SQL Editor → New query**,
   cole todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
   O script cria `hunts`, `hunt_items`, índices e as policies `Allow all` de RLS.

3. **Configure o ambiente**:

   ```bash
   cp .env.example .env.local
   ```

   Edite `.env.local` com a connection string
   (Supabase → botão **Connect** → **Transaction pooler**, recomendado para Vercel):

   ```
   DATABASE_URL=postgresql://postgres.SEU-PROJETO:[SUA-SENHA]@aws-0-....pooler.supabase.com:6543/postgres?sslmode=require
   DATABASE_POOL_MAX=1
   ```

4. **Instale e rode**:

   ```bash
   npm install
   npm run dev
   ```

   Abra <http://localhost:3000>, clique em **Nova Hunt**, cole o texto do Hunt
   Analyser e salve a primeira sessão.

> Como o schema é criado pelo SQL acima, o `drizzle-kit push` não é necessário no
> Supabase — ele serve apenas para bancos locais/fresh.

## Deploy (Vercel — grátis)

1. Publique o repositório: `bash scripts/publish.sh "feat: versão inicial"`.
2. Em <https://vercel.com>, **Add New → Project**, importe o repo do GitHub.
3. Em **Environment Variables**, adicione `DATABASE_URL` com o **Transaction pooler**
   do Supabase (porta 6543) e `DATABASE_POOL_MAX=1`.
4. Deploy. Depois disso, cada push na `main` publica automaticamente.

## Como usar durante a rotação

1. Termine a sessão e abra o **Hunt Analyser** no client do Tibia.
2. Clique em **Copy to Clipboard**.
3. No app, **Nova Hunt** → cole no campo → confira o preview (Loot / Supplies / Profit / itens).
4. **Salvar Hunt** — o app volta pro dashboard em ~1.5s.
5. Acompanhe o profit do time no **Dashboard** e o detalhe de cada sessão no **Histórico**.

## Formato do clipboard (client real)

```
Session data: From 2026-10-19, 20:52:54 to 2026-10-19, 21:18:51
Session: 00:25h
Raw XP Gain: 120,294
XP Gain: 180,431
Raw XP/h: 278,135
XP/h: 417,179
Loot: 757,866
Supplies: 255,875
Balance: 501,991
Damage: 403,113
Damage/h: 1,073,041
Healing: 134,361
Healing/h: 357,653
Killed Monsters:
  12x flimsy lost soul
  1x scorpion
Looted Items:
  2x a silver token
  3x a gold token
  96x a royal star
  1x a collar of red plasma
```

O parser extrai `Session`, `XP Gain`/`XP/h` (ignorando as linhas `Raw`), `Loot`,
`Supplies` e `Balance`; ignora `Session data`, `Damage`, `Healing` e a lista de
`Killed Monsters`; e normaliza os itens de `Looted Items` ("2x a silver token" →
**Silver Token ×2**, removendo o artigo e aplicando Title Case). Casos de
`Loot: 0`, `Balance` negativo e `Looted Items: None` também funcionam.
O formato legado com seções `Loot:`/`Supplies:` no estilo "Nome: quantidade"
continua sendo aceito.

**Teste de regressão**: as amostras reais do client ficam salvas em
[`tests/hunt-analyser-parser.test.mjs`](./tests/hunt-analyser-parser.test.mjs) —
rode `node tests/hunt-analyser-parser.test.mjs` para validar o parser (28 asserções).

## Estrutura

```
src/
  app/
    page.tsx                       # Dashboard (/)
    new/page.tsx                   # Nova Hunt (/new)
    history/page.tsx               # Histórico (/history)
    characters/page.tsx            # Personagens (/characters) — ganhos por boneco
    api/hunts/route.ts             # GET ?filter=&character= + POST (hunt + itens em batch)
    api/characters/route.ts        # GET (com agregados) + POST (busca na TibiaData e salva)
    api/characters/[id]/route.ts   # PATCH (atualiza via TibiaData) + DELETE (hunts sobrevivem)
    api/characters/lookup/route.ts # GET — proxy da TibiaData API (preview antes de salvar)
  components/                      # Sidebar, StatCards, charts, tabela, picker/filtro de char
  hooks/                           # useHunts (TimeFilter + personagem), useCharacters
  lib/
    parser.ts                      # Parser do clipboard do Hunt Analyser
    tibiadata.ts                   # Cliente da TibiaData API v4 (prod + fallback dev)
    vocations.ts                   # Cor/ícone por vocação
    format.ts                      # Formatação de GP (kk / k / gp)
    time.ts                        # TimeFilter -> data de início (date-fns)
    stats.ts                       # Agregações (totais, profit/dia, top itens)
  db/schema.ts                     # characters + hunts + hunt_items (Drizzle)
supabase/schema.sql                # SQL completo p/ Supabase (tabelas + índices + RLS + migration)
```

---

Feito para o seu time de rotação. **Boss Rotation Tracker v1.0** 🏆
