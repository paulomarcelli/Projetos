# Direção de arte — personagens e cenários

> Modelo da skill `create-game-assets` (assets/art-direction-brief.md).
> Referência de **estilo** enviada pelo usuário: ilustração chibi com olhos grandes e luz de fim de tarde.
> Usamos só o estilo. Os personagens são originais e não reproduzem o rosto de ninguém da imagem de referência.

## Quadro do jogo
- Fantasia do jogador: patinar pela cidade com estilo, sem parar, até o festival.
- Verbos principais: deslizar, pular, grindar em corrimãos, girar (manobra).
- Motor: Phaser 4 (proposta; decisão em aberto no plano.md).
- Câmera: lateral (side view), personagem voltada para a direita por padrão (espelhada para a esquerda).
- Tela base: 1280×720, escalada para caber em qualquer tela.
- Tamanho do personagem na tela: ~150 px de altura (cerca de 2,5 blocos de 64 px).

## Sistema visual — personagens (chibi)
- **Proporção:** cabeça ≈ 40% da altura total (cerca de 2,5 "cabeças" de altura); corpo pequeno, mãos e pés simplificados.
- **Olhos:** muito grandes, castanhos/coloridos, íris com degradê simples, **dois brilhos brancos** (um grande em cima, um pequeno embaixo) e cílios marcados nas meninas.
- **Rosto:** bochechas com blush rosado, nariz mínimo, boca grande e expressiva quando alegre (sorriso aberto com a língua aparecendo).
- **Contorno:** linha **marrom-escura** (não preta), mais grossa na silhueta (≈3 px na tela) e fina nos detalhes internos (≈1,5 px), com leve variação de espessura, como traço à mão.
- **Pintura:** cel shading em 2 tons (base + sombra quente) e um brilho suave no cabelo; nada de degradês fortes.
- **Cabelo:** mechas grandes e onduladas, com volume; cada personagem com cor e formato bem diferentes, para reconhecer só pela silhueta.
- **Figurino:** roupa casual juvenil (jaquetas, moletons, shorts, tênis/patins), com estampas simples e sem logos de marcas reais.
- **Expressões obrigatórias:** feliz (padrão), concentrada (manobra), surpresa (queda) e comemorando (fim de fase).

## Sistema visual — cenários
- **Luz:** "hora dourada": sol baixo, ar quente, sombras longas em tom lilás.
- **Fundo distante:** desfocado com bokeh (círculos de luz), como na referência, para os personagens se destacarem.
- **Plano do jogo (onde se pisa):** nítido, contorno marrom e topo mais claro; nunca desfocado.
- **Paleta base:** dourado `#F2B544`, pêssego `#F6C9A6`, creme `#FFF3DD`, verde-folha `#8DAE5A`,
  turquesa do mar `#3FA7A3`, lilás das sombras `#9C88B8`, contorno `#4A2E22`.
- **Textura:** granulado leve de papel por cima de tudo (bem sutil).

## Contrato técnico
- Sprites em PNG com transparência real (conferir o canal alfa, não confiar no gerador).
- Folhas de animação em grade de 256×256 por quadro, ponto de apoio nos pés (base central).
- Animações da Mel: parada (4 quadros), patinando (8), pulo/subida (2), queda (2), grind (4), manobra (6), queda/tombo (4), comemoração (6).
- Nomes: `mel_patinando_01.png`, `fase1_fundo_camada2.png`, etc.
- Filtro suave (não é pixel art).

## Alvo visual (a aprovar antes de produzir o resto)
1. **Ficha da Mel:** frente, perfil patinando e 4 expressões, no estilo acima.
2. **Cena de teste:** Mel no Calçadão do Farol, no tamanho real do jogo, sobre o cenário em camadas.
- Responsável pela aprovação: usuário.

## Prompt-base para gerar arte (se a escolha for IA)
```
FINALIDADE: personagem jogável de um jogo de plataforma 2D
ASSUNTO: Mel, garota de 16 anos, cabelo [cor/formato], jaqueta [cor], shorts, patins quad [cor]
VISTA: perfil lateral, voltada para a direita, de corpo inteiro, patinando
DIREÇÃO DE ARTE: chibi, cabeça grande (~40% da altura), olhos enormes com dois brilhos, blush,
  contorno marrom-escuro com espessura variável, cel shading em 2 tons, cores quentes de fim de tarde
LEITURA NO JOGO: silhueta clara a 150 px de altura
SAÍDA: fundo transparente, personagem centralizada, sem cortes
MANTER: proporções, cores do figurino e traço iguais em todas as poses
EXCLUIR: texto, logos, marcas, cenário, outras pessoas, semelhança com pessoas reais
```
