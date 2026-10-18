<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</div>

<p align="center">
  <b>Site de fã do single “Cenicienta”, de Karol Sevilla: vídeo no topo, história da música, ficha técnica e mural de mensagens.</b>
</p>

---

## 📌 Sobre o projeto

O **Site Cenicienta** é um projeto web publicado no GitHub Pages. Esta página será utilizada para apresentar o projeto Cenicienta e praticar conceitos de desenvolvimento web.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura e conteúdo da página |
| CSS3 | Estilos, layout e aparência visual |
| JavaScript | Interações e comportamento da página |

## ✨ O que o site tem

- Vídeo da música no topo, com botão de pausar/tocar (pausa sozinho fora da tela e respeita “reduzir movimento”).
- Seções “Sobre a Karol”, “Significado” e “Sobre a música”, com ficha técnica e botão de compartilhar.
- Menu fixo com link da seção atual e menu de tela cheia no celular.
- Mural de mensagens com validação, contador, apagar/desfazer (salvo só no seu navegador, via `localStorage`).
- Animações leves (entrada ao rolar, brilhos de “meia-noite”, microinterações) que se desligam com “reduzir movimento”.
- Acessibilidade: navegação por teclado, foco visível, alvos de toque de 44px, textos para leitores de tela.

## 📁 Arquivos

```text
Cenicienta/
├── index.html          → estrutura e conteúdo
├── style.css           → design system: cores, espaçamentos, tipografia, layout (Agente 1)
├── components.css      → componentes: menu, formulário, mural, toast (Agente 2)
├── motion.css          → animações e microinterações (Agente 3)
├── script.js           → funcionalidades: menu, vídeo, formulário, mural, compartilhar (Agente 2)
├── motion.js           → animações que precisam de JavaScript (Agente 3)
├── docs/DESIGN_SYSTEM.md → tokens, escala de espaçamento e contrato de classes
├── assets/
│   ├── cenicienta-hero.webm / .mp4 → vídeo leve do topo (~7 MB, já começa no trecho certo)
│   └── cenicienta-poster.webp      → imagem mostrada enquanto o vídeo não toca
├── images.jpg          → capa da música
├── cenicienta.mp4      → vídeo original (56 MB, guardado como fonte)
└── README.md
```

## ▶️ Como visualizar

Abra o arquivo `index.html` no navegador ou utilize o **Live Server** no Visual Studio Code.

## 🌐 Ver o site online

Acesse o projeto publicado no GitHub Pages: [**Abrir Site Cenicienta**](https://paulomarcelli.github.io/Projetos/Projetos/Cenicienta/)

## 👤 Autor

Desenvolvido por **Paulo Marcelli** — Estudante de ADS na **FECAP**.

## 📍 Localização

Este projeto está organizado em `Projetos/Cenicienta` dentro do repositório principal `Projetos`.
