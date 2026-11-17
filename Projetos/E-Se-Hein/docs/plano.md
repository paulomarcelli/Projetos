# Plano: base do projeto de vídeo "E Se, Hein?"

**Objetivo:** gerar vídeos verticais 1080 × 1920 a 30 fps a partir de dados (MP3 da Maia + roteiro), com legenda
sincronizada e cenas 3D trocáveis. Primeiro vídeo: "E se a Lua desaparecesse?".

**Arquitetura:** Remotion 4 com TypeScript e `@remotion/three`. Um mundo 3D único e contínuo (cidade, praia, mar e uma
Terra no céu). Cada trecho do roteiro aponta para uma **cena**: um arquivo em `src/cenas/` que define as poses da
câmera, o clima (Lua visível, estrelas, escuridão), os objetos próprios e os rótulos. A câmera interpola de uma cena
para a outra, sem corte seco. A legenda mostra uma palavra por vez.

**Dados:** `videos/<tema>.json` tem áudio, roteiro, trechos (texto, início, fim, cena), palavras com tempo, rótulo de
contexto e pergunta final. O script `scripts/preparar.mjs` gera esse arquivo a partir do MP3 e do roteiro.

## Restrições

- Sem API paga: transcrição com o whisper.cpp local (modelo `small`, multilíngue). Sem GPU, o `whisper-webgpu` não serve.
- Arquivos grandes fora do git: áudio, MP4, quadros, `node_modules/`, `out/`, `whisper.cpp/`, `.cache/`.
- Sem e-mail ou dado pessoal em arquivo. Sem commit nem push.
- Áreas da interface do TikTok livres: coluna da direita (botões) e faixa de baixo (texto do post).

## Tarefas

1. **Áudio** — `scripts/normalizar.mjs`: `loudnorm` em duas passadas para -14 LUFS, cópia em `public/audio/<tema>.wav`.
2. **Transcrição** — `scripts/transcrever.mjs`: whisper.cpp 1.5.5, palavras com tempo, `language: "pt"`.
3. **Alinhamento (TDD)** — `scripts/lib/alinhar.mjs`: alinha as palavras do roteiro exato (sem as marcações entre
   colchetes) com as da transcrição por programação dinâmica; palavras sem par recebem tempo interpolado. Também
   monta os trechos (um por parágrafo) com início e fim. Testes em `tests/alinhar.test.mjs`.
4. **Gerar os dados** — `scripts/preparar.mjs <tema> <mp3> <roteiro.txt>` junta 1 a 3 e grava `videos/<tema>.json`,
   mantendo os nomes de cena que já estiverem no arquivo.
5. **Tempo na composição (TDD)** — `src/lib/tempo.ts`: palavra ativa, cena ativa e mistura entre cenas. Testes em
   `tests/tempo.test.ts`.
6. **Mundo 3D** — `src/mundo/`: céu em degradê com nuvens pintadas e névoa, cidade low-poly, praia e mar, boneco
   "você", Lua e Terra. Tudo animado só por `useCurrentFrame()`.
7. **Cenas** — `src/cenas/`: uma por trecho, registradas em `src/cenas/index.ts`.
8. **Camadas 2D** — legenda (uma palavra por vez, a 68 % da altura), rótulos presos aos objetos (projeção da câmera),
   rótulo de contexto, marca-d'água, abertura de 1 s e fechamento de 4 s com a logo.
9. **Conferência** — quadros dos momentos principais, prévia em baixa resolução, MP4 final, LUFS do MP4.

## Pontos de atenção

- Palavra que o Whisper escreve diferente ("1/3" em vez de "um terço") não pode deslocar as seguintes.
- Pausas longas: a palavra não fica na tela durante o silêncio.
- Render sem GPU (WebGL por software): medir o tempo por quadro antes do render completo.
