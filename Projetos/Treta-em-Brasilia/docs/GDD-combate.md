# BRASÍLIA KOMBAT · GDD do Sistema de Combate

> [!NOTE]
> Este é o documento de planejamento da versão 1. A versão 2 (a que está no jogo) refez o combate e as habilidades a partir dele: veja o README e `scripts/personagens.gd`, que guarda os golpes como dados (tempos, dano, recarga, custo de barra).

> Documento de design (sem código). Sátira política claramente fictícia: os golpes exageram referências públicas, declarações conhecidas e memes. Nenhuma característica pessoal ou acusação é inventada.

**Versão:** 1.0 · **Personagens:** Lula, Bolsonaro, Trump, Xandão (Alexandre de Moraes), Eduarda Campopiano · **Plataforma:** navegador (computador, tablet e celular), contra a CPU ou online.

---

## 0. Convenções

| Item | Como ler |
|---|---|
| **Dano** | Escala de 1 a 100, em **% da barra de vida** do rival. Um soco fraco tira 4; um ultimate, entre 28 e 35. |
| **Tempo** | O jogo roda a 60 quadros por segundo: 60 quadros = 1 s. Duração = início + ativo + recuperação. |
| **Alcance** | Curto (até 1 corpo), médio (até 2 corpos), longo (até meia tela), tela (a tela toda). |
| **Recarga** | Tempo até poder usar de novo. Golpes sem recarga são limitados pela recuperação e pela barra. |
| **Defesa** | *Alta/média*: defende em pé ou agachado. *Baixa*: só agachado. *Aérea*: só em pé. *Indefensável*: precisa esquivar (pular ou sair do alcance). |
| **Barra de Super** | 3 níveis (0 a 300). Golpes, defesas e provocações enchem. O ultimate gasta 300. |

### Comandos padrão (todos os personagens)

| Ação | Teclado (P1) | Teclado (P2) | Controle | Touch (celular/tablet) |
|---|---|---|---|---|
| Andar / pular / agachar | A D / W / S | setas | direcional ou analógico | joystick virtual à esquerda |
| Soco (fraco) | F | 1 (num) ou `,` | X / Quadrado | botão **S** |
| Chute (forte) | G | 2 (num) ou `.` | A / X | botão **C** |
| Especial | H | 3 (num) ou `;` | B / Bola | botão **★** |
| Provocar | R | 4 (num) ou `/` | Y / Triângulo | botão **😏** |
| **Especial 1** | Especial parado, ou ↓↘→ + Soco | idem | idem | ★ sem direção |
| **Especial 2** | Trás + Especial, ou ↓↙← + Soco | idem | idem | ★ com joystick para trás |
| **Especial 3** | Frente + Especial, ou →↓↘ + Soco | idem | idem | ★ com joystick para a frente |
| **Ultimate** | ↓ + Especial com a barra cheia, ou ↓↘→ ↓↘→ + Soco | idem | idem | segurar ★ por 1 s com a barra cheia (o botão brilha) |
| **Combo básico** | Soco, Soco, Chute (enquanto acerta) | idem | idem | S, S, C |

Regras gerais que valem para todos:
- **Cancelamento:** soco ou chute que acerta pode ser cancelado em qualquer especial (é o que liga os combos).
- **Recarga** aparece como um ícone em volta da barra de super; especial em recarga não sai (a mão do personagem pisca).
- **Esquiva:** pulo para trás tem 4 quadros de invencibilidade a golpes baixos.
- Contra a CPU e online o sistema é o mesmo: tudo é decidido pelos comandos de cada quadro, então as duas telas veem a mesma luta.

---

## 1. LULA · "O Churrasqueiro"

**Estilo:** resistência e controle de espaço. Aguenta mais tempo na luta, recupera vida, mas é lento para entrar. **Referências:** a promessa da picanha, o churrasco com cerveja, os discursos, o "Faz o L".

**Visual:** terno azul-marinho com a faixa presidencial; barba e cabelo brancos; gesticula muito com a mão da frente quando parado (como num palanque). Corpo mais baixo e robusto, com barriga.

