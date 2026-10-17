# Multiplayer — servidor do WAR: As Crônicas de Nárnia

> Dono: Agente 4. Código em `packages/server/`. Contratos: `packages/shared/src/protocol.ts`,
> `types.ts` e `engine-api.ts` (ver `ARCHITECTURE.md`, seções 4 e 5).

## 1. Arquitetura

```text
packages/server/src/
├── index.ts            # entrada: sobe o servidor e trata SIGINT/SIGTERM e erros soltos
├── app.ts              # Express + http + Socket.IO tipado; /healthz; build do cliente com fallback de SPA
├── config.ts           # variáveis de ambiente (seção 8)
├── engine.ts           # adaptador do motor: usa só a EngineApi exportada por @war/shared
├── rng.ts              # Rng com crypto.randomInt (dados rolados no servidor)
├── validation.ts       # esquemas zod de todos os payloads e validação de nome
├── rate-limit.ts       # janela deslizante de 1 s por socket
├── errors.ts           # ServerError → ack {ok:false, error}
├── log.ts              # log JSON de uma linha (nível, sala, id curto do jogador, ação)
├── rooms/model.ts      # formato persistido da sala, código, token e resumo público
├── rooms/manager.ts    # RoomManager: lobby, partida, conexões, timers e persistência
├── socket/handlers.ts  # liga eventos do Socket.IO ao RoomManager (validação, limite, ack)
└── store/              # RoomStore (interface), FileRoomStore (JSON) e MemoryRoomStore
```

- **Um processo e autoridade total.** O cliente só pede ações. O servidor valida, chama
  `engine.applyAction(state, jogador, ação, rngCrypto)` e devolve a cada socket só
  `engine.getPlayerView(state, seuJogador)`.
- O `RoomManager` não conhece o Socket.IO. Ele fala com a rede por uma interface `Transport`
  (emitir para o canal da sala, emitir para um socket, entrar e sair do canal).
- **Ordem do pipeline de `game:action`:** limite de taxa → zod → socket associado a
  (sala, jogador) → partida existe → `clientActionId` repetido → `expectedVersion` →
  motor → registro do id → persistência → `game:events` → `game:state` individual → ack.
- Todo handler responde o ack exatamente uma vez. Um erro inesperado vira
  `INTERNAL` com a mensagem "Erro interno do servidor." e fica registrado no log.
  `uncaughtException` e `unhandledRejection` são registrados e não derrubam o processo.

## 2. Ciclo de vida da sala

```text
room:create ──▶ lobby ──room:start (anfitrião, ≥2)──▶ playing ──vitória/abandonos──▶ finished ──24 h──▶ removida
                 │  room:join (até 6), room:set-color, room:leave (remove; transfere anfitrião; sala vazia é apagada)
                 └─ sem ninguém conectado e sem atividade por 24 h ──▶ removida
```

- **Código:** 5 caracteres do alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sem 0/O, 1/I/L).
  Não diferencia maiúsculas de minúsculas na entrada.
- **Jogadores:** de 2 a 6 (`LIMITS`). O nome passa por `trim`, tem os espaços internos
  colapsados e precisa ter de 1 a 20 caracteres, sem caracteres de controle nem de
  formatação invisível (Cc, Cf, Zl, Zp). Fora disso, a resposta é `INVALID_NAME`.
- **Cores:** são únicas. Quem entra recebe a primeira livre na ordem
  `vermelho, azul, verde, amarelo, preto, branco`. `room:set-color` só funciona no lobby.
  Uma cor de outro jogador é recusada com `BAD_REQUEST` ("Essa cor já foi escolhida…").
- **Anfitrião:** quem cria a sala. Se ele sai no lobby, o anfitrião passa para o jogador
  mais antigo. Só ele pode dar `room:start`.
- **Partida iniciada:** um `room:join` recebe `ROOM_ALREADY_STARTED`. Só quem tem token
  volta, por `room:resume`.
- **Saída (`room:leave`):** no lobby, remove o jogador. Na partida, chama `engine.abandon`,
  e também `skipTurn(..., 'abandoned')` se era a vez dele. O jogador fica marcado `left`:
  o token deixa de valer e ele continua listado no `room:update` como desconectado.
- **Fim:** quando o estado chega a `phase === 'game-over'` (ou `winner`), a sala passa a
  `finished` e um `room:update` é emitido.

