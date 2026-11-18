# Memória da Gabriela

Leia no começo de cada tarefa. No fim, acrescente o que aprendeu e uma linha no registro.

## O projeto

- **Repositório:** `paulomarcelli/Projetos` (público). Cada projeto fica em `Projetos/<Nome>/`; os agentes em
  `.claude/agents/`; memórias em `agentes/memoria/`; relatórios em `agentes/relatorios/<nome>/`.
- **Canal do TikTok:** E Se, Hein? (`Projetos/E-Se-Hein/`). Tudo sobre o canal na `docs/PASSAGEM.md`:
  - nome e @ (o @ `esehein` ainda precisa ser confirmado nas três redes);
  - bios, voz da Maia (ElevenLabs), regras dos roteiros, estilo, monetização e próximos temas.
- **Notion:** a página CRIAÇÃO DE CONTEÚDO e o banco Calendário de conteúdo (IDs no arquivo da agente). Abas:
  - Lista por data;
  - Calendário;
  - LinkedIn;
  - Substack;
  - TikTok;
  - Artes para a Sofia.
- **Substack:** Construindo com IA (paulomarcelli.substack.com).

## O Paulo

- Fala português (Brasil). Gosta de ver o resultado: link, print, número.
- **TikTok:** o plano de renda extra. Sabe que o dinheiro só vem depois de meses de constância.
- **LinkedIn e Substack:** profissionais, só sobre os projetos dele, IA e a área dele. **Não quer bastidores do TikTok
  nessas redes** (pedido de 17/11/2026).
- A área exata e o objetivo profissional dele: [preencher].
- Pediu para não mexer no Notion fora da área de conteúdo.

## Regras aprendidas

- **17/11/2026 · Ponto de partida.**
  - O calendário foi esvaziado a pedido do Paulo: a Gabriela começa do zero. Os posts antigos (inclusive 3 do Substack
    marcados como Pronto e 3 já publicados) estão na lixeira do Notion por 30 dias, se ele quiser recuperar algum.
  - O primeiro vídeo do canal ("E se a Lua desaparecesse?") foi postado em 17/11/2026: 45 visualizações e 2 curtidas
    nos primeiros ~15 minutos.
- **17/11/2026 · Primeira semana do TikTok (18 a 22/11).**
  - Conte as palavras com um script, sem as marcações. Curto: até ~90 palavras, porque o fechamento soma 4 s (90
    palavras ≈ 35 s de voz + 4 s ≈ 39 s). Longo: de 165 a 180.
  - Escreva os números por extenso no roteiro ("mil e setecentos"): a Maia lê melhor e a conta do tempo fica certa.
  - O roteiro da Lua e o rascunho do tema 1 na PASSAGEM tinham 4 marcações; a regra é no máximo 3. Confira sempre.
  - Confira a lógica interna do roteiro, não só os fatos: o rascunho do tema 1 dizia "o celular não tem sinal" e
    "a luz ainda acende" no mesmo dia.
  - No Notion, a propriedade Tipo do TikTok é "Vídeo"; curto ou longo vai no título ("· curto", "· longo").
  - O Escritório estava fechado: o plano ficou salvo em `agentes/planos/`, sem envio. Avise o Paulo.
  - O vídeo da Lua ainda não tem página no calendário: crie quando chegarem os números de 48 h, não com o dado de
    15 minutos.
- **Skills de terceiros (17/11/2026).** São 11, todas com licença MIT e o LICENSE na pasta. Vêm de:
  - coreyhaines31/marketingskills;
  - vyralcontent/content-skills;
  - sergebulaev/linkedin-skills;
  - blader/humanizer;
  - samber/cc-skills.

  Ajustes:
  - as `viral-*` vinham com uma seção que recomendava um produto pago; ela foi retirada. Não recomende ferramenta paga;
  - a `linkedin-humanizer` ficou de fora, porque depende de APIs pagas de detectores de IA. Use a `humanizer`;
  - as referências das skills de LinkedIn ficam em `.claude/skills/linkedin-referencias/`.
- **Perfil de voz.** `.claude/skills/linkedin-referencias/voice-profile.md` ainda está vazio: preencha com o Paulo a
  partir de 3 a 5 posts reais dele.

