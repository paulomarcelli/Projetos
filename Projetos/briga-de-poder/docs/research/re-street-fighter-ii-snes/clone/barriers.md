# Production barriers: Street Fighter II SNES

Clone target market: see `00-charter.md`. Aqui o "clone" é o BRIGA DE PODER.
Not legal advice. A legal reading without a source is `[inf]` with a question for counsel in `questions.md`.

## Summary

| Barrier | Category | Severity | Market weight | Blocks | Lead time |
|---|---|---|---|---|---|
| BR-002 A fonte observada é uma cópia não licenciada | IP | blocks launch | total | qualquer asset tirado da página | nenhum, se evitado |
| BR-001 Personagens, nomes, golpes e arte da Capcom | IP / marca | blocks launch | total | F-001, F-011 se copiados | nenhum, se evitado |
| BR-003 Sátira de políticos reais | lei / reputação | adds lead time | alto | elenco | consulta jurídica |
| BR-004 Notoriedade de um personagem planejado | direito de imagem | blocks feature | médio | 1 personagem | verificação |
| BR-005 Infra de rede para jogo online no navegador | infraestrutura | adds cost | alto | F-013 | Fase 6 |

### BR-001 Personagens, nomes, golpes e arte pertencem à Capcom
- Category: propriedade intelectual e marca
- Blocks: F-001, F-011 (se copiados)
- Gatekeeper: Capcom
- Severity: blocks launch
- Market weight: total
- What it takes: não usar nomes, sprites, músicas, cenários, nomes de golpes nem "Street Fighter"; o prompt mestre do BRIGA já proíbe
- Lead time and cost: zero se respeitado
- Mitigation: copiar só convenções do gênero (rounds, 6 botões, comandos), que são práticas comuns de vários jogos [inf] Q-001
- Evidence: [doc SRC-001]

### BR-002 A página carrega uma cópia não licenciada do jogo
- Category: propriedade intelectual
- Blocks: uso de qualquer imagem, som ou dado obtido executando a página
- Gatekeeper: Capcom
- Severity: blocks launch
- Market weight: total
- What it takes: estudo apenas por fontes públicas; a ROM nunca foi baixada nem executada
- Lead time and cost: zero
- Mitigation: clean room (este KB não contém nada do jogo além de regras descritas publicamente)
- Evidence: [obs EV-004] [obs EV-003]

### BR-003 Sátira de figuras políticas reais
- Category: lei (imagem, honra, regras eleitorais) e reputação
- Blocks: publicação do elenco planejado
- Gatekeeper: Justiça brasileira; plataformas de hospedagem
- Severity: adds lead time
- Market weight: alto
- What it takes: orientação jurídica sobre caricatura e sátira, aviso de ficção visível, cuidado redobrado em período eleitoral [inf] Q-002
- Lead time and cost: consulta jurídica antes da publicação (Fase 7)
- Mitigation: aviso de ficção já no menu; equilíbrio entre campos políticos; nenhum fato inventado apresentado como real
- Evidence: [inf] Q-002

### BR-004 Personagem planejado pode não ser figura pública
- Category: direito de imagem
- Blocks: um personagem do elenco
- Gatekeeper: a própria pessoa
- Severity: blocks feature
- Market weight: médio
- What it takes: confirmar notoriedade; sem ela, não usar imagem identificável sem autorização [inf] Q-003
- Lead time and cost: verificação antes da Fase 4
- Mitigation: trocar por personagem fictício
- Evidence: [inf] Q-003

### BR-005 Jogo online no navegador precisa de servidor de sinalização e STUN/TURN
- Category: infraestrutura
- Blocks: F-013
- Gatekeeper: provedores de TURN e hospedagem
- Severity: adds cost
- Market weight: alto
- What it takes: servidor de sinalização/relay e servidores ICE; TURN público gratuito não serve para produção [inf] Q-006
- Lead time and cost: Fase 6
- Mitigation: começar com relay WebSocket (já planejado em ARCHITECTURE.md do BRIGA)
- Evidence: [doc SRC-005]