| # | Golpe | Referência | Tipo | Funcionamento |
|---|---|---|---|---|
| Básico | **Discurso em 3 Atos** | discursos longos | ofensivo | Soco, Soco, Chute. O último golpe é **"Nunca Antes Neste País!"**: um tapa de palanque que derruba. |
| E1 | **Picanha Voadora** | "a picanha voltou" | ofensivo | Arremessa uma picanha em arco que quica uma vez no chão. Pega rivais agachados no quique. |
| E2 | **Churrasco do Companheiro** | churrasco e cerveja | defensivo / cura | Monta uma churrasqueira no lugar: por 3 s recupera vida aos poucos enquanto não apanha. A fumaça na frente dele **apaga projéteis**. Se apanhar, a churrasqueira tomba e a cura para. |
| E3 | **Picanha Gigante** | a picanha como símbolo | ofensivo pesado | Saca uma picanha do tamanho de um remo e dá uma pancada em arco. Aguenta 1 golpe sem ser interrompido na subida (armadura). Derruba. |
| Ultimate | **O Churrascão do Povo** | o churrasco prometido | especial | A tela escurece, acende uma churrasqueira gigante atrás. Lula serve 5 espetos de picanha no rival (5 golpes) e fecha com uma "cerveja estourando" que lança o rival. Recupera 10% de vida. |
| Taunt | **Faz o L** | o gesto de campanha | especial | Faz o "L" com a mão e pisca para a plateia. +30 de barra; 40 quadros vulnerável. |
| Vitória | **O Amor Venceu** | frase de campanha | — | Ergue uma picanha como troféu; confete verde e amarelo; plateia canta "olê olê". |
| Derrota | **E a Picanha?** | — | — | Senta no chão, a churrasqueira apaga, olha o espeto vazio. |

| Golpe | Dano | Recarga | Alcance | Duração (quadros) | Defesa / esquiva | Efeito visual | Som |
|---|---|---|---|---|---|---|---|
| Discurso (3 golpes) | 4 + 4 + 9 | — | curto | 4+3+9 / 4+3+12 / 7+5+24 | alta/média | brilho de microfone no último | "Companheiro!" |
| Picanha Voadora | 9 | 1,5 s | longo | 14+…+22 | média; pular por cima | rastro de fumaça, quique com faísca | chiado de grelha |
| Churrasco | cura 8% em 3 s | 12 s | próprio lugar | 20 montar + 180 | interrompível por golpe | churrasqueira, fumaça que some projéteis | carvão estalando |
| Picanha Gigante | 16 | 6 s | médio | 12+6+28 | média; armadura de 1 golpe | arco de carne, osso brilhando | "TÓIN" de pancada |
| Churrascão | 32 + cura 10% | barra cheia | curto → tela | 30 congela + 150 | indefensável depois do primeiro espeto (o primeiro pode ser defendido: se defender, nada acontece) | churrasqueira gigante, espetos, lata de cerveja estourando | "Faz o L!" + estouro de lata |
| Faz o L | — | — | — | 40 | vulnerável | "L" luminoso na mão | coro "L!" |

**Pontos fracos:** é o mais lento a andar e a pular alto; a churrasqueira o deixa parado.

---

## 2. BOLSONARO · "O Capitão"

**Estilo:** pressão e investidas com armadura. Entra rápido e aguenta golpes, mas fica exposto se errar. **Referências:** passado militar, motociatas, "Talquei?", "Tá OK?", "E daí?", os debates sobre vacinas ("vai virar jacaré").

**Visual:** jaqueta verde-oliva com insígnias de brinquedo por cima da camisa amarela da seleção; boina militar nas habilidades; postura reta, ombros para trás. Corpo alto e magro.

