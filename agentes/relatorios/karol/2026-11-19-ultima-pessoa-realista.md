# Vídeo "E se você fosse a última pessoa do mundo?" · primeiro no estilo realista (v2)

Karol · de 19 a 21/11/2026 · pedido do Paulo: produzir o vídeo de 19/11 no estilo realista aprovado, com o 3D no
Blender (técnica da `how-its-built-starter`), as camadas 2D da v2 no Remotion, a rodada obrigatória de conferência dos
quadros e o render final com a GPU (RTX 5050). Em 21/11 o Paulo pediu para a Sofia, com as skills novas de Blender,
melhorar o acabamento e o personagem antes do render, e para usar a skill graphify.

Partes da `superpowers` usadas (regra 1 do arquivo da Karol): `writing-plans` (plano em tarefas no começo de cada
etapa), `test-driven-development` (as regras de tempo e de legenda da v2 nasceram dos testes, que falharam antes do
código), `systematic-debugging` (o "No frame found" do Remotion) e `verification-before-completion` (a conferência do
MP4 com a saída dos comandos). A skill `superpowers` não está instalada nesta máquina; segui as partes pelo nome.

## O que foi feito

1. **Voz e mapa de tempo.** O MP3 e o `videos/ultima-pessoa.json` vieram prontos da nuvem (9 trechos, 178 palavras).
   Gerei de novo o áudio normalizado: -16,52 → **-13,95 LUFS**. O `preparar.mjs` quebrava no Windows (caminho
   `\C:\...` vindo de `import.meta.url`); corrigido com `fileURLToPath`.
2. **3D no Blender, por código** (`blender/`), Blender 5.3 sem janela, Cycles com OptiX:
   - `ultima-pessoa.spec.json`: 7 planos, com os trechos que cada um cobre e os eventos presos a palavras da fala
     (a técnica da how-its-built: a peça chega na palavra). Os cortes ficam no meio da pausa entre trechos.
   - `comum.py`: tempo pela fala, materiais procedurais, céu físico com o sol, névoa de distância, câmera de drone.
   - `paulista.py`: a Avenida Paulista inventada (3,5 km, ciclovia vermelha no canteiro, calçadas com árvores, torres,
     torres de TV em treliça, um museu suspenso por pórticos vermelhos, espigão com o terreno descendo). P1 cheia →
     vazia em "última" → fim da tarde e luzes em "acende"; P5 anos depois (mato, rachaduras, chuva, vidro sujo,
     janelas quebradas, manchas); P7 vazia e limpa. Mesmo enquadramento nos três.
   - `outras.py`: P2 cidades sem nome apagando uma por uma; P3 corte genérico do metrô (rua, terra com canos, túnel,
     bomba no poço, lençol freático, água cobrindo só os trilhos); P4 supermercado (geladeira apaga, frutas
     murcham); P6 Pripyat (prédios de painel, roda-gigante amarela, árvores tomando tudo, ninguém em cena).
   - `render.py`: monta um plano e renderiza quadros soltos ou a sequência (retoma de onde parou).
3. **Camadas 2D da v2** (`src/v2/`, `src/lib/v2.ts`): véu, filtro do céu, contador no canto (8,3 bilhões contando
   até 1 em escala logarítmica), fato, título, legenda de frase inteira (até 60 caracteres e 2 linhas; quebra na
   vírgula ou antes de "e", "se", "que", "mas" e "ou"; "mil novecentos e oitenta e seis" vira "1986") e fechamento com
   o círculo laranja nascendo do "você". Fontes `@fontsource/newsreader` e `@fontsource/ibm-plex-sans` (5.3.0,
   travadas). Só os dados conferidos pela Sabrina vão para a tela. `Root.tsx` escolhe a v2 pelo mapa `ESTILO_V2`; Lua
   e Sol seguem na v1, sem mudança.