## 3. Protocolo (Socket.IO)

Todas as respostas chegam pelo ack: `{ ok: true, data }` ou `{ ok: false, error: { code, message, ruleCode? } }`.

### Cliente → servidor

| Evento | Payload | Resposta `data` | Erros possíveis |
|---|---|---|---|
| `room:create` | `{ name }` | `Session & { room }` | INVALID_NAME, BAD_REQUEST, RATE_LIMITED |
| `room:join` | `{ code, name }` | `Session & { room }` | ROOM_NOT_FOUND, ROOM_FULL, ROOM_ALREADY_STARTED, INVALID_NAME |
| `room:resume` | `{ code, token }` | `Session & { room }`; depois chega um `game:state` se houver partida | ROOM_NOT_FOUND, INVALID_TOKEN |
| `room:set-color` | `{ color }` | `RoomSummary` | NOT_IN_ROOM, ROOM_ALREADY_STARTED, BAD_REQUEST (cor ocupada/inválida) |
| `room:start` | `{}` | `null` | NOT_IN_ROOM, NOT_HOST, NOT_ENOUGH_PLAYERS, ROOM_ALREADY_STARTED, INTERNAL (sem motor) |
| `room:leave` | `{}` | `null` | NOT_IN_ROOM |
| `game:action` | `{ clientActionId, expectedVersion, action }` | `{ version }` | NOT_IN_ROOM, BAD_REQUEST, STALE_VERSION, DUPLICATE_ACTION, RULE_ERROR (+`ruleCode`), RATE_LIMITED |
| `game:sync` | `{}` | `PlayerView` ou `null` (lobby) | NOT_IN_ROOM |

### Servidor → cliente

| Evento | Quando | Destino |
|---|---|---|
| `room:update` (`RoomSummary`) | entrada, saída, cor, início, fim, conexão e desconexão | canal da sala (nunca contém tokens) |
| `game:events` (`GameEvent[]`) | eventos novos de ação, pulo de turno ou abandono | canal da sala, **antes** do `game:state` |
| `game:state` (`PlayerView`) | depois de cada mudança, no `resume`, em STALE/DUPLICATE | **cada socket individualmente**, com `getPlayerView(state, jogadorDoSocket)` |
| `room:notice` | desconexão, turno pulado, abandono | canal da sala |

O campo `players[].connected` da `PlayerView` é preenchido pelo servidor.

### Exemplos

```js
socket.emit('room:create', { name: 'Lúcia' }, (r) => r);
// → { ok: true, data: { roomCode: 'K7QXM', playerId: 'p_9f…', token: 'Zq…(32 chars)', room: { code: 'K7QXM', status: 'lobby', hostId: 'p_9f…', players: [{ id, name: 'Lúcia', color: 'vermelho', isHost: true, connected: true }], minPlayers: 2, maxPlayers: 6, createdAt } } }

socket.emit('game:action', { clientActionId: 'c-17', expectedVersion: 42, action: { type: 'attack', from: 'cair-paravel', to: 'beruna', dice: 3 } }, cb);
// sucesso → todos recebem game:events [{type:'attack',…}] e depois game:state (cada um a sua visão); cb({ ok: true, data: { version: 43 } })
// fora de turno → { ok: false, error: { code: 'RULE_ERROR', ruleCode: 'NOT_YOUR_TURN', message: 'Não é a sua vez.' } }
// versão velha  → { ok: false, error: { code: 'STALE_VERSION', … } } e o socket recebe um game:state novo
```

## 4. Segurança

- **Token:** `crypto.randomBytes(24)` em base64url (32 caracteres), um por jogador e sala.
  Vai só no ack de create/join/resume do próprio dono. Nunca aparece em `room:update`,
  `game:*` ou no log. A comparação usa `timingSafeEqual`. Fica no JSON da sala, gravado
  com permissão `0600`.
- **Sigilo:** o estado bruto nunca é enviado. Cada socket recebe `getPlayerView` do seu
  jogador. Um teste inspeciona **todos** os payloads e acks recebidos por cada cliente e
  confirma que não aparecem tokens alheios, a descrição ou o id do objetivo de outro, as
  chaves `private` ou `deck`, nem cartas que não sejam as próprias. Os eventos
  (`game:events`) são públicos por contrato. O objetivo do vencedor só aparece no `game-over`.
