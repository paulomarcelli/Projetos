# Rules: partida

### R-001 Vence o round quem zera a vida do oponente
- Given dois lutadores com vida acima de zero
- When a vida de um chega a zero
- Then o outro vence o round
- Evidence: [doc SRC-001]
- Feature: F-001 · Screen: S-002

### R-002 Com o relógio zerado vence quem tem mais vida
- Given o relógio do round chega a zero
- When nenhum lutador foi nocauteado
- Then vence quem tem mais vida restante
- Evidence: [doc SRC-001] [doc SRC-002]
- Feature: F-001 · Screen: S-002

### R-003 Vida igual no fim do tempo ou nocaute duplo: ninguém vence o round
- Given o tempo acabou com vidas iguais, ou os dois foram nocauteados ao mesmo tempo
- When o round termina
- Then nenhum lutador ganha o round
- Evidence: [doc SRC-001]
- Feature: F-001 · Screen: S-002

### R-004 A luta termina quando alguém vence dois rounds
- Given uma luta em andamento
- When um lutador soma duas vitórias de round
- Then ele vence a luta
- Evidence: [doc SRC-001]
- Feature: F-001 · Screen: S-002

### R-005 Existe um limite de rounds para evitar luta infinita em empates
- Given empates sucessivos
- When o número máximo de rounds é atingido (10 no original, 4 nas edições seguintes)
- Then no modo solo vence o computador; entre dois jogadores, ambos perdem
- Evidence: [doc SRC-001]
- Feature: F-001 · Screen: S-002

### R-006 Um segundo jogador pode entrar durante o modo solo
- Given uma partida solo em andamento
- When o segundo jogador entra
- Then começa uma luta entre os dois, e o vencedor continua o modo solo
- Evidence: [doc SRC-001]
- Feature: F-011 · Screen: S-002

### R-007 Modo solo: torneio contra todos, mapa entre lutas, bônus a cada três lutas
- Given o modo solo
- When uma luta termina
- Then o próximo local é escolhido automaticamente num mapa; a cada três lutas há uma fase bônus de pontos
- Evidence: [doc SRC-001]
- Feature: F-011 · Screen: S-003
