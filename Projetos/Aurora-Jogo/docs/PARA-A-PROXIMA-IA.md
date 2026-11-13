# Passagem para a próxima IA

Este arquivo resume o que foi decidido, por quê, o que está provisório e o que fazer a seguir.
Leia junto com `README.md` (visão geral), `docs/ARQUITETURA.md` (código) e `docs/roteiro.md` (história).

## Quem é o usuário e como ele trabalha
- Fala português; gosta de ver resultado visual rápido e manda imagens geradas no **Gemini**.
- Quer **muito detalhe** na personagem: respiração, piscar, dedos, cabelo com vento e com o movimento.
- Inspirações citadas: *Game of Thrones*, *Jogos Vorazes*, mitologia, jogos modernos e *Dark Souls* (fogueiras).
  **Use só o clima e as mecânicas genéricas; nada de nomes, personagens, cenas, símbolos ou textos dessas obras.**
  A fogueira do jogo é a *Fogueira Lunar* (desenho próprio), a moeda é *moeda de prata*.
- Imagens que ele manda no meio de uma resposta às vezes **não chegam como arquivo** (só como visualização).
  Se precisar processar uma imagem, confira `ls -t` na pasta de imagens da sessão e peça para reenviar como anexo.

## Decisões importantes (e o motivo)
1. **Motor: PixiJS 8 no navegador** (não Godot/Unity). O agente consegue rodar, testar com Playwright e tirar
   capturas sozinho; tem malhas deformáveis (`MeshPlane`, `MeshRope`) para o nível de detalhe pedido; publica no
   GitHub Pages. O arquivo `arte/sprites/aurora_spriteframes.tres` (Godot) é legado.
2. **Aurora parada = um desenho inteiro deformado por regiões** (estilo Live2D). Um boneco montado com peças
   separadas foi tentado e **ficou estranho** (o Gemini desenhou cada peça num ângulo e escala diferentes).
   Está arquivado em `experimentos/` e `arte/boneco/`.
3. **Animações de movimento = quadros desenhados** (folhas do Gemini), com o cabelo deformado pelo vento por cima.
4. **Escala igualada pela altura da cabeça**, medida com régua em cada fonte (as imagens do Gemini vêm em escalas
   diferentes). Valores em `ferramentas/montar_folha.py` (`POSES`, `CABECA_FOLHAS`, `CABECA_POR_GRUPO`).
5. **Física com os números da skill `platformer`** (`.claude/skills/gamedev-skills`, `jump_tuner.py`). Não mude as
   constantes sem rodar o calculador de novo e os testes.

## Rodada 2 de melhorias (pedidos do usuário) — o que foi feito
- **Cabelo separado do corpo:** a deformação usava caixas, e o peito, as costas e a ombreira balançavam junto.
  Agora `ferramentas/pesos_cabelo.py` acha o cabelo pela cor (prata sem saturação; o metal azulado e a pele
  ficam de fora) e gera pesos que são **zero no corpo** (`jogo/assets/viva/aurora_viva_cabelo.png`,
  `arte/sprites/aurora_folha_cabelo.png`). Rode de novo sempre que a folha de sprites mudar.
- **Vento no cabelo:** `MolaCabelo` (`jogo/src/pesos.js`): mola amortecida (atrasa, passa do ponto e volta),
  onda que desce da raiz à ponta e tremor nas pontas proporcional ao vento.
- **Nitidez:** resolução da tela do aparelho (até 2×) e mipmaps nas texturas (`nitida()` em `aurora_viva.js`);
  `ferramentas/limpar_bordas.py` tira a franja branca das bordas da folha. O resto do "pixelado" vem das folhas do
  Gemini com quadros de ~250 px: os prompts novos pedem 3–4 quadros por imagem.
- **Flecha:** escala 0,62 (~45% da altura dela).
- **Dano:** clarão vermelho, recuo, faíscas, número, vinheta vermelha, tremor e hit-stop (`jogo/src/efeitos.js`).
  A animação `dano` usa a pose normal (as silhuetas branca/vermelha da folha antiga não são mais usadas).
