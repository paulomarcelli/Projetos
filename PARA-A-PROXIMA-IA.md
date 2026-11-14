# Passagem para a próxima IA · repositório Projetos

Última atualização: 14/11/2026. Outra IA vai assumir o trabalho: este arquivo diz como o usuário trabalha, onde está
cada coisa, o que foi feito por último e o que vem a seguir. Cada projeto tem o próprio `README.md`; o projeto em
andamento (**Aurora**) tem uma passagem detalhada em
[`Projetos/Aurora-Jogo/docs/PARA-A-PROXIMA-IA.md`](Projetos/Aurora-Jogo/docs/PARA-A-PROXIMA-IA.md).

---

## 1. Como o usuário trabalha (regras que ele pediu)
- Fala **português (Brasil)**. Pediu para **não pedir permissão**: faça, verifique (testes e capturas) e publique.
- **Publicar = commit e push direto na `main`** deste repositório (é o padrão combinado). Não coloque o nome ou id do
  modelo de IA nos commits.
- **Privacidade:** o repositório é público. Não escreva aqui e-mails ou dados pessoais do usuário. Nunca peça para ele
  colar senhas ou chaves na conversa.
- **Sátira** (jogos `Treta-em-Brasilia` e `briga-de-poder`): o alvo são os **papéis políticos públicos**, nunca
  identidade de gênero ou aparência.
- **Não fazer:** não editar as aulas de **Design** no Notion; não fazer posts sobre a **Luna**; o **ATLAS** não será publicado.
- **Imagens** que ele manda às vezes chegam **só como visualização** (não como arquivo): confira a pasta de imagens da
  sessão e, se não estiver lá, peça para reenviar como anexo.
- **Figma** liberado para gerar arte (gasta créditos de IA do plano dele). A arte dos jogos normalmente vem do **Gemini**,
  gerada por ele.
- O push para o repositório do **perfil** (`paulomarcelli/paulomarcelli`) já foi bloqueado uma vez pelo classificador do
  ambiente; se acontecer, explique e peça para ele autorizar.

## 2. Estrutura e publicação
- `Projetos/<nome>/`: um projeto por pasta, cada um com `README.md` (alguns com `CLAUDE.md` e `docs/`).
- `.github/workflows/pages.yml`: **a cada push na `main`, publica os sites no GitHub Pages**
  (<https://paulomarcelli.github.io/Projetos/>). Projeto novo ou **pasta nova que um site carrega** precisa entrar na
  lista de cópia desse workflow (já aconteceu: a pasta `fases/` da Aurora ficou de fora e foi corrigida).
- `.claude/skills/`: skills instaladas no repositório. As de jogo são **`gamedev-skills`** (roteador com `level-design`,
  `platformer`, `pixijs-rendering` etc.) e **`2d-games`** (instalada nesta conversa, a pedido dele; `skills-lock.json`).
- `docs/capas/`: imagens de capa usadas no `README.md` da raiz e no perfil do GitHub.

## 3. O que foi feito nesta conversa (mais recente primeiro)
**Aurora: O Dízimo da Lua** (`Projetos/Aurora-Jogo`, jogo de plataforma 2D em PixiJS 8 — o foco atual):
- Animações da **Aurora criança** para o Prólogo geradas no Figma (ficha + 6 folhas: parada, corrida em 8 quadros, pulo,
  andando escondida, escondida), conferidas e com o recorte testado (`fatiar_folha.py --manter-brancos`).
- **Fase 1 — A Floresta da Névoa** jogável do começo ao fim, feita em dados (`jogo/fases/fase1.json`) com as skills
  `gamedev-skills` e `2d-games`, e testada por um "jogador robô" que pula cada trecho com a física do jogo.
- **Fogueira Lunar** redesenhada; corpo deixou de "esticar" junto com o cabelo na corrida (duas camadas).
- Arte do Gemini integrada: sentar/sentada, arco v2, golpe de lâmina + volta à guarda, dano, sombra de névoa.
- Workflow do Pages corrigido para publicar `jogo/fases/`.

**Outros projetos mexidos nesta conversa:**
- **Karol × Samsung** (`Projetos/landing page Karol Sevilla x Samsung`): câmeras do Galaxy S26 Ultra em 3D corrigidas
  (aros grafite, lentes na posição certa). Publicado. A frase "Karol Sevilla é embaixadora oficial da Samsung" **não foi
  confirmada em fonte oficial**: não afirme isso em textos sem uma fonte.
- **Perfil do GitHub** (repositório `paulomarcelli/paulomarcelli`): README novo, com cartões dos projetos, linha animada,
  seção "Agora" e os 3 últimos posts do Substack atualizados sozinhos todo dia (workflow `substack.yml`).
- **Aulas de exercícios** (Notion, fora do GitHub): espaços de resposta em todas as aulas com exercício.

## 4. Trabalho fora do GitHub (contexto para continuar)
- **Notion · ESTUDOS** (método de recordação ativa: perguntas em toggles e revisões espaçadas; a skill `estudos` descreve
  o formato). Regras de agenda dele: no máximo **2 aulas por dia, de matérias diferentes**; **domingos livres**; cada aula
  até **6 dias antes da prova**; revisões até a véspera.
  - **POO:** as aulas antigas foram apagadas (estão na lixeira do Notion) e refeitas **só com o PDF "Material de estudos
    para PO e Exame"** (29 temas de C#): 8 aulas de 13/11 a 28/11, **prova em 04/12**. Em 02/12 e 03/12 caem as
    revisões das 8 aulas de uma vez.
- **Substack e LinkedIn** (calendário de posts no Notion): post do Karol × Samsung publicado; post "como estudo com IA"
  pronto, com a data de publicação a decidir; post do Una Noche Más pronto, falta o link depois de publicado.

## 5. Pendências que dependem do usuário
- **Aurora:** ele jogar a Fase 1 e contar onde se perdeu, que salto errou mais de 3 vezes, que trecho foi chato ou
  injusto e quanto tempo levou.
- **Landing da Sofia Carson** (ideia guardada no Notion, em "IDEIAS DE PROJETOS"): ele escolheu o modelo **Lusco**
  (Profitize AI) e vai mandar o prompt do Lusco, o `.zip` e as fotos.
- **Landing da Estela Marangoni** (sobre os ensinamentos dela, com ênfase no desapego): modelo **Sinal** recomendado;
  falta o prompt/`.zip` do Sinal e o conteúdo dela (transcrições ou frases).
- **Radar de Leads:** falta a chave da API do Google, a cidade, o nome e o preço.

## 6. Próximos passos sugeridos (em ordem)
1. **Aurora · Prólogo (A Noite das Lanças):** ligar a Aurora criança no jogo, criar a furtividade (soldados com campo
   de visão e esconderijos), gerar a arte dos soldados da Lança Dourada e do castelo, e montar as cenas do roteiro.
   O passo a passo está na passagem da Aurora (§6).
2. Aurora: menu inicial, controles de toque, som e música; depois a Fase 2 (A Tinta que Escorre).
3. Retomar as landings (Sofia Carson e Estela Marangoni) assim que ele mandar os materiais.

## 7. Verificação rápida antes de publicar
```bash
cd Projetos/Aurora-Jogo/jogo && npm install && npm run preparar && npm test      # 21 testes da Aurora
```
Cada site com `package.json` tem `npm run build` (o workflow do Pages roda os builds das landings, da prévia da Iris e
do portfólio). Confira o visual com Playwright (Chromium já instalado no ambiente).
