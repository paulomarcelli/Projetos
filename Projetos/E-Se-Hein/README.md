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
# O mesmo com um bundle só (bem mais rápido: ~5 s por quadro na nuvem)
NODE_USE_ENV_PROXY=1 node scripts/quadros.mjs <tema> out/quadros-<tema> 30 300 900 1500

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

## Vídeo no estilo realista (v2, desde 19/11/2026)

O 3D é montado **no Blender, por código** (técnica da skill `how-its-built-starter`: a cena sai de um spec e cada
mudança acontece na palavra da fala), e o Remotion põe por cima as camadas 2D do Design System v2 (véu, contador no
canto, fato, título, legenda de frase inteira e fechamento). Precisa do Blender 4.2 ou mais novo (testado no 5.3) e de
placa de vídeo (RTX 5050 no PC do Paulo). Exemplo: `ultima-pessoa`.

1. **Voz e legenda:** como num vídeo comum (`preparar.mjs`). Se o JSON já veio pronto, só gere o áudio normalizado:
   `node scripts/normalizar.mjs audio/<tema>-maia.mp3 public/audio/<tema>.wav`.
2. **Planos:** em `blender/<tema>.spec.json`, um plano por cena, com os trechos que ele cobre, o modo de cor
   (`dia`, `noite`, `frio`) e os eventos presos a palavras (`{"o": "multidao_some", "palavra": "última", "trecho": 1}`).
   O corte fica no meio da pausa entre dois trechos. As cenas ficam em `blender/paulista.py` e `blender/outras.py`;
   as peças comuns (tempo pela fala, materiais, céu, câmera de drone), em `blender/comum.py`.
3. **Camadas 2D:** em `src/v2/<tema>.ts`, os estados do contador (só dados conferidos pela Sabrina), o fato e o
   título; registre o tema em `ESTILO_V2` (`src/Root.tsx`). As frases da legenda saem sozinhas do JSON
   (`src/lib/v2.ts`: até 60 caracteres e 2 linhas; o ano dito por extenso vira número).
4. **Rodada de conferência (obrigatória, antes do render):** renderiza os quadros-chave no Blender e põe o 2D por cima:
   ```bash
   node scripts/conferencia-v2.mjs ultima-pessoa P1:1.0,3.6 P2:20.5 P3:29.6 P4:35.5 P5:47.8 P6:50.6 P7:63.0
   ```
   Saída em `out/conferencia/<tema>/` (um JPG por quadro e `folha.jpg`). Confira cada um: pé ou cabeça fora do quadro,
   efeito fraco, objeto flutuando ou atravessando outro, texto fora da zona segura, cena vazia sem leitura do lugar,
   quadro preto. Corrija, guarde o antes e mostre o antes e depois. O Paulo aprova a folha.
5. **Render:** os planos no Blender (retoma de onde parou; `--limpar` depois de mudar uma cena) e o vídeo no Remotion:
   ```bash
   node scripts/render-v2.mjs ultima-pessoa --amostras 24
   npx remotion render ultima-pessoa out/ultima-pessoa.mp4 --codec=h264 --crf=18
   ```
   O `render-v2.mjs` confere se cada plano tem o número de quadros que o Remotion espera (senão sai quadro preto no
   corte). Os quadros ficam em `out/blender/`, e os MP4 dos planos em `public/blender/<tema>/` (fora do git).
6. **Conferir o MP4:** duração, -14 LUFS, sincronia da legenda e brilho de todos os quadros (como na seção Render).

**Tempo no PC do Paulo:** 2 a 3,5 s por quadro em 1080 × 1920 com 24 amostras (Cycles na GPU com OptiX), ou seja, cerca
de 1 h 30 para um vídeo de 70 s. Um quadro solto de conferência leva ~3 s, mais 8 a 30 s para montar a cena.

**Grafo do código:** `graphify update .` (pacote `graphifyy`) monta em segundos, sem LLM, o mapa de quem chama quem em
`graphify-out/` (fora do git). Ex.: `graphify path "VideoV2" "Mundo"` mostra que a v2 não depende do mundo da v1.

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
| `src/cenas/` | Uma cena por arquivo: câmera, clima, boneco, objetos e rótulos do trecho (as do Sol começam com `Sol`) |
| `src/mundo/` | Mundo 3D compartilhado: céu, Lua, cidade, praia e mar, boneco "você", Terra |
| `src/camadas/` | Camadas 2D: legenda, rótulos, contexto, marca-d'água, fechamento, cronômetro e termômetro |
| `blender/` | Estilo realista: spec dos planos, cenas montadas por código e o `render.py` |
| `src/v2/`, `src/lib/v2.ts` | Estilo realista: camadas 2D por cima dos planos do Blender e regras de tempo da legenda |
| `scripts/conferencia-v2.mjs`, `scripts/render-v2.mjs` | Rodada de conferência e render dos planos do estilo realista |
| `docs/` | Plano e arquitetura |

As cores do mundo (`src/mundo/paleta.ts`), a fonte e os componentes 2D seguem o Design System da Sofia
(`docs/design-system.md`). O realismo (texturas, céus HDRI, pós-processamento) está em `src/mundo/texturas.ts`,
`src/mundo/materiais.ts` e `src/mundo/Mundo.tsx`; as licenças, em `public/texturas/LICENCAS.md`.
