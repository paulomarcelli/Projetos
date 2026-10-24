# Vídeo de apresentação da Luna

Vídeo técnico de 2:55 (1920 × 1080, 30 fps) que explica o que a Luna faz e como ela funciona por dentro. Todas as animações são desenhadas por código: cada quadro é uma página web fotografada e depois montada em MP4.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `roteiro.json` | **Configuração central:** tempos das cenas, legendas (que são o roteiro da narração) e os textos do título e do final. Edite aqui. |
| `ROTEIRO.md` | O roteiro completo para ler: o que aparece em cada cena e a narração com os tempos. |
| `cenas.html` + `cenas.js` | As 8 cenas animadas (diagramas, fluxos, legendas). Abra `cenas.html` por um servidor local para ver. |
| `capturar_telas.py` | Tira as capturas reais da interface da Luna usadas no vídeo (pasta `capturas/`). |
| `gerar_trilha.py` | Compõe a trilha sonora original (gerada por código, sem música de terceiros). |
| `renderizar.py` | Monta o vídeo final: desenha os quadros, junta a trilha e grava o MP4 e as legendas `.srt`. |

## Como gerar o vídeo de novo

Na pasta `Luna-AI`, com o Python, o `ffmpeg` e o Playwright instalados:

```bash
pip install playwright scipy numpy
python -m playwright install chromium
python video/renderizar.py
```

O vídeo sai em `video/saida/luna-ai.mp4` e as legendas em `video/saida/luna-ai.srt`. Leva uns 12 minutos.

Para conferir só um pedaço: `python video/renderizar.py --inicio 28 --fim 60`. Para ver alguns quadros como imagem: `python video/renderizar.py --quadros 5 40 150`.

## Como adicionar a narração

O vídeo tem as falas como legendas, mas ainda não tem voz. Para incluir:

1. Grave você mesmo lendo o `ROTEIRO.md`, ou gere a voz com um serviço de voz sintética, seguindo os tempos de cada fala.
2. Salve como um arquivo `.wav` com a duração do vídeo (2:55).
3. Rode:

```bash
python video/renderizar.py --narracao minha-narracao.wav
```

A música abaixa sozinha quando a voz entra, e o volume fica normalizado. Se preferir o vídeo sem legendas na imagem, acrescente `--sem-legendas`.

Se a voz for sintética, avise isso nos créditos.

## Escolhas técnicas

- **Por que HTML + Canvas + Playwright + FFmpeg, e não Remotion:** o Remotion precisa baixar pacotes do npm, o que não estava disponível no ambiente onde o vídeo foi feito. A mesma ideia (cenas em código e renderização quadro a quadro) ficou com ferramentas que já estavam instaladas. O resultado é determinístico: o mesmo roteiro sempre gera o mesmo vídeo.
- **Fontes:** o código pede as fontes da Luna (Cormorant Garamond e Nunito) e, se não estiverem instaladas, usa TeX Gyre Pagella e Poppins, que foram as usadas nesta renderização. Instale as originais pelo Google Fonts e renderize de novo para ficar idêntico ao site.
- **Capturas:** são telas reais da interface. Só a resposta da conversa de exemplo é fixa (a resposta-modelo das instruções da Luna), e o vídeo marca isso na tela.
- **Trilha:** composta por código (acordes em Ré maior, sinos e arpejo suave), então não tem problema de licença.
