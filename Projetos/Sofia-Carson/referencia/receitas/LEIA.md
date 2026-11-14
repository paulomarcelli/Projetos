# Receitas: como foram feitos o fundo e as imagens da Lusco

Tudo aqui serve para refazer as peças com o material de outra produtora. Nada depende de uma conta específica: qualquer gerador de imagem que aceite imagem de referência e qualquer gerador de vídeo com "imagem para vídeo" servem.

## Ordem
1. **Quadro do cinegrafista** (a imagem-mãe): `imagens/quadro-cinegrafista.txt`. Gere em 16:9 e refine até ele sair imperfeito, como uma foto de set: luz fora do centro, raios desiguais, névoa irregular. Foto "perfeita" (raios simétricos, sujeito no meio da luz) denuncia IA.
2. **Os outros quatro quadros** (mãos no foco, olho, diretor no monitor, operador de boom): `imagens/quadro-*.txt`, cada um gerado com o quadro do cinegrafista anexado como referência de luz e textura.
3. **Um clipe por quadro**: `video/clipe-*.txt`. Imagem para vídeo, partindo do quadro como **primeiro quadro**, sem quadro final, 16:9, sem áudio; 5 s (o olho, 3 s). Na demo foi o Wan 3.0 Prime em 720p: cerca de 15 créditos do Higgsfield por clipe de 5 s (alguns reais), 69 no total. O fundo é escuro e granulado; 720p segura bem.
4. **A montagem**: `../fonte/montagem.sh` junta o trecho bom de cada clipe com corte seco, em preto e branco, num MP4 de ~2 MB que toca em loop atrás da página.
5. **As miniaturas da intro**: `../fonte/miniaturas.sh` tira um quadro de cada clipe (e das fotos dos filmes) em 480 × 270.

## O que observar nos clipes
- Assista cada um inteiro: o gerador às vezes desanda na segunda metade (na demo, o diretor saiu do quadro e o monitor encheu a tela com letras sem sentido; o boom abaixou a vara). Use só o trecho bom; 2 a 4 s por clipe bastam numa montagem.
- Não peça quadro final igual ao inicial para "fechar o loop": o gerador anda para outra cena e pula de volta no último quadro. O loop da montagem é corte seco, como num reel.
- Pessoa sempre em silhueta ou em close parcial (mão, olho): rosto inteiro iluminado tende a sair com cara de IA.

## Fotos dos filmes
`filme-carro` e `filme-clipe` são fotos do Pexels (licença livre): Victor Armas (https://www.pexels.com/photo/white-suv-under-the-rain-with-headlights-on-12742617/) e Wolrider Yurtseven (https://www.pexels.com/photo/woman-singing-at-concert-in-club-19517629/). Na demo, o emblema do carro e um texto ao fundo foram retocados. Num site de verdade, entram quadros dos filmes da própria produtora (4:5, 1024 × 1280 ou maior).

## Saída sem vídeo
Sem gerar nada: use um vídeo do próprio reel da produtora (16:9, escuro, sem texto queimado) no lugar da montagem, ou deixe só o pôster (`montagem.jpg`) como imagem fixa: o `fundo.js` já faz isso com movimento reduzido.