- **Validação:** zod em todo payload, inclusive em cada variante de `GameAction` (`strict`,
  ids de até 64 caracteres, `dice` de 1 a 3, contagens inteiras positivas). Um payload
  inválido recebe `BAD_REQUEST`.
- **Tamanho:** `maxHttpBufferSize` é de 16 KiB (`WAR_MAX_PAYLOAD_BYTES`). Uma mensagem
  maior derruba só aquela conexão.
- **Limite de taxa** por socket, em janela de 1 s: `game:action` aceita até
  `LIMITS.maxActionsPerSecond` (10), e os demais eventos até 20. O excesso recebe `RATE_LIMITED`.
- **Repetição:** o servidor guarda os últimos 200 `clientActionId` por jogador, persistidos
  e por isso válidos também depois de um reinício. Um id repetido recebe `DUPLICATE_ACTION`,
  com a mensagem dizendo a versão produzida pela ação original (ou que ela foi recusada),
  e o socket recebe um `game:state` atual. A ação não é aplicada de novo. Só contam ids
  que chegaram ao motor (aceitos ou com `RULE_ERROR`). Ids recusados por versão ou
  validação podem ser reenviados.
- **Versão:** um `expectedVersion` diferente de `state.version` recebe `STALE_VERSION`, e o
  servidor reenvia a visão.
- **Origem:** sem `ALLOWED_ORIGINS`, só a mesma origem (ou cliente sem cabeçalho `Origin`,
  como o Node). Isso é checado em `allowRequest`, o que bloqueia sequestro de WebSocket entre sites.

## 5. Conexão, reconexão e abandono

- Um jogador pode ter vários sockets (abas). Ele está `connected` enquanto houver pelo
  menos um. Todos os sockets recebem as visões. Mudanças de conexão emitem `room:update`,
  e durante a partida também `room:notice`.
- Ao reconectar, o cliente envia `room:resume {code, token}`, recebe a sessão e a sala no
  ack e depois o `game:state`. `game:sync` devolve a visão atual a qualquer momento.
- **Carência do jogador da vez:** quando ele não tem nenhum socket, o turno é pulado com
  `engine.skipTurn(..., 'disconnected')` em
  `max(desconectadoEm, inícioDoTurno) + LIMITS.disconnectGraceMs`. O padrão é 60 s
  (`WAR_GRACE_MS`). Depois disso saem um `room:notice` e os eventos.
- **Abandono:** quem fica desconectado por mais que `LIMITS.abandonAfterMs` (padrão 10 min,
  `WAR_ABANDON_MS`) passa por `engine.abandon`, e por `skipTurn(..., 'abandoned')` se era a
  vez dele. A partida termina se o motor declarar vencedor.
- **Timers recriados:** cada sala tem um único timer para o prazo mais próximo, calculado
  sempre a partir dos timestamps salvos (`disconnectedAt`, `turnStartedAt`). Ao reiniciar o
  servidor, todos os jogadores começam desconectados. Quem estava conectado conta a
  desconexão a partir do reinício, e quem já estava desconectado mantém o horário original.

## 6. Persistência

- `RoomStore` (`loadAll`, `save`, `delete`, `flush`). A implementação padrão é a
  `FileRoomStore`, com um arquivo `<WAR_DATA_DIR>/<CODE>.json` (padrão
  `packages/server/data/rooms/`, ignorado pelo git).
- **Gravação atômica:** escreve `<CODE>.json.<pid>.tmp` e faz `rename`. As escritas de uma
  sala passam por uma fila (cadeia de promessas). O instantâneo é serializado no momento
  da chamada, então a ordem é preservada. Arquivos `.tmp` sobrando são apagados ao carregar.
- O arquivo guarda a sala inteira: jogadores com tokens, o `GameState` completo, o
  **histórico completo de eventos** (a view traz só os últimos), os ids recentes e os
  timestamps de conexão e turno.
- A gravação acontece a cada mudança: ação aceita, lobby, conexão e desconexão, timers.
- **Limpeza:** a cada 10 min (`WAR_CLEANUP_INTERVAL_MS`) são removidas as salas
  `finished` há mais de 24 h (`WAR_ROOM_TTL_MS`) e as salas sem ninguém conectado e sem
  atividade há mais de 24 h.

## 7. Limites desta versão

