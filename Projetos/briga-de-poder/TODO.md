# TODO

## Pendências da Fase 1
- [ ] Testar em aparelhos reais: Safari no iPhone, Chrome no Android, Firefox no desktop (até agora só Chromium com emulação de celular).
- [ ] Testar controle físico no navegador (a classificação foi testada com eventos sintéticos).
- [ ] Ao voltar de Configurações/Créditos, devolver o foco ao botão de origem (hoje vai para o primeiro disponível).
- [ ] Em clone novo, o primeiro `--import` mostra erros de "No loader found" porque o tema carrega antes das fontes/ícones serem importados; o segundo `--import` sai limpo. Avaliar ordem de importação ou documentar no CI.
- [ ] Servir o `.wasm` comprimido (gzip/brotli) na hospedagem final: 43,7 MB → ~9,4 MB.

## Pendências da Fase 2
- [ ] Agarrão e escape (T-12), especial por carga (T-18) e "soltar o botão" (T-20): entram nas Fases 3 e 4.
- [ ] Testar com controle físico e dois jogadores reais (testado com teclado no Chromium e com entradas sintéticas).
- [ ] Interpolação visual para telas de 120 Hz (hoje o desenho segue os 60 quadros da simulação).
- [ ] Ajuste fino dos tempos dos golpes jogando (os números atuais são de partida, dentro das faixas do gênero).

## Fase 3 (próxima)
- [ ] Controles de toque: direcional, leve/médio/forte, pulo, defesa, especial; tamanho, posição e opacidade (Configurações já guardam os valores).
- [ ] Buffer maior no toque e comandos simplificados opcionais.
- [ ] Remapeamento de teclas.

## Antes de criar personagens (Fase 4)
- [ ] Confirmar se Eduarda Campopiano é figura pública; se não for, não usar imagem identificável sem autorização (substituir ou criar personagem fictício).
