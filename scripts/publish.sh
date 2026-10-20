#!/usr/bin/env bash
# Publica uma versão validada no GitHub.
# Uso: bash scripts/publish.sh "descrição da alteração"
#
# Autenticação suportada:
# 1. Credencial Git já configurada no computador; OU
# 2. Secrets GITHUB_TOKEN + GITHUB_REPOSITORY (usuario/tibiatracker).
set -euo pipefail

MESSAGE="${1:-chore: atualizar TibiaTracker}"

if [[ ! -d .git ]]; then
  echo "ERRO: Git ainda não foi inicializado." >&2
  exit 1
fi

# Segurança: aborta se algum arquivo de ambiente secreto estiver rastreado.
TRACKED_ENVS="$(git ls-files '.env' '.env.local' '.env.*.local' 2>/dev/null || true)"
if [[ -n "$TRACKED_ENVS" ]]; then
  echo "ERRO: arquivo de ambiente secreto está rastreado pelo Git:" >&2
  echo "$TRACKED_ENVS" >&2
  echo "Remova-o do índice antes de publicar: git rm --cached <arquivo>" >&2
  exit 1
fi

# Configura o origin pelo secret, se ainda não existir.
if ! git remote get-url origin >/dev/null 2>&1; then
  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    git remote add origin "https://github.com/${GITHUB_REPOSITORY}.git"
    echo "Remote origin configurado: https://github.com/${GITHUB_REPOSITORY}.git"
  else
    echo "ERRO: configure o remote origin ou o secret GITHUB_REPOSITORY." >&2
    exit 1
  fi
fi

echo "[1/5] Testando parser real..."
node tests/hunt-analyser-parser.test.mjs

echo "[2/5] Gerando tipos do Next.js..."
npx next typegen

echo "[3/5] Verificando TypeScript..."
npm exec tsc -- --noEmit --pretty false

echo "[4/5] Gerando build de produção..."
npm run build

echo "[5/5] Criando commit..."
git add -A

if git diff --cached --quiet; then
  echo "Nenhuma alteração nova para commit. Enviando a branch atual..."
else
  git commit -m "$MESSAGE"
fi

git branch -M main

# Se há token no ambiente, usa GIT_ASKPASS sem gravá-lo no remote ou no disco.
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  ASKPASS_FILE="$(mktemp)"
  trap 'rm -f "$ASKPASS_FILE"' EXIT
  cat > "$ASKPASS_FILE" <<'ASKPASS'
#!/usr/bin/env bash
case "$1" in
  *Username*) echo "x-access-token" ;;
  *Password*) echo "$GITHUB_TOKEN" ;;
  *) echo "" ;;
esac
ASKPASS
  chmod 700 "$ASKPASS_FILE"
  GIT_ASKPASS="$ASKPASS_FILE" GIT_TERMINAL_PROMPT=0 git push -u origin main
else
  git push -u origin main
fi

echo "OK: código validado e publicado no GitHub."
