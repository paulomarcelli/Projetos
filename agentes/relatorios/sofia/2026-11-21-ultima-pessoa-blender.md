# Acabamento 3D · "E se você fosse a última pessoa do mundo?"

Sofia · 21/11/2026

## 1. Pedido

Subir o acabamento do 3D do vídeo (Blender sem janela, montado por código) sem mudar a história, os enquadramentos
aprovados, os tempos nem as camadas 2D. No meio da tarefa entraram dois pedidos novos: melhorar o personagem (o
"você" e a multidão) e tirar o "você" de baixo do fato no supermercado (P4).

## 2. A ideia

**O que denuncia o "3D de código" é a maior área do quadro:** do drone, isso é o telhado, o céu e a árvore. Mexi
primeiro no que ocupa mais pixels por plano, depois nas cenas internas.

Partes da `design-skills` usadas:
- `critique-composition` e `visual-hierarchy`: ler cada quadro pelo peso (telhado claro e liso puxava o olho mais que
  a avenida) e garantir que o "você" continua o ponto de entrada.
- `critique-color`: a camiseta amarela `#FFD21F` como única cor saturada. Por isso as placas do supermercado saíram
  do amarelo e a testeira das gôndolas ficou num vermelho apagado.

Skills Blender (pacote novo, pelo roteamento da `blender-director`):
- `blender-director`: brief e roteamento (ambiente, vegetação, veículo, personagem, luz, materiais, QA).
- `realistic-style` (valores PBR, escala real), `environment-artist` (`references/composition.md`: camadas e
  silhueta), `archviz` (`references/archviz-lighting.md`: interior com luz de janela e placas de piso).
- `vegetation-artist` (`references/tree-lod.md`: tronco, galho e copa em tufos), `vehicle-artist` (proporção e
  cabine), `character-artist` (`references/body-proportions.md`: 7,5 a 8 cabeças).
- `lighting`, `lookdev` (uma variável por passada, captura a cada passada), `materials`
  (`references/procedural-patterns.md`: escorrido, manchas, variação por objeto), `set-dressing` (placas de
  corredor, gôndolas), `apocalypse-worlds` (Pripyat: capim e asfalto tomados), `rendering` e `qa-review`.

**Ferramentas:** o Blender MCP não estava conectado; tudo foi feito com o Blender 5.3 sem janela. O Figma não entrou
nesta tarefa (trabalho de cena 3D em código); a seção v2 do `docs/design-system.md` ganhou as regras de acabamento.
**Graphify (regra 8 do protocolo):** o CLI `graphify` não está instalado neste PC. Não consultei grafo nenhum; li os
arquivos direto.

## 3. O que mudou

Tudo em `Projetos/E-Se-Hein/blender/`. Nada em `src/`, no spec, nas câmeras, nos eventos ou nos textos.

**`comum.py`**
- `ceu_e_sol`: Hue/Saturation no céu (`sat_ceu`, 1,45 por padrão) e aerossol 0,12. O céu leitoso virou azul com
  profundidade, e a sombra puxa para o azul.
- Novos: `caixa_rapida` (caixa vértice a vértice; `bmesh.ops.create_cube` numa malha grande varre a malha inteira a
  cada chamada), `cone_entre` (galhos, braços, mastros), `afunilar` (cabine de carro, ombros), `rampa_paleta`.

**`paulista.py`** (P1, P5, P7; os materiais também servem P3, P4 e P6)
- `materiais` → fachada: térreo escuro de lojas, coroamento sem janela no topo, pilares a cada 3 a 7 colunas nos
  prédios de janela recortada, tom por andar, sujeira que escorre, vidro que reflete o céu (metal com o tom do vidro,
  cada painel um pouco diferente), persiana em parte das janelas. Telhado: 8 tons escuros por prédio, manchas e
  juntas de laje (antes um cinza claro liso).
- `predios` + novos `atributos_predio`, `telhados` e `mat_cobertura`: platibanda em toda caixa; casa de máquinas com
  caixa d'água, fila de ar-condicionado, placas solares e mastro nos prédios da frente; casinha e caixa d'água no
  fundo. Sorteio próprio com semente fixa: **o layout aprovado não mudou** (a sequência de `random` é a mesma).
- `chao`: o chão de longe vai até 30 km. Antes acabava em 6 km e o céu aparecia embaixo do horizonte, lendo como mar.
- `malha_arvore` + `mat_copa`: tronco que afina, 3 a 5 galhos aparentes, copa em 11 a 16 tufos irregulares (vértices
  sacudidos), tom por tufo e por árvore, relevo de folhagem e a parte de baixo da copa mais escura. Forma "choupo"
  (alta e estreita) para Pripyat.
