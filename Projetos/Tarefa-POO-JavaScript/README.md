# 🧩 Tarefa de POO em JavaScript

<div align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Status-Em_Desenvolvimento-blue?style=for-the-badge" alt="Status: Em desenvolvimento" />
</div>

<p align="center">
  <b>Uma tarefa de Programação Orientada a Objetos desenvolvida em JavaScript.</b>
</p>

---

## 📌 Sobre o projeto

Este projeto reúne a minha tarefa de **Programação Orientada a Objetos (POO)** em JavaScript. A proposta é praticar os pilares da POO: classes, encapsulamento, herança e polimorfismo.

O arquivo `src/main.js` traz um exemplo inicial com uma playlist de músicas e podcasts. Ele será adaptado ao enunciado da tarefa assim que eu definir o tema.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| JavaScript (ES2022) | Classes, campos privados (`#`), getters e setters |
| Node.js | Execução do código pelo terminal |
| Git / GitHub | Versionamento e organização do projeto |

## 🧠 Conceitos de POO

| Conceito | Onde aparece no exemplo |
|---|---|
| Classe e objeto | `Midia`, `Musica`, `Podcast` e `Playlist` |
| Encapsulamento | Campos privados `#titulo` e `#duracaoEmSegundos`, com getters e setter validado |
| Herança | `Musica` e `Podcast` estendem `Midia` com `extends` e `super()` |
| Polimorfismo | Cada classe sobrescreve `descricao()`, e a `Playlist` chama o método de cada item |
| Classe abstrata | `Midia` não pode ser instanciada diretamente |
| Composição | A `Playlist` guarda várias mídias |

## 📁 Arquivos

```text
Tarefa-POO-JavaScript/
├── src/
│   └── main.js
└── README.md
```

## 🚀 Como executar

Com o **Node.js** instalado, entre na pasta do projeto e execute o arquivo principal:

```bash
cd Projetos/Tarefa-POO-JavaScript
node src/main.js
```

## 👤 Autor

Desenvolvido por **Paulo Marcelli** — Estudante de ADS na **FECAP**.

## 📍 Localização

Este projeto está organizado em `Projetos/Tarefa-POO-JavaScript` dentro do repositório principal `Projetos`.
