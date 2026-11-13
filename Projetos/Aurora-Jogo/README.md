<div align="center">

<img src="../../docs/capas/aurora.webp" alt="Aurora: guerreira de cabelo prateado e olhos violeta, com arco, sob a lua" width="720">

# 🌙 Aurora: O Dízimo da Lua

**Plataforma 2D de ação e fantasia sombria, com uma heroína que respira, pisca e reage ao vento.**

[Jogar o protótipo ↗](https://paulomarcelli.github.io/Projetos/Projetos/Aurora/) · [Roteiro](docs/roteiro.md) · [Arquitetura](docs/ARQUITETURA.md) · [Passagem para a próxima IA](docs/PARA-A-PROXIMA-IA.md)

</div>

## O jogo
Aurora, a última da Casa Selênia (descendente da deusa da lua), é entregue como tributo ao Labirinto onde o Império
de Helion acorrenta um deus. A história mistura **mitologia grega** (o tributo ao Labirinto, Astérion, Selene,
Caronte, a Esfinge) com o clima de intriga e sobrevivência de grandes sagas de fantasia. Personagens, mundo e diálogos
são **originais**. Roteiro completo, com 3 atos, 13 fases e 4 finais: [`docs/roteiro.md`](docs/roteiro.md).

**Estado atual:** protótipo jogável numa fase de teste noturna.

| Já funciona | Provisório ou falta |
|-------------|---------------------|
| Correr, pular (com pulo variável, "pulo atrasado" e memória do botão), Salto da Lua (pulo duplo, gasta mana), esquiva, golpe de lâmina, arco com flecha que voa e crava | Fases do roteiro, chefes, diálogos e escolhas |
| Aurora parada "viva": respiração, piscar, mão que abre e fecha, cabelo e tranças que balançam | Olhos totalmente fechados (só há semicerrados) |
| Vento com rajadas e folhas em duas camadas (parallax); move o cabelo e a chama | Pose sentada (usa a pose agachada) |
| Fogueira Lunar: sentar, recuperar vida e mana, salvar, criaturas voltam, menu de evolução | Arte das criaturas (hoje são formas desenhadas em código) |
| Moedas de prata, 4 atributos, custo de nível crescente, salvamento versionado | Som e música, controles de toque, mais fases |

## Controles
| Tecla | Ação |
|-------|------|
| ← → (ou A D) | andar |
| Espaço (ou ↑ W) | pular; de novo no ar = **Salto da Lua** (gasta mana) |
| Shift (ou C) | esquivar rolando |
| J (ou Z) | golpe de lâmina |
| K (ou X) | atirar com o arco |
| E | descansar na Fogueira Lunar / levantar |
| 1 2 3 4 | (na fogueira) evoluir Vigor, Foco, Força, Precisão |
| L | lupa: aproxima a câmera para ver os detalhes da Aurora |
| H / V | testar as animações de dano e de vitória |

## Rodar no computador
Precisa de Node.js 18+ e Python 3.
```bash
cd Projetos/Aurora-Jogo/jogo
npm install
npm run preparar     # copia o PixiJS e as artes para jogo/
npm test             # 15 testes: física, progressão e salvamento
python3 -m http.server 8080
```
Abra `http://localhost:8080`. Precisa de um servidor (os módulos JavaScript não abrem com dois cliques em `file://`).

## Pastas
```text
Aurora-Jogo/
├── jogo/                 o jogo (é isto que vai para o GitHub Pages)
│   ├── index.html
│   ├── src/              main.js, fisica.js, aurora_viva.js, vento.js, fogueira.js, inimigos.js, hud.js, progresso.js
│   ├── assets/           sprites (folha de animações, flecha) e viva (Aurora parada em alta resolução)
│   ├── vendor/           pixi.min.mjs (PixiJS 8.23, licença MIT)
│   ├── testes/           testes com o testador do Node
│   └── ferramentas/      preparar.mjs
├── arte/
│   ├── referencias/      arte de conceito aprovada da Aurora
│   ├── poses-originais/  tudo que veio do Gemini, sem mexer
│   ├── viva-original/    base + variações (olhos semicerrados, mão fechada) da Aurora parada
│   ├── sprites/          recortes, folha de sprites montada, prévias GIF, flecha (ver LEIA-ME.md)
│   └── boneco/           peças separadas (experimento arquivado)
├── ferramentas/          Python: recortar, fatiar folhas, montar a folha, compor a Aurora parada
├── experimentos/         código arquivado (boneco de peças)
└── docs/                 roteiro, arquitetura, ficha da Aurora, prompts de arte, passagem para a próxima IA
```

## Tecnologias
- **PixiJS 8** (renderização 2D com malhas deformáveis) + JavaScript sem empacotador.
- **Física própria** com os números da skill de plataforma (`gamedev-skills/platformer`, calculados com `jump_tuner.py`).
- **Python + Pillow + NumPy** para o fluxo de arte (recorte, fatiamento, alinhamento, composição).
- **Arte gerada com IA** (Google Gemini) pelo autor, a partir da ficha da Aurora. Declarar ao publicar em lojas.
