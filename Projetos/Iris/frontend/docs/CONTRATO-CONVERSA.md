# Conversa com a Iris: o que o backend precisa oferecer

**Situação hoje:** o backend tem só `/health` e `/documents`. Não existe endpoint de investigação nem de conversa, e
o frontend não inventa um. A interface conversacional está pronta e funciona assim:

- **build normal:** toda pergunta volta como "indisponível". A conversa fica registrada neste navegador, e a pergunta
  pode ser guardada como rascunho de investigação (a funcionalidade que já existia);
- **prévia** (`vite --mode previa`): uma demonstração responde com a investigação de exemplo
  (`src/previa/investigacao-exemplo.ts`), marcada como "Demonstração" em cada resposta. Se a pergunta digitada for
  outra, a resposta diz qual pergunta o exemplo responde.

Este documento é uma **proposta** do que o servidor precisa expor para a interface funcionar de verdade. Os nomes de
rota abaixo são sugestões para discussão, não rotas existentes.

## Onde a integração entra

Um único arquivo: `src/services/conversa.ts`, função `perguntar(pergunta, contexto, sinal)`. Ela devolve um fluxo de
eventos (`AsyncGenerator<EventoDaPergunta>`, em `src/types/conversa.ts`):

```ts
type EventoDaPergunta =
  | { tipo: "etapa"; etapa: "pergunta" | "evidencias" | "atores" | "cenarios" }
  | { tipo: "resposta"; resposta: Resposta };
```

O motor (`src/components/analysis/conversa/motor.ts`), o histórico e todos os componentes já consomem esses eventos. Quando o
endpoint existir, só `perguntar` muda.

## Dados necessários

### 1. Pergunta que abre uma investigação

Entrada: `{ pergunta: string, horizonte: 1 | 3 | 5 | 10 | 25 }`. O horizonte, em anos a partir do ano atual, é
escolhido embaixo do campo, junto com a primeira pergunta, e vale para a conversa inteira (vai também nas perguntas
seguintes, em `contexto.horizonte`); o servidor deve usá-lo como o fim do horizonte da investigação
(`horizonte.fim`). Opcionalmente, os outros parâmetros do formulário detalhado: regiões, dimensões e profundidade,
que já existem em `Rascunho`.

Saída, de preferência em fluxo (Server-Sent Events ou similar), nesta ordem:

1. etapas de processamento (`pergunta` → `evidencias` → `atores`), para a interface não parecer travada;
2. a análise: um `ResultadoDeInvestigacao` (`src/types/investigacao.ts`) **com id e versão**. Os cenários podem vir
   vazios nesse momento (`cenarios: "gerando"`);
3. a etapa `cenarios` e, ao fim, o resultado com os cenários (`cenarios: "prontos"`).

O Mapa das relações e a Timeline só aparecem na resposta depois deste último passo: enquanto a análise não termina,
a interface mostra só o texto, os cenários em construção e o painel de etapas.

Se o servidor não processar em separado, basta enviar a análise já com os cenários.

### 2. Pergunta complementar

Entrada: `{ pergunta, investigacaoId, anteriores: string[], horizonte }`. O contexto é o que faz a pergunta aprofundar a
investigação aberta, em vez de começar outra.

Saída esperada (a definir com o backend):

- um **complemento** em texto, com afirmações ligadas a evidências (o mesmo formato `Afirmacao`), para qualquer
  pergunta. Hoje a demonstração só cobre cinco intenções (Brasil, interesses, o que alteraria os cenários, história e
  indicadores), montadas a partir de campos do resultado;
- quando a pergunta mudar a investigação, uma **nova versão** do `ResultadoDeInvestigacao`. O tipo `Resposta` já
  carrega `versao`.

### 3. Leitura

- obter uma investigação por id (hoje `useInvestigacao`, em `src/components/analysis/investigacao/hooks/useInvestigacao.ts`);
- listar as investigações e conversas da pessoa, para o histórico deixar de ser só deste navegador.

## Regras que a interface já cumpre e o servidor deve manter

- **Rastreabilidade:** toda afirmação aponta para evidências, e cada evidência para fontes (`Evidencia.fontes`), com
  título, veículo, data, tipo de documento, link e trecho conferido.
- **Cenários não são previsões.** Cada um traz trajetória, premissas, o que o favorece, indicadores (ids de `Sinal`),
  evidências, incertezas e gatilhos.
- **Probabilidade só com método.** O campo opcional `Cenario.estimativa` (`{ valor, metodo, limitacoes }`) só deve vir
  quando houver metodologia e base de dados; `valor` é texto (uma faixa, por exemplo), nunca um número solto. Sem ele, a
  interface mostra a limitação registrada no resultado.

## Estrutura da resposta (prospectiva)

A resposta segue a lógica: compreender o presente → identificar dinâmicas → construir futuros → monitorar sinais →
atualizar cenários. Na tela, nesta ordem:

| Parte | Componente (`src/components/analysis/conversa/resposta/`) | De onde vêm os dados |
| --- | --- | --- |
| 01 Diagnóstico estratégico | `Diagnostico.tsx` | `diagnostico` (opcional) ou, sem ele, `montarDiagnostico`: `avisoDeContexto`, a incerteza principal (`porQue`) e a `implicacao` das evidências ligadas a ela |
| 02 Dinâmicas geopolíticas | `Dinamicas.tsx` | `dinamicas` (opcional) ou, sem ele, `montarDinamicas`: últimos acontecimentos observados, interesses e relações dos atores centrais, variáveis e demais incertezas, em texto corrido |
| 03 Cenários prospectivos | `Prospectiva.tsx` | `cenarios`, `horizontes`, `premissas`, `variaveis` (direção por cenário), `incertezas` |
| 04 Indicadores e monitoramento | `Monitoramento.tsx` | `sinais` (`favorece`, `enfraquece`, `leitura`, `ondeAcompanhar`, `quando`), `versao`, `revisoes` |
| 05 Explorar a investigação | `Exploracao.tsx` | mapa, timeline, evidências e fontes, `metodos` e `limitacoes`, recolhidos |

`montarDiagnostico` e `montarDinamicas` (`src/components/analysis/investigacao/estrutura.ts`) só reorganizam afirmações que já
existem no resultado, mantendo o tipo epistêmico e as evidências de cada uma; a única afirmação nova é a implicação
de cada evidência, marcada como **inferência**. Quando o motor redigir o diagnóstico e as dinâmicas, deve enviar os
campos opcionais:

```ts
diagnostico?: { situacao: Afirmacao[]; problema: Afirmacao; relevancia: Afirmacao; implicacoes: Afirmacao[] };
dinamicas?: { afirmacoes: Afirmacao[]; atores?: string[] }[]; // um item por parágrafo; atores = ids citados
```

## O que depende do backend

O servidor de hoje (FastAPI) só tem `/health` e `/documents`; não há motor de investigação. Até ele existir, a
interface roda com os dados de demonstração identificados como tal. Faltam:

1. **Gerar a investigação** (item 1 acima), com cenários, sinais e evidências rastreáveis.
2. **Redigir diagnóstico e dinâmicas** (`diagnostico`, `dinamicas`). Opcional: sem eles, a interface monta a partir do resultado.
3. **Atualizar com evidências novas:** reavaliar os sinais, publicar uma nova `versao` com uma entrada em `revisoes`
   dizendo o que mudou em cada cenário. A interface já mostra versão e histórico, e avisa que a revisão automática
   ainda não existe.
4. **Estimativas de probabilidade** (`Cenario.estimativa`), só se houver método.
