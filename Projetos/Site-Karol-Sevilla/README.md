# 🌐 Site Karol Sevilla

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</div>

<p align="center">
  <b>Um site de fã sobre a história, a superação e a música de uma das minhas grandes ídolas.</b>
</p>

---

## 📌 Sobre o projeto

O **Site Karol Sevilla** começou como o meu primeiro projeto web e agora ganhou uma nova versão. Criei esta página para contar a trajetória da Karol Sevilla, atriz, cantora e compositora que admiro, em três capítulos, apresentar as músicas *Mariposas* e *Más linda* e refletir sobre o que a história dela ensina.

A navegação foi inspirada em players de música (barra lateral, cartões, faixas e uma barra inferior), mas as cores, os textos, os ícones e a identidade são meus. Todas as informações têm fonte citada, e o que é opinião minha aparece marcado como "Nossa leitura".

É um site de fã, sem vínculo oficial com Karol Sevilla, Disney, gravadoras ou Spotify.

## ✨ Funcionalidades

- **Início** com apresentação, atalhos para os capítulos, destaques musicais e cartões de reflexão.
- **História** com uma linha do tempo de 1999 a 2026: ao clicar (ou apertar Enter) em um marco, o site abre o trecho certo do capítulo.
- **Três capítulos** com etiquetas que mostram o tipo de informação: *Fato*, *Nas palavras dela* e *Nossa leitura*, além das fontes numeradas.
- **Universo musical** com *Mariposas* e *Más linda* em destaque, lista de faixas com filtros e links oficiais (YouTube, Apple Music e Spotify, quando confirmados).
- **Player honesto**: ao escolher uma música, a barra de baixo mostra o título e os links oficiais. O site **não toca áudio** e avisa isso na tela.
- **O que Karol tem a nos ensinar?** com seis lições, cada uma ligada a um fato ou a uma fala dela.
- **Créditos e fontes** com a lista numerada de fontes, os links oficiais e os créditos de todas as imagens.
- Funciona no celular, no tablet e no computador, pelo teclado e também com o JavaScript desligado (as seções aparecem uma embaixo da outra).

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura e todo o conteúdo do site (capítulos, músicas, lições e fontes) |
| CSS3 | Variáveis de design (tokens), layout em grid, responsividade e animações leves |
| JavaScript | Navegação entre as seções pelo `#` da URL, player, filtros e setas das prateleiras |
| Google Fonts | Fontes Fredoka (títulos) e Figtree (textos) |

Não usei frameworks nem bibliotecas: é HTML, CSS e JavaScript puro, sem etapa de build.

## 📁 Arquivos

```text
Site-Karol-Sevilla/
├── index.html                  → o site novo (todas as seções)
├── assets/
│   ├── css/
│   │   ├── tokens.css          → cores, fontes, espaçamentos (variáveis)
│   │   └── main.css            → estilos do layout e dos componentes
│   ├── js/
│   │   ├── ui.js               → prateleiras, imagens com erro, realce de trechos
│   │   ├── player.js           → player honesto e filtros de músicas
│   │   └── app.js              → estado do site e navegação por #
│   └── img/                    → fotos livres (WebP), ícone e imagem de compartilhamento
├── primeira-versao/            → o meu primeiro site, preservado
│   ├── index.html
│   ├── style.css
│   └── script.js
├── docs/                       → planejamento, pesquisa, design e testes
└── README.md
```

## ▶️ Como visualizar

Abra o arquivo `index.html` no navegador ou utilize o **Live Server** no Visual Studio Code.

Também dá para usar um servidor simples do Python dentro da pasta:

```bash
python3 -m http.server 8000
```

Depois é só abrir `http://localhost:8000` no navegador.

## 🌐 Ver o site online

