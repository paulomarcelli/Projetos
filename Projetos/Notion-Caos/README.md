# Notion · Magia do Caos

Tema animado para o Notion, no estilo magia do caos e mudança de realidade. Toda a arte é original: selos, runas e
emblemas desenhados em código, sem símbolos, imagens ou textos de filmes e quadrinhos.

Prévia: https://paulomarcelli.github.io/Projetos/Projetos/Notion-Caos/

## O que tem

| Pasta | O que é | Como usar no Notion |
| --- | --- | --- |
| `arte/capas/` | 12 capas animadas (SVG 1500×600), uma por página | Capa › Trocar › Link |
| `arte/icones/` | 12 ícones animados (SVG 256×256) | Ícone › Link |
| `arte/divisor.svg` | linha de energia para separar seções | `/image` › Link |
| `widgets/portal/` | relógio, saudação, frase do dia e 8 portais para as páginas; a realidade muda a cada 16 s ou com um clique | `/embed` |
| `widgets/feitico/` | relógio de estudos (substitui o Relógio de Estudos): 60 runas acendem com o tempo, sino no fim, conta os feitiços do dia | `/embed` |

## Por que assim

O Notion não aceita CSS nem JavaScript próprio. O que dá para animar é o que o Notion mostra como imagem (capas,
ícones, imagens) e o que vem de fora por `/embed`. Os SVGs têm a animação dentro deles (CSS), então se mexem no
Notion sem nenhum plugin. Os widgets rodam no GitHub Pages.

## Gerar a arte de novo

```bash
python3 ferramentas/gerar_arte.py
```

Para criar uma capa nova, acrescente a página em `PAGINAS` (emblema, cor de acento e semente) e rode de novo.

## Backup

O design anterior do Notion está salvo no Figma ("Notion — design atual (backup 14-11-2026)") e numa página privada
do próprio Notion ("Backup do tema · antes da Magia do Caos"), com o ícone, a capa e as cores de cada página. A pasta
`backup/` fica só na máquina local (está no `.gitignore`) porque o repositório é público.
