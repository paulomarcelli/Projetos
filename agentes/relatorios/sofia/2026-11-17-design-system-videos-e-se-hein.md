# Design System dos vídeos · E Se, Hein? (17/11/2026)

## 1. Pedido

Criar no Figma o Design System dos vídeos verticais do canal E Se, Hein? (paleta, legenda, zonas seguras, rótulos,
personagem, fechamento e storyboard do vídeo da Lua) e documentar em `docs/design-system.md` para a Karol.

## 2. A ideia

Um mundo de brinquedo que a câmera atravessa sem cortar; o texto é grosso, curto e fica sempre no mesmo lugar.

Partes da `design-skills` usadas: `figma-design-workflow`, `design-system`, `design-token`, `motion-system`,
`illustration-style`. Não há parte de storyboard na skill: o storyboard seguiu o `figma-design-workflow` (plano,
criação em lotes, captura e correção). No Figma: `figma-use`, `figma-generate-library` e `figma-generate-design`.

## 3. O que mudou

**Figma, arquivo novo:** [E Se, Hein? · Design System dos vídeos](https://www.figma.com/design/okTGRiK8lTEXSoP9QDm0du)

- Variáveis: coleção Mundo (44 cores, modos Dia, Noite e Breu), Marca e rótulos (8 cores), Medidas (26 números),
  todas com escopo e sintaxe CSS (`var(--mundo-ceu-topo)`).
- Estilos: 12 de texto (Rubik no vídeo, Inter na documentação) e 1 de sombra (Sombra/Dura).
- Componentes: Ícone (9), Seta (6), Pílula (4), Texto preso (2), Rótulo de contexto (2), Legenda (2), Cartão (3, com
  troca de ícone), Marca / Símbolo E? (3), Marca / Assinatura (2), Marca-d'água, Guia / Zonas seguras, Personagem /
  Você (3 vistas), Fechamento.
- Páginas: Capa, Fundamentos, Componentes, Personagem, Fechamento, Storyboard · Lua (8 quadros 1080 × 1920 + notas).

**Figma, arquivo da logo** ([tQIfaeQgkOZhwh60i6Y5fH](https://www.figma.com/design/tQIfaeQgkOZhwh60i6Y5fH)): nova
seção "Definitiva · Conceito A" com o símbolo em quatro combinações de cor e a assinatura em tinta sobre branco e
sobre laranja. A rodada 2 já estava lá só como componentes em preto.

**Repositório (só `docs/`):**

- `Projetos/E-Se-Hein/docs/design-system.md`
- `Projetos/E-Se-Hein/docs/tokens.css`
- `Projetos/E-Se-Hein/docs/tokens.json`

## 4. Capturas

Em `/tmp/claude-0/-home-user/61176afd-f1be-57bd-aa55-21470799267f/scratchpad/videos/capturas/` (fora do repositório):
`storyboard-lua.png`, `capa.png`, `paleta.png`, `legenda-zonas.png`, `personagem.png`, `icones-setas-svg.png`.
O storyboard também está em `.../scratchpad/videos/storyboard-lua.png`.

## 5. Conferido em

- Captura de cada página e de cada quadro do storyboard com `get_screenshot` / `screenshot()` depois de montar.
- Defeitos achados e corrigidos: pílula grande cortando o texto (largura fixa); sombra e vão da bermuda sem
  transparência; "&quot;" na descrição da pele; céu curto no Q2 (faixa branca) e brilho da cidade duro; opacidade
  passada no lugar do raio (água opaca escondendo os corais e juntas da laje opacas); traços de SVG alinhados por
  dentro (pernas dos caranguejos invisíveis); pílulas sobrepostas no Q5; rótulo "TERRA" sobre o eixo no Q6;
  fechamento com pergunta fraca e espaço solto; títulos sobrepostos na página de componentes.
- Larguras reais da legenda medidas no Figma em 112 px ("desaparecesse?" 949 px, cabe em 84 px).
- Contraste calculado: branco/vermelho 4,2:1, branco/verde 4,2:1, tinta/laranja 6,1:1.
- Contagem final: 78 variáveis (52 cores, 26 números), igual ao `tokens.json`.
- Não houve build nem render: o código é da Karol.

## 6. Ficou de fora

- **Conteúdo:** fatos dos rótulos (marés com cerca de 1/3, inclinação de 22,1° a 24,5°, desova dos corais) precisam
  da checagem da Sabrina antes de publicar.
- **Visual:** abertura de 1 s não desenhada; capas do projeto e dos vídeos não pedidas.
- **Código:** nada mudou em `src/`; a lista do que mudar está no `design-system.md`.

## 7. Próximos passos

1. Karol: trocar a fonte para Rubik e ajustar a legenda (tamanho, posição, contorno, encolher pela largura real).
2. Karol: ajustar pílulas, texto preso, contexto, marca-d'água, setas e ícones às medidas do documento.
3. Karol: adotar os três modos de cor de `docs/tokens.json` e misturar na transição.
4. Karol: refazer o fechamento pelo componente (alinhado à esquerda, pergunta curta).
5. Sabrina: checar os fatos dos rótulos.
6. Sofia: conferir o primeiro render contra o storyboard (quadros nos mesmos tempos).
