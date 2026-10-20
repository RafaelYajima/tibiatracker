# Conectar GitHub, Supabase e Vercel — guia para iniciantes

Este guia é propositalmente detalhado. Você só precisa fazer a configuração uma vez.
Depois disso, o fluxo normal será:

1. o código é alterado;
2. os testes e o build são executados;
3. a alteração é enviada para o GitHub;
4. a Vercel percebe o push e publica a nova versão automaticamente;
5. o app publicado lê/escreve no PostgreSQL do Supabase.

## Visão geral (quem faz o quê)

```text
Você/assistente -> GitHub (código e histórico)
                         |
                         | push na branch main
                         v
                      Vercel (app Next.js publicado)
                         |
                         | DATABASE_URL secreta
                         v
                      Supabase (PostgreSQL persistente)
```

A TibiaData API é acessada pelo servidor do app e não exige chave.

---

## Parte 1 — GitHub

### 1. Criar uma conta

Acesse <https://github.com/signup> e crie a conta. Confirme o e-mail.

### 2. Criar o repositório vazio

1. Acesse <https://github.com/new>.
2. Em **Repository name**, use `tibiatracker`.
3. Recomendo **Private** enquanto o app é pessoal.
4. **Não marque** "Add a README", `.gitignore` ou licença. Esses arquivos já existem.
5. Clique em **Create repository**.
6. Guarde o identificador exibido na URL: `SEU-USUARIO/tibiatracker`.

### 3. Autorizar publicações automáticas deste ambiente

Nunca envie token, senha do Supabase ou `DATABASE_URL` no chat.
Cadastre-os na área de **Secrets / Environment Variables** da plataforma onde o
assistente está executando o projeto.

Crie um token no GitHub:

1. GitHub -> foto do perfil -> **Settings**.
2. **Developer settings** -> **Personal access tokens** -> **Fine-grained tokens**.
3. **Generate new token**.
4. Nome: `TibiaTracker deploy`.
5. Expiração: escolha um período e anote para renovar depois.
6. **Repository access**: *Only select repositories* -> `tibiatracker`.
7. **Repository permissions** -> **Contents: Read and write**.
8. Gere e copie o token (ele só aparece uma vez).

Na área de Secrets do ambiente deste projeto, adicione:

```text
GITHUB_REPOSITORY=SEU-USUARIO/tibiatracker
GITHUB_TOKEN=github_pat_...
```

- `GITHUB_REPOSITORY` não é secreto, mas pode ficar junto.
- `GITHUB_TOKEN` é secreto. Nunca coloque em `.env`, README ou mensagem.
- Se a plataforma oferece integração nativa com GitHub, ela é preferível ao token.

### 4. Como o envio funciona

O repositório local já está inicializado na branch `main`. Depois que os dois secrets
acima existirem, o comando de publicação é:

```bash
bash scripts/publish.sh "feat: descrever a alteração"
```

O script, antes de enviar:

- bloqueia arquivos `.env` acidentalmente rastreados;
- roda as 28 asserções do parser real;
- gera tipos do Next.js;
- valida TypeScript;
- gera o build de produção;
- cria commit e faz push na `main`.

Depois da primeira configuração, o assistente pode executar esse fluxo ao final de
cada rodada de alterações, desde que os secrets continuem disponíveis.

### 5. Conferir no GitHub

Abra `https://github.com/SEU-USUARIO/tibiatracker`:

- aba **Code**: arquivos e commits;
- aba **Actions**: pipeline "Validar TibiaTracker". Ele deve ficar verde;
- nunca deve existir `.env` ou `.env.local` na lista de arquivos.

---

## Parte 2 — Supabase (banco de dados)

### 1. Criar o projeto

1. Acesse <https://supabase.com/dashboard>.
2. Entre (pode usar a conta do GitHub).
3. **New project**.
4. Nome: `TibiaTracker`.
5. Gere uma senha forte para o banco e guarde em um gerenciador de senhas.
6. Escolha a região mais próxima (São Paulo, se disponível).
7. Crie o projeto e aguarde a inicialização.

### 2. Criar as tabelas

1. No menu do projeto, abra **SQL Editor**.
2. Clique em **New query**.
3. No GitHub/projeto, abra `supabase/schema.sql`.
4. Copie o conteúdo completo, cole no editor e clique em **Run**.
5. O resultado deve mostrar sucesso.
6. Em **Table Editor**, confirme as tabelas:
   - `characters`
   - `hunts`
   - `hunt_items`

O SQL também cria chaves estrangeiras, índices e RLS.

### 3. Copiar a conexão correta

Para Vercel, use **Transaction pooler**, pois funções serverless abrem conexões curtas:

1. No topo do projeto Supabase, clique em **Connect**.
2. Escolha **Transaction pooler**.
3. Copie a URI. Ela normalmente usa:
   - host `*.pooler.supabase.com`;
   - porta `6543`;
   - usuário `postgres.REFERENCIA_DO_PROJETO`.
