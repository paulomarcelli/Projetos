# IRIS: arquitetura do frontend

Este documento descreve como o frontend está organizado, por que, e onde ele encosta no backend.
Para tokens, cores, tipografia e telas, ver `DESIGN.md`.

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS 4 (tokens em `src/styles/variaveis.css`), react-router 7,
lucide-react (ícones da plataforma), Motion (só na landing e nas telas de conta, carregada sob
demanda), Vitest + Testing Library. Não há ESLint configurado: a verificação estática é o
`tsc -b` com `noUnusedLocals`/`noUnusedParameters`.

## Estrutura

A regra: **páginas compõem, features sabem de um assunto, componentes são genéricos.** Uma página só junta peças e
carrega dados; a lógica e as telas de um assunto (investigação, relações, evidências…) moram na sua feature; o que
não depende de assunto algum (layout, botões, estados vazios) fica em `components/`.

```
frontend/
├── public/
│   ├── favicon.svg
│   └── recursos/
│       ├── imagens/        mundo/ (landing), entrar/ (tela de entrada)
│       └── icones/         marca/ (logo claro e escuro, horizontal e símbolo)
├── index.html              tema e intro do logo antes da primeira pintura
├── .env.example            VITE_API_BASE e API_URL (o que cada uma faz)
│
└── src/
    ├── app/                montagem do app
    │   ├── main.tsx                entrada: preferências, impressão, roteador
    │   ├── App.tsx                 selo da prévia + rotas
    │   ├── roteador.tsx            todas as rotas (landing, conta, plataforma em /app)
    │   └── provedores/             ProvedorDeNotificacoes
    │
    ├── pages/              uma pasta por tela; só compõem features e carregam dados
    │   ├── Landing/  Autenticacao/  Inicio/  Historico/  Explorar/
    │   ├── Analise/  Relacoes/  Configuracoes/  SistemaDeDesign/
    │
    ├── components/         genéricos, sem assunto
    │   ├── layout/         LayoutDoApp (moldura), Cabecalho, MenuLateral, ConteudoPrincipal, CabecalhoDePagina
    │   ├── ui/             Carregando, Origem, Marca, Secao, Epistemico, SeletorTema, movimento,
    │   │                   dashboard-sidebar, sign-in-page
    │   └── feedback/       EstadoVazio, ErroDeCarregamento, Aviso
    │
    ├── features/           um assunto por pasta (components/, hooks/ e o que for só dele)
    │   ├── conversa/       a experiência principal: motor (fora do React), histórico, complementos e a resposta
    │   │                   (AnaliseEmTexto → CenariosProspectivos → Aprofundamento), CampoDePergunta, BoasVindas
    │   ├── investigacao/   contexto (estado compartilhado), ResultadoDaInvestigacao, abas, painel contextual
    │   ├── analise/        área "Análise"
    │   ├── relacoes/       mapa geopolítico, legenda, lista, geo/ (cartografia)
    │   ├── linha-do-tempo/ timeline prospectiva
    │   ├── prospectiva/    cenários e sua comparação
    │   ├── evidencias/     evidências e cartão de fonte
    │   ├── consulta/       a pergunta de pesquisa (nova investigação)
    │   ├── historico/      lista de investigações e favoritos
    │   ├── base-cientifica/ documentos reais da API
    │   ├── autenticacao/   peças das telas de conta
    │   └── landing/        mundo noturno (GSAP/Lenis), cena orbital
    │
    ├── services/           ÚNICO ponto de contato com a rede
    │   ├── api.ts                  cliente tipado de /health e /documents (+ modo prévia)
    │   └── autenticacao.ts         contrato de conta; hoje responde "indisponível"
    ├── hooks/                      useDados, useMidia, useArmazenamentoLocal (genéricos)
    ├── store/preferencias.ts       tema, tamanho do texto, menu (useSyncExternalStore)
    ├── types/                      api, fonte, ator, relacao, cenario, evento, investigacao
    ├── utils/                      data, formatadores, validadores, impressao
    ├── config/                     env (variáveis de ambiente), rotas, marca, método
    ├── styles/                     globais, variaveis (tokens), tipografia, animacoes, cristal
    ├── previa/, dev/               dados de exemplo da prévia e de pior caso (só desenvolvimento)
    └── test/
```

Fora do desenho do usuário e **de propósito**: não há `QueryProvider` (TanStack Query) nem `ThemeProvider` (o tema é
`store/preferencias.ts`, aplicado antes da primeira pintura) e o `analysisStore` é o `contexto.tsx` da investigação;
uma biblioteca de estado ou de dados nova não se justifica enquanto o backend tem só `/health` e `/documents`.
`useDebounce` não existe porque nada o usa.

