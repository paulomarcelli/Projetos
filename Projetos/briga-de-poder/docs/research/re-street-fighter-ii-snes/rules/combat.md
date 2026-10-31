# Rules: combate

### R-008 O golpe só acerta durante a fase ativa, quando a hitbox toca a hurtbox
- Given um golpe em andamento
- When ele está nos quadros ativos e sua hitbox sobrepõe a hurtbox do oponente
- Then o acerto (ou a defesa) é registrado; em startup e recovery não há hitbox
- Evidence: [doc SRC-002]
- Feature: F-003 · Screen: S-002

### R-009 Acerto e defesa deixam o oponente sem ação por um tempo
- Given um golpe conectou
- When o oponente estava sem defender (ou defendendo)
- Then ele entra em hitstun (ou blockstun) e não pode agir até o fim
- Evidence: [doc SRC-002]
- Feature: F-004 · Screen: S-002

### R-010 Golpes defendidos ainda causam dano de raspão
- Given o oponente defende um golpe que causa raspão
- When o golpe conecta
- Then o oponente perde uma fração do dano, em geral 10–25%; muitos jogos permitem nocaute por raspão
- Evidence: [doc SRC-002]
- Feature: F-004 · Screen: S-002

### R-011 Acerto e defesa empurram os lutadores para longe
- Given um golpe conectou
- When acerta ou é defendido
- Then os lutadores se separam pela distância de empurrão do golpe
- Evidence: [doc SRC-002]
- Feature: F-004 · Screen: S-002

### R-012 Quem se recupera primeiro tem vantagem de quadro
- Given um golpe conectou
- When o atacante termina a recuperação antes de o oponente sair do hitstun/blockstun
- Then o atacante age primeiro (vantagem); no caso contrário, desvantagem
- Evidence: [doc SRC-002]
- Feature: F-004 · Screen: S-002

### R-013 Todo acerto congela os dois lutadores por alguns quadros
- Given um golpe acertou
- When o contato acontece
- Then a luta pausa brevemente (hitstop); esses quadros ficam fora da contagem normal do golpe
- Evidence: [doc SRC-002]
- Feature: F-005 · Screen: S-002

### R-014 Agarrão não pode ser defendido, mas pode ser escapado
- Given os lutadores estão colados
- When um aplica agarrão
- Then a defesa não impede; se o outro apertar agarrão no mesmo instante, os dois são separados em posição neutra
- Evidence: [doc SRC-001] [doc SRC-002]
- Feature: F-006 · Screen: S-002

### R-015 Golpes que derrubam deixam o oponente no chão até levantar
- Given um golpe com propriedade de queda acertou
- When o oponente cai
- Then ele fica no chão por um tempo e não pode ser acertado normalmente até levantar (wakeup); na queda "dura" o tempo é fixo
- Evidence: [doc SRC-002]
- Feature: F-007 · Screen: S-002

### R-016 Combo acontece quando o novo acerto chega antes do fim do hitstun
- Given o oponente está em hitstun
- When outro golpe acerta antes do fim do hitstun
- Then o acerto conta no combo e não pode ser evitado; em SF2 isso surgiu sem querer e virou padrão do gênero
- Evidence: [doc SRC-001] [doc SRC-002]
- Feature: F-008 · Screen: S-002

### R-017 Cancelamento troca a recuperação de um golpe pelo início de outro
- Given um golpe normal cancelável acertou ou foi defendido
- When o comando de um especial é feito durante a janela de cancelamento
- Then a recuperação do normal é pulada e o especial começa
- Evidence: [doc SRC-002]
- Feature: F-008 · Screen: S-002

### R-018 Combos longos causam menos dano por acerto
- Given um combo em andamento
- When o número de acertos cresce
- Then o dano de cada acerto é reduzido até um piso (ex.: 100%, 100%, 80%, 70% … até 10%)
- Evidence: [doc SRC-002]
- Feature: F-008 · Screen: S-002

### R-019 Muitos acertos seguidos deixam o lutador tonto
- Given um lutador sofre acertos em sequência
- When o acúmulo passa de um limite
- Then ele fica tonto e indefeso; apertar botões e girar o direcional encurta a tontura
- Evidence: [doc SRC-002]
- Feature: F-010 · Screen: S-002