| # | Golpe | Referência | Tipo | Funcionamento |
|---|---|---|---|---|
| Básico | **Ordem Unida** | marcha militar | ofensivo | Soco, Soco, Chute. O último é **"Talquei?"**: um chute em continência que derruba. |
| E1 | **Motociata** | as motociatas | ofensivo | Investida montado numa moto: atravessa projéteis e termina numa derrapagem que joga poeira. Se errar, a moto cai e ele fica 20 quadros exposto. |
| E2 | **Escudo de Choque** | o universo militar (cartunesco) | defensivo | Levanta um escudo de choque de brinquedo por 1,5 s: absorve até 2 golpes ou projéteis. Apertar Soco com o escudo levantado faz um contragolpe. |
| E3 | **Seringa Gigante** | "vai virar jacaré" | controle | Estocada com uma seringa gigante. Se acertar, o rival **vira jacaré por 3 s**: ganha rabo verde, anda 30% mais devagar e pula mais baixo. |
| Ultimate | **Desfile de 7 de Setembro** | desfiles e motociatas | especial | Tela vira um desfile: tanques de papelão, motos e paraquedistas de brinquedo cruzam a tela atropelando o rival (6 golpes). Fecha com letreiro "IMBROCHÁVEL!" piscando. |
| Taunt | **Continência do Talquei** | "Talquei?" | especial | Bate continência, ajeita a boina e solta "Talquei?". +30 de barra. |
| Vitória | **Tá OK!** | "Tá OK?" | — | Motociata de comemoração em volta do rival caído; acena com joinha. |
| Derrota | **E Daí?** | "E daí?" | — | Dá de ombros, coloca os óculos escuros e sai andando de lado. |

| Golpe | Dano | Recarga | Alcance | Duração (quadros) | Defesa / esquiva | Efeito visual | Som |
|---|---|---|---|---|---|---|---|
| Ordem Unida | 4 + 4 + 10 | — | curto | 4+3+9 / 4+3+12 / 7+5+24 | alta/média | poeira de marcha | "Um, dois!" |
| Motociata | 13 | 4 s | longo | 9+20+18 | média; pular por cima | escapamento, poeira, bandeirinha | ronco de moto |
| Escudo de Choque | contragolpe 8 | 10 s | curto | 6+90 | — | escudo com reflexo, faísca ao bloquear | "CLANG" |
| Seringa Gigante | 10 + jacaré 3 s | 8 s | médio | 10+5+20 | média | seringa verde, rabo de jacaré no rival | "PLIM" + rugido de jacaré |
| Desfile | 34 | barra cheia | tela | 30 + 160 | só esquiva: pular sobre o primeiro tanque cancela o resto | tanques de papelão, paraquedas, confete | corneta militar + "IMBROCHÁVEL!" |
| Continência | — | — | — | 40 | vulnerável | boina girando | "Talquei?" |

**Pontos fracos:** pouca defesa contra golpes baixos depois de errar a Motociata; sem projétil de longo alcance.

---

## 3. DONALD TRUMP · "O Showman"

**Estilo:** dança e distância média. Desvia de projéteis dançando e controla o ritmo, mas apanha muito se pego de perto durante a dança. **Referências:** a dancinha dos comícios, o cabelo, "You're fired!", "Fake news!", o boné vermelho de campanha, o Air Force One, o tarifaço.

**Visual:** terno escuro, gravata vermelha comprida até abaixo da cintura, cabelo loiro que balança com atraso nos movimentos; gestos de mão (a "sanfona" e o dedo apontando) no idle. Corpo largo e alto.

| # | Golpe | Referência | Tipo | Funcionamento |
|---|---|---|---|---|
| Básico | **Discurso no Palanque** | comícios | ofensivo | Soco, Soco, Chute. O último é **"You're Fired!"**: um dedo na cara que empurra o rival para longe. |
| E1 | **Boné Bumerangue** | o boné de campanha | ofensivo | Arremessa o boné vermelho, que vai e **volta**: pode acertar duas vezes (na ida e na volta). |
| E2 | **A Dancinha** | a dancinha dos comícios | especial / defensivo | Entra no modo dança por 3 s: **desvia sozinho de todo projétil** (rebolando), cada passo empurra quem estiver colado e enche a barra. Golpe físico durante a dança causa **dano dobrado**. Pode sair antes apertando Especial. |
| E3 | **Air Force One** | o avião presidencial | ofensivo pesado | Sai da tela e o avião passa em rasante, de trás para a frente; Trump cai de paraquedas do outro lado. Pega o rival em qualquer ponto da tela no chão; pular esquiva. |
| Ultimate | **THE GREATEST DANCE EVER** | a dancinha | especial | Holofotes, palanque e telão. O rival é obrigado a dançar junto (sem controle) enquanto leva um golpe a cada batida (8 batidas). No fim, um placar de "audiência" sobe até "TREMENDOUS". |
| Taunt | **Fake News!** | "Fake news!" | especial | Aponta para a câmera e faz a "sanfona" com as mãos. +30 de barra. |
| Vitória | **Dancinha da Vitória** | — | — | Dança completa com chuva de bonés vermelhos. |
| Derrota | **RIGGED!** | "it's rigged" | — | Cruza os braços, aponta para o placar e grita "RIGGED!". |

