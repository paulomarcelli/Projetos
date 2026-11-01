# Contrato da Análise do Cenário (frontend ↔ servidor)

Cada cenário da investigação tem uma página própria, a **Análise do Cenário**
(`/app/investigacoes/:id/cenarios/:letra`). Ela é o segundo nível de navegação:

1. **Análise principal**: diagnóstico e os futuros possíveis, cada um em uma linha.
2. **Análise aprofundada**: um cenário tratado como objeto de inteligência próprio (esta página).
3. **Monitoramento**: sinais, premissas revistas e versões (ver `CONTRATO-MONITORAMENTO.md`).

Hoje a página é montada só com o que a investigação já entrega (`ResultadoDeInvestigacao`). Não existe motor no
servidor: nada aqui é gerado, estimado ou completado.

## Regra de inteligência

Aprofundar não significa inventar mais detalhes. Ao abrir um cenário, o motor deve **recuperar o raciocínio que
gerou o cenário** e reorganizá-lo, não escrever um texto novo. Ele deve:

1. Recuperar as evidências que sustentaram o cenário.
2. Consultar as relações entre atores no grafo (GraphRAG) e como cada uma muda neste cenário.
3. Identificar os fatores-chave e as incertezas críticas.
4. Construir uma trajetória lógica no horizonte: fases e marcos que são hipóteses de desenvolvimento, não datas
   previstas.
5. Derivar as consequências por região ou dimensão.
6. Indicar os pontos de inflexão: o que acelera, o que desvia, o que invalida.
7. Separar o que é evidência, o que é inferência e o que é hipótese (tipo epistêmico em cada afirmação).
8. Registrar o que deve ser monitorado (sinais que favorecem ou enfraquecem este cenário).

Quando faltar base para uma parte, a parte mostra a lacuna ("A investigação não projetou marcos no tempo para este
cenário"), em vez de preenchê-la.

## As oito partes e de onde cada uma vem

| Parte | Pergunta | Campos usados hoje |
|---|---|---|
| 1 · Tese do cenário | Qual futuro está sendo descrito? | `Cenario.sintese`, `impacto` |
| 2 · Lógica de evolução | Por que e como ele poderia acontecer? | `Cenario.mecanismos[]` (condição → consequência, com tipo e evidências), `condicoes[]` |
| 3 · Desenvolvimento temporal | Como ele evolui ao longo do horizonte? | `r.linhaDoTempo[]` com `cenarios` contendo a letra e `categoria` `projetado` ou `condicional`, agrupados por `data` |
| 4 · Dinâmicas estratégicas | Quem age e o que muda entre eles? | `Cenario.atoresDecisivos[]`, `r.relacoes[].cenarios[letra]` (só as que não são `mantida`) |
| 5 · Consequências | Quais impactos, e onde? | `Cenario.consequencias[]` (região, efeito, texto) |
| 6 · Pontos de inflexão | O que pode acelerar, desviar ou interromper? | `Cenario.gatilhos[]`, `revisao[]`, eventos com `inflexao` ou `condicional` |
| 7 · Indicadores | Quais sinais acompanhar? | `r.sinais[]` com a letra em `favorece` ou `enfraquece` |
| 8 · Premissas e vulnerabilidades | O que sustenta e onde pode falhar? | `premissas[]`, `favoraveis[]`, `contrarias[]`, `incertezas[]`, `limitacoes[]` |

## O que o servidor precisa entregar

Os mesmos campos de hoje, preenchidos pelo motor a partir do raciocínio recuperado. Para a trajetória, cada marco
projetado é um `EventoTempo` com `categoria: "projetado" | "condicional"`, `cenarios: [letra]`, `condicao` quando
houver, `evidencias` quando o marco se apoiar em fonte, e `inflexao: true` quando ele decidir o rumo.

## Princípios (não negociáveis)

1. Nenhuma probabilidade nem porcentagem sem método e dados.
2. Todo marco futuro é hipótese; nenhum evento observado vira marco futuro.
3. Toda afirmação mantém tipo epistêmico e fontes.
4. O que contradiz o cenário aparece junto com o que o sustenta.
5. Conteúdo político equilibrado: a página descreve trajetórias, não torce por nenhuma.
