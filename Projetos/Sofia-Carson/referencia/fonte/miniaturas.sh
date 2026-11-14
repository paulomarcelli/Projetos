#!/bin/sh
# Miniaturas da intro (a coluna que sobe): um quadro de um clipe em 480 × 270, WebP.
# uso: sh miniaturas.sh <clipe.mp4> <segundo> <saida.webp>      (precisa de ffmpeg e cwebp)
# Foto em pé (como as dos filmes): ffmpeg -i foto.jpg -vf "crop=iw:iw*9/16:0:(ih-iw*9/16)/2,scale=480:270" ...
set -e
ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 -vf "scale=480:270" -q:v 4 /tmp/miniatura.jpg
cwebp -quiet -q 72 /tmp/miniatura.jpg -o "$3"
rm -f /tmp/miniatura.jpg