| Golpe | Dano | Recarga | Alcance | Duração (quadros) | Defesa / esquiva | Efeito visual | Som |
|---|---|---|---|---|---|---|---|
| Discurso | 4 + 4 + 9 | — | curto | padrão | alta/média | dedo brilhando no último | "Wrong!" |
| Boné Bumerangue | 7 + 7 | 3 s | longo (vai e volta) | 12+…+20 | média; agachar na volta | boné girando com rastro vermelho | assobio |
| A Dancinha | empurrão 3 por passo | 14 s | curto | 180 | golpe físico pega (dano ×2) | holofote rosa, notas musicais | batida eletrônica 8-bit |
| Air Force One | 15 | 8 s | tela (no chão) | 20+30+40 | pular esquiva; defensável (média) | avião com sombra no chão, paraquedas | turbina + "Tremendous" |
| Greatest Dance Ever | 35 | barra cheia | tela | 30 + 170 | indefensável depois que a música começa; esquiva só nos 30 quadros iniciais (pular) | holofotes, telão, placar de audiência | música de comício em chiptune |
| Fake News! | — | — | — | 40 | vulnerável | jornal amassado voando | "Fake news!" |

**Pontos fracos:** dança arriscada de perto; golpes lentos de recuperar; corpo grande, fácil de acertar.

---

## 4. XANDÃO (Alexandre de Moraes) · "O Supremo"

**Estilo:** controle. Não ganha na força bruta: proíbe, trava e pune. **Referências:** o STF, decisões judiciais, ofícios, bloqueios de perfis e de redes sociais, o debate público sobre liberdade de expressão (satirizado como poder institucional exagerado).

**Visual:** careca brilhante, toga preta com cordões vermelhos que balança, sobrancelhas sempre franzidas, postura ereta com as mãos para trás. Corpo alto, silhueta de "capa" pela toga.

| # | Golpe | Referência | Tipo | Funcionamento |
|---|---|---|---|---|
| Básico | **Despacho em 3 Vias** | despachos | ofensivo | Soco, Soco, Chute. O último é **"Prisão Preventiva!"**: uma grade de papel cai sobre o rival e o derruba. |
| E1 | **Ofício Urgente** | ofícios judiciais | controle | Lança um ofício que voa devagar. Se acertar, **aumenta em 3 s a recarga** do próximo especial do rival. |
| E2 | **Zona de Bloqueio** | bloqueios de perfis e redes | controle | Carimba no chão uma área com a faixa "CONTA SUSPENSA" por 4 s. Rival dentro dela **não consegue usar especiais nem ultimate** (aparece um ícone de bloqueio sobre a cabeça). Golpes normais continuam. |
| E3 | **Martelo da Justiça** | o martelo do juiz | ofensivo pesado | Golpe de martelo de cima para baixo que **quebra a defesa** (rival defendendo fica atordoado 30 quadros). |
| Ultimate | **Decisão Monocrática** | decisões individuais | especial | Tribunal cinematográfico: Xandão lê uma sentença num pergaminho que desenrola até o chão. O rival fica preso numa moldura de "PERFIL SUSPENSO" (paralisado 2,5 s) enquanto o martelo bate 3 vezes. Termina com o carimbo "ARQUIVADO". |
| Taunt | **Está Sob Investigação** | — | especial | Põe a mão no queixo, encara o rival e anota algo num caderninho. +30 de barra. |
| Vitória | **Arquivado** | — | — | Carimba "ARQUIVADO" na testa do rival caído e bate o martelo. |
| Derrota | **Recorro** | — | — | O martelo quebra em dois; ele olha para o cabo e diz "Recorro.". |

