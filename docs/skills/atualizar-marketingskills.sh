#!/usr/bin/env bash
# Atualiza as skills do pacote Marketing Skills (coreyhaines31/marketingskills, MIT) em .claude/skills/.
# Uso, na raiz do repositório: bash docs/skills/atualizar-marketingskills.sh
# Não apaga skill que o pacote tenha removido: confira o diff e decida à mão.
set -euo pipefail
raiz="$(git rev-parse --show-toplevel)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone -q --depth 1 https://github.com/coreyhaines31/marketingskills.git "$tmp/ms"
for dir in "$tmp/ms/skills"/*/; do
  nome="$(basename "$dir")"
  destino="$raiz/.claude/skills/$nome"
  rm -rf "$destino"
  mkdir -p "$destino"
  (cd "$dir" && find . -path ./evals -prune -o -type f -print | while read -r f; do
    mkdir -p "$destino/$(dirname "$f")"
    cp "$f" "$destino/$f"
  done)
  cp "$tmp/ms/LICENSE" "$destino/LICENSE"
done
cp "$tmp/ms/LICENSE" "$raiz/docs/skills/MARKETINGSKILLS-LICENSE"
cp "$tmp/ms/VERSIONS.md" "$raiz/docs/skills/MARKETINGSKILLS-VERSIONS.md"
echo "Commit do pacote: $(git -C "$tmp/ms" log -1 --format='%h %cd')"
git -C "$raiz" status --short -- .claude/skills docs/skills | head -40
