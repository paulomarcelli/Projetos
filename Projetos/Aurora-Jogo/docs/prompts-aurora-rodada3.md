# Prompts para o Gemini: animações da Aurora adulta (rodada 3)

> **Atualização:** o usuário escolheu a Aurora redesenhada no Figma (`arte/figma/aurora_nova/`), e o jogo já usa
> as animações novas. Estes prompts ficam como alternativa para o Gemini; nesse caso, anexe a **ficha nova**
> (`arte/figma/aurora_nova/ficha.png`) como referência, não a imagem antiga.

O que o código já faz sozinho (não precisa desenhar): física do cabelo (onda, inércia, chicote ao virar),
respiração, piscar, fusão entre quadros, neve nos pés, efeitos de luz do golpe, da flecha e do arco carregando.

## Regras (iguais às da rodada 2, mais uma)

1. **Anexe a imagem de referência** da Aurora (`arte/viva-original/aurora_base.webp`) em todo prompt.
2. **No máximo 4 quadros por imagem** (cada quadro sai grande e nítido).
3. **De perfil de verdade.** O Gemini (e o Figma) tendem a desenhar de 3/4. Escreva sempre o bloco de câmera.
4. Mande as imagens como **anexo** (ou .zip).
5. Cole no fim de todo prompt os dois blocos abaixo.

**Bloco de câmera:**
```
CÂMERA: perfil puro, 90 graus de lado, como num jogo de plataforma 2D. Ela olha para a DIREITA: aparece só UM olho,
o nariz aponta para a borda direita da imagem, o peito para a direita, as costas e a aljava para a esquerda.
Nunca de frente, nunca de 3/4.
```

**Bloco de qualidade:**
```
Folha de sprites horizontal com os quadros lado a lado, na ordem, com bastante espaço branco entre eles
(nenhuma parte de um quadro encostando no outro, nem cabelo nem arco). Sem números, sem texto.
Todos os quadros na MESMA escala e com os pés na MESMA linha do chão.
Imagem grande e nítida (pelo menos 2048 px de largura), contorno limpo, sem desfoque de movimento, sem rastros,
sem efeitos de luz, sem sombra no chão. Fundo branco liso.
Mesma personagem da imagem de referência: manter exatamente rosto, proporções, cores, roupa, tiara, armadura e arco.
Estilo igual ao da referência: anime suave, contorno marrom-escuro, cores quentes.
```

---

## 1. Arco completo, com os dedos (2 imagens, 8 quadros)

**Imagem A, "ARCO 1: PEGAR E ENCAIXAR" (4 quadros):**
```
Aurora de perfil, pés firmes na largura dos ombros, arco na mão esquerda.
Quadro 1: em guarda, arco baixo, mão direita relaxada ao lado do corpo.
Quadro 2: a mão direita sobe por cima do ombro até a aljava nas costas, dedos abertos pegando uma flecha.
Quadro 3: a mão direita traz a flecha para a frente, segurando-a entre o polegar e o indicador.
Quadro 4: a flecha encaixada na corda na altura do peito; indicador acima da flecha, médio e anelar abaixo,
dedos curvados na corda; o arco começa a subir.
O cabelo longo cai pelas costas; uma mecha pode passar por cima do ombro esquerdo.
```

**Imagem B, "ARCO 2: PUXAR, SOLTAR, ACOMPANHAR" (4 quadros):**
```
Aurora de perfil atirando com o arco.
Quadro 1: braço esquerdo esticado para a frente, arco na vertical, puxada pela metade.
Quadro 2: puxada completa: corda no canto da boca, três dedos na corda, cotovelo direito alto e para trás,
olho mirando ao longo da flecha, ombros firmes.
Quadro 3: soltura: os dedos se abrem, a mão direita escorrega para trás passando a orelha, a corda já voltou
reta, a flecha já saiu (não aparece).
Quadro 4: acompanhamento: arco ainda erguido, a mão direita relaxada perto do ombro, começando a baixar.
```

No jogo: A (uma vez) → B quadros 1 e 2 (segura enquanto mira) → B 3 e 4.

## 2. Corrida mais forte (2 imagens de 4)

```
Aurora de perfil correndo rápido, corpo inclinado para a frente, arco na mão esquerda, braços balançando.
Imagem 1: quadro 1 pé direito tocando o chão na frente; quadro 2 corpo descendo, joelho direito dobrado;
quadro 3 passagem (perna esquerda passa por baixo do corpo); quadro 4 impulso, os dois pés no ar.
Imagem 2: os mesmos 4 tempos com a outra perna (pé esquerdo na frente).
O cabelo e as abas da túnica vão para trás em todos os quadros.
```

## 3. Mãos da Aurora parada (gesto dos dedos)

```
Close da mão direita da Aurora (sem luva, com a braçadeira de couro marrom), de perfil, na mesma escala e
iluminação da imagem de referência. 4 quadros: mão aberta relaxada; dedos começando a dobrar;
punho fechado; dedos esticando de novo, um pouco abertos.
```

## 4. Golpe de lâmina em 2 golpes (combo)

```
Aurora de perfil com a lâmina curva na mão direita, arco nas costas.
Imagem 1 (golpe 1, de cima para baixo): quadro 1 guarda; quadro 2 lâmina erguida atrás da cabeça (antecipação);
quadro 3 corte descendo na frente, corpo avançando um passo; quadro 4 lâmina embaixo, na frente.
Imagem 2 (golpe 2, horizontal, girando): quadro 1 corpo girando para trás (antecipação); quadro 2 corte
horizontal na altura do peito; quadro 3 lâmina esticada à frente; quadro 4 volta à guarda.
```

## 5. Sentar (opcional: o jogo já corrige o "flutuar")

```
Aurora de perfil sentando no chão ao lado de uma fogueira (a fogueira não aparece).
IMPORTANTE: o arco fica deitado no chão ATRÁS dela (do lado das costas), não na frente.
Quadro 1: dobrando os joelhos, arco baixando. Quadro 2: agachada, mão direita no chão, deitando o arco atrás.
Quadro 3: quadril chegando ao chão. Quadro 4: sentada de pernas cruzadas, quadril e botas no chão, mãos nos joelhos.
```

---

Depois de gerar, mande as imagens e diga qual é qual. O recorte e a montagem são feitos com
`ferramentas/fatiar_folha.py` e `ferramentas/montar_folha.py` (ver `docs/PARA-A-PROXIMA-IA.md`, seção 7).