- **Faca:** avanço de um passo no golpe, alcance de 140 px, criatura jogada para trás e atordoada, recuo dela; a
  criatura só machuca pelo miolo (`caixaToque`).
- **Sentar (arte do Gemini, folhas A e B):** `sentar` 4 quadros → `sentada` (respira e pisca, 3 quadros em sequência
  longa) → `levantar` (sentar ao contrário). Ela senta 100 px ao lado do fogo, virada para ele. A folha de sentar
  foi fatiada com `fatiar_folha.py --separar 3` (os arcos deitados encostavam nos vizinhos).
- **Arco v2 (folhas C e D):** pegada fechada no punho, corda no canto da boca, cabelo jogado para trás. A flecha
  que voa sai a 76% da altura dela (na flecha do desenho). As folhas antigas continuam em `poses-originais/`.
- **Criatura com arte:** a sombra de névoa usa a folha do Gemini (`ferramentas/fatiar_sombra.py`: transparência pela
  distância até o branco, para a fumaça não sumir): 4 quadros flutuando, o 1º de morte quando atordoada, os 3 de
  morte ao morrer, clarão do golpe com a mesma imagem somada por cima.
- **Golpe de lâmina (folha G, 2ª versão):** guarda, passo com a lâmina à frente, passo armando, estocada longa
  (segura 1 quadro). O acerto é na estocada (de 0,20 a 0,34 s depois de apertar). Fatiado com `--separar 7` e
  duas correções `--dar` (ponta da lâmina do quadro 2 e ponta do arco do quadro 4 encostavam no quadro 3).
  A 1ª versão da folha G (braço estendido, lâmina erguida) chegou só como visualização.
- **Dano (folha I):** 3 quadros (impacto, cambaleia, recupera com o arco) em 0,33 s, alinhados pelo tronco; clarão,
  recuo, faíscas e vinheta continuam por código.
- **Volta à guarda (folha H):** depois do golpe de lâmina, `lamina_guarda` (recolhe a lâmina, fica em guarda) por 0,45 s
  (variável `guarda` no `main.js`); andar, pular, esquivar ou golpear de novo cancela na hora.
- **Falta arte do Gemini** (prompts em `docs/prompts-aurora-rodada2.md`): mão meio fechada (F) e corrida maior (J). Uma folha J chegou só como visualização, e os quadros 1 a 3 dela são quase os mesmos passos da
  folha G (andando); falta o ciclo completo de corrida (8 quadros).

- **Corpo "elástico" na corrida (corrigido):** com o desenho inteiro numa malha 30×30, os triângulos que cruzavam o
  contorno do rosto, da tiara e do pescoço puxavam o corpo junto com o cabelo. Agora a Aurora em movimento tem duas
  camadas: corpo fixo (Sprite) por cima e só o cabelo na malha, por baixo. O contorno escuro e a borda
  semitransparente do cabelo vão junto com a mecha. A respiração por malha da pose sentada saiu (os quadros do
  Gemini já respiram).

## Fase 1 — A Floresta da Névoa (feita)
- A fase de teste foi trocada pela **Fase 1** em dados (`jogo/fases/fase1.json`), feita com as skills `gamedev-skills`
  (`level-design`, `platformer`, `pixijs-rendering`) e `2d-games` (camadas). Caçada do roteiro: clareira → primeiro
  salto (com vala rasa, sem perigo) → alvos de palha (ensina o arco) → subida pelos galhos → mirante → ravina com
  sombras → penhascos sobre o abismo → galhos com sombras → 2ª fogueira → clareira do cervo (clímax). Abater o cervo
  (flecha ou lâmina) abre a cena final com as falas de Lia e Aurora; R recomeça.
- Galhos são plataformas de uma via (`umaVia` em `fisica.js`). Cair no abismo tira 15 de vida e volta ao último chão.
- Para a próxima fase: copie o formato do JSON, mude `fetch('fases/fase1.json')` no `main.js` para escolher a fase e
  escreva o teste igual ao `fase1.test.mjs` (o jogador robô acusa vão ou subida impossível).
- Fica de fora por falta de arte: a **patrulha imperial** do roteiro (soldados) e o **Prólogo** (Aurora criança).

