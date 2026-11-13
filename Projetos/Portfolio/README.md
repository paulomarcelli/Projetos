<div align="center">

# 🌀 Portfólio · Paulo Marcelli

**Sites e inteligência artificial que mostram de onde vem cada resposta.**

Um portfólio em que o scroll leva para dentro de um túnel com as telas dos meus projetos: quando a câmera chega perto de um destaque, a tela sai da parede, cobre a página e vira a abertura do case.

[![Abrir o portfólio](https://img.shields.io/badge/ABRIR_O_PORTF%C3%93LIO-0e0e0f?style=for-the-badge&logo=githubpages&logoColor=c8102e)](https://paulomarcelli.github.io/Projetos/Projetos/Portfolio/)

![HTML5](https://img.shields.io/badge/HTML5-0e0e0f?style=flat-square&logo=html5&logoColor=c8102e)
![CSS3](https://img.shields.io/badge/CSS3-0e0e0f?style=flat-square&logo=css3&logoColor=c8102e)
![JavaScript](https://img.shields.io/badge/JavaScript-0e0e0f?style=flat-square&logo=javascript&logoColor=c8102e)
![Vite](https://img.shields.io/badge/Vite-0e0e0f?style=flat-square&logo=vite&logoColor=c8102e)
![Three.js](https://img.shields.io/badge/Three.js-0e0e0f?style=flat-square&logo=threedotjs&logoColor=c8102e)
![GSAP](https://img.shields.io/badge/GSAP-0e0e0f?style=flat-square&logo=greensock&logoColor=c8102e)

</div>

<br>

## ✨ As seções

| Seção | O que mostra |
|---|---|
| **Túnel de trabalhos** | 78 telas dos projetos nas paredes de um corredor 3D; F.R.E.Y.A., Iris, LUNA MIND e KFKA saem da parede e viram case |
| **Sobre** | Quem eu sou, com notas na margem ligadas ao texto por fios que se desenham com o scroll |
| **Como um projeto nasce aqui** | Pergunta, estrutura, interface e publicação, numa tira de filme que desliza com o scroll |
| **Todos os projetos** | Índice com filtros (IA, sites, jogos, faculdade); a tela do projeto segue o cursor |
| **Contato** | E-mail, GitHub e LinkedIn |

O layout parte do modelo **Margem**, da biblioteca de prompts da Profitize, adaptado para os meus projetos: tema escuro, porque as telas deles são escuras, e o vermelho da F.R.E.Y.A. como acento.

## 🛠️ Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/, que o GitHub Pages publica
```

## 📁 Estrutura

```text
Portfolio/
├── index.html
├── public/trabalhos/     as telas dos projetos (WebP)
└── src/
    ├── styles/           tokens.css (cores, fontes, tamanhos) e base.css
    ├── sections/         uma seção por arquivo (HTML + CSS)
    ├── motion/           o túnel (cena.js), a linha do tempo (percurso.js) e as animações
    ├── data/             os cases, o índice e as peças do túnel
    └── brand/            a assinatura "paulo marcelli"
```

Respeita `prefers-reduced-motion`: sem scroll suave, sem cursor e sem animações de entrada; o túnel continua respondendo ao scroll.
