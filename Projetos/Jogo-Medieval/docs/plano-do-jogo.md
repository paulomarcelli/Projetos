# A Coroa de Sal — plano do jogo (plataforma 2D / 2,5D)

> Feito com a skill `gamedev-skills` (roteador → `platformer`, `godot-2d-movement`, `godot-3d-essentials`,
> `godot-shaders`, `game-feel`, `level-design`, `create-game-assets`, `game-ui-ux`, `godot-export`).
> História: `historia.md`. Direção de arte: `direcao-de-arte.md`.

## 1. Formato
- **Gênero:** plataforma de ação e exploração, rolagem lateral, com quebra-cabeças de mapa.
- **Visual 2,5D:** cenário em 3D de baixo detalhe, com cara de papel, papelão e madeira pintada,
  visto de lado; personagens em 2D desenhados à mão e com contorno, dentro do cenário 3D.
- **Plataformas:** celular (controles na tela), computador e navegador; controle de videogame opcional.
- **Duração:** 8 a 10 fases de 10 a 20 minutos, alternando **Aldemar** (mundo humano) e o **Ermo Velho** (mundo encantado).

## 2. O que a Aurora faz
| Ação | Botão (celular) | Detalhe |
|------|-----------------|---------|
| Andar e pular | direcional + A | Pulo com tempo extra na borda e memória do botão (skill `platformer`) |
| Interagir / conversar | X | Falar com personagens, empurrar caixas, ler placas |
| **Desenhar no mapa** | Y | Abre o caderno: traçar uma ponte, uma porta ou uma escada que vira real por alguns segundos |
| Lanterna de sal | B (segurar) | Afasta a Maré Cinza e revela caminhos apagados; gasta tinta |
| **Fia, a raposa** | automática / toque nela | Ilumina segredos, alcança alavancas em buracos pequenos e dá dicas |

- **Vida:** 5 corações. Não há "vidas"; ao cair, ela volta ao último marco de pedra (checkpoint).
- **Combate leve:** Aurora não é guerreira. Ela desvia, distrai com a lanterna e usa o cenário (derrubar caixas, abrir portas sob inimigos).
- **Tinta de sal:** recurso que limita os desenhos; recarregada em fontes de sal escondidas.

## 3. Fases (rascunho)
| # | Mundo | Fase | Ideia nova que a fase ensina |
|---|-------|------|------------------------------|
| 1 | Aldemar | Porto de Morvane à noite | Andar, pular, caixas, Fia |
| 2 | Aldemar | Palácio de Pedralva (passagens secretas) | Primeiro desenho: ponte |
| 3 | Ermo | Bosque dos Cervos-de-Luar | Lanterna de sal contra a névoa |
| 4 | Aldemar | Minas dos Ferrabraz | Desenhar escadas; plataformas que caem |
| 5 | Ermo | Costas dos Gigantes Adormecidos | Plataformas que se mexem (o gigante respira) |
| 6 | Aldemar | Mercado do Lírio-Rubro | Fase de fuga e furtividade |
| 7 | Ermo | Poço das Mouras | Fase debaixo d'água; trocar segredos |
| 8 | Ermo | Penhascos dos Grifos | Voo montada num grifo |
| 9 | Aldemar | Ilha do Farol | Luz e sombra: virar espelhos |
| 10 | Os dois | Pedralva engolida pela Maré | Fase final; a escolha do fim |

Entre as fases há conversas curtas com escolhas (quem apoiar, o que contar), que mudam quem ajuda Aurora
no final e qual dos três finais aparece.

**Inimigos e obstáculos (originais):** plantas-boca de sal, guardas dos Ferrabraz com lanternas,
morcegos de névoa, estátuas que só andam no escuro e a própria Maré Cinza, que avança por trás em algumas fases.

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
