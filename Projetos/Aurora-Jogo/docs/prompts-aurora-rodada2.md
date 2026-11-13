# Prompts para o Gemini: melhorias da Aurora (rodada 2)

Pedidos do usuário nesta rodada: sentar travado, peito mexendo com o cabelo, pegada no arco, flecha enorme,
cabelo sobre o ombro ao mirar, cabelo reagindo ao vento, mãos mais naturais, efeito de dano, combate com faca
muito colado e personagem menos pixelada.

**Já resolvido no código (não precisa de arte nova):** peito parado (pesos do cabelo), reação ao vento (mola),
tamanho da flecha, efeito de dano, avanço e alcance da faca, nitidez na tela (mipmaps e resolução da tela) e
transição de sentar e levantar com respiração. O que depende de desenho novo está nos prompts abaixo.

## Antes de gerar: regras para as imagens chegarem boas

1. **Anexe a imagem de referência** da Aurora (`arte/viva-original/aurora_base.webp`) em todo prompt.
2. **Poucos quadros por imagem:** no máximo 4. As folhas antigas tinham 8 quadros, e cada um saiu com ~250 px,
   por isso a Aurora fica "pixelada" no jogo. Com 3 ou 4 quadros, cada um sai com 600 px ou mais.
3. **Mande os arquivos como anexo** (ou num .zip). Imagem colada no meio da conversa às vezes chega só como
   visualização e não dá para processar.
4. Cole sempre o **bloco de qualidade** no fim do prompt:

```
Folha de sprites horizontal com os quadros lado a lado, na ordem, com bastante espaço branco entre eles
(nenhuma parte de um quadro encostando no outro, nem cabelo nem arco).
Todos os quadros na MESMA escala e com os pés na MESMA linha do chão.
Imagem grande e nítida (pelo menos 2048 px de largura), contorno limpo e definido, sem desfoque de movimento,
sem rastros, sem efeitos de luz, sem sombra no chão. Fundo branco liso.
Mesma personagem da imagem de referência: manter exatamente rosto, cores, roupa, tiara, armadura e arco.
Estilo igual ao da referência: anime suave, contorno marrom-escuro, cores quentes. Sem texto, sem logos.
```

---

## 1. Sentar na fogueira e ficar sentada (substitui a pose agachada provisória)

**Imagem A, "SENTANDO" (4 quadros):**
```
Aurora de perfil, voltada para a direita, sentando no chão ao lado de uma fogueira (a fogueira NÃO aparece).
Quadro 1: em pé, relaxada, começando a dobrar os joelhos, o arco na mão esquerda baixando.
Quadro 2: agachada, apoiando a mão direita no chão ao lado do corpo, o arco sendo deitado no chão à frente.
Quadro 3: sentando, quadril quase no chão, uma perna se dobrando por baixo da outra.
Quadro 4: sentada no chão com as pernas cruzadas de lado (uma dobrada na frente, a outra para trás),
tronco reto, mãos apoiadas nos joelhos, o arco deitado no chão ao lado, olhando para a frente (para a fogueira).
O cabelo longo cai pelas costas até o chão e as tranças caem na frente dos ombros.
```

**Imagem B, "SENTADA" (3 quadros, para o loop de descanso):**
```
Aurora sentada no chão de perfil, voltada para a direita, pernas cruzadas de lado, mãos nos joelhos,
expressão calma e cansada, olhando para a frente (para uma fogueira que não aparece).
Quadro 1: respirando (inspirando), ombros um pouco mais altos.
Quadro 2: expirando, ombros mais baixos, cabeça levemente inclinada para baixo.
Quadro 3: igual ao 1, mas com os olhos fechados (piscando).
O corpo fica exatamente no mesmo lugar nos 3 quadros: só ombros, cabeça e olhos mudam.
```

No jogo: `sentar` (A, 4 quadros, uma vez) → `sentada` (B, em vai e volta) → `levantar` (A ao contrário).

## 2. Arco: pegada certa e cabelo sobre o ombro

**Imagem C, "PREPARAR O ARCO" (4 quadros):**
```
Aurora de perfil, voltada para a direita, preparando o arco.
Quadro 1: a mão direita alcança a aljava no quadril e puxa uma flecha.
Quadro 2: traz a flecha para a frente; com a mão esquerda ela joga o cabelo solto por cima do OMBRO ESQUERDO
(o ombro mais perto da câmera), e o cabelo passa a cair na frente do peito, longe da corda.
Quadro 3: encaixa a flecha na corda; a mão esquerda segura o punho do arco FECHADA em volta da empunhadura,
dedos enrolados e polegar por cima, os nós dos dedos virados para a direita (para o alvo).
Quadro 4: arco na vertical na frente do corpo, flecha encaixada, braço esquerdo começando a se estender.
A flecha tem cerca de metade da altura dela, haste fina, penas cinza e prata.
```