4. **Scripts:** `scripts/conferencia-v2.mjs` (quadros-chave no Blender + 2D por cima + folha) e `scripts/render-v2.mjs`
   (sequências dos planos, conferência do número de quadros e MP4 de cada plano).
5. **Sofia (21/11):** acabamento 3D e personagem com as skills novas (`blender-director` e especializadas). Relatório
   em `agentes/relatorios/sofia/2026-11-21-ultima-pessoa-blender.md`; regras em `docs/design-system.md`, seção
   "Acabamento 3D".
6. **Graphify (21/11):** instalei o CLI (`graphifyy` 0.9.114, com aprovação do Paulo) e montei o grafo de código do
   E-Se-Hein com `graphify update .` (745 nós, 1.796 ligações, 45 grupos, sem LLM e sem crédito). Usei para conferir
   que `VideoV2` não tem caminho até o mundo da v1 (`graphify path "VideoV2" "Mundo"`: nenhum). A extração semântica
   dos documentos (que gasta crédito) não foi feita.

## Rodada de conferência (antes e depois)

Folhas em `Projetos/E-Se-Hein/out/conferencia/` (fora do git): `folha-aprovacao.jpg` (aprovada pelo Paulo),
`antes-depois.jpg` (minhas correções) e `sofia-antes-depois.jpg` (acabamento da Sofia).

| Cena | Problema achado (lista da Karol) | Correção |
|---|---|---|
| Paulista | Dia estourado, céu leitoso, sol atrás da câmera e sem sombra na avenida | Exposição, sol de lado e baixo; depois a Sofia saturou o céu e escureceu os telhados |
| Paulista | "Xadrez" de janelas acesas em pleno dia | Luz interna fraca de dia, subindo só no fim da tarde |
| Metrô | Túnel fundo demais, bomba na faixa da interface do TikTok, metade de baixo vazia | Túnel raso, câmera reta, lençol freático; a Sofia achou o Boolean que apagava o túnel e remontou em blocos |
| Supermercado | Teto vazio na metade de cima, geladeira longe, depois o fato cobrindo o "você" | Câmera começa perto da geladeira e recua; o "você" foi para o fundo, fora do fato |
| Anos depois | Efeito fraco; legenda em 3 linhas | Vidro sujo e janela quebrada preta, manchas escorridas, mais mato; quebra da legenda antes de conjunção (testado) |
| Pripyat | Chão vazio, roda-gigante na faixa da legenda | Mais árvores e chão escuro; câmera com a roda acima da legenda |
| Personagem | Bloco amarelo sem forma | Pessoa de 1,75 m com braços, mãos, cabelo e tênis (Sofia); do alto, o mesmo boneco 6× para virar o ponto amarelo |

## Render

- **Blender:** 1.999 quadros em 1080 × 1920, 24 amostras, OptiX. Com um processo, a GPU ficava em ~97% durante o
  quadro e ~0% entre um quadro e outro (atualização da cena e gravação): 3,6 s por quadro. Com **duas filas em
  paralelo** (P1, P3, P5 e P2, P4, P6, P7), a GPU ficou em 96% e o conjunto fez **~1,5 a 2,5 s por quadro**. Total:
  84 min (os primeiros 138 quadros do P1 numa fila só).
- **MP4 dos planos:** a primeira versão saiu com quadros B e cor em faixa cheia (`yuvj420p`, herdada dos JPEG), e o
  Remotion falhou com "No frame found at position". Recodificado sem quadro B, em `yuv420p` com faixa de vídeo e um
  quadro-chave por segundo; regra no `render-v2.mjs`.
- **Remotion:** com `OffthreadVideo` sobre os MP4 dos planos, o erro "No frame found" voltou (em outro quadro a cada tentativa). O vídeo final saiu com a composição lendo os JPEG do Blender direto (modo `quadros`, um `<Img>` por quadro): **131 s** para 2.090 quadros, sem segunda compressão. O comando em primeiro plano passou de 10 min e foi morto uma vez; em segundo plano, com log, deu certo.