Acesse o projeto publicado no GitHub Pages: [**Abrir Site Karol Sevilla**](https://paulomarcelli.github.io/Projetos/)

## 🖼️ Imagens e créditos

- **Fotos do Wikimedia Commons**, com licenças abertas (CC BY 3.0 e CC BY-SA 4.0): eu só redimensionei e converti para WebP. Os créditos completos (autor, licença e link do arquivo) estão na seção **Créditos e fontes** do site.
- **Capas das músicas, imagens de divulgação de *Soy Luna* e a foto do Capítulo 1**: enviadas por mim. Os direitos pertencem aos respectivos titulares (artistas, gravadoras e Disney), e as imagens aparecem só para identificar e ilustrar as obras citadas. A autoria da foto do Capítulo 1 ainda não foi informada.

Todos os espaços de imagem já estão preenchidos. Em *Mariposas*, *Más linda*, na lista de faixas e no player aparece uma imagem de divulgação de *Soy Luna: Volver a rodar* (recortada em quadrado), porque não usei capas individuais dessas duas faixas.

### Como trocar uma imagem

1. No `index.html`, aperte `Ctrl+Shift+F` e procure por `IMAGEM PREENCHIDA`. Cada comentário diz **qual imagem é**, **onde aparece**, **a proporção** e **qual arquivo está em uso**.
2. Salve a nova imagem em `assets/img/` (de preferência em WebP ou JPG, com até 640 px nas capas) e troque o `src` da tag `<img>` logo abaixo do comentário.
3. Atualize o `alt` e, se a imagem for de outra fonte, o crédito na seção "Créditos de imagem".
4. **Não apague os comentários**, eles ajudam a lembrar qual imagem é.

| Imagem | Onde aparece | Arquivo atual |
|---|---|---|
| *Mariposas* e *Más linda* | Início · Universo musical · lista de faixas · player | `capa-soy-luna-volver-a-rodar.webp` |
| *Imperfecta*, *Otro Mood*, *Cenicienta*, *Una noche más* | Início · lista de faixas | `capa-<nome>.webp` |
| *Weekend*, *Anónimo*, *Miedo de sentir*, *Dime dime*, *Tus besos*, *Vuélveme a mirar así*, *Mil besos por segundo* | Lista de faixas | `capa-<nome>.webp` |
| Karol na infância | Capítulo 1 | `cap1-infancia.webp` |
| Capa de um álbum de *Soy Luna* | Capítulo 2 | `cap2-soy-luna.webp` |
| Arte da trilha de *Soy Luna* no Disney+ | Capítulo 3 | `cap3-volver-a-rodar.webp` |

As imagens do Capítulo 1 (640 px) e do Capítulo 3 (354 px) são pequenas. Se tiver versões maiores, troque para o site ficar mais nítido.

## 🧪 Testes

Testei o site no navegador (Chromium, com Playwright e com a ferramenta REA) em 1440, 1024, 820, 390 e 320 px: navegação por clique, por `#` e pelo teclado, linha do tempo, player, filtros, imagens, contraste, links internos e externos. Os resultados estão em [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md).

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) | Briefing (PRD) do projeto |
| [`docs/RESEARCH_KAROL_SEVILLA.md`](docs/RESEARCH_KAROL_SEVILLA.md) | Pesquisa com fontes verificadas |
| [`docs/SPOTIFY_REVERSE_ENGINEERING.md`](docs/SPOTIFY_REVERSE_ENGINEERING.md) | Estudo da interface de referência e critérios F1–F24 |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Cores, fontes, componentes e acessibilidade |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Plano de implementação |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | Relatório de testes |
| [`docs/agents/`](docs/agents/) | Revisões de SEO e de segurança |

## 🕰️ Primeira versão

O meu primeiro site continua guardado em [`primeira-versao/`](primeira-versao/), do jeitinho que eu fiz. Online: [**Abrir a primeira versão**](https://paulomarcelli.github.io/Projetos/primeira-versao/). O site novo também tem um link para ela no rodapé.

## 👤 Autor

Desenvolvido por **Paulo Marcelli** — Estudante de ADS na **FECAP**.

## 📍 Localização

Este projeto está organizado em `Projetos/Site-Karol-Sevilla` dentro do repositório principal `Projetos`.
