# Sofia Carson · a voz

Fã-site sobre a voz da Sofia Carson, projeto pessoal e de portfólio. **Não é oficial** e não tem vínculo com a
artista nem com a equipe dela; o cadastro de fã não envia nem guarda dados.

No ar: https://paulomarcelli.github.io/Projetos/Projetos/Sofia-Carson/

## Como é

Montado sobre o modelo **Lusco** (Profitize Build): um filme em preto e branco preso atrás da página, que
aparece por "furos" numa folha cor de osso, e o nome gigante sob o holofote, que aqui vira **S◐FIA** (o O de
meia-luz da marca Lusco). O guia, o prompt e os prints do modelo são material pago e ficam fora deste
repositório público: para mexer no projeto com uma IA, copie o `CLAUDE.md` do `lusco.zip` para esta pasta.

| Seção | Conteúdo |
| --- | --- |
| Hero | SOFIA sobre o filme; "Fã-site · a voz" e "Oscar 2023 · ‘Applause’, ao vivo" nos cantos |
| A voz (`#voz`) | ‘Applause’ no 95º Oscar, com Diane Warren ao piano, e a janela cinemascope |
| Palco (`#palco`) | estúdio e palco, com o furo "Só a voz e o palco" no meio |
| Trajetória (`#trajetoria`) | Evie (Descendentes, 2015), Cassie (Purple Hearts, 2022) e ‘Come Back Home’ (MTV 2023) |
| Fã-clube (`#fa-clube`) | raízes em Barranquilla, UNICEF e o cadastro sem envio; SOFIA vazado no rodapé |

## O filme do fundo

Não havia vídeo: o filme é uma montagem das fotos enviadas, com aproximação lenta, corte seco e preto e
branco (`public/video/montagem.mp4`, 13 s, 1 MB; o pôster é o 1º quadro). Para trocar por vídeo de verdade,
siga "Material da pessoa" no `CLAUDE.md` do modelo.

## Fatos e fontes

Tudo o que o site afirma foi conferido antes de entrar:

- ‘Applause’ no Oscar de 2023, com Diane Warren ao piano, e o pedido de aplausos para as mulheres:
  [Variety](https://variety.com/2023/music/news/sofia-carson-diane-warren-applause-oscars-1235544444),
  [Academia](https://press.oscars.org/news/sofia-carson-and-diane-warren-perform-oscarsr).
- *Purple Hearts*: produtora executiva, coautora das quatro primeiras canções da trilha; ‘Come Back Home’ e o
  MTV Movie & TV Awards 2023: [Newsweek](https://mag.newsweek.com/purple-hearts-sound-track-sofia-carson-1734888),
  [Wikipedia](https://en.wikipedia.org/wiki/Purple_Hearts_(soundtrack)).
- Barranquilla (a mãe, Laura Char, ex-rainha do Carnaval) e UNICEF (embaixadora desde 2020; visita ao Recife
  em 2019): [El Heraldo](https://www.elheraldo.co/tendencias/2015/12/24/actriz-de-disney-sofia-carson-pasa-navidad-en-barranquilla-235329/),
  [UNICEF Brasil](https://www.unicef.org/brazil/comunicados-de-imprensa/sofia-carson-conhece-projetos-do-unicef-em-pernambuco).

**Não entram sem confirmação:** "SC2" e o single "Her". Em 14/11/2026 nenhuma fonte confiável confirmava
os dois.

## Fotos

As fotos são de campanhas e redes da artista; os direitos são dos autores. Duas fotos enviadas ficaram de fora
por terem texto ou logotipo na imagem (capas de single).

## Rodar

```bash
npm install
npm run dev
```

`npm run build` gera o `dist/` (caminhos relativos: funciona em qualquer pasta).
