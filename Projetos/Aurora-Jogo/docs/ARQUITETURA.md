# Arquitetura — Aurora: O Dízimo da Lua

## Visão geral
```
index.html
  └─ src/main.js ............ cria o app PixiJS, o mundo, a câmera, a entrada e o laço do jogo
       ├─ fisica.js ......... física de plataforma pura (sem gráficos), passo fixo de 60 Hz
       ├─ progresso.js ...... atributos, custo de nível, salvar/carregar (puro, testado)
       ├─ aurora_viva.js .... Aurora parada: desenho único deformado por regiões + variações (olhos/mão)
       ├─ vento.js .......... Vento (brisa, rajadas, folhas em 2 camadas) e QuadrosVivos (animações numa malha)
       ├─ pesos.js .......... pesos do cabelo (PNG → peso por vértice) e MolaCabelo (atraso e balanço do cabelo)
       ├─ efeitos.js ........ faíscas, números de dano, vinheta vermelha, hit-stop e tremor de câmera
       ├─ fogueira.js ....... Fogueira Lunar (desenho em código, chama animada que reage ao vento)
       ├─ inimigos.js ....... Sombra de névoa (sprites do Gemini: patrulha, dano, morte, moedas)
       └─ hud.js ............ Painel (vida, mana, moedas, nível) e MenuFogueira (evolução)
```
`fisica.js` e `progresso.js` não importam nada gráfico: rodam no Node e têm testes em `testes/`.

## Laço do jogo (main.js)
1. O `app.ticker` acumula o tempo real e chama `passoFixo()` a cada 1/60 s (física estável em qualquer taxa de quadros).
2. `passoFixo()`:
   - se **sentada** na fogueira: recupera vida e mana, trata as teclas 1–4 (evoluir) e E (levantar);
   - senão: lê a entrada, inicia ações (lâmina, arco), chama `passo()` da física, gasta mana do Salto da Lua,
     resolve o golpe de lâmina (área na frente dela), o toque das criaturas (dano + empurrão + invulnerabilidade)
     e a morte (volta para a última fogueira).
3. Fora do passo fixo, a cada quadro: escolhe a animação, posiciona a Aurora, atualiza vento, cabelo,
   fogueiras, criaturas, flechas, textos flutuantes, painel e câmera.

## Duas formas de desenhar a Aurora
| Situação | Como | Arquivo |
|----------|------|---------|
| **Parada** | Um desenho inteiro em alta resolução (482×953) numa `MeshPlane` 42×80, deformada por regiões (cabelo e tranças pelos pesos de `aurora_viva_cabelo.png`): respiração (sobe acima da cintura), peito, cabeça, cabelo solto, tranças. Olhos e mão trocam por variações do **mesmo** desenho; a mão troca com transição suave (2 malhas sobrepostas). | `aurora_viva.js`, `assets/viva/` |
| **Em movimento** | Quadros desenhados (células 384×384) em **duas camadas**: o corpo é uma imagem fixa (`aurora_folha_corpo.png`, sem o cabelo que balança) por cima, e só o cabelo (`aurora_folha_mecha.png`, meia resolução) fica numa `MeshPlane` 30×30 por baixo, empurrado pelo vento e pela corrida (pesos de `aurora_folha_cabelo.png`, `MolaCabelo`). Assim a malha nunca estica o corpo. | `vento.js` (`QuadrosVivos`), `assets/sprites/` |

Ambas usam os **pés** como origem (y = base da célula) e são espelhadas com `scale.x = direção`.
Altura visual na tela: 210 px (`ALTURA_VISUAL`).

Estados de animação (`escolherAnimacao`): `boneco` (parada viva) · `correndo` · `pulo` · `queda` · `aterrissar` ·
`esquiva` · `cambalhota` (Salto da Lua) · `ataque_lamina` · `arco_preparar` → `arco_atirar` (solta a flecha no
quadro 3) · `dano` · `vitoria` · `sentar` → `sentada` → `levantar` (quadros do Gemini; quadros repetidos ocupam
uma célula só na folha).