| Golpe | Dano | Recarga | Alcance | Duração (quadros) | Defesa / esquiva | Efeito visual | Som |
|---|---|---|---|---|---|---|---|
| Despacho | 4 + 4 + 9 | — | curto | padrão | alta/média | grade de papel | carimbo |
| Ofício Urgente | 6 + recarga +3 s | 3 s | tela (lento) | 14+…+22 | média; pular | papel com selo vermelho | papel voando |
| Zona de Bloqueio | — | 15 s | médio (área de 2 corpos) | 16 + 240 | não se defende: sai da área | faixa amarela "CONTA SUSPENSA", ícone 🚫 | sirene curta |
| Martelo da Justiça | 14 | 6 s | curto | 14+4+26 | quebra defesa; esquiva pulando para trás | martelo dourado, ondas de choque | "PAM!" de martelo |
| Decisão Monocrática | 28 + paralisia | barra cheia | tela | 30 + 160 | indefensável; pular nos 20 quadros iniciais esquiva | pergaminho, moldura de perfil, carimbo | martelo ×3 + órgão de tribunal |
| Está Sob Investigação | — | — | — | 40 | vulnerável | caderninho, sobrancelha franzida | caneta riscando |

**Pontos fracos:** o menor dano direto do elenco; lento para andar; a Zona é inútil se o rival só usar golpes normais.

---

## 5. EDUARDA CAMPOPIANO · "A Debatedora"

**Estilo:** provocação e engajamento. Ganha barra rápido, irrita o rival e controla à distância com microfone e celular. **Referências públicas:** influencer política, deputada mais votada de SP em 2026, debates acalorados nas redes, cortes de vídeo e a postura pública contrária ao feminismo.

**Regra de tom:** a sátira é sobre a **própria postura dela** (a busca de engajamento com polêmica, o debate que nunca acaba, o corte fora de contexto). Mulheres e feministas **nunca** são alvo dos golpes; quando o tema aparece, a piada se volta contra ela (os golpes de polêmica podem "dar ruim" para ela mesma).

**Visual:** óculos de armação clara, cabelo em cuia com franja reta, dentes da frente caricatos, camisa da seleção com jeans, microfone de lapela e celular sempre na mão (filmando). Corpo menor e ágil.

| # | Golpe | Referência | Tipo | Funcionamento |
|---|---|---|---|---|
| Básico | **Thread em 3 Partes** | threads nas redes | ofensivo | Soco, Soco, Chute. O último é **"Direto de Praia Grande!"**: uma rasteira com o tripé do celular. |
| E1 | **Corte Fora de Contexto** | cortes de vídeo | controle | Filma o rival e solta um "corte": um quadro de vídeo voa até ele. Se acertar, o rival **fica travado 20 quadros** (o vídeo "pausa" a pessoa) e ela ganha barra. |
| E2 | **Debate de 3 Horas** | debates intermináveis | defensivo / controle | Liga o microfone e uma caixa de som: ondas de som empurram o rival para trás e **drenam a barra de super dele** enquanto ele estiver perto. Ela fica parada falando. |
| E3 | **Cartaz Polêmico** | polêmicas nas redes | ofensivo, com risco | Golpe forte com um cartaz "#POLÊMICA". Se acertar, derruba e dá muita barra. Se for **defendido, o cartaz vira contra ela**: aparece o selo "RATIO" e ela cai sentada (a polêmica "dando ruim"). |
| Ultimate | **Treta Viral** | engajamento | especial | A tela vira um feed de rede social: comentários, curtidas, notificações e "#TRETA" chovem sobre o rival (golpes em sequência); o contador de visualizações dispara até "1,9 MILHÃO" (os votos dela). |
| Taunt | **Selfie de Reação** | vídeos de reação | especial | Vira de costas para o rival e tira uma selfie com ele ao fundo. +40 de barra (mais que os outros), mas 50 quadros vulnerável. |
| Vitória | **Postei e Viralizou** | — | — | Filma o rival caído, posta, e o celular explode em notificações. |
| Derrota | **Fui Cancelada** | — | — | O celular apita "bateria 1%" e apaga; ela olha a tela preta, inconformada. |

