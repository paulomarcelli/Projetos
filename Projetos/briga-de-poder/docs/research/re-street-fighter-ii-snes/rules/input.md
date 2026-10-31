# Rules: entradas

### R-023 Controles: direcional de 8 direções e seis botões de ataque
- Given o lutador em jogo
- When o jogador usa o direcional
- Then anda, pula, agacha e defende (defesa = segurar para trás); três socos e três chutes trocam força por velocidade
- Evidence: [doc SRC-001]
- Feature: F-002 · Screen: S-002

### R-024 Especial por comando de movimento
- Given o lutador livre para agir
- When o jogador faz a sequência de direções do especial e aperta o botão
- Then o especial sai
- Evidence: [doc SRC-001] [doc SRC-002]
- Feature: F-009 · Screen: S-002

### R-025 Especial por carga exige segurar uma direção por cerca de 1 segundo
- Given o jogador segura trás ou baixo
- When passa cerca de 1 segundo e ele faz a direção oposta + botão
- Then o especial de carga sai; por levar tempo, costuma ser mais forte
- Evidence: [doc SRC-002]
- Feature: F-009 · Screen: S-002

### R-026 Comandos feitos um pouco antes ficam guardados (buffer)
- Given o lutador ainda não pode agir (ex.: em recuperação ou no chão)
- When o jogador faz o comando dentro da janela de buffer
- Then a ação sai no primeiro quadro possível
- Evidence: [doc SRC-002]
- Feature: F-009 · Screen: S-002

### R-027 Soltar o botão também conta (negative edge)
- Given o jogador segura um botão
- When faz o comando de movimento e solta o botão
- Then o especial sai, o que perdoa erros de tempo
- Evidence: [doc SRC-002]
- Feature: F-009 · Screen: S-002
