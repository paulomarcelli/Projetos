# Memória da Sofia

Leia inteira no começo de cada tarefa. No fim, acrescente o que aprendeu em **Regras aprendidas** e uma linha no
**Registro de tarefas**. Este repositório é **público**: nada de e-mail, telefone, senha, chave ou outro dado pessoal
aqui.

## O projeto

- Repositório **Projetos** do Paulo: um projeto por pasta em `Projetos/<nome>/`, cada um com `README.md` (alguns com
  `CLAUDE.md` e `docs/`). O `README.md` da raiz tem um cartão por projeto, com capa em `docs/capas/<projeto>.webp`
  (960 × 540).
- **Publicação:** `.github/workflows/pages.yml` publica os sites no GitHub Pages a cada push na `main`
  (`https://paulomarcelli.github.io/Projetos/`). Projeto novo, ou pasta nova que um site carrega, precisa entrar na
  lista de cópia desse workflow.
- Projetos em Vite usam `base: './'` (caminhos relativos), porque o Pages publica numa subpasta.
- `PARA-A-PROXIMA-IA.md` (na raiz) é a passagem de trabalho geral: leia quando precisar de contexto de outro projeto.
- Skills do repositório em `.claude/skills/` (a sua é a `design-skills`); agentes em `.claude/agents/`; o time em
  `agentes/README.md`.

## O Paulo

- Fala português (Brasil) e gosta de texto **humano**: frases curtas, sem fórmula de IA, sem "Não é X, é Y".
- Gosta de ver o resultado: mande capturas de tela, não só descrição.
- Faz posts no **Substack** sobre os projetos (calendário no Notion). Cada post tem uma cara: não repete abertura,
  intertítulos, subtítulo nem fechamento dos anteriores.
- Pediu para **não mexer no Notion** sem pedido explícito (o espaço dele fica como está).
- Usa o Figma com o plano dele; gerar imagem no Figma gasta créditos: peça antes.

## Projetos de design que você já fez (para manter a linguagem)

| Projeto | Pasta | Linguagem |
|---|---|---|
| Sofia Carson · a voz (fã-site) | `Projetos/Sofia-Carson/` | Modelo Lusco: filme preso atrás da página, folha cor de osso com furos, preto e branco com grão, Geist e Geist Mono. Design system no Figma: arquivo `41SYetZSfkGCyXrWKMkLl1` (Capa, Fundamentos, Componentes, Telas desktop, Telas celular). |
| Karol × Samsung | `Projetos/landing page Karol Sevilla x Samsung/` | Landing 3D com Three.js, GSAP e Lenis; um único celular desenhado em código que acompanha a rolagem. |

## Regras aprendidas

- **14/11/2026 · Furo e camadas (Lusco).** O furo é um bloco transparente com `box-shadow: 0 0 0 300vmax` cor de osso
  numa seção com `overflow: hidden; isolation: isolate`. **Nenhum contêiner que guarda o furo pode ter `z-index`**: senão
  ele vira outra camada e a sombra cobre o texto que vem antes. Isso deixou o manifesto e o título "Palco e estúdio"
  invisíveis no ar até alguém tirar print. Sempre confira com captura depois de rolar devagar.
- **14/11/2026 · Texto sob a nav transparente.** Texto que passa por baixo da nav sobre o filme (cantos do hero,
  aberturas) some por marco (`.is-sob`), nunca por scrub.
- **14/11/2026 · Capturas com rolagem.** Pular direto com `scrollTo` engana as entradas por marco; role em passos
  (≈ 40 px) e espere ~2,5 s antes do print.
- **Figma · texto.** Carregue a fonte (`loadFontAsync`) antes de qualquer mudança em texto.
- **Figma · auto-layout.** Linha ou cartão com altura fixa corta o texto: use `layoutSizingVertical = 'HUG'`. Na página
  Fundamentos do design system da Sofia, os nomes dos estilos e os cartões de regras estavam cortados por isso
  (corrigido em 14/11/2026).
- **Figma · imagem em instância.** Para foto 4:5 obedecer ao tamanho do quadro, trave a proporção
  (`lockAspectRatio()`) na imagem do componente.
- **Responsivo.** Teste 320, 375, 390, 768, 1024, 1280, 1920 e 2560 px e o celular deitado. Em 320 px, menu com três
  links e botão cabe só se o botão encurtar ("Entrar").
- **Fã-site.** O aviso "projeto de fã, sem vínculo" fica; formulário de fã não envia nem guarda dado. Fato sem fonte
  confiável fica de fora (ex.: "SC2" e o single "Her" da Sofia Carson, em 14/11/2026).
- **Material pago** (guias, prompts e prints de modelos comprados, como o Lusco) fica fora do repositório público
  (`.gitignore` do projeto).

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 14/11/2026 | (criação da Sofia; nenhuma tarefa ainda) | — | — | — | — |
