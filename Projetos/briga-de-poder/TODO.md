# TODO

## Pendências da Fase 1
- [ ] Testar em aparelhos reais: Safari no iPhone, Chrome no Android, Firefox no desktop (até agora só Chromium com emulação de celular).
- [ ] Testar controle físico no navegador (a classificação foi testada com eventos sintéticos).
- [ ] Ao voltar de Configurações/Créditos, devolver o foco ao botão de origem (hoje vai para o primeiro disponível).
- [ ] Em clone novo, o primeiro `--import` mostra erros de "No loader found" porque o tema carrega antes das fontes/ícones serem importados; o segundo `--import` sai limpo. Avaliar ordem de importação ou documentar no CI.
- [ ] Servir o `.wasm` comprimido (gzip/brotli) na hospedagem final: 43,7 MB → ~9,4 MB.

## Fase 2 (próxima)
- [ ] `scripts/combat`: simulação em quadros fixos com entrada em bitmask e estado copiável.
- [ ] Dois lutadores provisórios claramente marcados como provisórios.
- [ ] Hitbox/hurtbox próprias, dano, hitstun, knockback, rounds, temporizador, HUD.
- [ ] Ativar "Jogar" no menu.

## Antes de criar personagens (Fase 4)
- [ ] Confirmar se Eduarda Campopiano é figura pública; se não for, não usar imagem identificável sem autorização (substituir ou criar personagem fictício).
