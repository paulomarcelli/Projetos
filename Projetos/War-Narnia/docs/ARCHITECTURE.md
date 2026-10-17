# Arquitetura — WAR: As Crônicas de Nárnia

> Documento único de arquitetura, compartilhado pelos 5 agentes. Dono: Tech Lead.
> Mudanças nos **contratos** (seção 4) exigem acordo do Tech Lead.

## 1. Diagnóstico inicial

- **Repositório:** `paulomarcelli/Projetos`, um portfólio de sites estáticos publicados no GitHub Pages (HTML/CSS/JS sem build). O único projeto com backend usa Firebase (`Projetos/Role-peoes`).
- **Não existe código de jogo anterior.** O projeto nasce em `Projetos/War-Narnia/`, sem mexer nos outros.
- **Ambiente:** Node 22, npm com acesso ao registro, Chromium do Playwright (`/opt/pw-browsers`) para testes com vários navegadores, rede liberada.
- **Arte fornecida pelo usuário** (em `docs/referencias/`):
  - `mapa-narnia-original.webp` (2000×1125): mapa ilustrado com **42 territórios em 6 regiões de 7**, e a legenda com os bônus. A parte do mapa, sem a legenda, foi recortada para `packages/client/public/assets/mapa-narnia.webp` (2000×888) e é a arte do tabuleiro.
  - `cartas-herois.jpg` e `cartas-territorio.jpg`: referências visuais de cartas (heróis e territórios).
- **Hospedagem:** o GitHub Pages só serve arquivos estáticos e não roda servidor. O multiplayer precisa de um processo Node com WebSocket. Por isso o jogo fica pronto para um serviço como **Render, Railway ou Fly.io**, e o deploy final depende de o usuário conectar uma conta. Ver `docs/DEPLOY.md`, escrito na fase 8.

## 2. Pilha escolhida (e por quê)

| Camada | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript em todo o projeto | Tipos compartilhados entre cliente, servidor e motor evitam divergência de contrato. |
| Organização | npm workspaces (`packages/shared`, `packages/server`, `packages/client`) | Um repositório, um `npm install`, tipos importados diretamente de `@war/shared`. |
| Motor de regras | TypeScript puro em `@war/shared/engine` | Roda no servidor (autoridade). O cliente só usa tipos e constantes. Testável sem rede. |
| Servidor | Node 22 + Express + Socket.IO 4 | O Socket.IO tem salas, reconexão automática, ack e fallback de transporte. Com um processo só, o deploy é simples. |
| Persistência | Arquivo JSON por sala (`packages/server/data/rooms/<código>.json`), gravado de forma atômica a cada ação aceita | Sobrevive a reinício do servidor sem exigir banco. Pode virar Redis ou Postgres depois, pela interface `RoomStore`. |
| Cliente | Vite + React 18 + TypeScript | Componentes reutilizáveis, estado previsível e build estático servido pelo próprio Express. |
| Mapa | Arte do usuário + camada SVG com marcadores por território e linhas de conexão desenhadas a partir do grafo | Usa a ilustração fornecida sem precisar de polígonos exatos. As conexões vêm dos dados, não da imagem. |
| Testes | Vitest (motor, servidor, integração por socket) e Playwright (2 a 3 navegadores independentes) | Ferramentas padrão do ecossistema Vite e Node. |

## 3. Estrutura de pastas e donos

```text
War-Narnia/
├── docs/                         # documentação (cada agente escreve só o seu arquivo)
│   ├── ARCHITECTURE.md           # Tech Lead
│   ├── PROJECT_STATE.md          # Tech Lead (estado, decisões, pendências)
│   ├── REA_WARGROW.md            # Agente 1
│   ├── RULES.md                  # Agente 2
│   ├── MAP_DATA.md               # Agente 2 (justificativa de cada conexão)
│   ├── DESIGN_SYSTEM.md          # Agente 3
│   ├── MULTIPLAYER.md            # Agente 4
│   ├── TEST_REPORT.md            # Agente 5
│   ├── DEPLOY.md                 # Tech Lead (fase 8)
│   └── referencias/              # artes enviadas pelo usuário
├── packages/
│   ├── shared/                   # @war/shared
│   │   └── src/
│   │       ├── types.ts          # CONTRATO (Tech Lead)
│   │       ├── engine-api.ts     # CONTRATO (Tech Lead)
│   │       ├── protocol.ts       # CONTRATO (Tech Lead + Agente 4)
│   │       ├── map/              # Agente 2: territórios, regiões, conexões
│   │       ├── engine/           # Agente 2: motor de regras + rules-config.ts
│   │       └── index.ts          # Tech Lead (reexporta tudo)
│   ├── server/                   # Agente 4 (rooms, socket, persistência)
│   └── client/                   # Agente 3 (UI, mapa, telas)
└── tests/e2e/                    # Agente 5 (Playwright multi-navegador)
```

