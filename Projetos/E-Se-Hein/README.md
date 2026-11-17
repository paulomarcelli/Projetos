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
npx remotion render <tema> out/<tema>.mp4 --codec=h264 --crf=18 --concurrency=1
```

Na primeira vez o Remotion baixa o navegador dele. Atrás de proxy, rode com `NODE_USE_ENV_PROXY=1`.

**Tempo de render sem GPU** (WebGL por software, 4 núcleos): cerca de 1,5 s por quadro, perto de 1 hora para um vídeo
de 69 s. Mais de uma aba (`--concurrency`) não acelera: o WebGL por software já usa todos os núcleos.

**Com placa de vídeo (PC com Windows e NVIDIA):** use a GPU no navegador do Remotion (`--gl=angle`) e ligue a
qualidade máxima (oclusão de ambiente e MSAA 4×) com `REMOTION_GPU=1`. No PowerShell:

```powershell
$env:REMOTION_GPU = "1"
npx remotion render lua out/lua-v2.mp4 --codec=h264 --crf=18 --gl=angle --concurrency=4
```

Sem `REMOTION_GPU`, o vídeo sai com SMAA e sem oclusão, como na nuvem. Nas cenas no espaço (Q5 e Q6) é sempre
assim, mesmo com GPU: com MSAA 4× o 3D saía preto em parte dos quadros.

**Tempo com GPU** (RTX 5050, `--concurrency=4`): 69 s para o vídeo da Lua inteiro (2.075 quadros, ~0,03 s por
quadro). Para confirmar que a GPU está em uso, rode `nvidia-smi` durante o render: o `chrome-headless-shell.exe` tem
que aparecer na lista. O `npx remotion gpu` não serve aqui, porque o navegador sem janela não abre `chrome://gpu`.

**Conferir quadros pretos:** um quadro que sai vazio no meio de uma cena não aparece na folha de contato se cair
fora dos quadros escolhidos. Meça o brilho de todos e procure quedas bruscas:

```bash
ffmpeg -v error -i out/lua-v2.mp4 -vf "scale=108:192,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=out/yavg.txt" -f null -
```

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

As cores do mundo (`src/mundo/paleta.ts`), a fonte e os componentes 2D seguem o Design System da Sofia
(`docs/design-system.md`). O realismo (texturas, céus HDRI, pós-processamento) está em `src/mundo/texturas.ts`,
`src/mundo/materiais.ts` e `src/mundo/Mundo.tsx`; as licenças, em `public/texturas/LICENCAS.md`.
