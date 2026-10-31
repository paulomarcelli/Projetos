# Glossary

Termos do gênero com o nome que o BRIGA DE PODER usará no código (inglês) e na interface (português).

| Term | Definition | Evidence |
|---|---|---|
| Quadro (frame) | Unidade de tempo da luta; a 60 quadros por segundo, 1 quadro ≈ 16 ms. Código: `frame`. | [doc SRC-002] |
| Startup / Active / Recovery | As três fases de um golpe: preparação, período em que a caixa de ataque existe, e recuperação até o lutador voltar ao controle. Código: `startup`, `active`, `recovery`. | [doc SRC-002] |
| Hitbox / Hurtbox | Retângulos de ataque e de corpo; um golpe acerta quando a hitbox toca a hurtbox do oponente. Interface: "caixa de golpe" / "caixa de corpo" (modo treino). | [doc SRC-002] |
| Hitstun / Blockstun | Tempo em que o lutador atingido (ou que defendeu) não pode agir. Código: `hitstun`, `blockstun`. | [doc SRC-002] |
| Dano de raspão (chip) | Dano pequeno sofrido mesmo defendendo, em geral 10–25% do dano normal. Código: `chip_damage`. | [doc SRC-002] |
| Empurrão (pushback) | Distância que separa os lutadores após acerto ou defesa. Código: `pushback`. | [doc SRC-002] |
| Vantagem de quadro | Quem se recupera primeiro após um acerto ou defesa. Código: `frame_advantage`. | [doc SRC-002] |
| Cancelamento | Interromper a recuperação de um golpe para emendar outro (normalmente um especial). Código: `cancel`. | [doc SRC-002] |
| Emenda (link) | Encadear golpes deixando o primeiro terminar, dentro da vantagem de quadro. | [doc SRC-002] |
| Combo | Sequência de acertos impossível de evitar depois do primeiro. Interface: "COMBO x3". | [doc SRC-001] [doc SRC-002] |
| Agarrão (throw) | Golpe curto que não pode ser defendido; defende-se apertando agarrão no mesmo instante ("escapar"). Código: `throw`, `throw_tech`. | [doc SRC-002] |
| Tontura (stun) | Após muitos acertos seguidos, o lutador fica tonto e indefeso; pode apertar botões para sair antes. Código: `dizzy`. | [doc SRC-002] |
| Queda (knockdown) / Levantar (wakeup) | Ser derrubado e o momento de voltar a ficar de pé. Código: `knockdown`, `wakeup`. | [doc SRC-002] |
| Carga | Segurar uma direção cerca de 1 segundo antes do comando do especial. Código: `charge_input`. | [doc SRC-002] |
| Comando de movimento | Especial feito com sequência de direções (ex.: baixo, diagonal, frente + botão). Código: `motion_input`. | [doc SRC-002] |
| Janela de buffer | Período em que o jogo guarda um comando e o executa no primeiro quadro possível. Código: `input_buffer`. | [doc SRC-002] |
| Pausa de impacto (hitstop) | Congelamento breve dos dois lutadores no acerto, para dar peso ao golpe. Código: `hitstop`. | [doc SRC-002] |
| Redução de dano em combo | Cada acerto a mais no combo causa menos dano. Código: `damage_scaling`. | [doc SRC-002] |
| Rollback | Netcode que executa a entrada local na hora e volta/ressimula quando chega a entrada real do oponente. | [doc SRC-002] |
| Tempo esgotado (time out) | Round decidido pelo relógio: vence quem tem mais vida. | [doc SRC-001] [doc SRC-002] |