- **Um único processo.** Para escalar horizontalmente seriam necessários um `RoomStore`
  compartilhado (Redis/Postgres) com trava por sala, o adapter do Socket.IO (ex.:
  `@socket.io/redis-adapter`) e sessões aderentes, ou roteamento por código de sala. Os
  timers também precisariam de um dono único por sala.
- Não há espectadores. Não há limite global de salas por IP (pendência).
- O tamanho do histórico de eventos cresce com a partida (algumas centenas de KB numa partida longa).

## 8. Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | 3000 | porta HTTP |
| `ALLOWED_ORIGINS` | vazio (só mesma origem) | origens extras, separadas por vírgula (ex.: `http://localhost:5173`); `*` libera tudo |
| `WAR_DATA_DIR` | `packages/server/data/rooms` | pasta dos JSON das salas |
| `WAR_CLIENT_DIST` | `packages/client/dist` | build do cliente servido pelo Express |
| `WAR_GRACE_MS` | 60000 | carência do jogador da vez desconectado |
| `WAR_ABANDON_MS` | 600000 | tempo desconectado até o abandono |
| `WAR_MAX_ACTIONS_PER_SECOND` | 10 | limite de `game:action` por socket (0 desliga) |
| `WAR_MAX_REQUESTS_PER_SECOND` | 20 | limite dos outros eventos por socket |
| `WAR_MAX_PAYLOAD_BYTES` | 16384 | tamanho máximo de mensagem |
| `WAR_ROOM_TTL_MS` | 86400000 | expiração de salas finalizadas ou inativas |
| `WAR_CLEANUP_INTERVAL_MS` | 600000 | intervalo da limpeza (0 desliga) |
| `LOG_LEVEL` | info | `debug`, `info`, `warn`, `error` ou `silent` |

## 9. Como rodar e testar

```bash
npm run dev -w @war/server        # tsx watch, porta 3000 (o Vite em :5173 faz proxy de /socket.io)
npm start -w @war/server          # produção; serve packages/client/dist se existir
curl localhost:3000/healthz       # {"ok":true,"engine":true|false}

cd packages/server
npx vitest run                    # testes de socket (porta aleatória, pasta temporária)
npx tsc --noEmit -p tsconfig.json
```

Os testes (`packages/server/test/`) sobem o servidor numa porta aleatória e usam o
`socket.io-client` real:

- `lobby.test.ts` não depende do motor. Cobre healthz, build e SPA, criar, entrar e cores
  únicas, cor duplicada, nome inválido, sala inexistente e cheia, início só pelo anfitrião
  e com mínimo, sem motor → INTERNAL, resume e token inválido, várias abas, saída e
  transferência de anfitrião, BAD_REQUEST e NOT_IN_ROOM, RATE_LIMITED, payload grande,
  origem, persistência e reinício do lobby, limpeza.
- `game.test.ts` roda a mesma bateria com o **dublê de contrato** (`test/helpers/contract-double.ts`,
  uma EngineApi mínima, só de teste, com territórios fictícios) e, quando o motor existir,
  também com o **motor real** de `@war/shared`. Cobre não vazamento, fora de turno,
  STALE_VERSION, DUPLICATE_ACTION, ação vista pelo outro (eventos antes do estado), pulo de
  turno por desconexão, reconexão, reinício com a partida continuando (e deduplicação
  persistida), timers recriados após o reinício, abandono por tempo, `room:leave` na
  partida e partida completa até a vitória (dublê).

## 10. Pedidos ao Tech Lead

1. **`COLOR_TAKEN` em `ServerErrorCode`:** hoje, uma cor ocupada responde `BAD_REQUEST` com mensagem específica.
2. **`room:create` e `room:join` com `color?` opcional:** evitaria um `room:set-color` logo depois de entrar.
3. **`DUPLICATE_ACTION`:** o `ErrorPayload` não tem campo para devolver o `{version}` original.
   Sugestão: `data?: unknown` opcional no `ErrorPayload`, ou documentar que o cliente deve
   tratar `DUPLICATE_ACTION` como "já aplicado" e esperar o `game:state`, que o servidor já reenvia.
4. **Partida completa com o motor real:** o teste fica `todo` até o motor exportar
   `createGame`, `applyAction`, `getPlayerView`, `skipTurn` e `abandon`, de preferência
   também um `legalActions(state, player)` para o bot de teste.
