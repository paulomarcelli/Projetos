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
- **21/11/2026 · Marketing Skills completo.** O pacote inteiro de coreyhaines31/marketingskills (54 skills, MIT,
  versão 2.14.25) está em `.claude/skills/`; origem e atualização em `docs/skills/marketingskills.md`. A `social` foi
  para 2.6.0. Leia só a skill que serve à tarefa (tabela no seu perfil). As skills citam ferramentas pagas e o Magister
  do autor: não recomende sem o Paulo pedir. Análise de performance é obrigatória: número → interpretação → problema
  provável → recomendação com justificativa, comparando com o histórico e dizendo as limitações.
- **Perfil de voz.** `.claude/skills/linkedin-referencias/voice-profile.md` ainda está vazio: preencha com o Paulo a
  partir de 3 a 5 posts reais dele.
- **21/11/2026 · Semana de 22 a 28/11, foco em crescimento.**
  - Decisão do Paulo: meta de **10 mil seguidores e 100 mil visualizações**, retenção no centro, vídeos de **20 a 30 s**. Isso vale mais que o "mais de 1 minuto" da PASSAGEM e do perfil. Não prometer monetização; confirmar na documentação oficial antes de falar de pagamento.
  - Conta do tempo: 2,6 palavras/s + 4 s de fechamento. Para ficar até 30 s, no máximo 65 palavras (70 palavras = 30,9 s). Contar com script (não há Python na máquina: usei Node).
  - Só há um dado real do canal: Lua, 45 visualizações e 2 curtidas em ~15 min. Estratégia = hipótese até chegarem os números de 48 h.
  - O WebSearch não acha o TikTok: a checagem de "vídeo gigante" foi só no YouTube, com contagem de agregadores. Pedir ao Paulo a busca no TikTok.
  - `docs/estilo-realismo.md`, citado no perfil, não existe no repositório.
  - Notion: o Paulo autorizou, mas as ferramentas de escrita (excluir e criar páginas) foram recusadas pelo sistema de permissões da sessão. Deixei a lista exata no relatório. Não tente contornar.
  - Antes de afirmar que um fato "já foi conferido", cite o relatório da Sabrina; o texto encurtado precisa de novo ok.
  - Testes A/B com poucos vídeos: use pares e conte vitórias (6 de 6 = 1,6% de acaso; 4 de 4 = 6%). Chamar de indício, não de prova.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 17/11/2026 | (criação da agente; nenhuma tarefa ainda) | — | — | — | — |
| 17/11/2026 | 5 roteiros do TikTok de 18 a 22/11 (3 curtos, 2 longos), 5 páginas no Notion, plano para Sabrina e Sofia, relatório | aguardando o Paulo | ~1 sessão | não medido | O Escritório estava fechado (plano não enviado). Pedir os números da Lua em 48 h. Prazo da quarta é apertado: roteiro do dia seguinte precisa sair com 2 dias de folga. |
| 21/11/2026 | Excluir a semana 18 a 22/11 (git rm do relatório e do plano), nova semana 22 a 28/11 com 7 roteiros de 20 a 30 s e estratégia para 10 mil seguidores e 100 mil visualizações | aguardando o Paulo (exclusão e criação no Notion recusadas pelas permissões) | ~1 sessão | não medido | Pedir os números da Lua, do Sol e da última pessoa antes de domingo. Mandar à Sabrina com 2 dias de folga. Conferir se o Notion tem permissão de escrita antes de começar. |
