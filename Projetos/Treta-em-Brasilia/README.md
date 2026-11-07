<div align="center">

# 🥊 Brasília Kombat

**A briga mais polarizada do país.** Um jogo de luta 2D no estilo fliperama dos anos 90, com caricaturas de políticos e memes, golpes absurdos, Superpowers, Ultimates com cinemática e arenas cheias de manifestação.

![Godot 4.3](https://img.shields.io/badge/Godot-4.3-478cbf?style=flat-square&logo=godotengine&logoColor=white)
![GDScript](https://img.shields.io/badge/GDScript-478cbf?style=flat-square)
![Pixel art](https://img.shields.io/badge/16_bits-ffd23f?style=flat-square)
![Navegador e celular](https://img.shields.io/badge/navegador_·_celular_·_tablet-1f9d55?style=flat-square)

[![Jogar no navegador](https://img.shields.io/badge/JOGAR_NO_NAVEGADOR-c81e2a?style=for-the-badge&logo=godotengine&logoColor=ffd23f)](https://paulomarcelli.github.io/Projetos/Projetos/Treta-em-Brasilia/)

<img src="docs/luta.png" alt="Bolsonaro acerta Lula com a metralhadora de brinquedo na Avenida Paulista: estalo de impacto, retratos ao lado das barras de vida e a plateia dos dois lados" width="860">

</div>

> [!NOTE]
> **Paródia e humor.** Os lutadores são caricaturas com apelidos, memes e referências públicas conhecidas, sem apoio a partido ou candidato. O elenco e as manifestações mostram todos os lados de propósito, e a violência é de desenho animado: armas de brinquedo, explosões de confete, ninguém se machuca.

## 🎮 Modos

| Modo | O que é |
|---|---|
| **PLAY** | 1 jogador contra a CPU: escolhe os lutadores e a arena |
| **MULTIPLAYER** | 2 jogadores no mesmo aparelho (teclado ou dois controles) |
| **ARCADE MODE** | enfrente todo o elenco em sequência, uma arena por luta, cada CPU mais difícil |
| **TRAINING** | contra um boneco parado, com barra infinita, vida que volta e contador de combo |
| **CHARACTER SELECT** | ficha de cada lutador: biografia, atributos, golpes com os comandos e demonstração animada |
| **SETTINGS** | volume de música e efeitos, dificuldade, tremor de tela, controles de toque, tempo do round e tela cheia |

## 👊 Combate

- **Movimentação de fliperama:** todos lutam na guarda (de lado, joelhos dobrados, punhos perto do rosto, balançando no ritmo); pulo para a frente ou para trás vira cambalhota; braços e pernas têm cotovelo e joelho de verdade (cinemática inversa), sem esticar; chutes recolhem o joelho antes de esticar; o corpo quica ao cair.
- **Golpes normais:** soco fraco e **soco forte** (frente + Soco), chute médio, **chute alto** (frente + Chute), **rasteira** (baixo + Chute), soco aéreo, voadora e **pisão** (baixo + Chute no ar).
- **Combos:** Soco, Soco, Chute termina no golpe final de cada um; Chute, Chute vira chute alto; golpes que conectam cancelam em especial, e qualquer coisa cancela no SUPER.
- **Agarrão e arremesso:** botão Agarrar (ou Soco + Chute) de perto; com trás, joga para o outro lado. Se os dois agarram juntos, **escapam**.
- **Dash e esquiva:** dois toques para a frente ou para trás. A esquiva para trás é invencível no começo.
- **Defesa e contra-ataque:** segure para trás (agachado defende rasteira). Começar a defender bem na hora do golpe é **DEFESA PERFEITA**: não perde vida e o rival fica desequilibrado. Acertar quem está preparando um golpe é **CONTRA-ATAQUE** (mais dano).
- **Peso nos golpes:** antecipação antes de cada ataque, pausa de impacto proporcional à força, empurrão (knockback), reação diferente se pega na cabeça, no corpo ou nas pernas, recuperação no fim, preparação do pulo e aterrissagem.
- **Efeitos:** faíscas, anel de impacto, poeira, fumaça, estrelas, confete, linhas de velocidade, rastro de silhueta nos dashes e investidas, tremor de tela moderado, zoom e câmera lenta no nocaute.

## ⚡ SUPER e Ultimate

A **barra de energia** enche batendo, defendendo, apanhando e provocando. Ela tem dois níveis:

- **Meia barra = SUPERPOWER:** o botão SUPER solta a habilidade especial do personagem.
- **Barra cheia = ULTIMATE:** a tela congela, a câmera dá zoom e começa uma **cinemática** exclusiva. Dá para escapar pulando ou defendendo na hora certa.

O botão SUPER (tecla **J**, ou o botão grande na tela do celular) mostra a carga num anel, brilha quando dá para usar, fica dourado no Ultimate e treme e faz "bzz" quando não há energia. Cada especial tem **recarga** (os quadradinhos ao lado do nome). Ao soltar o Superpower, o retrato do lutador cruza a tela com o nome do golpe. A **Censura Suprema** do Xandão cala o rival: tarja preta e mosaico no rosto, falas viram ####, o nome no placar vira CENSURADO e ele fica sem especiais por 5 segundos.

| Lutador | Especiais (Especial + direção) | SUPERPOWER | ULTIMATE |
|---|---|---|---|
| **Lula** | Discurso do Planalto · Picanha Gigante · Faz o L! · Bolsa Família · Picanha Voadora | Picanha na Brasa | **Picanha Suprema** |
| **Bolsonaro** | Fuzil Cartunesco · Motociata · Talquei? · Operação Cloroquina · Vai Virar Jacaré! | Rajada do Capitão | **Operação Presidencial** |
| **Xandão** | Inquérito! · Conta Bloqueada · Martelo da Justiça · Canetada do STF · Suspensão de Conta | Censura Suprema | **Decisão Monocrática** |
| **Trump** | Presidential Speech · Hair Attack · You're Fired! · Make America Dance Again · Boné MAGA! | Bombardeio Presidencial | **YMCA Presidential Show** |
| **Eduarda** | Corte Viral! · Microfone Explosivo · Lacração Reversa · Debate Infinito · 1,9 Milhão de Votos | Polêmica nas Redes | **Treta Nacional** |
| **Erika** | PEC 6x1 · Vida Além do Trabalho · Não Me Calarão! · Abaixo-Assinado · Representação! | Fim da Escala 6x1 | **PEC Aprovada** |
| **Pavanato** | Tá Gravando? · Visita Surpresa na USP · Mais Votado da História! · Frente Antiwoke · Treta no Aeroporto | 3 Milhões de Votos | **Presidente?!** |
| **Nikolas** | O Vídeo do Pix · Caminhada até Brasília · Mais Votado do Brasil! · Revoga! · Story de 1 Minuto | 300 Milhões de Views | **Caminhada!** |
| **Flávio** | Bombom Lavado · Rachadinha! · Cadê o Queiroz? · Mansão de R$ 6 Mi · Carta (Versão 3) | TariFlávio | **Saiu Escondido!** |

<table>
  <tr>
    <td width="50%"><img src="docs/ultimate_trump.png" alt="Ultimate do Trump: palco com holofotes, as letras Y M C A em neon e Trump dançando"></td>
    <td width="50%"><img src="docs/ultimate_lula.png" alt="Ultimate do Lula: churrasqueira gigante e uma picanha enorme caindo do céu em cima do rival"></td>
  </tr>
  <tr>
    <td><img src="docs/danca.png" alt="Make America Dance Again: Trump faz as letras com os braços, o tronco e as pernas"></td>
    <td><img src="docs/cabelo.png" alt="Hair Attack: o topete do Trump vira um chicote loiro"></td>
  </tr>
</table>

## 🧑‍🎤 Lutadores

- **Rosto da foto em pixel art** (`ferramentas/cabeca_pixel.py`) com 8 expressões redesenhadas em cada quadro: neutro, piscar, esforço, grito, dor, nocaute, feliz e derrota. A Eduarda segue a caricatura do boneco abridor de garrafas: cabelo escuro liso, óculos transparentes e a risada escancarada.
- **Erika Hilton** (deputada federal, PSOL-SP): sátira do papel público dela, a PEC pelo fim da escala 6x1 (44 h para 36 h, movimento Vida Além do Trabalho), os abaixo-assinados e as representações. Vestido-blazer preto sem manga, escarpim e pulseira dourada; a Ultimate é a votação no plenário com o painel enchendo de SIM.
- **Lucas Pavanato** (PL-SP, vereador mais votado da história de SP e deputado federal com ~3 milhões de votos): blazer azul-marinho aberto sobre a camiseta preta "ANTI WOKE", tênis e celular sempre gravando. A Frente Antiwoke é um muro de escudos que apaga projéteis; a Ultimate é a "posse" com a bandeira, flashes e o contador de votos disparando.
- **Nikolas Ferreira** (PL-MG, deputado federal mais votado do Brasil em 2022): terno azul-marinho e gravata, bandeira do Brasil no mastro. O vídeo do Pix vira um losango girando, a Caminhada até Brasília é uma marcha com armadura e 4 acertos, e o "Revoga!" derruba um carimbo gigante. Na Ultimate, a estrada BR-040 na chuva com a placa contando de 240 km até "CHEGAMOS!".
- **Flávio Bolsonaro** (PL-RJ, senador, candidato derrotado no 2º turno de 2026): terno azul-marinho com a faixa verde e amarela e o brasão dourado; cabeça feita do retrato oficial do Senado (Agência Senado, Wikimedia Commons). O bombom da lojinha voa deixando bolhas de sabão, a Rachadinha avança com o envelope, a mansão sobe com a piscina que deixa lento, a carta sai em 3 versões e o TariFlávio faz chover caixotes de 50%. Na Ultimate, o aeroporto à noite com o voo para Miami, a lupa do "CADÊ O FLÁVIO?" e "SAIU ESCONDIDO!". As piadas são sobre fatos públicos e investigações noticiadas, não condenações.
- **Tela de seleção nova:** grade 4 colunas só com retratos (fundo e faixa na cor de cada lutador), última linha centralizada, "?" para quem ainda vai entrar, e o confronto escrito embaixo do VS.
- **Efeitos de poder na cor de cada lutador:** brilho e faíscas no início de cada especial, rastro nos projéteis, faíscas dos especiais puxando para a cor de quem bate e borda pulsando no chão das zonas.
- **Cabeça independente:** atrasa em relação ao corpo, recua no golpe, balança andando, pisca sozinha.
- **Roupa com movimento:** gravata, toga e aba do paletó balançam; o topete do Trump mexe com o vento.
- **Proporções e silhueta próprias**, jeito de ficar parado, provocação, vitória e derrota de cada um (a vitória do Trump é a dança).

Em breve: Flávio Bolsonaro, Milei e Janones.

## 🏟️ Arenas

| Arena | O que tem |
|---|---|
| **Praça dos Três Poderes** | Congresso no pôr do sol, o pato amarelo inflável, a van da TV Treta e a plateia com cartazes |
| **USP** | Torre do Relógio, prédio brutalista com faixa de greve, estudantes passando, manifestação de camiseta vermelha com estrela, bandeiras LGBT e da Palestina, cartaz "RECUA, FASCISTA, RECUA!" e sinalizador de fumaça |
| **Avenida Paulista** | MASP, antenas, prédios acesos, trânsito, manifestantes dos dois lados (vermelho e verde-amarelo), polícia no meio, imprensa com flash e um empurra-empurra de desenho animado |
| **Casa Branca** | fachada com o pórtico, bandeiras, agentes de terno e óculos escuros, limusine, holofotes e helicóptero passando |

A plateia pula mais quando a luta esquenta.

<table>
  <tr>
    <td width="50%"><img src="docs/usp.png" alt="Luta na USP com a Torre do Relógio e a manifestação de estudantes"></td>
    <td width="50%"><img src="docs/casa_branca.png" alt="Luta na Casa Branca com os agentes de segurança e a limusine"></td>
  </tr>
</table>

## 🔊 Áudio

Tudo **original e sintetizado** (`ferramentas/sons.py`): 45 efeitos (socos, chutes, impactos, defesa, poderes, churrasqueira, moto, caça, martelo, notificação, menus), **vozes caricatas** curtas de cada lutador (grunhidos sintéticos, sem imitar a voz de ninguém) e 6 músicas chiptune em loop, uma por arena. Nenhuma gravação ou música protegida.

## 🕹️ Controles

| | Jogador 1 | Jogador 2 |
|---|---|---|
| Andar / pular / agachar | A D / W / S | setas |
| Soco · Chute | F · G | `,` · `.` (ou 1 · 2 do numérico) |
| Especial | H | `/` (ou 3) |
| **SUPER** | **J** | **K** (ou 5) |
| Agarrar | T | L (ou 6) |
| Provocar | R | `;` (ou 4) |
| Pausa | Esc ou P | |

Controle: direcional, X soco, A chute, B especial, Y provocar, **RB super**, LB agarrar.

**Celular e tablet:** direcional à esquerda; SOCO, CHUTE, ESPECIAL, AGARRA e o botão **SUPER** grande à direita; pausa no meio da tela. Aceita vários dedos ao mesmo tempo. No primeiro toque o jogo entra em **tela cheia** e trava na horizontal (no iPhone o Safari não permite tela cheia; use "Adicionar à Tela de Início").

## 🖼️ Telas

<table>
  <tr>
    <td width="50%"><img src="docs/titulo.png" alt="Menu inicial com o logo, os botões PLAY, MULTIPLAYER, ARCADE MODE, TRAINING, CHARACTERS e SETTINGS e dois lutadores em pose de luta"></td>
    <td width="50%"><img src="docs/selecao.png" alt="Seleção de lutadores com retratos, atributos e o Superpower e o Ultimate de cada lado"></td>
  </tr>
  <tr>
    <td><img src="docs/arenas.png" alt="Escolha da arena com as quatro miniaturas"></td>
    <td><img src="docs/lutadores.png" alt="Ficha do Trump com biografia e a lista de golpes"></td>
  </tr>
</table>

## 🎨 Visual 16 bits

Não há imagens prontas além das cabeças: tudo é desenhado em código. O jogo pensa em 1280×720 e desenha numa tela de **480×270** ampliada sem suavização, com contorno escuro, sombreado, céu pontilhado (dithering) e a fonte pixelada **Press Start 2P** (OFL, em `fontes/`). Para rodar bem em aparelhos modestos, cenário, plateia e controles de toque viram textura (atualizada só quando muda) e cada lutador é enviado à placa de vídeo num único lote de triângulos (`scripts/lote.gd`): a luta inteira cabe em ~35–55 chamadas de desenho por quadro.

Detalhes de acabamento: punhos fechados com nós dos dedos e polegar, sombra embaixo das mangas e atrás das pernas, sapatos com sola e salto, dobras do tecido, dragonas e condecorações na farda, lenço no bolso dos paletós e as estrelas na camisa da seleção. Na movimentação, a caminhada acelera e freia (patch da Manus), os punhos acompanham o corpo com atraso, os passos e as freadas levantam poeira e o golpe acerta com um clarão branco. Nos efeitos, cada impacto tem um estalo de quadrinho com riscos, os tiros têm clarão no cano e as explosões viram bola de fogo com estilhaços e onda de choque no chão. No HUD, as barras de vida são inclinadas, com rastro vermelho do dano, marcas a cada 10%, retrato do lutador (que muda de expressão quando apanha), medalhas de round, placa do relógio e a barra de energia com brilho correndo e dois losangos de Super. HUD e partículas também saem em lote.

## ▶️ Como rodar

1. Instale o [Godot 4.3](https://godotengine.org/download/archive/4.3-stable/).
2. Abra o Godot, clique em **Importar** e escolha o `project.godot` desta pasta.
3. Aperte **F5**.

## 🧪 Testes

```bash
godot --headless --path . --script res://tests/mecanica.gd
godot --headless --fixed-fps 60 --path . --script res://tests/simular.gd
```

- `mecanica.gd` (50 verificações): golpes fortes, defesa alta e baixa, defesa perfeita, contra-ataque, dash, comandos, recarga, SUPER sem energia, Superpower, Ultimate, agarrão, Bloqueio Supremo e todas as habilidades de todos os lutadores.
- `simular.gd`: 10 partidas CPU x CPU com todos os lutadores até o fim.
- `capturas.gd`: capturas de todas as telas, golpes e ultimates (precisa de tela, por exemplo com `xvfb-run`).
- `cpu.gd`: custo de CPU por quadro de uma luta.

## 📁 Estrutura

```text
treta-em-brasilia/
├── scripts/
│   ├── main.gd          # modos de jogo e transições entre telas
│   ├── telas.gd         # título, seleção, arena, lutadores, configurações, VS, resultado
│   ├── luta.gd          # rounds, colisões, câmera, HUD, cinemática, treino, pausa
│   ├── lutador.gd       # movimento, golpes quadro a quadro, defesa, agarrão, habilidades
│   ├── personagens.gd   # elenco e habilidades (dados)
│   ├── poses.gd         # poses das habilidades e a dança
│   ├── desenho.gd       # corpo, rosto, roupas, texto pixelado, Praça dos Três Poderes
│   ├── arte.gd          # objetos, projéteis, zonas, caça, churrasqueira
│   ├── cenarios.gd      # USP, Avenida Paulista, Casa Branca
│   ├── cinematica.gd    # ultimates
│   ├── particulas.gd · projetil.gd · zona.gd
│   ├── ia.gd            # CPU
│   ├── toque.gd         # controles de toque
│   ├── som.gd · config.gd · controles.gd · entrada_humana.gd · camada.gd
├── audio/               # sfx, vozes e músicas (gerados por ferramentas/sons.py)
├── sprites/             # cabeças e retratos em pixel art (gerados das fotos)
├── ferramentas/         # cabeca_pixel.py, rostos.py, sons.py
├── fontes/ · tests/ · docs/
```

## 🛣️ Próximos passos

- Multiplayer online com código de sala (hoje o multiplayer é no mesmo aparelho).
- Os próximos lutadores: Flávio, Milei, Pavanato e Janones.
