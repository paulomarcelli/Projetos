# Passagem para a próxima IA · Aurora: O Dízimo da Lua

Última atualização: 14/11/2026. Leia este arquivo inteiro antes de mexer no jogo. Depois: `README.md` (visão geral),
`docs/ARQUITETURA.md` (código), `docs/roteiro.md` (história, 13 fases) e o `CLAUDE.md` desta pasta (regras).

---

## 1. Estado atual em uma frase
Plataforma 2D em **PixiJS 8** no navegador, publicada no GitHub Pages
(<https://paulomarcelli.github.io/Projetos/Projetos/Aurora/>), com a **Fase 1 (A Floresta da Névoa) jogável do começo ao
fim**, a Aurora adulta toda animada com arte do Gemini e as **animações da Aurora criança (Prólogo) prontas, mas ainda
fora do jogo**. 21 testes passando (`npm test`).

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

**Fase 1 — A Floresta da Névoa** (`jogo/fases/fase1.json`): a caçada do roteiro em 10 trechos — clareira (ensina
andar) → primeiro salto (vala rasa, sem perigo) → alvos de palha (ensina o arco) → subida pelos galhos → mirante (rastros
do cervo) → ravina com sombras → penhascos sobre o abismo → galhos com sombras → 2ª fogueira → clareira do cervo
(clímax). Abater o cervo abre a cena final com as falas de Lia e Aurora; R recomeça. Galhos são plataformas de uma via;
cair no abismo tira 15 de vida e volta ao último chão firme.

**Aurora criança (Prólogo)** — arte pronta, **ainda não está no jogo**:
- ficha: `arte/referencias/aurora-crianca-01.png` (comparação com a adulta conferida: mesmo traço e cores);
- 6 folhas em `arte/poses-originais/crianca_*.png`: parada (3), correndo (8, em duas folhas), pulo (4), andando
  escondida (4), escondida (3). Já testei o recorte: os 22 quadros saem limpos **com `--manter-brancos`** (a capinha de
  pele e as meias são brancas e o recorte normal as apagava). Detalhes em `docs/prompts-aurora-crianca.md`.

## 5. Como a fase é verificada (rode depois de mexer em `fases/*.json`)
`testes/fase1.test.mjs` (skill `level-design`): mede o pulo real (`ferramentas/medir_pulo.mjs`), confere vão ≤ 70% do
alcance (183 px) e subida ≤ topo − meio bloco (172 px), faz um **jogador robô** (`src/nivel.js`, `tentarSalto`) correr e
pular cada trecho do `caminho` e dos `retornos` com a física do jogo, confere o ritmo (`batidas`: começa ensinando, sem 3
trechos intensos seguidos, descanso antes do clímax) e se fogueiras, criaturas, alvos e cervo estão sobre um chão.
O robô foi conferido: reprova vão de 400 px e subida de 260 px.

## 6. Próximos passos (em ordem)
1. **Prólogo — A Noite das Lanças** (`docs/roteiro.md`, seção PRÓLOGO). É o que o usuário está pedindo agora.
   - Ligar a Aurora criança no jogo: fatiar as 6 folhas (`--manter-brancos`), criar uma folha de sprites própria
     (ela é menor: medir a cabeça; ~4 cabeças de altura), colisor menor e **sem armas** (não ataca, não usa arco).
   - Mecânica de **furtividade** (ela precisa chegar à capela sem ser vista): soldados patrulhando com campo de visão
     (cone), esconderijos (atrás de cortinas, mesas, colunas) onde ela usa a pose "escondida", andar agachada mais lento e
     silencioso; ser vista = recomeçar do último ponto. Use as skills `game-ai` (patrulha e percepção) e `level-design`.
   - **Arte que falta:** soldados da Lança Dourada (andando, parados, olhando) e o cenário do castelo da Casa Selênia
     (salão da festa de inverno, corredores, capela com altar). Gere no Figma (ou passe prompts para o Gemini).
   - Cenas: a festa (Elias rouba a fita, Lady Ilaria), as luzes apagando, o altar (fala de Ilaria e Caius) e o corte
     para a neve com Bram. Texto já está no roteiro; use uma caixa de diálogo (skill `dialogue-systems`).
   - Fazer o Prólogo também em JSON (`fases/prologo.json`) com o mesmo tipo de teste da Fase 1, e um jeito de escolher a
     fase (hoje o `main.js` carrega `fases/fase1.json` fixo).
2. **Ouvir o teste do usuário na Fase 1** e ajustar: onde ficou perdido, salto que errou mais de 3 vezes, trecho chato
   ou injusto, tempo total.
3. **Menu inicial** (Novo jogo, Continuar, escolher fase) e **controles de toque** para celular (skill `game-ui-ux`).
4. **Som e música** (skill `audio-design`): passos na neve, flecha, golpe, dano, fogueira, trilha da floresta.
5. **Patrulha imperial na Fase 1** (o roteiro pede): reaproveitar os soldados e a visão do Prólogo.
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
cd Projetos/Aurora-Jogo/jogo && npm install && npm run preparar && npm test     # 21 testes
python3 -m http.server 8080
```
`window.__jogo` expõe `corpo`, `estado`, `vida`, `mana`, `progresso`, `vento`, `sombras`, `fogueiras`, `fase`, `alvos`,
`cervo`, `cenaFinal`, `quadros`, `impacto`. Chromium no Playwright: `--use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader`. Prévia isolada da fogueira: `jogo/previa/fogueira.html?vento=0.6`.

## 10. Outros projetos desta conversa
Ver `PARA-A-PROXIMA-IA.md` na raiz do repositório (todos os projetos e pendências).
