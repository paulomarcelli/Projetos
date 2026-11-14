> Tradução e adaptação para o português do Brasil, feita pela ProfitizeBuild, da skill original em inglês tasteskill v2, de Leonxlnx, sob a licença MIT (veja o LICENSE).

# Direção de Arte (`direcao-de-arte`)

Uma skill de design para agentes de código, construída a partir de um estudo de 247 sites selecionados (One Page Love e Sites of the Day
do Awwwards, outubro de 2026). Ela dá ao agente uma direção de arte em vez de deixá-lo cair na
landing page média, prende-o a um estilo da casa rígido e sem enfeites, e o faz olhar o próprio
render antes de dar o trabalho por terminado.

## Como funciona

1. **Inventário.** O agente lista o que só este cliente tem: o nome e o que ele significa, a rua,
   os números, a única restrição, os materiais, o horário.
2. **Sorteio.** O `scripts/draw.mjs` sorteia três de 20 direções (cada uma, um motor de ideias visto nos
   sites mais fortes do estudo); o agente escolhe a que consegue levar algo do inventário, e
   o script sorteia o resto: uma composição de hero, composições de seção, um sistema tipográfico de fontes gratuitas reais,
   uma paleta, fotografias, um movimento, referências estudadas e, embaixo de cada planta, uma lista de
   onde ela contraria as regras da casa. Os sorteios recentes ficam guardados para os projetos não se repetirem.
3. **Ideia e elemento vivo.** Uma frase que amarra o material do próprio cliente ao recurso da direção,
   conferida contra o concorrente mais próximo, e uma coisa que o visitante pode fazer na página.
4. **Construção** a partir da ficha, palavras primeiro, conteúdo completo. Quando o projeto não tem fotografias
   próprias, o `scripts/assets.mjs` encontra imagens reais do mundo do assunto em acervos abertos (a
   rua dele em cartões-postais antigos, mapas antigos, os materiais, gravuras do ofício, objetos de museu do
   mesmo tipo), baixa-as para o projeto e registra os créditos; o assunto só é desenhado em código
   onde não existe imagem honesta.
5. **Checagem.** O `scripts/lint.mjs` (código-fonte) e o `scripts/inspect.mjs` (navegador real, 1440 / 768 / 390)
   medem as regras da casa: headlines de duas linhas ou menos, sem rótulos de chapéu (eyebrow), sem monoespaçada, sem
   01/02/03, sem fios finos, sem gradientes, sem sombras em repouso, sem creme com terracota, sem violeta, e
   os defeitos que os jurados às cegas puniram: sem ponto focal, telas vazias, texto coberto ou cortado, trechos fixados longos,
   fileiras que rolam para o lado, texto apagado.
6. **Olhar.** O inspetor salva capturas de tela; o agente as critica com uma rubrica com os pesos do Awwwards,
   corrige os três maiores problemas e repete, no máximo três rodadas.

Cinco rodadas de testes às cegas contra uma linha de base sem skill e contra outra skill de design estão registradas em
`references/pt-BR/research.md` §11.

## Sumário

```
SKILL.pt-BR.md                 o roteiro, as regras da casa, as leis
references/              copy, tipo, cor, layout, imagens, movimento, crítica, cacoetes, pesquisa
scripts/draw.mjs         sorteia opções / uma direção / reimprime / sorteia de novo; --alternatives, --photos, --site
scripts/assets.mjs       busca em acervos abertos de imagens (Openverse, Wikimedia Commons, Art Institute of
                         Chicago, o Met) e, com --video, vídeos reais (Wikimedia Commons, Internet
                         Archive, NASA); --get baixa com o crédito, --credits os imprime
scripts/lint.mjs         varredura estática de padrões proibidos e frases feitas
scripts/inspect.mjs      renderiza, mede, fotografa
scripts/lib/             cliente do Chrome DevTools sem dependências, a sonda dentro da página, as regras
library/                 direções (20), heroes, seções, sistemas tipográficos, paletas, fotografias,
                         sites estudados, movimentos
assets/base.css, base.js uma base neutra opcional
evals/evals.json         seis briefings para testar a skill contra uma linha de base sem skill
```

## Requisitos

Node 22 ou mais novo e um Chrome, Edge ou Chromium instalado para o `inspect.mjs` (ele controla o navegador
pelo protocolo DevTools com o WebSocket nativo do Node; nada é instalado). O `draw.mjs`,
o `lint.mjs` e o `assets.mjs` executam no Node 18+; o `assets.mjs` precisa de acesso à rede e não pede chave de API. Defina
`CHROME_PATH` se o navegador estiver num lugar incomum.

## Instalação

Copie esta pasta para a sua pasta de skills, por exemplo `~/.claude/skills/direcao-de-arte/`, ou mantenha-a em
um repositório dentro de `.claude/skills/`.

## Observações

- As fotografias da biblioteca são servidas pelo Lorem Picsum a partir do Unsplash, sob a licença do Unsplash.
  São placeholders (conteúdo provisório) de atmosfera; troque-as pelas imagens do próprio projeto.
- As imagens encontradas com o `assets.mjs` mantêm as próprias licenças. Por padrão ele oferece só CC0, domínio
  público, CC BY e CC BY-SA, e o `--get` registra o título, o autor, a licença e a fonte de cada
  download em `assets/credits.json`. A página tem de trazer os créditos (o `--credits` os imprime).
- O `assets.mjs --video` encontra vídeos curtos do mundo do assunto, pega uma versão de 720p ou menos,
  recusa arquivos acima de 25 MB a menos que se passe `--max-mb`, e salva um quadro de poster com cada vídeo; como
  usar um deles numa página (loop sem som, poster, parado com movimento reduzido) está em
  `references/pt-BR/imagery.md` §11.
- As fontes vêm do Google Fonts e do Fontshare. Confira a licença de cada fonte para o seu uso.
- As notas em `references/pt-BR/research.md` são julgamentos de modelo a partir de capturas, não notas do Awwwards.
- O histórico de sorteios fica em `~/.taste-skill/history.json` (defina `TASTE_SKILL_HISTORY` para mudá-lo de lugar).
  Apague-o para zerar.
- Uma construção leva a um agente uns 30–45 minutos e algumas centenas de milhares de tokens com o
  ciclo completo de olhar e corrigir; a maior parte disso é achar ou desenhar imagens quando o projeto não tem fotografias.
