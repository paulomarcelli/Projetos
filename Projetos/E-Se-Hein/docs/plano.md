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

---

# Plano v2: Design System da Sofia e storyboard (17/11/2026)

Fonte: `docs/design-system.md` (seção "O que muda no código atual"), `docs/tokens.json` e o storyboard da Lua.

1. **Texto (TDD)** — `src/lib/tempo.ts`: a legenda mantém a caixa do roteiro e o `?`/`!` do fim; em pausa maior que
   0,35 s sai 4 quadros depois da fala; palavra de destaque por trecho (`destaque` no JSON). Tamanho da legenda medido
   pela largura real (112 a 84 px, de 2 em 2), testado com uma função de medida injetada.
2. **Tokens** — `src/mundo/paleta.ts` lê `docs/tokens.json`; `src/mundo/materiais.ts` guarda um material por token e
   troca a cor a cada quadro pela mistura dos modos Dia, Noite e Breu (e Espaço). A luz fica fixa e neutra.
3. **Mundo** — laje alta na cidade (Q1 e Q7), morro fora da cidade com domo de luz (Q2), praia em corte com régua e
   faixas de maré (Q3), costa com caranguejos, ave e corais (Q4), Terra e Lua no espaço bem acima do mundo (Q5 e Q6),
   com a névoa escondendo o chão. Nuvens de 3 ou 4 esferas achatadas. Lua redonda, lisa, com crateras simples.
   Boneco com as medidas da Sofia (1,80 m), piscando e respirando.
4. **Componentes 2D** — Rubik 800/900; legenda; pílulas G e P; texto preso com guia; setas reta e curva; ícones
   amarelos de 168 px; cartões Um, Dois e Antes e depois; contexto (Texto e Tempo); marca-d'água; fechamento novo
   (círculo laranja nascendo da Lua). Rótulos com entrada e saída dos tokens de movimento, no máximo 3 na tela.
5. **Cenas** — reescrever as 7 cenas pelo storyboard; sem abertura (começa no Q1); passagem de 45 quadros.
6. **Conferência** — folha de contato comparada ao storyboard, testes, lint, render em `lua-v2.mp4`, LUFS e sincronia.

## Realismo (17/11/2026, pedido do Paulo)

Feito: texturas PBR do Poly Haven no chão, na areia e no asfalto; água e areia molhada refletindo o céu HDRI do modo;
Lua e Terra com as fotos da NASA (Terra com atmosfera); pós-processamento com brilho, tone mapping neutro, vinheta e
SMAA. Dois cuidados que custaram tempo:

- **O canvas só nasce com as texturas prontas.** O Remotion desenha o canvas quando ele é criado e a cada quadro; se a
  cena completa chega depois, o quadro sai vazio.
- **O EffectComposer monta depois do primeiro desenho.** O componente `Redesenhar` (em `Mundo.tsx`) desenha o quadro
  de novo depois que tudo montou e segura o render com `delayRender` até isso acontecer. Sem ele, o quadro sai vazio.

Ajustes de enquadramento pela folha de contato contra o storyboard: laje com 9 andares (a Lua aparece inteira no Q1),
boneco inteiro no Q2, régua no quadro no Q3, maré mais baixa no Q4 (caranguejos na areia), espuma fina e a câmera do
Q7 passando por cima do "você" na ida até a Lua.
