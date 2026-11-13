# A Prova do Sal — direção de arte

> Referências enviadas pelo usuário: capturas de um jogo de plataforma 2,5D independente.
> Usamos **só os princípios de estilo**. Personagens, criaturas, cenários e interface são criados do zero.

## Princípios tirados das referências
- **Cenário "feito à mão" em 3D:** formas simples com textura de papel, papelão, madeira pintada e
  tecido; bordas levemente tortas, como uma maquete de teatro de bonecos.
- **Personagens 2D com contorno** escuro, cabeça grande e olhos expressivos, dentro do cenário 3D.
- **Noite como cor principal:** fundos em roxo, índigo e azul profundo; o primeiro plano mais escuro.
- **Luz que conta a história:** cada fonte de luz (lanterna, cristal, criatura encantada) tem halo
  e brilho; o caminho importante está sempre iluminado.
- **Vida no cenário:** cipós pendurados, musgo, flores que brilham, caixas de madeira, plantas grandes.
- **Interface simples e grossa:** corações grandes no topo, botões redondos coloridos na tela.

## Identidade própria de *A Coroa de Sal*
- **Sal como assinatura:** cristais de sal brancos e azul-claros que brilham (pontos de salvamento,
  tinta, a Coroa). É a luz "boa" do jogo.
- **Maré Cinza:** névoa cinza-lilás que apaga cores e contornos do que toca; o cenário dentro dela
  vira só um esboço a lápis.
- **Os três ambientes:**
  - **Pedralva (o Alto):** pedra clara, cristal, seda, ouro; roxo frio com luz quente de candelabros.
  - **Salinas (o Baixo):** madeira escura, sacos, picaretas, sal sujo; marrom e cinza com tochas laranja.
  - **O Labirinto:** túneis de cristal e pedra que lembram costelas e veias; azul-escuro com brilho de sal e névoa lilás.
- **Os Espelhos de Sal:** cristais grandes nas praças, que mostram a cena com um brilho azul; aparecem como transição entre fases.
- **Desenhos da Aurora:** o que ela desenha aparece com traço de nanquim azul e brilho de sal, até sumir.

## Personagens (originais)
- **Aurora Morvane:** cabelo ruivo-escuro em trança lateral, sardas, capa curta azul-marinho com
  borda de garça bordada, bolsa de couro cheia de rolos de mapa, botas gastas. Lápis atrás da orelha.
- **Fia:** raposa vermelha pequena (não fala), cauda grande com ponta branca, coleira com um cristal.
- Proporção: cabeça grande (≈ 1/3 da altura), olhos expressivos, contorno marrom-escuro.

## Paleta-base
| Uso | Cor |
|-----|-----|
| Fundo noturno | índigo `#2A2350`, roxo `#4B3A78` |
| Sombras do primeiro plano | `#17122B` |
| Luz de sal | `#E8F6FF` com halo `#8FD3FF` |
| Tochas e velas (Aldemar) | `#F2A541` |
| Labirinto | azul profundo `#1C2A4A`, brilho de sal `#BFE6FF`, veias `#6A4C93` |
| Maré Cinza | `#A9A3B8` |
| Contorno dos personagens | `#2B1A14` |

## Contrato técnico
- Cenário: modelos 3D simples (poucos polígonos), texturas pintadas 512–1024 px, luz em tempo real com brilho (glow).
- Personagens: folhas de sprites 2D, 256×256 por quadro, ponto de apoio nos pés.
- Animações da Aurora: parada, andando, correndo, pulo, queda, empurrando, desenhando, lanterna, dano, comemoração.
- Interface: corações, barra de tinta de sal, botões na tela, todos com a mesma espessura de contorno.

## Alvo visual (aprovar antes de produzir)
Um trecho dos **Túneis Mutantes do Labirinto**: paredes de cristal em forma de costelas, névoa lilás,
cristais de sal brilhando, um Espelho de Sal ao fundo, Aurora e Fia no tamanho real do jogo, testado num celular.