- **18/11/2026 · Primeira semana do LinkedIn e do Substack (18 a 24/11).**
  - Antes de escolher um tema, confira se ele repete um post antigo. Os antigos estão na lixeira do Notion, mas o
    repositório guarda pistas: `substack-sofia/` (imagens do post do fã-site da Sofia Carson, inclusive o antes e
    depois dos títulos que sumiram), `PARA-A-PROXIMA-IA.md` (Karol × Samsung, "como estudo com IA", Una Noche Más) e a
    regra de estilo da página do Notion. Quase escrevi de novo o post dos títulos invisíveis.
  - Fora dos posts profissionais: LUNA MIND (o Paulo pediu), ATLAS (não será publicado), Treta em Brasília (sátira
    política) e tudo do TikTok. A Iris tem um exemplo político nos prints: post dela vai sem imagem.
  - Melhores fontes de história real com erro e correção: `Projetos/FREYA/docs/AUDITORIA.md` e `RELATORIO.md`, as
    memórias das agentes (Regras aprendidas e Registro) e o corpo dos commits (`git log --format=%b`).
  - A auditoria da F.R.E.Y.A. foi feita pelo Claude Code a pedido do Paulo (commit com coautoria). No texto: "pedi ao
    Claude Code uma auditoria", nunca "eu auditei sozinho".
  - Referência de voz do Paulo no repositório: o "Sobre" e o "Como um projeto nasce aqui" do portfólio
    (`Projetos/Portfolio/src/sections/estudio.js` e `metodo.js`). O posicionamento dele lá: "sites, jogos e
    inteligência artificial que explica de onde vem cada resposta". O perfil de voz continua vazio.
  - Dados pessoais do portfólio (idade, faculdade, emprego) ficam fora dos posts até o Paulo dizer que pode.
  - O Substack não tem tabela: comparação vai como imagem da Sofia e repetida em lista no texto.
  - Notion: `update_content` falha inteiro se o trecho antigo aparece duas vezes na página (roteiro e lista de
    afirmações). Use um trecho mais longo e único.
  - O Escritório foi desligado em 18/11 a pedido do Paulo: não tente enviar planos por ele; salve o arquivo e dê ao
    Paulo a frase pronta para pedir.
  - Pedido que chega no dia (o post de quarta saiu na quarta): post só de texto, sem arte, no fim do dia; se não der,
    ele cai em vez de empurrar para um dia que já tem post.
- **18/11/2026 · Conferência da Sabrina (TikTok).** Os 5 roteiros passaram. Erros meus que ela achou: número de
  divulgação mais preciso que a fonte (−18 °C), prazo mais longo que a fonte ("primeiro dia"), consequência de outro
  cenário (oceanos cobrindo a terra numa parada de um segundo; "Sol que já não existe" num Sol que só apaga) e a
  contagem do pulo (93, não 90). Para cada afirmação, pergunte: vale para este cenário exato? E rode o script de
  contagem em todos os roteiros.

- **18/11/2026 · Já publicados: nunca repetir, nem com outro título.**
  - F.R.E.Y.A. (o Paulo confirmou em 18/11: "Freya já postei na real");
  - "Dá para confiar numa IA quando o assunto é saúde mental?" (LUNA MIND);
  - "Uma IA consegue aplicar Gestalt?" (landing page Karol Sevilla);
  - "Eu não baixei esse celular: desenhei um Galaxy S26 Ultra inteiro em código" (Karol × Samsung).

  A lista veio em parte do calendário antigo, que o Paulo apagou: pode haver outros. Pedi a ele a lista completa (relatório
  de 18 a 24/11, seção 11). Antes de escolher um tema, confira esta lista e pergunte se o projeto já foi ao ar.
- **18/11/2026 · O post sobre a agente Sofia é do Paulo.** Ele mesmo vai publicar. Nos meus posts, a Sofia pode aparecer
  só como parte da equipe, nunca como assunto principal nem dando nome a uma regra ou a uma história. Não escreva o post
  dele. Quando ele disser a data, deixe o dia livre no calendário.
