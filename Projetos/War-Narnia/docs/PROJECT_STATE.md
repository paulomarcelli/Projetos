# Estado do projeto — WAR: As Crônicas de Nárnia

| Fase | Status | Responsável |
|---|---|---|
| 1. Descoberta | Em andamento: arquitetura pronta, REA em execução | Tech Lead, Agente 1 |
| 2. Planejamento | Contratos prontos (`types.ts`, `engine-api.ts`, `protocol.ts`); mapa e regras em execução | Tech Lead, Agente 2 |
| 3. Design | Em execução | Agente 3 |
| 4. Motor | Pendente (depois do mapa) | Agente 2 |
| 5. Multiplayer | Em execução contra os contratos | Agente 4 |
| 6. Integração | Pendente | Tech Lead |
| 7. QA | Pendente | Agente 5 |
| 8. Entrega | Pendente | Tech Lead |

## Decisões
- Pilha e justificativas: `ARCHITECTURE.md`, seção 2.
- Territórios e bônus: os do mapa enviado pelo usuário (legenda da imagem). "Cair Paavel" na legenda é erro de digitação e o nome correto é Cair Paravel. "Yelmaráino" no mapa corresponde a Vale Telmarino da legenda.
- A hospedagem depende de serviço com Node e WebSocket (o GitHub Pages não serve).

## Pendências
- Confirmar no REA as regras do WAR de referência (1ª rodada sem ataque, dados de defesa, valores de troca).
