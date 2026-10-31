# Parity tests

Testes de aceitação para o motor de luta do BRIGA DE PODER (Fase 2 em diante).

| Test | Rule | Feature | Summary | Clone status |
|---|---|---|---|---|
| T-01 | R-001 | F-001 | Vida a zero encerra o round com vitória do outro | done (Fase 2, tests/combat) |
| T-02 | R-002 | F-001 | Tempo esgotado: vence quem tem mais vida | done (Fase 2, tests/combat) |
| T-03 | R-003 | F-001 | Vida igual ou nocaute duplo: round sem vencedor | done (Fase 2, tests/combat) |
| T-04 | R-004 | F-001 | Duas vitórias encerram a luta | done (Fase 2, tests/combat) |
| T-05 | R-005 | F-001 | Limite de rounds encerra empates sucessivos | done (Fase 2, tests/combat) |
| T-06 | R-008 | F-003 | Sem acerto fora dos quadros ativos | done (Fase 2, tests/combat) |
| T-07 | R-009 | F-004 | Hitstun/blockstun bloqueiam ações | done (Fase 2, tests/combat) |
| T-08 | R-010 | F-004 | Defesa sofre só o raspão | done (Fase 2, tests/combat) |
| T-09 | R-011 | F-004 | Acerto e defesa separam os lutadores | done (Fase 2, tests/combat) |
| T-10 | R-012 | F-004 | Vantagem de quadro calculada igual ao previsto pelos dados | done (Fase 2, tests/combat) |
| T-11 | R-013 | F-005 | Hitstop congela os dois e não consome quadros do golpe | done (Fase 2, tests/combat) |
| T-12 | R-014 | F-006 | Agarrão ignora defesa; escape simultâneo separa | todo |
| T-13 | R-015 | F-007 | Lutador no chão não é atingido até levantar | done (Fase 2, tests/combat) |
| T-14 | R-016 | F-008 | Acerto durante hitstun soma combo | done (Fase 2, tests/combat) |
| T-15 | R-017 | F-008 | Cancelamento pula a recuperação | done (Fase 2, tests/combat) |
| T-16 | R-018 | F-008 | Dano por acerto cai conforme a tabela, até o piso | done (Fase 2, tests/combat) |
| T-17 | R-024 | F-009 | Comando de movimento + botão gera o especial | done (Fase 2, tests/combat) |
| T-18 | R-025 | F-009 | Carga só vale após o tempo mínimo | todo |
| T-19 | R-026 | F-009 | Comando no buffer sai no primeiro quadro livre | done (Fase 2, tests/combat) |
| T-20 | R-027 | F-009 | Soltar o botão completa o especial | todo |
| T-21 | R-020 | F-012 | Nada de áudio ou execução pesada antes do gesto | done (Fase 1) |