**Imagem D, "MIRAR E ATIRAR" (4 quadros):**
```
Aurora de perfil, voltada para a direita, atirando com o arco, cabelo solto jogado sobre o ombro esquerdo
(na frente do peito), longe da corda.
Pegada correta de arqueira: braço esquerdo estendido para a direita, quase reto, segurando o punho do arco
com a mão fechada em volta da empunhadura; a flecha apoiada em cima da mão esquerda.
Mão direita puxa a corda com três dedos (indicador acima da flecha, médio e anelar abaixo), até o canto da boca;
cotovelo direito na altura do ombro, apontando para trás. Ombros alinhados com a flecha.
Quadro 1: puxando a corda até a metade.
Quadro 2: corda totalmente puxada, mirando, olhar firme no alvo, arco bem curvado.
Quadro 3: acabou de soltar: dedos da mão direita abertos perto do rosto, a corda reta, SEM a flecha no arco.
Quadro 4: depois do tiro: braço do arco ainda estendido, mão direita relaxando para trás, olhar acompanhando.
Flecha com cerca de metade da altura dela, haste fina, penas cinza e prata.
```

## 3. Mãos mais naturais

**Imagem E, "MÃOS" (folha de referência, 6 desenhos):**
```
Folha de referência das mãos da Aurora (luvas de couro marrom sem dedos e braçadeiras de couro com fivelas),
no mesmo estilo e escala da personagem, vistas de perfil:
1. mão relaxada ao lado do corpo, dedos levemente curvados (não retos nem duros);
2. mão meio fechada, descansando;
3. mão fechada em punho;
4. mão segurando o punho do arco (dedos enrolados na empunhadura, polegar por cima);
5. mão puxando a corda com três dedos;
6. mão segurando a lâmina curva pelo cabo, lâmina para a frente.
Dedos com articulações visíveis e proporções naturais, unhas curtas.
```

**Imagem F, "PARADA COM A MÃO MEIO FECHADA" (para a Aurora parada ter 3 estados de mão):**
```
Exatamente a mesma imagem de referência, pixel por pixel na mesma posição, só com a mão direita
(a que está solta ao lado do corpo) MEIO FECHADA, dedos curvados e relaxados. Nada mais muda.
```

## 4. Lâmina: combo com distância (não colado)

**Imagem G, "GOLPES DE LÂMINA" (4 quadros):**
```
Aurora de perfil, voltada para a direita, atacando com a lâmina curva da mãe (faca longa) na mão direita,
o arco preso nas costas. Golpes com o braço BEM ESTENDIDO, longe do corpo, avançando um passo largo.
Quadro 1: preparação: recua o braço da lâmina para trás do corpo, peso na perna de trás, joelhos dobrados.
Quadro 2: corte horizontal: dá um passo largo à frente, braço totalmente estendido para a direita,
a lâmina na altura do peito, bem à frente dela.
Quadro 3: corte de baixo para cima: tronco girando, braço subindo na diagonal, ainda estendido.
Quadro 4: estocada final: avanço longo (perna da frente bem dobrada, a de trás esticada), braço e lâmina
apontando para a frente na altura do ombro.
SEM rastro, sem brilho e sem efeito do golpe (o rastro é feito no jogo). O cabelo voa para trás com o movimento.
```

**Imagem H, "VOLTA À GUARDA" (2 quadros):**
```
Aurora de perfil, voltada para a direita, depois de atacar com a lâmina:
Quadro 1: recolhendo o braço, recuando meio passo, lâmina na frente do corpo em guarda.
Quadro 2: em guarda, pernas afastadas, lâmina na mão direita abaixada na frente, olhar firme.
```

## 5. Dano (sem o piscar branco desenhado)

**Imagem I, "DANO" (3 quadros):**
```
Aurora de perfil, voltada para a direita, sendo atingida por um golpe vindo da direita.
Quadro 1: impacto: tronco jogado para trás, cabeça virando, olhos apertados de dor, braços se afastando do corpo,
o cabelo e as tranças jogados para a frente pelo tranco.
Quadro 2: cambaleando para trás, um pé saindo do chão, o arco quase caindo da mão.
Quadro 3: recuperando o equilíbrio, joelhos dobrados, olhar de raiva para a direita.
SEM brilho, SEM silhueta branca ou vermelha (o efeito de dano é feito no jogo).
```

## 6. (Opcional) Corrida em resolução maior

O ciclo de corrida atual veio numa folha com 8 quadros pequenos. Para ficar nítido como a Aurora parada:
**Imagens J1 e J2, "CORRENDO" (4 quadros cada, 8 no total):**
```
Aurora de perfil, voltada para a direita, ciclo de corrida completo em 8 quadros (nesta imagem os quadros
[1 a 4 | 5 a 8]): contato, passagem, impulso e voo de cada perna, braços alternando, o arco na mão esquerda,
o cabelo voando para trás e ondulando.
```

---

## Depois que as imagens chegarem (para a IA)

```bash
# na pasta Aurora-Jogo; troque os nomes pelos arquivos recebidos
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_sentar.webp --nomes sentar:4 --saida arte/sprites/recortes
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_sentada.webp --nomes sentada:3 --saida arte/sprites/recortes
# registrar cada pose nova em POSES / CABECA_FOLHAS (ferramentas/montar_folha.py), depois:
python3 ferramentas/montar_folha.py
python3 ferramentas/limpar_bordas.py arte/sprites/aurora_folha.png
python3 ferramentas/pesos_cabelo.py
cd jogo && npm run preparar && npm test
```
Em `jogo/src/main.js`, as animações `sentar`, `sentada`, `levantar` e `dano` hoje são montadas por código com os
quadros que existem (procure "animações montadas por código"): quando as folhas novas estiverem na folha de
sprites, apague essas linhas para o jogo usar as do JSON.