## Provisório / incompleto (prioridade de cima para baixo)
1. **Combo de verdade**: hoje J faz sempre o mesmo golpe (apertar J na guarda recomeça o golpe). Um 2º golpe
   diferente (outra folha) deixaria encadear golpe 1 → golpe 2.
2. **Criaturas**: só existe a sombra de névoa. Faltam as outras do roteiro e os chefes.
3. **Olhos fechados**: a Aurora parada só tem olhos semicerrados (piscar mais suave). Pedir ao Gemini a mesma
   imagem base com os olhos fechados e incluir em `compor_viva.py` (`FONTES`, novas combinações).
4. **Mão meio fechada**: idem, para o gesto dos dedos ficar com 3 estados (prompt F em `prompts-aurora-rodada2.md`).
5. **Próximas fases do roteiro**: a Fase 1 está pronta. Próxima: Fase 2 (A Tinta que Escorre). O Prólogo precisa da
   Aurora criança (arte nova).
6. **Chefes** (Brakus, o Carneiro, é o primeiro), **diálogos e escolhas** (skill `dialogue-systems`), **som**
   (skill `audio-design`), **controles de toque** e **menu inicial**.
7. Detalhes de arte: as flechas da aljava vieram com penas coloridas (a ficha pede cinza e prata); as folhas do arco
   estão de frente/três-quartos; o rastro do golpe de lâmina está desenhado junto da pose.

## Armadilhas já encontradas
- `Math.pow` com base negativa e expoente quebrado dá `NaN` e **apaga vértices da malha** (sumiu a cabeça uma vez).
  Sempre limite a base com `Math.max(0, …)`.
- Módulos ES não abrem em `file://`: rode `python3 -m http.server` dentro de `jogo/`.
- Folhas do Gemini: quadros vizinhos às vezes se encostam (cabelo, flecha, arco deitado); o `fatiar_folha.py` tem
  plano B (corte nos vales) e plano C (`--separar N`: afina a máscara, separa e devolve cada pixel à peça mais perto).
- As folhas do Gemini chegam com 1024 px de largura (o pedido de 2048 px não é respeitado). Como o jogo reduz os
  quadros (cabeça de 93–148 px na fonte → 70 px no jogo), ainda ficam nítidos.
- O branco preso entre o arco e a corda não encosta na borda: o recorte também apaga áreas brancas fechadas
  grandes (limite proporcional ao tamanho da imagem; menor nas folhas).
- Texturas maiores que 4096 px quebram em muitos celulares: a folha de sprites usa 8 colunas (3072×2688).
- Ao processar imagens novas, confira sempre o resultado **sobre fundo escuro** (é onde aparecem halos e sobras).
- Ordem depois de mexer na folha: `montar_folha.py` → `limpar_bordas.py arte/sprites/aurora_folha.png` →
  `pesos_cabelo.py` (pesos + camadas corpo/mecha) → `npm run preparar`. Os pesos dependem da folha final (posição de cada quadro).
- Nos testes com Playwright, ponha a Aurora perto da fogueira (`__jogo.corpo.x = 270`) antes de apertar E:
  sem save, ela começa a 168 px da fogueira, longe demais para sentar.

## Como verificar o que mudou
```bash
cd Projetos/Aurora-Jogo/jogo && npm install && npm run preparar && npm test
python3 -m http.server 8080   # e abrir com Playwright/Chromium (veja os scripts de teste descritos abaixo)
```
Os testes visuais usados nesta sessão abriam `http://localhost:8080`, liam `window.__jogo` (corpo, estado, vida,
mana, progresso, vento, sombras, fogueiras) e tiravam capturas: parada, lupa (tecla L), correndo, pulo, Salto da
Lua, arco, fogueira (E), vento (`__jogo.vento.soprar(-1, 8)`). Chromium no Playwright: use
`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

## Outros projetos desta mesma conversa (contexto)
- `Projetos/Jogo-Medieval/` e `Projetos/Jogo-Patins/`: ideias anteriores, **substituídas** por este projeto.
- `Projetos/Perfil-Investidor/`: sistema especialista da FECAP (pull request separado).
- `Projetos/Newsletter-PP/`: PRD e direção de arte de uma newsletter (pausado).