## Física (fisica.js)
| Constante | Valor | Origem |
|-----------|-------|--------|
| Bloco | 64 px | |
| Pulo | 3,2 blocos, topo em 0,38 s | `jump_tuner.py --height 3.2 --apex-time 0.38 --tile 64 --tick 60 --integrator half` |
| Gravidade subida / queda | 2836,57 / 5105,82 px/s² | idem (queda 1,8×) |
| Velocidade do pulo | −1077,89 px/s | idem |
| Corte ao soltar | ×0,5 | pulo variável |
| Coyote / memória do botão | 6 / 7 ticks | idem |
| Corrida | 384 px/s, aceleração 4800, freio 6000, controle no ar 0,65 | skill `platformer` |
| Salto da Lua | 90% do pulo, 1 por pulo, exige `podeSaltoDuplo` (mana ≥ 12) | |
| Esquiva | 560 px/s por 21 ticks, recarga 30 ticks | |
| Colisor | 44 × 170 px | |
Integração de meio passo (a altura do pulo não muda com a taxa de quadros). Colisão por caixas (AABB), eixo X e depois Y.

## Progressão e salvamento (progresso.js)
- Atributos: Vigor (vida = 60 + 12×), Foco (mana = 20 + 8×), Força (lâmina = 8 + 3×), Precisão (flecha = 6 + 3×). Começam em 5.
- Custo do nível n→n+1: `round(20 × ((n+1)³ − n³) / 3)` (47, 127, 247, …).
- Save no `localStorage` (chave `aurora_save`): `{ versao: 1, nivel, moedas, atributos, fogueira }`.
  `desserializar` recusa JSON inválido, versão mais nova ou campos faltando (volta para um progresso novo).
  Ao mudar o formato: suba `VERSAO_SAVE` e escreva a migração da versão anterior (skill `save-systems`).

## Vento (vento.js)
`forca` de −1 a 1 = brisa (`0,12·sen`) + rajada (sobe em 0,7 s, dura ~3,5 s, desce em 1,2 s, a cada 9–19 s).
Folhas: camada de trás (pequenas, parallax 0,5) e da frente (grandes, parallax 1,35), em coordenadas de tela.
`vento.soprar(dir, duracao)` força uma rajada (útil para eventos de fase e testes).

## Arquivos de dados
- `assets/sprites/aurora_folha.json`: `{ celula: 384, animacoes: { nome: { fps, loop, quadros: [[x,y,w,h], …] } } }`.
- `assets/viva/aurora_viva.json`: tamanho, ponto dos pés e regiões (cabelo, trança, peito, alturas do pescoço,
  ombro e cintura) em px da imagem. Gerado por `ferramentas/compor_viva.py`.

## Fluxo de arte (Python, pasta ferramentas/)
| Ferramenta | Faz |
|------------|-----|
| `recortar.py` | tira o fundo branco (só o branco ligado à borda + áreas brancas fechadas grandes), borda suave sem halo, remove pedaços soltos |
| `fatiar_folha.py` | separa os quadros de uma folha do Gemini por peças; se quadros se encostam, corta nos vales (plano B) ou afina a máscara e separa (`--separar N`, plano C) |
| `fatiar_sombra.py` | folha da sombra de névoa: transparência pela distância até o branco (a fumaça não some), gera `arte/sprites/sombra/` |
| `montar_folha.py` | iguala a escala **pela altura da cabeça** medida em cada fonte, alinha os pés, cria quadros extras por código, gera a folha, o JSON, o SpriteFrames do Godot (legado) e as prévias |
| `compor_viva.py` | junta base + variações (olhos, mão) por máscaras de diferença e gera as combinações da Aurora parada |
| `limpar_bordas.py` | tira a franja branca das bordas da folha (descontamina a cor e afina 1 px) |
| `pesos_cabelo.py` | acha o cabelo pela cor e gera os pesos (zero no corpo) da Aurora parada e de cada quadro da folha, e separa a folha nas camadas corpo (fixa) e mecha (cabelo que balança) |
| `extrair_partes.py`, `texturas_corda.py`, `previa_montagem.py` | do experimento arquivado do boneco de peças |
Detalhes de cada animação e origem: `arte/sprites/LEIA-ME.md`.

## Testes
`npm test` (Node 18+): 8 de física, 7 de progressão/salvamento. A parte visual foi verificada com Playwright
(capturas de tela parada, lupa, correndo, pulo, Salto da Lua, arco, fogueira, vento, sem erros no console).