4. Troque `[YOUR-PASSWORD]` pela senha do banco.

Formato aproximado (não invente host/usuário; copie do seu painel):

```text
postgresql://postgres.PROJECT_REF:SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres?sslmode=require
```

Se a senha tiver caracteres como `@`, `:`, `/`, `#` ou `%`, use a URI fornecida pelo
painel ou aplique URL encoding. Uma alternativa simples é redefinir uma senha forte
composta por letras e números.

### 4. Usar Supabase localmente

Crie `.env.local` (ele está protegido pelo `.gitignore`):

```text
DATABASE_URL=postgresql://...:6543/postgres?sslmode=require
DATABASE_POOL_MAX=1
```

Reinicie o servidor e abra:

```text
http://localhost:3000/api/health
```

Resposta esperada:

```json
{"ok":true}
```

Se retornar 500, revise senha, host, porta e se o SQL foi executado.

> Não é necessário instalar o pacote JavaScript `@supabase/supabase-js`: o app usa
> Drizzle ORM diretamente no PostgreSQL do Supabase. Essa é uma conexão Supabase
> válida e mantém todas as queries tipadas no servidor.

---

## Parte 3 — Vercel

Esta parte é feita no navegador depois que o GitHub recebeu o primeiro push.

### 1. Importar o projeto

1. Acesse <https://vercel.com/signup>.
2. Entre com **Continue with GitHub**.
3. Autorize a Vercel a acessar o repositório `tibiatracker`.
4. No dashboard, **Add New -> Project**.
5. Encontre `tibiatracker` e clique em **Import**.
6. A Vercel detectará **Next.js** automaticamente. Não altere build/output/root.

### 2. Adicionar as variáveis antes do deploy

Abra **Environment Variables** na tela de importação e adicione:

```text
DATABASE_URL = URI Transaction pooler do Supabase (porta 6543)
DATABASE_POOL_MAX = 1
```

Marque **Production**, **Preview** e **Development**. `DATABASE_URL` não tem prefixo
`NEXT_PUBLIC_`, pois é uma credencial exclusivamente server-side.

Clique em **Deploy**.

### 3. Validar a publicação

Quando o deploy terminar:

1. abra a URL fornecida pela Vercel;
2. acesse `/api/health` — deve retornar `{"ok":true}`;
3. abra **Personagens**, busque um boneco real e cadastre;
4. registre uma hunt de teste;
5. no Supabase **Table Editor**, confirme as linhas em `characters`, `hunts` e `hunt_items`.

### 4. Deploys seguintes são automáticos

Depois da integração GitHub/Vercel:

- push em `main` -> deploy de produção automático;
- Pull Request/outra branch -> preview separado;
- mudança de variável na Vercel -> precisa fazer **Redeploy** para aplicar.

---

## Checklist final

- [ ] Repositório privado `tibiatracker` criado vazio no GitHub
- [ ] `GITHUB_REPOSITORY` configurado no ambiente do projeto
- [ ] `GITHUB_TOKEN` configurado como secret (Contents: read/write)
- [ ] Primeiro `bash scripts/publish.sh "feat: versão inicial"` concluído
- [ ] GitHub Actions verde
- [ ] Projeto Supabase criado e senha guardada
- [ ] `supabase/schema.sql` executado sem erro
- [ ] Transaction pooler (porta 6543) copiado
- [ ] `DATABASE_URL` e `DATABASE_POOL_MAX=1` configurados na Vercel
- [ ] Repositório GitHub importado na Vercel
- [ ] `/api/health` da Vercel retorna `{"ok":true}`
- [ ] Personagem/hunt de teste aparecem no Supabase

## Erros comuns

### `DATABASE_URL is required`
A variável não foi criada na Vercel ou não foi marcada para o ambiente do deploy.
Adicione-a e faça **Redeploy**.

### `password authentication failed`
Senha incorreta ou caracteres especiais não codificados na URI. Copie novamente a
URI e redefina a senha no Supabase, se necessário.

### `ENETUNREACH`, `ENOTFOUND` ou timeout
Provavelmente foi usada a conexão **Direct** (IPv6) em vez do **Transaction pooler**.
Copie a URI de Transaction pooler, host `*.pooler.supabase.com`, porta `6543`.

### Build verde, mas `/api/health` retorna 500
O código compilou, mas a aplicação não conectou no banco. Verifique a variável na
Vercel, rode o SQL no Supabase e faça um novo deploy.

### Push retorna 403
O token não tem `Contents: Read and write`, expirou ou não tem acesso ao repositório.
Gere um novo fine-grained token e atualize o secret.

### Repositório não aparece na Vercel
Em Vercel -> Settings -> Git, revise a instalação do GitHub e permita acesso ao
repositório privado `tibiatracker`.