| Golpe | Dano | Recarga | Alcance | Duração (quadros) | Defesa / esquiva | Efeito visual | Som |
|---|---|---|---|---|---|---|---|
| Thread | 4 + 3 + 8 | — | curto | padrão (mais rápido: −1 quadro em cada) | alta/média / último é baixo | balões de comentário | "ping" de notificação |
| Corte Fora de Contexto | 5 + trava 20 quadros | 4 s | longo | 12+…+20 | média; pular | moldura de vídeo, botão de play | "clique" de câmera |
| Debate de 3 Horas | 0 (empurra, drena 40 de barra) | 12 s | médio | 10 + 150 | não se defende: pular por cima e bater de perto | ondas de som, balões "MAS E O…" | microfonia + falatório acelerado |
| Cartaz Polêmico | 15 (ou ela cai, se defendido) | 7 s | médio | 10+5+26 | média; defender pune | cartaz "#POLÊMICA", selo "RATIO" | "TÁ PEGANDO FOGO" / buzina de erro |
| Treta Viral | 30 | barra cheia | tela | 30 + 150 | indefensável depois do primeiro comentário (o primeiro pode ser defendido) | feed, coraçõezinhos, contador de views | enxurrada de notificações |
| Selfie de Reação | — | — | — | 50 | vulnerável | flash de câmera | obturador |

**Pontos fracos:** a menor vida do elenco; o Cartaz Polêmico pune quem abusa; o Debate a deixa parada.

---

## 6. Animações por personagem

Todos têm o conjunto mínimo de 12 animações. O que muda de um para o outro:

| Animação | Lula | Bolsonaro | Trump | Xandão | Eduarda |
|---|---|---|---|---|---|
| Idle | respira fundo, gesticula como em discurso, pisca | postura reta, pequenos ajustes de ombro | mãos em "sanfona", cabelo balança | mãos para trás, olhar fixo, mão no queixo | balança o celular, olha a tela |
| Andar | passos curtos, barriga balança | marcha | passo largo, ombros abertos | passos lentos, toga ondula | passos rápidos |
| Pulo | pulo baixo, encolhe | salto de paraquedista | pulo largo, gravata voa | pulo alto, toga abre | pulo leve |
| Agachar | apoia a mão no joelho | posição de tiro (sem arma) | agacha resmungando | se encolhe na toga | se abaixa filmando |
| Golpe fraco | tapa de palanque | soco de continência | dedo apontado | tapa com o ofício | tapa com o celular |
| Golpe forte | chute de churrasco | coturno | chute "de golfe" | chute com a toga | chute com o tripé |
| Especial | ver seção do personagem | idem | idem | idem | idem |
| Reação a golpe | cabeça recua, barba balança | rosto franzido, boina cai | cabelo levanta | careca brilha com o impacto | óculos tortos, celular quase cai |
| Queda | rola e para sentado | cai em posição de sentido | cai de costas, cabelo abre | cai rígido como uma tábua | cai de lado, celular voa |
| Vitória | ergue a picanha | joinha na motociata | dancinha | carimba "ARQUIVADO" | posta a selfie |
| Derrota | olha o espeto vazio | "E daí?" e sai | "RIGGED!" | martelo quebra | bateria acaba |
| Provocação | Faz o L | Continência | Fake News! | Está Sob Investigação | Selfie de Reação |

**Rosto (todos):** neutro, piscar, esforço (dentes cerrados), grito, dor, nocaute (olhos em X com estrelas), feliz e derrota. O rosto troca a cada estado da luta e pisca sozinho no idle.

---

## 7. Tabela de balanceamento

| | Lula | Bolsonaro | Trump | Xandão | Eduarda |
|---|---|---|---|---|---|
| **Vida** | 1050 (alta) | 1000 | 1060 (alta) | 1000 | 950 (baixa) |
| **Dano** | ★★★★ | ★★★★ | ★★★★ | ★★★ | ★★★ |
| **Velocidade** | ★★ | ★★★★ | ★★★ | ★★ | ★★★★★ |
| **Defesa** | ★★★★ (cura, fumaça) | ★★★★ (escudo, armadura) | ★★ (dança arriscada) | ★★★ | ★★ |
| **Alcance** | ★★★★ (picanha em arco) | ★★★ (investida) | ★★★★★ (boné, avião) | ★★★★★ (ofício, zona) | ★★★★ (corte, debate) |
| **Controle** | ★★ | ★★★ (jacaré) | ★★★ (dança forçada) | ★★★★★ (bloqueio, paralisia) | ★★★★ (trava, drena barra) |
| **Dificuldade** | fácil | fácil | média | difícil | média |
| **Especialidade** | resistência e cura | pressão com armadura | desvio e ritmo | proibir e punir | provocar e ganhar barra |
| **Ponto fraco** | lento | exposto ao errar a moto | apanha dobrado dançando | pouco dano | pouca vida, cartaz pune |

