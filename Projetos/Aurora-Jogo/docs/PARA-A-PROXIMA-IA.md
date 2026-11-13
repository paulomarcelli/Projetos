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

## Provisório / incompleto (prioridade de cima para baixo)
1. **Pose sentada na fogueira**: usa o 1º quadro de `aterrissar`. O usuário gerou a folha de sentar, mas ela chegou
   só como visualização. Pedir de novo (prompt na conversa: "SENTANDO NO CHÃO" 3 quadros + "SENTADA" 2 quadros),
   fatiar com `fatiar_folha.py --nomes sentar:3,sentada:2`, registrar em `montar_folha.py` e tocar em `main.js`
   (sentar → sentada em loop; levantar = sentar ao contrário).
2. **Criaturas**: hoje são formas desenhadas em código (`inimigos.js`). A folha da "sombra de névoa" (4 quadros
   andando + 3 de dano/morte) também chegou só como visualização: pedir de novo e trocar o desenho por sprites.
3. **Olhos fechados**: a Aurora parada só tem olhos semicerrados (piscar mais suave). Pedir ao Gemini a mesma
   imagem base com os olhos fechados e incluir em `compor_viva.py` (`FONTES`, novas combinações).
4. **Mão meio fechada**: idem, para o gesto dos dedos ficar com 3 estados.
5. **Fases do roteiro**: hoje há só uma fase de teste. Começar pelo Prólogo e pela Fase 1 (Floresta da Névoa),
   com a skill `level-design`. Montar os níveis em dados (JSON) em vez de no código.
6. **Chefes** (Brakus, o Carneiro, é o primeiro), **diálogos e escolhas** (skill `dialogue-systems`), **som**
   (skill `audio-design`), **controles de toque** e **menu inicial**.
7. Detalhes de arte: as flechas da aljava vieram com penas coloridas (a ficha pede cinza e prata); as folhas do arco
   estão de frente/três-quartos; o rastro do golpe de lâmina está desenhado junto da pose.

## Armadilhas já encontradas
- `Math.pow` com base negativa e expoente quebrado dá `NaN` e **apaga vértices da malha** (sumiu a cabeça uma vez).
  Sempre limite a base com `Math.max(0, …)`.
- Módulos ES não abrem em `file://`: rode `python3 -m http.server` dentro de `jogo/`.
- Folhas do Gemini: quadros vizinhos às vezes se encostam (cabelo, flecha); o `fatiar_folha.py` tem plano B.
- O branco preso entre o arco e a corda não encosta na borda: o recorte também apaga áreas brancas fechadas
  grandes (limite proporcional ao tamanho da imagem; menor nas folhas).
- Texturas maiores que 4096 px quebram em muitos celulares: a folha de sprites usa 8 colunas (3072×2688).
- Ao processar imagens novas, confira sempre o resultado **sobre fundo escuro** (é onde aparecem halos e sobras).

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
