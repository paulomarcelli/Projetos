# E Se, Hein?

Vídeos curtos verticais (TikTok, Shorts e Reels) no formato "E se…?", narrados pela Maia. Feitos com
[Remotion](https://www.remotion.dev) e cenas 3D em Three.js (`@remotion/three`). Formato 1080 × 1920, 30 fps.

Cada vídeo é descrito por dados (`videos/<tema>.json`): áudio, roteiro, trechos com início, fim e cena, e as palavras
com tempo para a legenda. Um vídeo novo sai trocando só esses dados.

## Preparar

Precisa de Node 22, `ffmpeg` e `git` (para compilar o whisper.cpp na primeira vez).

```bash
npm install
```

## Vídeo novo a partir de um MP3 e de um roteiro

1. Salve o roteiro exato em `videos/<tema>.roteiro.txt`: um parágrafo por trecho, com linha em branco entre eles. As
   marcações de voz entre colchetes (`[calm]`, `[mysterious]`) ficam fora da legenda.
2. Rode:

   ```bash
   node scripts/preparar.mjs <tema> caminho/da/voz.mp3 videos/<tema>.roteiro.txt \
     --titulo "E se …?" --pergunta "Pergunta que fica no fechamento?"
   ```

   O script faz tudo sem API paga:
   - normaliza a voz para -14 LUFS (cópia em `public/audio/<tema>.wav`; o MP3 original não muda);
   - transcreve com o whisper.cpp local (modelo `small`, português; a primeira vez baixa e compila tudo em `whisper.cpp/`);
   - mede as pausas do áudio e alinha as palavras do roteiro com a transcrição (a grafia vem do roteiro);
   - grava `videos/<tema>.json` e mostra o mapa de tempo (início e fim de cada trecho).
3. Em `videos/<tema>.json`, escolha a cena de cada trecho no campo `"cena"` (nomes em `src/cenas/index.ts`). Trecho sem
   cena usa a `provisoria`. Rodar o script de novo mantém as cenas já escolhidas.
4. Veja no Studio: `npm run dev` (o vídeo aparece com o nome do tema).

## Render

```bash
# Quadros soltos + folha de contato (para conferir legenda e cenas)
bash scripts/quadros.sh <tema> 30 300 900 1500

# Prévia leve (metade da resolução)
npx remotion render <tema> out/<tema>-previa.mp4 --scale=0.5

# Final 1080 × 1920
npx remotion render <tema> out/<tema>.mp4 --codec=h264 --crf=18
```

Na primeira vez o Remotion baixa o navegador dele. Atrás de proxy, rode com `NODE_USE_ENV_PROXY=1`.

## Testes

```bash
npm test        # alinhamento, ajuste pelas pausas, tempo da legenda e das cenas
npm run lint    # eslint + tsc
```

## Estrutura

| Caminho | O que é |
|---|---|
| `videos/<tema>.json` | Dados do vídeo (contrato em `src/tipos.ts`) |
| `scripts/preparar.mjs` | MP3 + roteiro → JSON (normaliza, transcreve, alinha) |
| `scripts/lib/alinhar.mjs` | Alinhamento do roteiro com a transcrição |
| `src/Video.tsx` | Composição: abertura (1 s), mundo 3D, rótulos, legenda, fechamento (4 s) |
| `src/cenas/` | Uma cena por arquivo: câmera, clima, boneco, objetos e rótulos do trecho |
| `src/mundo/` | Mundo 3D compartilhado: céu, Lua, cidade, praia e mar, boneco "você", Terra |
| `src/camadas/` | Camadas 2D: legenda, rótulos, contexto, marca-d'água, fechamento |
| `docs/` | Plano e arquitetura |

O visual 3D, as cores do mundo (`src/mundo/paleta.ts`) e a fonte (`src/fontes.ts`) são **provisórios** até o Design
System da Sofia.
