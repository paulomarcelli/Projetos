# Contrato do monitoramento prospectivo (frontend ↔ servidor)

A seção **04 Monitoramento prospectivo** da investigação já está pronta na interface. O servidor ainda não produz
nada dela: não existe motor de investigação nem de monitoramento (hoje o servidor só tem `/documents` e `/health`).
Este documento diz o que o servidor precisa entregar para a seção funcionar com dados reais.

## Onde entra

`ResultadoDeInvestigacao.monitoramento?: Monitoramento` (`src/types/monitoramento.ts`). O campo é opcional:
sem ele, a interface mostra estados vazios que dizem o que falta, e nada é simulado.

## O que o servidor precisa fazer

| Capacidade | Campo | Regra que a interface espera |
|---|---|---|
| Varrer acontecimentos novos (notícias, documentos, declarações, dados) | `acontecimentos[]`, `verificadoEm` | Cada acontecimento tem fonte verificável em `r.fontes` (`fontes: string[]`). Sem fonte, não entra. |
| Relacionar o acontecimento à investigação | `acontecimentos[].relacao` | Uma `Afirmacao` com tipo epistêmico (em geral inferência) e evidências. |
| Classificar o impacto em cada cenário | `acontecimentos[].impactos[]` | `favorece · enfraquece · neutro · ambiguo · investigar`, sempre com `justificativa`. Nunca "confirma". |
| Revisar premissas | `revisoesDePremissas[]` | `reforca · enfraquece · contradiz · obsoleta · revisar`, com a versão e a justificativa. O índice `premissa` se refere à versão em que a premissa foi escrita. |
| Observar indicadores | `observacoes[]` | Uma leitura por data, ligada a um `sinal` de `r.sinais`. `tendencia` só quando houver observações suficientes. |
| Registrar cada mudança | `historico[]` | Tipos separados: `criacao`, `nova-evidencia`, `nova-interpretacao`, `revisao-premissa`, `revisao-cenario`, com o que motivou (evidências e/ou acontecimentos). |
| Preservar versões | `versoesAnteriores[]` | Um retrato de cada cenário em cada versão anterior. Uma atualização nunca sobrescreve: incrementa `r.versao` e guarda o anterior. |

## Princípios (não negociáveis)

1. Acontecimento não é evidência de confirmação de cenário.
2. Nenhuma probabilidade sem método e dados (`Cenario.estimativa` continua opcional e, hoje, ausente).
3. Toda classificação tem justificativa rastreável.
4. Versões anteriores são preservadas e consultáveis.
5. Nova evidência, nova interpretação, revisão de premissa e revisão de cenário são registros diferentes.
6. Evidências contraditórias aparecem (`contradiz`, `enfraquece`), sem filtro.

## O que a interface já faz com os dados

- Lista os acontecimentos com data, tipo, fonte, relação e os cenários afetados.
- Mostra a matriz acontecimento × cenário com a classificação e a justificativa (sem totais: somar sugeriria
  confirmação).
- Mostra as premissas de cada cenário com o estado da última revisão (no monitoramento e no painel do cenário).
- Mostra cada indicador com cenários relacionados, evidência do fator, última observação e tendência.
- Mostra o histórico com marca e nome por tipo de mudança e dá acesso às versões anteriores (painel do cenário).

## Demonstração

Na prévia e em desenvolvimento, "Ver com dados fictícios" carrega `src/previa/monitoramento-demonstracao.ts`
(dados inventados, marcados como fictícios em cada item). Só aparece quando a investigação não traz monitoramento
próprio, e nunca é salva.
