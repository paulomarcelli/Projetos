# Passagem para a próxima IA · Aurora: O Dízimo da Lua

Última atualização: 14/11/2026. Leia este arquivo inteiro antes de mexer no jogo. Depois: `README.md` (visão geral),
`docs/ARQUITETURA.md` (código), `docs/roteiro.md` (história, 13 fases) e o `CLAUDE.md` desta pasta (regras).

---

## 1. Estado atual em uma frase
Plataforma 2D em **PixiJS 8** no navegador, publicada no GitHub Pages
(<https://paulomarcelli.github.io/Projetos/Projetos/Aurora/>), com a **Fase 1 (A Floresta da Névoa) jogável do começo ao
fim**, a Aurora adulta toda animada com arte do Gemini e o **Prólogo jogável** (Aurora criança, furtividade no castelo,
festa, altar, neve e título; soldados, castelo e personagens ainda desenhados em código, sem arte). 39 testes passando
(`npm test`). `?fase=prologo` / `?fase=1` escolhe a fase.

## 2. Quem é o usuário e como ele trabalha
- Fala **português**. Pede para **não perguntar permissão**: faça, verifique e publique (commit e push direto na `main`).
- Gosta de ver resultado visual rápido; quer **muito detalhe** na personagem (respiração, piscar, dedos, cabelo no vento).
- Gera a arte no **Gemini** e manda as folhas na conversa. Imagens às vezes chegam **só como visualização, não como
  arquivo**: confira com `ls -t` na pasta de imagens da sessão; se não estiver lá, peça para reenviar como anexo.
- Liberou o **Figma** (MCP) para gerar arte: `generate_image` aceita só texto (sem imagem de referência) e cada imagem
  gasta créditos de IA do plano dele. Use o modelo `gemini-3.1-flash-image` e repita a descrição completa da personagem
  em cada prompt para manter a consistência. Arquivo do Figma já criado: "Aurora criança · Prólogo".
- Inspirações citadas: *Game of Thrones*, *Jogos Vorazes*, mitologia grega, *Dark Souls* (fogueiras). **Só clima e
  mecânicas genéricas; nada de nomes, personagens, cenas, símbolos ou textos dessas obras.**
- Skills de jogo disponíveis no repositório (`/home/user/projetos/.claude/skills/`): **`gamedev-skills`** (roteador; use
  `level-design`, `platformer`, `pixijs-rendering`, `game-feel`, `audio-design`, `dialogue-systems`, `game-ui-ux`…) e
  **`2d-games`** (princípios gerais: camadas, câmera, atlas). Ele pediu para usar as duas.

## 3. Decisões importantes (e o motivo)
1. **PixiJS 8 no navegador** (não Godot/Unity): o agente roda, testa com Playwright e tira capturas sozinho; tem malhas
   deformáveis; publica no Pages. `arte/sprites/aurora_spriteframes.tres` (Godot) é legado.
2. **Aurora parada = um desenho inteiro deformado por regiões** (estilo Live2D). Boneco de peças separadas foi tentado e
   ficou estranho (arquivado em `experimentos/` e `arte/boneco/`).
3. **Animações = quadros desenhados** (folhas do Gemini). Em movimento, a Aurora tem **duas camadas**: corpo fixo
   (Sprite) por cima e só o cabelo numa malha por baixo (`QuadrosVivos` em `vento.js`). Antes era uma malha só e o
   corpo "esticava" junto com o cabelo.
4. **Escala igualada pela altura da cabeça** medida em cada folha (`CABECA_POR_GRUPO` em `ferramentas/montar_folha.py`).
5. **Física com os números da skill `platformer`** (`jump_tuner.py`). Pulo medido: 205 px de altura, 262 px de alcance.
6. **Fases em dados** (`jogo/fases/*.json`) com verificação automática da skill `level-design` (ver §5).

## 4. O que já está pronto
**Aurora adulta** (arte do Gemini, folha `arte/sprites/aurora_folha.png`): parada viva (respira, pisca, mão abre e
fecha), correr, pular, queda, aterrissar, esquiva, Salto da Lua (pulo duplo, gasta mana), arco v2 (pegada no punho,
corda no rosto), golpe de lâmina em 4 quadros + volta à guarda, dano em 3 quadros, sentar → sentada (respira e pisca) →
levantar, vitória.

**Sistemas:** Fogueira Lunar (redesenhada: pedra com lua crescente, chama em 3 tons que deita com o vento, brasas e
fumaça; salva, recupera e abre o menu de evolução), moedas de prata, 4 atributos, salvamento versionado, efeitos de
impacto (hit-stop, tremor, faíscas, números, vinheta), vento com rajadas, neve caindo.

**Criatura:** sombra de névoa (arte do Gemini): flutua, fica atordoada, morre em 3 quadros.

**Arte nova (Figma, 14/11/2026):** o usuário achou os bonecos e cenários em código "horríveis" e pediu tudo desenhado.
Gerei no Figma (modelo gemini-3.1-flash-image, mesmo estilo da Aurora) o castelo (3 painéis), a cena da neve com o Bram,
o soldado (andando e parado), Ilaria, Elias, convidados, Caius, o do carneiro, o das luvas, os esconderijos e o altar;
na Fase 1, céu com lua, floresta do meio, textura do chão, 3 pinheiros, arbusto, pedra, placa, alvo, cervo (3 poses),
galho, tronco em pé e tronco caído. Fluxo em `docs/ARQUITETURA.md` (seção "Arte gerada no Figma"). Movimento: neve que
levanta (passos, pulo, pouso, esquiva), pegadas que somem em 6 s, amassar ao pousar e esticar ao pular (`efeitos.js`,
`NeveNosPes`; `main.js`, `pisarNaNeve`).

**Segunda rodada (pedido: "melhore a barra de vida e mana, os movimentos de ataque, os animais, iluminação, neve, chão"):**
- Painel (`hud.js`): moldura de prata do Figma (`assets/hud/moldura.png`), retrato da Aurora no medalhão, barras com
  degradê e reflexo, dano atrasado (a parte perdida fica clara e escorre), tremor ao apanhar, pulso vermelho com pouca
  vida, números, nível e moedas. Dica de controles foi para o pé da tela.
- Ataques (`efeitos.js`, `Brilhos`; folha da floresta, peças `fx_*` de fundo preto, mistura somada): arco de luz na
  estocada da lâmina, explosão de impacto nos acertos, luz juntando na ponta da flecha enquanto ela puxa a corda,
  estrela e tremor curto ao soltar, rastro de luz atrás da flecha, poeira ao cravar.
- Animais: cervo com 12 quadros novos (andar, correr, olhar, cheirar), vagueia ±150 px, pasta e encara se ela corre
  perto (`perceber`); lebres e pássaros (`animais.js`) que fogem e voltam quando ela está longe.
- Luz (`luz.js`), neve em 3 profundidades com cintilar (`vento.js`), chão com neve pintada, sombra que escurece a terra,
  pingentes nas quinas e nos galhos, capim, pedrinhas e samambaias (`fase.js`, `terrenoPintado`).
- `window.__jogo.escalaTempo = 0.08` deixa o jogo em câmera lenta para fotografar efeitos no Playwright.
- As folhas de sprites do Figma vão para o jogo em WebP (`*_folha.webp`, ~1 MB cada).

**Sentar na fogueira (skill 2d-games: antecipação, segurar as poses-chave, continuação, achatar/esticar):**
ela anda até o lugar (do lado de onde veio; à esquerda, depois da pedra da lua) em vez de ser teletransportada; sentar e
levantar têm tempo por quadro (`duracoes`) e fusão entre quadros (`fundir`, o quadro anterior some por cima —
`QuadrosVivos` em `vento.js`); afunda antes de sentar, quica ao pousar e o cabelo cai por último (`cabeloImpulso`);
sentada, respira (escala), pisca e às vezes olha o fogo pensativa (`descansando` em `main.js`), com a luz violeta da
fogueira tremulando nela; ao levantar, afunda, sobe e estica no fim.

**Terceira rodada:**
- Sentar: o usuário achou que ela "flutuava" — no quadro antigo o arco deitado era o ponto mais baixo e o encaixe nos
  pés usa o mais baixo. Agora o sentar usa **8 quadros novos gerados no Figma** (`arte/figma/aurora_sentar_figma.png`,
  `src/sentar.js`, folha `sentar_folha.*`): de pé → dobra → agacha pousando o arco → mão no chão → sentada (normal,
  mãos nos joelhos, olhos fechados, pensativa), quadril e botas no chão. Alinhados pela **cabeça**
  (`montar_folha_figma.py sentar`), escala 0,9 (o desenho tem cabeça maior que a Aurora do jogo). Recorte com
  `fatiar_folha.py --buraco 0.0012` (apaga o vão do arco, mantém as listras das meias) + limpeza do vão do arco deitado.
- Luz do Prólogo (`src/mapa_luz.js`, `MapaDeLuz`): mapa de luz que **multiplica** a cena (ambiente branco na festa,
  índigo `0x34325e` na noite). Luzes: velas (poças quentes), lanterna e cone de visão de cada soldado (o cone ilumina de
  verdade; fica vermelho com o alerta), janelas e feixes de luar inclinados, luz fria fraca na menina, velas do altar
  na cena final. Por cima, uma camada somada fraca (halo das chamas, véu do cone, poeira no luar). Armadilha: o
  `resize` da RenderTexture não muda o alvo já usado — recriar a RenderTexture quando a tela muda de tamanho.

**Fase 1 — A Floresta da Névoa** (`jogo/fases/fase1.json`): a caçada do roteiro em 10 trechos — clareira (ensina
andar) → primeiro salto (vala rasa, sem perigo) → alvos de palha (ensina o arco) → subida pelos galhos → mirante (rastros
do cervo) → ravina com sombras → penhascos sobre o abismo → galhos com sombras → 2ª fogueira → clareira do cervo
(clímax). Abater o cervo abre a cena final com as falas de Lia e Aurora; R recomeça. Galhos são plataformas de uma via;
cair no abismo tira 15 de vida e volta ao último chão firme.

**Prólogo — A Noite das Lanças** (`jogo/src/prologo.js`, `jogo/fases/prologo.json`; detalhes em `docs/ARQUITETURA.md`):
salão da festa (Lady Ilaria, convidados, Elias corre com a fita) → as velas se apagam → corredor das cortinas → galeria
(sobe por 2 degraus, passa por cima do guarda) → salão das colunas (2 guardas) → antessala → capela (guarda da porta,
bancos) → altar: a mãe, Caius e os dois homens; falas do roteiro → neve com o Bram → título AURORA → Fase 1.
- Aurora criança: 22 quadros fatiados com `--manter-brancos` em `arte/sprites/recortes/aurora_c_*.png`, folha em
  `arte/sprites/crianca_folha.png` por `ferramentas/montar_folha_crianca.py` (escala pela **altura em pé**, não pela
  cabeça: pela cabeça ela ficaria do tamanho da adulta). Prévias em `arte/sprites/previas/crianca_*.gif`.
- Furtividade em `src/furtividade.js` (9 testes); caixa de diálogo em `src/dialogo.js`.
- `fisica.js`: `criarCorpo(x, y, { largura, altura, velCorrida })` (sem opções = adulta) e `entrada.lento`.
- `nivel.js`: o robô agora também pula quando bate numa parede (degrau em cima do próprio chão).

## 5. Como a fase é verificada (rode depois de mexer em `fases/*.json`)
`testes/fase1.test.mjs` (skill `level-design`): mede o pulo real (`ferramentas/medir_pulo.mjs`), confere vão ≤ 70% do
alcance (183 px) e subida ≤ topo − meio bloco (172 px), faz um **jogador robô** (`src/nivel.js`, `tentarSalto`) correr e
pular cada trecho do `caminho` e dos `retornos` com a física do jogo, confere o ritmo (`batidas`: começa ensinando, sem 3
trechos intensos seguidos, descanso antes do clímax) e se fogueiras, criaturas, alvos e cervo estão sobre um chão.
O robô foi conferido: reprova vão de 400 px e subida de 260 px.

## 6. Próximos passos (em ordem)
1. **Ouvir o teste do usuário no Prólogo e na Fase 1** e ajustar (Prólogo: guardas justos? a dica de esconder é clara?
   o tempo de alerta de 0,6 s é curto demais?). Fase 1: onde ficou perdido, salto que errou mais de 3 vezes, trecho chato
   ou injusto, tempo total.
3. **Menu inicial** (Novo jogo, Continuar, escolher fase) e **controles de toque** para celular (skill `game-ui-ux`).
4. **Som e música** (skill `audio-design`): passos na neve, flecha, golpe, dano, fogueira, trilha da floresta.
5. **Patrulha imperial na Fase 1** (o roteiro pede): reaproveitar `furtividade.js` e a classe `Soldado` do Prólogo.
5b. **Mais arte** (Figma, arquivo em `docs/ARQUITETURA.md`): quadros de animação para Ilaria, Elias (correndo) e
   convidados; galeria e degraus pintados (hoje em código); fogueira pintada; soldado no Fase 1 (patrulha).
6. **Fase 2 — A Tinta que Escorre** (roteiro) e o primeiro chefe (Brakus, o Carneiro).
7. Arte opcional da adulta: mão meio fechada (prompt F), corrida em 8 quadros maiores, olhos totalmente fechados
   (prompts em `docs/prompts-aurora-rodada2.md`); combo de verdade (2º golpe diferente).

## 7. Fluxo de arte (folha nova do Gemini/Figma)
```bash
# na pasta Aurora-Jogo
python3 ferramentas/fatiar_folha.py arte/poses-originais/FOLHA.png --nomes nome:4 --saida arte/sprites/recortes
#   quadros encostados: --separar 3..7 (e --dar x0,y0,x1,y1:N para devolver um pedaço ao quadro certo)
#   roupa branca: --manter-brancos
# registrar o grupo em ferramentas/montar_folha.py (QUADROS, CABECA_POR_GRUPO e a animação em montar_animacoes), depois:
python3 ferramentas/montar_folha.py
python3 ferramentas/limpar_bordas.py arte/sprites/aurora_folha.png
python3 ferramentas/pesos_cabelo.py      # pesos do cabelo + camadas corpo/mecha (sempre depois da folha)
cd jogo && npm run preparar && npm test
```
Confira sempre o recorte **sobre fundo escuro** e meça a cabeça comparando com outro quadro já no jogo.

## 8. Armadilhas já encontradas
- `Math.pow` com base negativa e expoente quebrado dá `NaN` e apaga vértices da malha: limite com `Math.max(0, …)`.
- Módulos ES não abrem em `file://`: rode `python3 -m http.server 8080` dentro de `jogo/` (ou use o link do Pages).
- O workflow do Pages (`/.github/workflows/pages.yml`) copia só `index.html`, `src`, `vendor`, `assets` e `fases` do
  `jogo/`. **Pasta nova que o jogo carrega precisa entrar nessa lista**, senão o site publicado quebra.
- Folhas do Gemini chegam com ~1024 px (as do Figma com 1376 px), mesmo pedindo 2048; como o jogo reduz, ficam nítidas.
- O recorte apaga áreas brancas fechadas grandes (para o vão entre arco e corda): roupa branca precisa de `--manter-brancos`.
- Texturas acima de 4096 px quebram em celulares: a folha usa 8 colunas (3072×3072) e quadros repetidos dividem célula.
- A sombra de névoa é fumaça: tem recorte próprio (`ferramentas/fatiar_sombra.py`, transparência pela distância ao branco).
- Playwright com swiftshader é lento: cada captura trava o jogo por segundos e pode pular janelas de tempo (ex.: o acerto
  do golpe). Para testar lógica, rode sem capturas e leia `window.__jogo` num laço de `requestAnimationFrame`.
- O verificador de segurança do Bash recusou comandos com heredoc + `( … &)` juntos; separe em comandos menores.

## 9. Como verificar
```bash
cd Projetos/Aurora-Jogo/jogo && npm install && npm run preparar && npm test     # 39 testes
python3 -m http.server 8080
```
`window.__jogo` expõe `corpo`, `estado`, `vida`, `mana`, `progresso`, `vento`, `sombras`, `fogueiras`, `fase`, `alvos`,
`cervo`, `cenaFinal`, `quadros`, `impacto`. Chromium no Playwright: `--use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader`. Prévia isolada da fogueira: `jogo/previa/fogueira.html?vento=0.6`.

## 10. Outros projetos desta conversa
Ver `PARA-A-PROXIMA-IA.md` na raiz do repositório (todos os projetos e pendências).