- `malha_carro`: ombro arredondado, cabine que afina com para-brisa inclinado, teto na cor do carro; tinta metálica.
- **Personagem** `malha_pessoa`: pessoa de 1,75 m (7,5 cabeças), olhando para onde anda; pernas separadas, quadril,
  tronco achatado de frente para trás, camiseta de manga curta, braços com cotovelo, mãos, pescoço, cabeça com nariz
  e orelhas, cabelo (curto ou longo) e tênis. Materiais: camiseta, calça (7 tons), pele (5 tons), cabelo (6 tons) e
  tênis (5 tons). Pose "empurra" para o carrinho. Os pedestres agora olham para onde andam (antes todos olhavam
  para +x).
- `voce`: a mesma malha nova. **Mantive a escala 6× (3× na altura)**, com brilho leve e sem sombra: a 180 m uma
  pessoa de verdade tem 2 a 3 px e o ponto amarelo do Design System sumiria. Com a malha nova o ponto continua
  nítido e agora lê como alguém visto de cima (ombros amarelos, cabeça escura). Conferido em P1 3,6 s e P7 63,0 s:
  o ponto fica em y ~1100, fora da faixa da legenda.
- `mato` e `chuva`: as 6.500 moitas e os 9.000 pingos são feitos vértice a vértice. A montagem do P5 caiu de 157 s
  para 7 s; a do P1, de 33 s para 8 s.

**`outras.py`**
- P3 `montar_metro` e `mat_solo`: **o túnel estava quebrado.** O Boolean exato em malhas de caixas sobrepostas
  apagava a parede de azulejo, o piso, o lastro e os dormentes; o fundo do vão aparecia como uma parede salmão e os
  trilhos (que a água precisa cobrir em "alagar") quase não existiam. Remontei tudo em blocos que já deixam o vão e
  o poço abertos, sem Boolean. Terra com camadas de sedimento, manchas, pedras com relevo e a parte encharcada em
  marrom escuro (antes um azul chapado em meio quadro). Parede de azulejo com faixa azul e encardido. Luz de
  preenchimento quente ligada só à terra (light linking), para o corte mostrar relevo sem acender o túnel: o
  "desligadas" continua forte. Céu com saturação 1,1 nesta cena.
- P4 `montar_mercado`: piso de porcelanato 60 cm com brilho e desgaste, parede com rodapé e faixa verde, forro em
  placas, gôndolas até x 40 (o fundo não fica um piso vazio), testeira das gôndolas, três placas de corredor sem
  texto, carrinho com puxador, pés e rodas. O "você" de perto usa camiseta de tecido sem brilho, com as mãos no
  puxador. **Pedido da Sabrina:** ele foi para o fundo, perto da geladeira e à direita do corredor (x 40,5, y −2,4;
  antes x 33, y 0,3). Projeção conferida: os pés ficam acima de y 1055 o plano inteiro, fora do fato (y 1085 a 1180)
  e da legenda.
- P6 `montar_pripyat`: capim em três escalas com relevo, asfalto velho com rachaduras e mato, chão até o horizonte,
  platibanda e casa de máquinas nos blocos (sem ar-condicionado nem placa solar: é 1986), dois desenhos de choupo.
- P2 (cidades à noite): **sem mudança.** É luz de cidade vista de 3 km; nada do diagnóstico valia para ela.

Também: `Projetos/E-Se-Hein/docs/design-system.md`, seção "Acabamento 3D (Sofia, 21/11/2026)" na parte v2.

## 4. Capturas

- **Antes e depois por cena, mais o personagem:** `Projetos/E-Se-Hein/out/conferencia/sofia-antes-depois.jpg`.
- Antes (com 2D): `out/conferencia/antes-sofia/`; quadros crus do Blender de antes: `out/conferencia/antes-sofia/blender/`.
- Depois (com 2D): `out/conferencia/ultima-pessoa/` (folha principal `folha.jpg`; quadros extras em `folha-extra.jpg`).

## 5. Conferido em

**Tempo por quadro** (resolução cheia, 24 amostras, RTX 5050, 8 quadros seguidos com dados persistentes como no
render final; média sem o primeiro, que monta a BVH). O "antes" é o código original rodado na mesma máquina:

| Plano | Antes | Depois |
|---|---|---|
| P1 (Paulista cheia, o mais pesado) | 2,78 s | 3,48 s |
| P4 (supermercado) | 2,42 s | 2,06 s |
| P6 (Pripyat) | 1,87 s | 2,34 s |
| P7 (Paulista vazia) | 2,55 s | 2,93 s |

