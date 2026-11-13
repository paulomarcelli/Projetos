#!/usr/bin/env bash
# Recompila do zero o motor web enxuto do jogo:
#   web/motor/godot.web.template_release.wasm32.nothreads.zip
# (o export_presets.cfg usa esse zip como modelo de exportação da versão web).
#
# O perfil (o que entra e o que sai do motor) está em web/motor/custom.py.
# Precisa de git, python3 e uns 6 GB livres; leva de 40 a 60 minutos em 4 núcleos.
#
# Uso: ferramentas/motor_web.sh [pasta_de_trabalho]
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
TRABALHO="${1:-$RAIZ/../motor-web-build}"
EMSDK_VERSAO="3.1.64"      # o mesmo Emscripten das versões oficiais do Godot 4.3
GODOT_TAG="4.3-stable"     # tem de ser a mesma versão do editor que exporta o jogo
ZIP="godot.web.template_release.wasm32.nothreads.zip"

mkdir -p "$TRABALHO"
cd "$TRABALHO"

python3 -m pip install --quiet scons

if [ ! -d emsdk ]; then
	git clone --depth 1 https://github.com/emscripten-core/emsdk.git
fi
(cd emsdk && ./emsdk install "$EMSDK_VERSAO" && ./emsdk activate "$EMSDK_VERSAO")
# shellcheck disable=SC1091
source emsdk/emsdk_env.sh

if [ ! -d godot ]; then
	git clone --depth 1 -b "$GODOT_TAG" https://github.com/godotengine/godot.git godot
fi

cd godot
scons platform=web target=template_release threads=no profile="$RAIZ/web/motor/custom.py" -j"$(nproc)"
cp "bin/$ZIP" "$RAIZ/web/motor/$ZIP"
echo "Motor pronto: web/motor/$ZIP"
