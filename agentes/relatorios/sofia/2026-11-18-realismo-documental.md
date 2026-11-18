# Realismo documental (v2) · E Se, Hein?

Sofia · 18/11/2026

## 1. Pedido

Levar os vídeos do E Se, Hein? para um estilo de realismo documental, a partir dos princípios de um vídeo de referência
de outro canal: direção de arte e componentes no Figma, dois quadros de exemplo da Paulista (cheia e vazia) e a seção
v2 no `docs/design-system.md`. Durante a tarefa entraram as correções da Sabrina: 8,3 bilhões, o lugar em outra linha
e um desenho próprio para o dado da geladeira.

## 2. A ideia

**O lugar é a prova:** um lugar real do Brasil visto do alto, um número que muda quando a história muda e um texto
que sai do caminho, como num documentário.

Partes da `design-skills` usadas:
- `figma-design-workflow`: inspecionar o arquivo, reaproveitar o que existe e revisar por captura.
- `direcao-de-arte` (`taste-skill/SKILL.pt-BR.md`): ideia a partir do assunto, inventário do lugar e foto real de acervo aberto com `scripts/assets.mjs`.
- `typography-scale`.
- `visual-hierarchy`.
- `color-system`.
- `design-token`.
- `component-spec`.
- `motion-system`.

Da referência ficaram os princípios: lugar real, luz de verdade, drone, pouco texto e antes e depois no mesmo plano.
O visual é nosso:
- **Fontes:** Newsreader e IBM Plex Sans. O outro canal usa uma serifa tipo Garamond para tudo.
- **Alinhamento:** à esquerda, numa coluna só. O deles é centralizado.
- **Componentes:** o contador com o lugar separado por um fio, o fato e o véu de leitura.
- **Céu:** escurecido por filtro degradê.

## 3. O que mudou