### Por que não há páginas separadas para Análise, Relações, Timeline e Cenários

Análise, Relações, Timeline e Cenários são áreas de UMA investigação e compartilham estado: o cenário em foco, o ator ou a
evidência selecionados e o painel contextual. Separá-las em páginas faria o cenário escolhido na
análise se perder no mapa. Por isso existe uma página (`/app/investigacoes/:id`) com abas, e a
área aberta fica no endereço (`?area=relacoes|timeline`), para links diretos e para o "voltar" do
navegador. Os cenários aparecem na análise (três lado a lado + comparação) e na timeline (cenário
em foco), com os mesmos componentes.

### Botão e cartão

Não há componentes `Button` e `Card` em React: são classes de componente no CSS (`.botao`,
`.botao-primario|secundario|fantasma|perigo`, `.botao-pequeno|grande`, `.ficha`, `.cartao`,
`.cartao-interativo`, `.painel`). Elas já são usadas em todas as telas; um invólucro React só
duplicaria a responsabilidade.

## Fluxo de dados

1. Páginas leem dados por hooks (`useDados(fn, deps)` para chamadas à API; `useInvestigacao(id)`
   para o resultado).
2. Hooks chamam `services/api.ts`. Nenhum componente usa `fetch` diretamente.
3. O resultado de uma investigação é colocado em `ProvedorDoResultado`, que monta índices (atores,
   relações, evidências, fontes, sinais) uma vez. As áreas não guardam cópias: consultam `r` e `ix`.
4. Preferências do navegador (tema, tamanho do texto, menu) vêm de um único armazenamento
   (`store/preferencias.ts`, `useSyncExternalStore`), aplicado antes da primeira pintura.

## A conversa (experiência principal)

`/app` é uma conversa nova; a primeira pergunta cria a conversa (`/app/conversas/:id`) e abre a investigação. As
perguntas seguintes a aprofundam no mesmo contexto. Cada resposta segue a ordem: análise em texto → cenários
prospectivos → mapa de relações, linha do tempo e evidências (os mesmos componentes da página completa, sobre o mesmo
`ProvedorDoResultado`, carregados só quando abertos). O formulário com parâmetros continua em `/app/nova`.

Camadas, de baixo para cima:

1. `services/conversa.ts`: a fronteira com a API (hoje, "indisponível"; na prévia, a demonstração);
2. `features/conversa/motor.ts`: envia, acompanha as etapas e grava as respostas, fora do React (a primeira pergunta
   troca de página, e o processamento continua);
3. `features/conversa/historico.ts`: as conversas deste navegador (`localStorage`), só com referências aos resultados;
4. `features/conversa/complementos.ts`: regras puras das perguntas complementares;
5. componentes, que só leem.

O contrato que o servidor precisará cumprir está em `docs/CONTRATO-CONVERSA.md`.

## Integração com o backend

| Backend (app/api) | Frontend |
|---|---|
| `GET /health`, `GET /health/ready` | `prontidao()` → estado do sistema no menu e em Configurações |
| `GET /documents`, `GET /documents/{id}` | Base científica, leitor de fonte, favoritos, painel da base |
| `GET /documents/{id}/pages` | leitor de fonte (texto por página) |
| `POST /documents` (upload) | gestão do acervo, com progresso real |
| `DELETE /documents/{id}` | gestão do acervo |

Em desenvolvimento, o Vite encaminha `/documents` e `/health` para `API_URL` (padrão
`http://127.0.0.1:8000`). Nenhuma chave de API existe no frontend.

## O que depende do backend (fora do escopo do frontend)

- **Investigações:** não há endpoint para criar, processar ou ler investigações. O formulário
  salva rascunhos no navegador e diz isso; `/app/investigacoes/:id` mostra estado vazio fora da
  prévia. Ponto de integração: `hooks/useInvestigacao.ts` (contrato de estado já pronto) e o tipo
  `ResultadoDeInvestigacao` em `types/investigacao.ts`, que precisa de um esquema equivalente na API.
- **Relações, timeline e cenários:** dependem do resultado de investigação acima.
- **RAG / modelo de linguagem:** `app/llm/client.py` existe, mas nenhuma rota o expõe; a busca
  de evidências na base ainda não está disponível para a interface.
- **Contas e sessão:** não existem na API; `services/autenticacao.ts` responde "indisponível".
- **Busca textual nas fontes:** a Base científica filtra os títulos carregados no navegador; uma
  busca no servidor (`GET /documents?q=`) tornaria isso escalável.
