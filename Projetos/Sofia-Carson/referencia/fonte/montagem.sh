#!/bin/sh
# Junta os cinco clipes na montagem do fundo: trechos curtos, corte seco, preto e branco, sem áudio, ~2 MB.
# uso: sh montagem.sh cinegrafista.mp4 maos.mp4 olho.mp4 diretor.mp4 boom.mp4 public/video/montagem.mp4
# Os trechos (0–4, 0–3, 0–2, 0–2,2, 0–1,8 s) são os da demo: em clipes novos, escolha o trecho bom de cada um
# (o começo costuma ser o mais fiel ao quadro inicial). Precisa de ffmpeg.
set -e
ffmpeg -v error -y -i "$1" -i "$2" -i "$3" -i "$4" -i "$5" -filter_complex \
  "[0]trim=0:4,setpts=PTS-STARTPTS[a];[1]trim=0:3,setpts=PTS-STARTPTS[b];[2]trim=0:2,setpts=PTS-STARTPTS[c];[3]trim=0:2.2,setpts=PTS-STARTPTS[d];[4]trim=0:1.8,setpts=PTS-STARTPTS[e];[a][b][c][d][e]concat=n=5:v=1,format=gray,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 24 -profile:v high -g 30 -movflags +faststart -an "$6"
# o pôster é o 1º quadro da montagem (o mesmo que a intro faz crescer até a tela)
ffmpeg -v error -y -i "$6" -frames:v 1 -q:v 3 "${6%.mp4}.jpg"