**Figma** ([arquivo](https://www.figma.com/design/okTGRiK8lTEXSoP9QDm0du), página nova
[Realismo documental (v2)](https://www.figma.com/design/okTGRiK8lTEXSoP9QDm0du?node-id=28-23)). Nada das páginas do v1
foi alterado.

- **Variáveis:**
  - Coleção `v2 · Cor`, com os modos Dia, Noite e Frio: 13 variáveis (texto claro, escuro e sombra; sol, céu, sombra e neblina; exposição, saturação, contraste, filtro do céu e as duas misturas).
  - Coleção `v2 · Medidas`: 28 variáveis (contador, título, legenda, fato, sombra, câmera, plano e movimento).
  - Todas têm escopo e código WEB (`var(--v2-...)`).
- **Estilos:**
  - 10 de texto: `v2/Título`, `v2/Legenda`, `v2/Legenda destaque`, `v2/Dado rótulo`, `v2/Dado número`, `v2/Dado unidade`, `v2/Dado lugar`, `v2/Fato texto`, `v2/Fechamento pergunta` e `v2/Fechamento chamada`. Os tamanhos estão ligados às variáveis.
  - 2 de efeito: `v2/Sombra de leitura` e `v2/Halo claro`.
- **Componentes:**
  - `v2 / Dado no canto`: Tom Claro ou Escuro. Propriedades Rótulo, Número, Unidade, Lugar, Mostrar unidade e Mostrar lugar.
  - `v2 / Fato`: Tom. Propriedades Rótulo e Texto.
  - `v2 / Título`: Tom. Propriedade Texto.
  - `v2 / Legenda`: Tom. Propriedade Frase, com uma palavra em redondo.
  - `v2 / Véu de leitura`.
  - `v2 / Fechamento`: clone do v1 com a tipografia nova e a propriedade Pergunta.
- **Quadros 1080 × 1920:**
  - Exemplo 1 · antes (Paulista cheia).
  - Exemplo 2 · depois (Paulista vazia).
  - v2 / Fechamento.
  - Exemplo 4 · contador e fato, com a correção Noite.
  - Todos montados com instâncias e com a guia de zonas seguras escondida dentro (é só ligar).
- **Documentação na página:** cabeçalho com a ideia; Exemplos · notas; Do v1 para o v2 (com a decisão da legenda); Tipografia v2; Movimento v2; Cor v2 (amostras ligadas às variáveis nos três modos e a mesma foto em Original, Dia, Noite e Frio); Câmera v2 (diagrama de perfil do drone e da lente de 28 mm, mais 8 regras).

**Repositório**
- `Projetos/E-Se-Hein/docs/design-system.md`: aviso das duas versões no topo, a página nova na tabela de páginas e a seção "v2 · Realismo documental" no fim (tokens, tipografia, componentes, cor, câmera, movimento, zonas, o que a Karol precisa e o que falta). A v1 ficou como estava.
- `Projetos/E-Se-Hein/docs/tokens.css`: bloco v2 no fim (`:root`, `[data-v2-modo="noite"]`, `[data-v2-modo="frio"]`, as fontes, a sombra, o halo e o véu).
- `Projetos/E-Se-Hein/docs/tokens.json`: chave `v2`. As chaves do v1 não mudaram.
- `agentes/memoria/sofia.md`: regras novas e o registro da tarefa.

## 4. Capturas

Em `agentes/relatorios/sofia/2026-11-18-realismo-documental/`:

| Arquivo | O quê |
|---|---|
| `folha-quadros.jpg` | Os quatro quadros lado a lado: antes, depois, fechamento, contador e fato |
| `quadro-1-cheia.jpg` | Exemplo 1 · antes, 1080 × 1920 |
| `quadro-2-vazia.jpg` | Exemplo 2 · depois, mesmo enquadramento |
| `quadro-3-fechamento.png` | Fechamento v2 |
| `quadro-4-contador-e-fato.jpg` | Contador "Sozinho há · poucos dias" e fato da geladeira |
| `quadro-cheia-zonas.jpg` | Exemplo 1 com a guia das zonas seguras ligada |
| `comp-dado-no-canto.png`, `comp-fato.png`, `comp-titulo.png`, `comp-legenda.png` | Os componentes nos dois tons |
| `doc-v1-para-v2.png`, `doc-tipografia.png`, `doc-cor.png`, `doc-camera.png`, `doc-movimento.png`, `doc-notas-exemplos.png` | As páginas de documentação |

As capturas com a Paulista usam a foto "Vista aérea de la Avenida Paulista de São Paulo 03", de ProtoplasmaKid
(Wikimedia Commons, licença CC BY-SA 4.0), recortada e com a cor tratada. Por ser compartilha-igual, as capturas
também ficam sob CC BY-SA 4.0. Os quadros do outro canal ficaram fora do repositório.

Não há "antes": a página é nova. Os quadros do v1 continuam nas páginas antigas do Figma.

## 5. Conferido em

- **Figma:** captura de cada quadro e de cada página depois de montar. Corrigido depois da primeira rodada:
  - o véu cobria o quadro inteiro (a variável de cor tirava a transparência do degradê);
  - o "você" da legenda perdeu o redondo;
  - a legenda deixava "está cheia." e "boa." sozinhos na segunda linha;
  - os números da página de cor saíram com 15 casas;
  - a coluna "Uso" estava cortada;
  - o rótulo de 45° caía em cima da linha tracejada.
- **Zonas seguras:** posição de cada caixa de texto lida no Figma (números na seção "Zonas seguras" do `design-system.md`). Tudo dentro de x 72 a 900 e y 210 a 1420. Captura com a guia ligada.
- **Contraste** (medido na foto tratada, luminância relativa):
  - branco quente sobre o céu do contador: 3,8:1 na média;
  - atrás do título: 5,5:1;
  - atrás da legenda: 3,7:1 sem véu e 4,2:1 a 4,5:1 com véu.
  - Antes do filtro degradê, o céu dava 2,4:1, e foi por isso que a regra do céu entrou.
- **Fontes:** Newsreader e IBM Plex Sans confirmadas na lista de fontes do Figma, com os estilos usados.
- **Código:** `tokens.json` validado (o JSON carrega, com as chaves do v1 e a `v2`). Não houve build nem teste do Remotion: não mexi em `src/`.
- **Navegador e celular:** não se aplica (são quadros de vídeo).

## 6. Ficou de fora

**Visual**
- A Paulista vazia é um retoque feito por código, não uma cena. Tem uma mancha clara perto da árvore de baixo, um trecho da ciclovia sem sombra e algumas pessoas minúsculas nas calçadas. Serve para compor; a cena de verdade sai do Blender.
- Os modos Noite e Frio só foram vistos em foto tratada ("noite americana"). Os números são ponto de partida.
- A transição de 12 quadros do fechamento (círculo a partir do "você") está descrita, não desenhada quadro a quadro.

**Conteúdo**
- As falas dos quadros ("Numa manhã qualquer, a Paulista está cheia.", "Agora só tem você.", "A comida da geladeira ainda está boa." e a pergunta do fechamento) são de exemplo. O roteiro é da Gabriela.
- Os números estão com a correção da Sabrina (8,3 bilhões e o lugar em outra linha). A cena do Exemplo 4 é a Paulista à noite só para compor: a cena real é o supermercado.

**Código**
- Não mexi em `src/`. Os componentes do Remotion (`DadoNoCanto`, `Fato`, `Titulo`, `Legenda`, `VeuDeLeitura`) são da Karol, a partir do `design-system.md`.
- Sem Code Connect: os componentes de código ainda não existem.

## 7. Próximos passos

1. **Karol:** protótipo de 10 s no Blender, num lugar real, seguindo a seção "O que a Karol precisa para o código", com a rodada de conferência dos quadros. O Paulo aprova o visual antes de virar padrão.
2. **Karol:** as camadas do Remotion (véu, contador, fato, título, legenda e fechamento v2), com as fontes do `@fontsource`.
3. **Sofia:** depois do protótipo, comparar o render com os quadros do Figma e ajustar os números de cor (sobretudo Noite e Frio) e o tamanho do "você".
4. **Gabriela e Sabrina:** as falas finais e os textos de cada contador e fato, no formato do componente (número ou palavra de até 9 letras; lugar em outra linha).
5. **Sofia:** desenhar a transição do fechamento quadro a quadro e a capa do vídeo para o perfil.
