# F.R.E.Y.A. — front-end

Aplicação React que transforma o motor de inteligência prospectiva em uma experiência de análise:
nova investigação, acompanhamento das etapas, análise estruturada, grafo do GraphRAG explorável,
evidências com fonte, histórico, guardados e preferências.

## Pilha

Mesma pilha da Iris (outro projeto deste repositório), para manter as convenções:

| | |
|---|---|
| Base | React 19, TypeScript, Vite 8 |
| Estilo | Tailwind 4 + tokens em CSS (`src/styles/tokens.css`) |
| Movimento | CSS e WAAPI; `motion` só para mola, layout e saída |
| Ícones | lucide-react |
| Rotas | react-router 8 |
| Grafo | d3-force (só a simulação de forças; o desenho é SVG próprio) |
| Fontes | Outfit, Inter, IBM Plex Sans, Atkinson Hyperlegible, IBM Plex Mono (pacotes locais, sem CDN) |
| Testes | vitest + Testing Library; ponta a ponta com Playwright contra a API real |

## Referência visual (Figma)

O arquivo de referência tem três elementos, todos **imagens** (sem componentes editáveis):

1. **Menu lateral "WeStud"** (Outcrowd): escuro, aberto e recolhido, com dica no recolhido, item ativo em
   superfície mais clara, submenu em linha vertical e seletor claro/escuro no rodapé;
2. **Dashboard "Genie Chatbot"** (RonDesignLab): coluna "Chat Results" com histórico agrupado (Hoje, Ontem),
   cartão grande com a imagem do papagaio, e o painel **New Chat** à direita, com saudação, cartões de ação
   e campo "Ask me anything" com botão de envio. Superfícies de vidro claro e cantos muito arredondados;
3. **Logo da F.R.E.Y.A.**: três estrelas de quatro pontas (grande, média e pequena), em degradê.

"Reutilizar os componentes" aqui significa reconstruir esses padrões em código:
- menu lateral em vidro com os dois estados;
- histórico agrupado por dia;
- o lugar do papagaio, que vira o **explorador do grafo**;
- o painel New Chat, que vira o **ponto de entrada da análise prospectiva**.

A logo é vetorizada com o mesmo desenho e as mesmas proporções, e só a cor muda (escarlate).

## Rotas

| Rota | Tela |
|---|---|
| `/` | Dashboard: explorador do grafo (no lugar do papagaio), análises recentes por dia e painel Nova Análise |
| `/analises/nova` | Nova análise em tela cheia |
| `/analises/:id` | A análise: etapas ao vivo, seções estruturadas, cenários, grafo e evidências |
| `/historico` | Histórico de análises (reabrir, guardar, excluir) |
| `/guardados` | Análises guardadas |
| `/configuracoes` | Tipografia (fonte, tamanho, prévia, aplicar/cancelar/restaurar), tema, movimento |
| `/perfil` | Perfil local (nome e função, neste navegador) |

## Pastas e quem pode mexer

Cada agente só altera as pastas dele, para não haver edição simultânea do mesmo arquivo. Quem precisar de
uma mudança fora da sua área registra o pedido no relatório final, e o coordenador aplica.

| Pasta | Dono |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/app/`, `src/config/`, `src/contexts/` | Coordenador |
| `src/styles/`, `src/components/{ui,brand,sidebar,theme,layout}/`, `public/` | Agente 1 — UI/UX e design system |
| `src/pages/`, `src/components/{dashboard,chat,analysis,graph,history,settings,profile}/`, `src/hooks/` | Agente 2 — front-end e funcionalidades |
| `src/services/`, `src/types/api.ts`, `src/test/integracao/`, `e2e/`, backend (`src/freya/api/`, `Repositorio` em `src/freya/investigacao/orquestrador.py`, `tests/`) | Agente 3 — arquitetura, backend e integração |

Testes de componente ficam ao lado do componente (`*.test.tsx`), na pasta do dono.

## Contratos

### Tipos da API — `src/types/api.ts`
Espelho exato dos modelos pydantic do backend. Ninguém inventa campo.

### Serviços — `src/services/index.ts`
Única porta de entrada para a API. Páginas e componentes importam daqui e nunca chamam `fetch`.
- `criarInvestigacao`, `obterInvestigacao`, `acompanharInvestigacao` (consulta periódica até concluir ou falhar)
- `obterGrafo`, `expandirNo`, `caminhosEntre`, `obterEvidencia`
- `listarInvestigacoes`, `excluirInvestigacao`, `guardarInvestigacao`, `desguardarInvestigacao`
- `obterSaude`

Erros chegam sempre como `ErroDaApi` com um `tipo` (`indisponivel`, `nao_encontrado`, `invalido`,
`conflito`, `nao_implementado`, `servidor`). A interface escolhe a mensagem pelo tipo.

Endereço da API:
- **desenvolvimento**: `/api/...`, que o Vite repassa para `http://127.0.0.1:8000`;
- **produção**: `VITE_FREYA_API`. A origem do site também precisa estar em `FREYA_CORS_ORIGENS` no backend.

### Preferências — `src/contexts/Preferencias.tsx`
`usePreferencias()` traz e altera estas preferências, todas guardadas neste navegador:
- tema, fonte, escala do texto, menu recolhido, reduzir movimento e perfil;
- `definirTema` só troca o tema;
- a animação Scarlet Reality Shift é do Agente 1 e envolve essa troca.

O contexto aplica no `<html>`:
- `data-tema`, `data-fonte` e `data-movimento`;
- `--fonte-texto`;
- `font-size`, que serve de escala para todo o texto, medido em rem.

## Princípios

- **Análise, não conversa.** A F.R.E.Y.A. não é um chatbot. O "New Chat" do Figma é o campo de investigação, e
  a resposta é a análise estruturada do backend:
  1. a questão interpretada;
  2. contexto;
  3. atores;
  4. relações;
  5. fatores (variáveis e tendências);
  6. incertezas críticas;
  7. cenários;
  8. consequências (desdobramentos);
  9. evidências e fontes, mais as limitações.
- **Nada inventado.** Sem endpoint, a interface mostra o estado vazio ou o aviso de indisponibilidade, nunca um
  resultado fictício. Os dados de demonstração só existem nos testes.
- **Tipos epistêmicos visíveis.** Confirmado, inferência e hipótese têm selos distintos, e as evidências abrem com
  a fonte e a confiabilidade (oficial, enciclopédia ou wiki de fãs).
- **Escopo da base.** A base de conhecimento cobre a continuidade cinematográfica do MCU. Uma questão fora dela
  (por exemplo, China e Taiwan) passa pelo motor normalmente, e a análise volta com poucas evidências e com as
  limitações explícitas. A interface mostra isso com clareza, sem esconder.
- **Vermelho com parcimônia.** O escarlate marca interação, seleção, indicadores e energia; as superfícies
  ficam neutras.

## Ausências no backend

Itens marcados **(feito)** foram resolvidos pelo Agente 3 nesta entrega:
- lista de investigações, exclusão e guardados (ver a seção do Agente 3 abaixo);
- **autenticação e perfil**: não existem. O perfil fica neste navegador e a tela avisa disso. Para várias
  pessoas, o backend precisa de contas, sessões e investigações por usuário;
- **preferências no servidor**: não existem; ficam no navegador.
- **conversa em várias mensagens**: não existe por decisão de produto. Cada pergunta é uma investigação nova.