**Regra de integração:** cada agente só edita as pastas de que é dono. Para mudar um contrato, o agente pede ao Tech Lead, que atualiza o arquivo e avisa os outros. Testes unitários ficam junto do pacote (`*.test.ts`), escritos pelo dono e ampliados pelo Agente 5 em `packages/*/test/qa/`.

## 4. Contratos

1. **`packages/shared/src/types.ts`:** mapa, cartas, objetivos, estado (`GameState`), ações (`GameAction`), eventos (`GameEvent`), visão por jogador (`PlayerView`) e erros (`RuleError`).
2. **`packages/shared/src/engine-api.ts`:** `createGame`, `applyAction`, `getPlayerView`, `skipTurn` e `abandon`. São funções puras, e o `Rng` é injetado.
3. **`packages/shared/src/protocol.ts`:** eventos do Socket.IO, formato do ack, códigos de erro do servidor e `LIMITS`.
4. **`packages/shared/src/engine/rules-config.ts`** (Agente 2): o único lugar com números de regra (dados, mínimos, valor das trocas, reforço mínimo etc.).
5. **`packages/shared/src/map/narnia.ts`** (Agente 2): o `MapData`. É o único lugar com territórios, regiões e conexões.

## 5. Fluxo autoritativo

```text
Cliente ──game:action{clientActionId, expectedVersion, action}──▶ Servidor
                                                                 │ autentica (socket ↔ token ↔ jogador)
                                                                 │ limite de taxa, id repetido, versão
                                                                 │ engine.applyAction(state, jogador, ação, rngCrypto)
                                                                 │   └─ RuleError → ack {ok:false, RULE_ERROR}
                                                                 │ salva sala (JSON atômico)
Todos ◀──game:events (eventos novos)── e ◀──game:state (getPlayerView por jogador)──┘
```

- **Os dados são rolados no servidor** (`crypto.randomInt`). O cliente nunca envia resultado de dado.
- **Sigilo:** cada socket recebe só `getPlayerView(state, seuJogador)`. Objetivos e cartas dos outros não saem do servidor, e o objetivo do vencedor só é revelado no `game-over`.
- **Repetição:** o servidor guarda os últimos `clientActionId` por jogador e ignora repetições, devolvendo `DUPLICATE_ACTION`. Uma ação sobre versão antiga recebe `STALE_VERSION`, e o cliente sincroniza de novo.
- **Reconexão:** o cliente guarda `{code, token}`. Ao reconectar, envia `room:resume` e recebe a visão atual. Se o jogador da vez fica desconectado por mais que `LIMITS.disconnectGraceMs`, o servidor chama `engine.skipTurn`. Depois de `LIMITS.abandonAfterMs`, chama `engine.abandon`.

## 6. Critérios de aceite (do pedido do usuário)

- [ ] Exatamente 42 territórios e 6 regiões de 7, com o grafo de conexões verificado: simétrico, conexo, sem ligações inventadas e com justificativa em `MAP_DATA.md`.
- [ ] Uma partida completa pode ser jogada até a vitória sem erro bloqueador.
- [ ] Reforço, ataque, defesa, conquista, remanejamento, cartas e objetivos funcionam.
- [ ] Objetivos secretos ficam privados (teste automatizado que inspeciona o tráfego do socket).
- [ ] Dois ou mais jogadores entram na mesma sala por navegadores diferentes.
- [ ] Uma ação de um jogador aparece para os outros.
- [ ] O servidor rejeita ações inválidas e fora de turno.
- [ ] Desconectar e reconectar não corrompe a partida.
- [ ] O layout funciona em desktop e tablet e se adapta ao celular.
- [ ] Os fluxos principais têm testes automatizados.
- [ ] Não há erro bloqueador no console nem no servidor no fluxo testado.
- [ ] As instruções de execução e hospedagem estão documentadas.

## 7. Fases e agentes

| Fase | Quem | Saída |
|---|---|---|
| 1. Descoberta | Tech Lead + Agente 1 | Este documento + `REA_WARGROW.md` |
| 2. Planejamento | Tech Lead + Agente 2 | Contratos (seção 4), `map/narnia.ts`, `MAP_DATA.md`, `RULES.md` |
| 3. Design | Agente 3 | `DESIGN_SYSTEM.md`, tema e componentes no cliente |
| 4. Motor | Agente 2 | `engine/` + testes unitários |
| 5. Multiplayer | Agente 4 | `server/` + testes de socket + `MULTIPLAYER.md` |
| 6. Integração | Tech Lead + Agentes 3 e 4 | Cliente conectado ao servidor real |
| 7. QA | Agente 5 | Testes E2E multi-navegador + `TEST_REPORT.md` |
| 8. Entrega | Tech Lead | `README.md`, `DEPLOY.md`, publicação se houver infraestrutura |