Tudo abaixo do teto de ~5 s. O primeiro quadro de cada plano leva 3,4 a 4,4 s. A **montagem** da cena caiu: P1 de
33 s para 8 s, P5 de 157 s para 7 s. P2, P3 e P5 não foram medidos em sequência; os quadros soltos deles levaram
1,8 a 2,6 s.

Conferência com as camadas 2D por cima (`scripts/conferencia-v2.mjs`), 19 quadros, com o quadro cru do Blender
aberto ao lado quando precisou. A posição do "você" no P4 foi conferida por projeção da câmera nos quadros 1, 43,
175 e 190.

Lista da Karol, quadro a quadro (P1 1,0 · 3,6 · 9,0 · 15,5 · 17,6; P2 20,5; P3 29,6 · 33,7; P4 35,5 · 39,9; P5 41,2 ·
44,8 · 47,8; P6 50,6 · 54,0 · 57,4; P7 60,0 · 63,0 · 65,5):
- Pé ou cabeça fora do quadro: nenhum.
- Objeto flutuando ou atravessando: o quadril que vazava a camiseta foi corrigido; carro, pessoa e caixa d'água no
  chão ou na laje.
- Texto fora da zona segura e algo importante na faixa da legenda: nenhum; o "você" do P4 saiu da faixa do fato.
- Cena vazia sem leitura do lugar: o P4 ganhou gôndolas até a geladeira; o P3 voltou a ter túnel, plataforma e trilhos.
- Quadro preto: nenhum.
- Efeito fraco: o céu saturado fazia uma faixa rosa forte no pôr do sol (P1 17,6 s), atrás da linha do lugar no
  contador; agora a saturação do céu desce de 1,45 para 1,1 junto com o sol. As janelas quebradas e as manchas do P5
  continuam pouco visíveis do alto (já eram antes; não mexi nesses eventos).
- Ponto amarelo do "você": nítido em P1 3,6 s e P7 63,0 s, em y ~1100.

**Problema que achei e não era do pedido:** o túnel do P3 já estava quebrado na folha aprovada (Boolean). Consertei
porque o evento "alagar" depende dos trilhos. O P3 mudou de cara mais que as outras cenas: a parede salmão virou o
azulejo que o código sempre quis desenhar. Vale o Paulo olhar esse antes e depois.

## 6. Ficou de fora

- Copas de Pripyat de perto ainda lembram brócolis (tufos arredondados). Folha em cartão com transparência deixaria
  mais crível, mas custa tempo de render; não fiz.
- Carros e ônibus de perto não existem em plano nenhum; parei na silhueta (cabine e capô). Sombra de contato extra
  não foi preciso: o sol já faz.
- A água do P3 continua uma faixa azul fina sobre os trilhos. Lê, mas é discreta.
- Pele sem subsurface (custo); só variação de tom por pessoa.
- Não rodei o plano inteiro de nenhuma cena: medi 8 quadros seguidos em 4 planos.

## 7. Próximos passos

1. Karol: render final como de costume (`render.py --sequencia`). A montagem ficou mais rápida; o tempo por quadro
   está na seção 5.
2. Karol: no render final, olhar o P3 inteiro entre "desligadas" e "alagar" (a água sobe sobre trilhos agora
   inteiros; não vi o plano todo).
3. Sofia, se o Paulo quiser mais: folhas em cartão nas copas do P6 e uma pessoa sentada na bicicleta (hoje o
   ciclista é uma pessoa em pé a 0,5 m do chão, que do alto não se vê).

```text
ENTREGA
Resumo: acabamento 3D das 7 cenas (céu, telhados, fachadas, árvores, carros, P3 refeito sem Boolean, P4, P6) e
personagem novo (o "você" e a multidão), sem mudar câmera, spec, tempos, 2D nem layout aprovado. "Você" do P4 fora
da faixa do fato. Tempo por quadro de 2,1 a 3,5 s; montagem mais rápida.
Arquivos: Projetos/E-Se-Hein/blender/comum.py, paulista.py, outras.py; Projetos/E-Se-Hein/docs/design-system.md
(seção Acabamento 3D); out/conferencia/sofia-antes-depois.jpg; out/conferencia/antes-sofia/; este relatório;
agentes/memoria/sofia.md.
Conferido: 19 quadros com as camadas 2D, lista da Karol, projeção do "você" no P4, tempo medido em 4 planos.
Pendências: copas do P6 ainda arredondadas; água do P3 discreta; nada do plano inteiro renderizado; Figma não usado;
graphify não instalado; Blender MCP não conectado. Nada commitado.
Próximo: Karol (render final); o Paulo olha a folha de antes e depois, em especial o P3.
```
