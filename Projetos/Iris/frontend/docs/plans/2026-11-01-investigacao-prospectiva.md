# Plano — Investigação prospectiva em cinco seções (nov/2026)

## Diagnóstico (o que existe)

- **Dados:** `types/investigacao.ts` (`ResultadoDeInvestigacao`). Não há API de investigação: o servidor só tem
  documentos (`/documents`) e saúde (`/health`). O resultado vem do exemplo da prévia (`previa/investigacao-exemplo.ts`)
  via `useInvestigacao`. Fora da prévia, a página mostra "Investigação não encontrada".
- **Estado compartilhado:** `ProvedorDoResultado` (`contexto.tsx`): `vista` (presente ou cenário), `selecao` (o que o
  painel mostra), `aba` (Análise · Mapa · Timeline) e índices `ix`. Todas as áreas leem o mesmo estado.
- **Página:** `ResultadoDaInvestigacao` = cabeçalho + barra de abas + área + painel contextual (400 px no desktop,
  folha inferior no celular). A aba Análise (`AreaDeAnalise`) tem Síntese, Fatores (tabela), Três cenários (cartões),
  Comparação e Evidências recolhidas.
- **Peças reaproveitáveis:** `montarDiagnostico` e `montarDinamicas` (estrutura.ts, montam diagnóstico e narrativa a
  partir dos dados quando o motor não os escreve), `Frase`, `Citacoes`, `Letra`, `Epistemico`, `LinhaAfirmacao`,
  `TresCenarios`/`CartaoDeCenario`, `DetalheDoCenario` (painel), `MatrizDasIncertezas`, `TabelaComparativa`,
  `AreaDeEvidencias`, `MapaGeopolitico`, `AreaDaTimeline`, `useBordasDeRolagem`.
- **Monitoramento e versões:** inexistentes nos tipos e no servidor. Existe só `r.versao`, `r.atualizadoEm`,
  `r.revisoes` (data + texto) e `r.sinais` (indicadores com favorece/enfraquece).
- **Movimento:** o app anima com CSS e tokens (`--ease-saida`, `--duracao-*`); a biblioteca Motion fica só na landing e
  nas telas de conta. Mantido.

## Decisões

1. **Uma página, cinco seções** em vez de três abas: 01 Diagnóstico · 02 Cenários · 03 Comparação · 04 Monitoramento ·
   05 Exploração e evidências. O mapa, a timeline e as evidências viram vistas da seção 05 (sub-abas), montadas só
   quando a seção chega perto da tela (o mapa é pesado).
2. **Índice fixo** com as cinco seções, marcador da seção atual (IntersectionObserver) e, no celular, um seletor
   compacto. Botão "voltar ao topo".
3. **Fatores dentro da narrativa:** a tabela de fatores sai; os fatores aparecem nas Dinâmicas (`montarDinamicas`) e
   nas direções da Comparação.
4. **Cartão de cenário enxuto + painel completo:** o cartão mostra trajetória, lógica, premissas, consequências,
   indicadores e a data; o painel (DetalheDoCenario, 400 px) traz os dez itens pedidos, na ordem pedida.
5. **Comparação sem repetir os cartões:** diferenças estruturais (fatores), condições que favorecem, consequências
   divergentes, sinais que favorecem/enfraquecem, o que levaria a revisar. Matriz 2×2 só quando há duas incertezas
   críticas e todos os cenários têm posição nas duas.
6. **Monitoramento como contrato de frontend:** novo tipo opcional `r.monitoramento` (`types/monitoramento.ts`) com
   acontecimentos, impacto por cenário, revisões de premissas, observações de indicadores, histórico tipado e versões
   anteriores dos cenários. Sem ele, cada parte mostra um estado vazio honesto e o que depende do servidor; os
   indicadores e o histórico usam o que já existe (`r.sinais`, `r.revisoes`). Nada é persistido no navegador.
7. **Demonstração rotulada:** na prévia e em desenvolvimento, um botão mostra a interface do monitoramento com dados
   fictícios, marcados como fictícios em cada item. Nunca entra no resultado real.
8. **Semântica de cor** num só lugar (`config/semantica.ts`): favorece/reforça (ciano-texto, +), enfraquece (texto-2,
   −), contradiz (negativo, ×), exige revisão/investigar (âmbar), ambíguo (texto-2, ±), neutro (texto-3, =), obsoleta
   (texto-3, riscado). Sempre com palavra e ícone, nunca só cor. Ouro = estrutura (núcleo dos cenários, versão atual);
   âmbar = epistêmico (hipótese, incerteza, atenção).

## Fora do escopo (depende do servidor)

Coleta de acontecimentos, classificação de impacto, revisão de premissas, observação de indicadores, geração de novas
versões e armazenamento das versões anteriores. Documentado em `docs/CONTRATO-MONITORAMENTO.md`.
