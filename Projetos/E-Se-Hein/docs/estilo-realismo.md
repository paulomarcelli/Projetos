# Estilo realista (pedido do Paulo, 18/11/2026)

O Paulo mandou um vídeo de referência de um canal de "What if" em inglês: o canal mostra os bastidores e um vídeo dele
com 2,6 milhões de visualizações. O pedido: deixar os vídeos do E Se, Hein? nesse estilo de realismo e com as melhorias
de processo que o vídeo mostra. Os quadros da referência não entram no repositório: são de outro canal. Aqui fica só a
análise.

A ideia é aprender os princípios, não copiar o visual. O canal continua com a marca, a voz da Maia e o formato
"E se…?".

## 1. O que a referência faz na tela

**Mundo real e cheio.** O vídeo "E se a Terra chegasse ao zero absoluto por 5 segundos?" se passa num lugar real e
reconhecível: uma praia de Santa Monica. Ela é vista do alto, como num drone, com:
- palmeiras e o píer com a roda-gigante;
- areia com marcas e sombras longas;
- centenas de pessoas pequenas e carros.

A cena é montada por código, não gerada por IA de vídeo ("352 carros na Times Square").

**Luz de verdade.** Sol com sombra dura, céu claro e cor natural. Quando a Terra congela, a mesma cena vira branca de
geada: o antes e o depois no mesmo lugar e no mesmo enquadramento.

**Câmera de documentário.** Plano alto e calmo, com movimento lento. O lugar fica legível.

**Pouco texto, e elegante:**
- **Dado no canto:** "TEMPERATURA · 72 °F · SANTA MONICA, CALIFÓRNIA", que vira "−459,67 °F · ZERO ABSOLUTO". O
  número é o que conta a história.
- **Título serifado** no alto, em branco.
- **Legenda em itálico serifado**, frase inteira ("A Terra acabou de chegar ao zero absoluto.").

Não tem pílula colorida nem desenho de brinquedo.

## 2. O processo que a referência mostra (as "melhoras")

1. **Uma linha de ideia,** e antes de tudo a conferência: "ninguém postou isso ainda, eu chequei".
2. **Fontes:** todo número da tela tem fonte.
3. **Não é vídeo de IA:** é código que monta o mundo inteiro, com detalhe de verdade (centenas de carros, prédios,
   pessoas).
4. **A IA confere os próprios quadros e conserta o que está fraco.** Exemplos do vídeo: "pé fora do quadro" e "vapor
   fraco demais", os dois corrigidos.
5. **O render roda no computador** (3.000 quadros em 18 minutos). Custo extra: zero, dentro do plano do Claude.

## 3. O que já temos e o que muda

| Item | Hoje | Muda para |
|---|---|---|
| Ideia | Gabriela escolhe pela estratégia | Gabriela também confere que o tema não tem vídeo grande no TikTok e no YouTube (um com mais de 1 milhão de visualizações já postado), e diz isso na página |
| Lugar | Cidade e praia genéricas | Cada vídeo num lugar real e reconhecível do Brasil, quando o tema permitir (ex.: Copacabana, Avenida Paulista, Pão de Açúcar), com o nome e um dado na tela |
| Fontes | Sabrina confere o roteiro | Sabrina confere também os números do dado no canto (temperatura, distância, tempo) |
| Mundo 3D | Brinquedo low-poly no Three.js | Mundo realista no Blender (luz de sol e céu, sombra, materiais PBR, multidão e carros), montado por código, com a técnica da `how-its-built-starter` e as skills do Blender e do Poly Haven |
| Câmera | Perto do boneco | Plano de drone alto e lento sobre o lugar; antes e depois no mesmo enquadramento |
| Texto na tela | Pílulas, ícones, Rubik 800 | Menos texto: dado no canto, título e legenda com tipografia de documentário. A Sofia redefine isso no Design System antes de qualquer código |
| Conferência dos quadros | Folha de contato olhada uma vez | Rodada obrigatória: a Karol olha cada quadro-chave com uma lista (pé fora do quadro, efeito fraco, objeto atravessando outro, texto fora da zona segura, cena vazia), corrige e mostra antes e depois |
| Render | No PC com a RTX 5050 | Igual |

## 4. Ordem

1. **Sofia:** direção de arte "realismo documental" no Design System do canal (Figma), com tipografia, dado no canto,
   título, legenda, cor e câmera. A marca (E?, laranja no fechamento) fica.
2. **Karol, no PC com o Blender:** um protótipo de 10 segundos num lugar real, com a rodada de conferência dos quadros.
   O Paulo aprova o visual antes de virar padrão.
3. **Gabriela e Sabrina:** a conferência de tema já postado e a de números no dado do canto entram desde o próximo
   roteiro.
