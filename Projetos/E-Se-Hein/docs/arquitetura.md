# Arquitetura

## Partes

1. **Dados** (`videos/<tema>.json`): áudio, roteiro, pergunta final, trechos (texto, início, fim, cena) e palavras com
   tempo. Gerados por `scripts/preparar.mjs`; contrato em `src/tipos.ts`.
2. **Composição** (`src/Video.tsx`): lê os dados, calcula em que cena está cada quadro, mistura a câmera e o clima
   entre duas cenas na passagem (1,8 s, no meio da pausa entre trechos) e desenha as camadas.
3. **Mundo 3D** (`src/mundo/`): um só cenário contínuo (cidade à beira-mar, praia com régua de maré, mar, céu noturno
   e uma Terra de brinquedo no alto). A câmera voa de um ponto a outro, sem corte seco.
4. **Cenas** (`src/cenas/`): cada arquivo diz a pose da câmera, o clima (Lua, luar, breu, maré, Terra), a pose do
   boneco, os objetos próprios e os rótulos. As animações se prendem às palavras com `aos("palavra")`.
5. **Camadas 2D** (`src/camadas/`): legenda (uma palavra por vez), rótulos presos aos objetos pela projeção da mesma
   câmera, contexto, marca-d'água e fechamento.

## Decisões (ADR curto)

**ADR 1 — Transcrição com whisper.cpp local (`@remotion/install-whisper-cpp`).**
A skill indica o `@remotion/whisper-webgpu`, mas ele exige GPU, e a máquina não tem. O whisper.cpp roda na CPU, sem
custo, em cerca de 40 s para 60 s de áudio com o modelo `small`. Descartado: API paga de transcrição.

**ADR 2 — O roteiro manda na grafia, o áudio manda no tempo.**
As palavras do roteiro são alinhadas com as da transcrição pela maior subsequência comum (aceita diferença pequena
de grafia). O que não casa é distribuído entre as âncoras. Depois, as pausas medidas pelo `silencedetect` corrigem os
finais de palavra que o Whisper estica por cima do silêncio.

**ADR 3 — Um mundo contínuo em vez de uma cena 3D por trecho com corte.**
A referência visual não tem cortes duros. Por isso as cenas definem poses e clima num mundo compartilhado, e a
composição interpola entre elas. Trocar o visual de um trecho é trocar um arquivo em `src/cenas/`. Descartado: um
`<ThreeCanvas>` por cena com transição de opacidade (dois contextos WebGL ao mesmo tempo e corte visível).

**ADR 4 — Legenda própria em vez do elemento Basic Captions.**
O elemento da skill espera as legendas escritas no código; aqui elas vêm do JSON do vídeo, e o pedido é uma palavra
por vez. O componente `src/camadas/Legenda.tsx` usa as regras testadas em `src/lib/tempo.ts`.