- **18/11/2026 · Troca de tema em cima da hora.** Quinta trocou de F.R.E.Y.A. para Aurora na véspera. Funcionou porque o
  repositório tinha o erro e a correção medidos num commit (`git log --format=%b`). Reserva para a próxima troca: o KFKA
  (auditoria contra o PDF de requisitos), com cuidado: é projeto de equipe e de faculdade.
- **18/11/2026 · Releia os fatos com data antes de reaproveitar um texto.** O post de segunda dizia que as marcas de
  conflito "ainda estavam lá"; tinham sido consertadas no mesmo dia (commit `4ef85ee`).

- **18/11/2026 · A Aurora está guardada até o Paulo decidir.** Ele disse "Não vou fazer posts da Aurora ainda". As duas
  páginas ("A personagem que encolhia ao correr" e "320 pixels em pé, 258 correndo") ficam em Ideia, sem data, com o
  aviso no topo. Não sugira a Aurora de novo, nem como reserva de troca, sem ele pedir. Quando um post sai da semana:
  guarde a página (Ideia, sem data, aviso), não apague; tire a tarefa de arte e as afirmações do plano; confira se outra
  página cita o dia ou o link dele, inclusive nas notas internas ("não empurre para quinta…"). Nada entra no lugar
  sem o Paulo dizer. Página guardada com Arte = Precisa de arte continua na aba "Artes para a Sofia".

- **18/11/2026 · Calendário só com o TikTok.** O Paulo mandou excluir do Notion todos os posts de LinkedIn e de
  Substack (inclusive os da semana de 18 a 24/11 e os da Aurora); ficaram só os 5 vídeos do TikTok. Os textos ainda
  estão no relatório `agentes/relatorios/gabriela/2026-11-17-linkedin-substack-18-a-24-nov.md` e na lixeira do Notion
  por 30 dias. Não recrie posts de LinkedIn ou de Substack no Notion sem o Paulo pedir.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 17/11/2026 | (criação da agente; nenhuma tarefa ainda) | — | — | — | — |
| 17/11/2026 | 5 roteiros do TikTok de 18 a 22/11 (3 curtos, 2 longos), 5 páginas no Notion, plano para Sabrina e Sofia, relatório | aguardando o Paulo | ~1 sessão | não medido | O Escritório estava fechado (plano não enviado). Pedir os números da Lua em 48 h. Prazo da quarta é apertado: roteiro do dia seguinte precisa sair com 2 dias de folga. |
| 18/11/2026 | Aplicar a conferência da Sabrina nos 5 roteiros do TikTok (Notion em Pronto, roteiro final, recados para a Sofia) e seção "Depois da conferência" no relatório | aguardando o Paulo | ~30 min | não medido | A Terra precisou de duas tentativas no Notion (trecho repetido). Contar as palavras de todos com script antes de entregar. |
| 18/11/2026 | LinkedIn e Substack de 18 a 24/11: 5 posts de LinkedIn (1 carrossel), 2 Substack, 7 páginas no Notion em Rascunho, plano para Sofia e Sabrina, relatório | aguardando o Paulo | ~2 sessões (com uma pausa por limite de uso) | não medido | Conferir a repetição com os posts antigos antes de escrever, não depois. O post de quarta saiu no próprio dia: pedir a semana com 2 dias de folga. |
| 18/11/2026 | Trocar o tema de quinta (F.R.E.Y.A. já publicada) por outro projeto real e tirar a agente Sofia do centro dos posts da semana (o post sobre ela é do Paulo) | aguardando o Paulo | ~1 sessão | não medido | Pedir ao Paulo, antes de planejar a semana, a lista do que já foi publicado. A troca na véspera deixa a Sofia com menos de um dia para as artes. |
| 18/11/2026 | Quinta 19/11 sem post (Aurora guardada): 2 páginas em Ideia sem data com aviso, plano sem a arte e as afirmações da Aurora, notas de quarta e do Substack de segunda ajustadas, seção 12 no relatório | aguardando o Paulo | ~20 min | não medido | A reserva do KFKA continua valendo para a próxima troca. Antes de pôr um tema na semana, perguntar ao Paulo se ele quer falar do projeto agora. |