## Conferência do MP4

`out/ultima-pessoa.mp4` (140,6 MB, fora do git; cópia em Downloads):

| Item | Esperado | Medido |
|---|---|---|
| Formato | 1080 × 1920, 30 fps | 1080 × 1920, 30 fps, h264 + AAC estéreo 48 kHz, 2.090 quadros |
| Duração | ~69,6 s | 69,67 s (65,6 s de voz + 4 s de fechamento) |
| Voz | -14 LUFS | -14,01 LUFS, pico -1,48 dBTP |
| Sincronia | legenda com a voz | nas 20 pausas, o recomeço da fala bate com o início da palavra: diferença máxima de 2 ms |
| Quadro preto | nenhum | nenhum quadro com brilho médio abaixo de 3; 9 quedas bruscas, todas conferidas na imagem: cortes P1→P2, P2→P3 e P4→P5, as cidades apagando e a geladeira apagando |

Folha final (um quadro por cena, tirado do MP4): `out/final/folha-final.jpg`.

## O que funcionou no Blender (e virou regra)

- **Planos por spec e eventos por palavra.** O spec diz o que acontece em qual palavra; o tempo vem do JSON da voz.
  Trocar a voz não exige mexer na cena.
- **Mesma conta de quadros nos dois lados.** Blender e Remotion usam `round(fim·30) − round(início·30)`. Um quadro a
  menos no Blender vira quadro preto no corte; o `render-v2.mjs` recusa codificar se a conta não bater.
- **Quadros soltos com o 2D por cima antes do render.** A folha de contato com os textos achou o que o 3D sozinho não
  mostra (texto sobre o personagem, legenda em 3 linhas, bomba na faixa da interface).
- **Material por atributo.** Milhares de prédios numa malha só, com o sorteio de cor e de janela num atributo por
  face; um material comum por tipo, com controles animáveis (rachar, mato, molhado, quebradas, manchas, sujo).
- **Duas filas de render.** Uma fila só deixa a GPU ociosa entre quadros; duas a mantêm cheia sem estourar a memória
  (4 de 8 GB, ~3 GB de RAM).
- **Sem Boolean em caixas sobrepostas** (achado da Sofia) e chão até o horizonte, para a névoa fechar o fundo.

## Pendências

- O "você" do alto é a mesma pessoa em escala 6× (3× na altura), sem sombra: é o ponto amarelo do Design System, mas
  não é escala real.
- Inclinação da câmera do drone: ~18°, para o horizonte cair em y ~480 como no quadro do Figma; o texto do Design
  System fala em 35° a 55°. Vale a Sofia alinhar o texto ao Figma.
- Ainda fracos (Sofia): as copas de Pripyat de perto, a água do metrô e as janelas quebradas vistas do alto.
- A extração semântica da graphify (documentos) não foi feita: gasta crédito.

```text
ENTREGA
Resumo: vídeo de 19/11 no estilo realista pronto: 7 planos no Blender por código, camadas 2D da v2 no Remotion,
conferência dos quadros com antes e depois, acabamento e personagem da Sofia, render com a GPU em duas filas.
Arquivos: Projetos/E-Se-Hein/blender/*, src/v2/*, src/lib/v2.ts, src/Root.tsx, tests/v2.test.ts,
scripts/conferencia-v2.mjs, scripts/render-v2.mjs, scripts/preparar.mjs (Windows), README.md, docs/PASSAGEM.md,
package.json (fontes); MP4 em out/ultima-pessoa.mp4 (fora do git).
Conferido: 50 testes e lint; grafo da graphify (v2 isolada da v1); folhas de conferência; MP4 com ffprobe, loudnorm, silencedetect e brilho de todos os quadros.
Pendências: as da seção acima.
Próximo: Paulo assiste e posta; Sofia revisa as pendências visuais para o próximo vídeo v2.
```
