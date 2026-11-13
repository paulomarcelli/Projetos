# A Prova do Sal — plano do jogo (título provisório) (plataforma 2D / 2,5D)

> Feito com a skill `gamedev-skills` (roteador → `platformer`, `godot-2d-movement`, `godot-3d-essentials`,
> `godot-shaders`, `game-feel`, `level-design`, `create-game-assets`, `game-ui-ux`, `godot-export`).
> História: `historia.md`. Direção de arte: `direcao-de-arte.md`.

## 1. Formato
- **Gênero:** plataforma de ação e exploração, rolagem lateral, com quebra-cabeças de mapa.
- **Visual 2,5D:** cenário em 3D de baixo detalhe, com cara de papel, papelão e madeira pintada,
  visto de lado; personagens em 2D desenhados à mão e com contorno, dentro do cenário 3D.
- **Plataformas:** celular (controles na tela), computador e navegador; controle de videogame opcional.
- **Duração:** 10 fases de 10 a 20 minutos: 3 em Pedralva antes da Prova, 6 dentro do **Labirinto**, 1 final.
- **Espetáculo:** dentro do Labirinto, um contador de **plateia** (como o reino vê Aurora nos Espelhos de Sal) muda com as escolhas e libera ajudas.

## 2. O que a Aurora faz
| Ação | Botão (celular) | Detalhe |
|------|-----------------|---------|
| Andar e pular | direcional + A | Pulo com tempo extra na borda e memória do botão (skill `platformer`) |
| Interagir / conversar | X | Falar com personagens, empurrar caixas, ler placas |
| **Desenhar no mapa** | Y | Abre o caderno: traçar uma ponte, uma porta ou uma escada que vira real por alguns segundos |
| Lanterna de sal | B (segurar) | Afasta a Maré Cinza e revela caminhos apagados; gasta tinta |
| **Fia, a raposa** | automática / toque nela | Fareja a névoa, passa por buracos pequenos e puxa alavancas |

- **Vida:** 5 corações. Não há "vidas"; ao cair, ela volta ao último marco de pedra (checkpoint).
- **Combate leve:** Aurora não é guerreira. Ela desvia, distrai com a lanterna e usa o cenário (derrubar caixas, abrir portas sob inimigos).
- **Tinta de sal:** recurso que limita os desenhos; recarregada em fontes de sal escondidas.

## 3. Fases (rascunho)
| # | Lugar | Fase | Ideia nova que a fase ensina |
|---|-------|------|------------------------------|
| 1 | Pedralva | Telhados e arquivos do palácio à noite | Andar, pular, caixas, Fia |
| 2 | Salinas | Fuga pelas minas com Nico e Tobias | Primeiro desenho: ponte; plataformas que caem |
| 3 | Pedralva | O desfile dos Campeões e a descida | Furtividade entre guardas; conversa com escolhas |
| 4 | Labirinto | Os Túneis Mutantes | Paredes que mudam; desenhar o mapa para não se perder |
| 5 | Labirinto | As Costelas | Plataformas que sobem e descem com a respiração da Dragoa |
| 6 | Labirinto | O Salão das Armadilhas | Guardiões de Sal; desenhar escadas |
| 7 | Labirinto | O Poço de Névoa | Lanterna de sal contra as Filhas da Névoa |
| 8 | Labirinto | A Emboscada | Chefe: Mestre Gorm; alianças decidem quem ajuda |
| 9 | Labirinto | O Coração | Chefe final: Irmão Ansel |
| 10 | Pedralva | O Despertar | Fuga épica enquanto a Dragoa ergue a cidade; o final escolhido |

Entre as fases há conversas com escolhas (com quem se aliar, a quem trair, o que mostrar nos Espelhos) que mudam
quem sobrevive, como o povo vê Aurora e qual dos três finais aparece.

**Inimigos e obstáculos:** Guardiões de Sal, Filhas da Névoa, desabamentos, outros Campeões e a própria Maré Cinza.

## 4. Tecnologia
- **Motor recomendado: Godot 4.7.** Faz bem o 2,5D (cenário 3D + personagens 2D), tem luzes e brilho
  prontos para a cena noturna, é gratuito e exporta para celular, computador e navegador.
  O Phaser, que usamos antes, é 2D puro e teria dificuldade com essa iluminação.
- Câmera em perspectiva leve vista de lado (dá profundidade às camadas), seguindo a Aurora com suavidade.
- Física e colisão em 2D (a jogabilidade é toda num plano), com o cenário 3D só como visual.
- Controles na tela para celular, no estilo das referências (direcional à esquerda, 4 botões à direita).

## 5. Etapas
1. **Protótipo cinza:** movimento da Aurora, caixas, checkpoint e o desenho de ponte. Ajustar até ficar gostoso.
2. **Alvo visual:** um trecho da fase 1 (Porto de Morvane) com arte e luz finais, testado no celular.
3. **Fatia vertical:** fase 1 completa, com Fia, inimigo, conversa com escolha, som e menu.
4. **Produção** das outras fases, alternando os dois mundos.
5. **Polimento e publicação** (itch.io, Google Play e, se quiser, Steam).
