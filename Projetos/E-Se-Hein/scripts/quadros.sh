#!/usr/bin/env bash
# Renderiza quadros soltos (para conferir encaixe) e monta uma folha de contato.
# Uso: bash scripts/quadros.sh <composicao> <quadro> [quadro...]
set -euo pipefail
comp="$1"; shift
mkdir -p out/quadros
for f in "$@"; do
  npx remotion still "$comp" "out/quadros/$comp-$f.png" --frame="$f" --log=error >/dev/null
done
args=(); for f in "$@"; do args+=(-i "out/quadros/$comp-$f.png"); done
n=$#
ffmpeg -y -loglevel error "${args[@]}" -filter_complex "$(for i in $(seq 0 $((n-1))); do printf '[%d]scale=270:480[s%d];' $i $i; done)$(for i in $(seq 0 $((n-1))); do printf '[s%d]' $i; done)xstack=inputs=$n:layout=$(python3 -c "
n=$n;c=min(n,6);print('|'.join(f'{(i%c)*270}_{(i//c)*480}' for i in range(n)))")" out/quadros/folha-$comp.png
echo "out/quadros/folha-$comp.png"