**Regras de equilíbrio:**
- Nenhum golpe é invencível do começo ao fim: todo especial tem pelo menos 18 quadros de recuperação em que leva golpe.
- Todo ultimate tem uma janela de esquiva no começo (pulo) e custa a barra inteira.
- Efeitos de controle (jacaré, trava, bloqueio, paralisia) **não acumulam** no mesmo rival e têm 2 s de imunidade depois que acabam.
- Combos perdem força: cada golpe seguido tira 12% a menos (mínimo de 45%), então ninguém mata num combo só.
- Cura: no máximo 18% da vida por round.

---

## 8. Sons e efeitos (sugestões)

- **Trilha:** chiptune 16 bits com samba e funk de fundo; cada cenário com a sua.
- **Impacto:** três níveis de "tapa" (fraco, forte, especial) e um "crunch" no ultimate.
- **Locutor do round:** "ROUND 1… LUTE!", "K.O.!", "PERFECT!" (sem tomar dano), "TEMPO!".
- **Plateia:** grita mais alto quando a vida de alguém fica abaixo de 25%.
- **Memes em áudio:** as falas dos personagens (os áudios que você mandar) tocam ao escolher o lutador, no golpe final do combo, no ultimate, na vitória e às vezes nos especiais.
- **Efeitos visuais:** tela treme no golpe forte, congelamento de 34 quadros com fundo escuro no ultimate, faíscas amarelas no acerto e azuis na defesa, letreiros de meme que surgem e somem.

---

## 9. Interações especiais entre personagens

| Encontro | O que acontece |
|---|---|
| **Lula × Bolsonaro** | Diálogo de abertura: "Faz o L!" / "Talquei?". Se a Picanha Voadora acertar o Bolsonaro virado em jacaré, aparece "JACARÉ NA BRASA!" (dano normal, só o letreiro e o som mudam). |
| **Trump × Lula** | O Boné Bumerangue que acertar uma picanha no ar a "taxa": aparece "TARIFAÇO 50%" e a picanha cai pela metade do caminho. |
| **Trump × Bolsonaro** | Abertura com aperto de mão que vira cabo de guerra. Se os dois provocarem ao mesmo tempo, dançam juntos por 1 s (os dois ganham barra). |
| **Xandão × Bolsonaro** | A Motociata que entrar na Zona de Bloqueio é "apreendida": a moto some e aparece o reboque. |
| **Xandão × Eduarda** | O Corte Fora de Contexto que entrar na Zona de Bloqueio vira "VÍDEO REMOVIDO". |
| **Xandão × Trump** | A Dancinha dentro da Zona de Bloqueio para no meio: "DANÇA SUSPENSA". |
| **Eduarda × qualquer um** | A Selfie de Reação mostra o rival fazendo careta no "story" dela no canto da tela. |
| **Espelho (mesmo personagem)** | Abertura com os dois falando a mesma frase ao mesmo tempo; o letreiro diz "DEBATE INTERNO". |

---

## 10. Ordem de implementação sugerida

1. Sistema de recarga, barra em 3 níveis e o botão de Provocar (base para tudo).
2. Os três especiais de cada personagem, um personagem por vez, começando pelo Lula (mais simples) e terminando no Xandão (controle).
3. Efeitos de controle compartilhados: trava, lentidão (jacaré), bloqueio, paralisia, com a regra de imunidade.
4. Ultimates cinematográficos (cena própria por cima do cenário).
5. Interações especiais, sons, controles de toque e ajuste de balanceamento com partidas CPU × CPU (as 10 combinações de lutadores, 20 partidas cada).
