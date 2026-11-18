# Conferência de fatos · TikTok E Se, Hein? · 18 a 22/11/2026

Sabrina · pesquisa feita em 17/11/2026, relatório gravado em 18/11/2026 · pedido: conferir os 5 roteiros da Gabriela
(`agentes/relatorios/gabriela/2026-11-17-tiktok-18-a-22-nov.md`) antes de gravar a voz.

## Resumo

**Nenhum roteiro foi reprovado. Um sai como está (o do pulo) e quatro precisam de trocas pequenas antes da voz.** As
frases corrigidas estão prontas para colar e têm praticamente o mesmo tamanho das originais. O do **Sol vai ao ar hoje
(18/11)**: com as duas trocas abaixo, ele pode ser gravado.

| Dia | Roteiro | Veredito | Trocas obrigatórias | Palavras (antes → depois) |
|---|---|---|---|---|
| **Qua 18/11 (hoje)** | E se o Sol se apagasse agora? | **Aprovado com correções** | 2 frases + 1 rótulo | 90 → 90 |
| Qui 19/11 | E se você fosse a última pessoa do mundo? | **Aprovado com correções** | 2 trechos + 1 rótulo | 177 → 178 |
| Sex 20/11 | E se a Terra parasse de girar por um segundo? | **Aprovado com correções** | 1 frase | 92 → 90 |
| Sáb 21/11 | E se todas as pessoas do mundo pulassem ao mesmo tempo? | **Aprovado** | nenhuma (ver nota de contagem) | 93 → 93 |
| Dom 22/11 | E se você pulasse num buraco que atravessa a Terra? | **Aprovado com correções** | 2 frases | 178 → 178 |

**O mesmo tipo de erro da Lua apareceu três vezes.** Um número de divulgação ficou mais preciso do que a fonte (o
−18 °C do Sol). Um prazo ficou mais longo do que as fontes dizem (o "primeiro dia" com luz). E uma consequência de outro
cenário entrou na história (os oceanos cobrindo os continentes, que vale para uma parada permanente e não para "um
segundo"; a "Terra sem Sol", que vale para o Sol sumir e não para ele apagar).

**Como contei as palavras:** pelo mesmo critério do roteiro (sem as marcações entre colchetes, separando por espaço),
com o script `contar.py` no meu rascunho. Quatro contagens bateram com as da Gabriela. O do pulo tem **93** palavras,
não 90 (ver a seção dele).

**Níveis de certeza:** **confirmado** (fonte primária ou conta refeita), **provável** (fonte boa, mas de divulgação, ou
sem consenso fino) e **não confirmado** (fica fora do roteiro). Todas as fontes foram acessadas em **17/11/2026**.

---

## 1. Qua 18/11 · E se o Sol se apagasse agora? · prioridade 1 (vai ao ar hoje)

**Veredito: aprovado com correções.** Trocas:
1. a afirmação 3 ("um Sol que já não existe") mistura dois cenários e está errada para "apagar";
2. a afirmação 5 (−18 °C em uma semana) é um número de divulgação sem modelo, convertido e arredondado para mais
   preciso do que a fonte;
3. o rótulo "~ -18 °C" muda junto.

| # | Afirmação | Nível | Situação e fonte |
|---|---|---|---|
| 1 | "Você não ia perceber. Pelo menos por oito minutos." | Confirmado | A luz leva 8 min 19 s (conta abaixo). A Live Science (29/03/2026) cita Timothy Cronin, do MIT: "For at least 8 minutes, 20 seconds, no one would know the sun went missing". |
| 2 | "A luz do Sol leva uns oito minutos para chegar aqui." | Confirmado | Distância média de 149,598 milhões de km (NASA, Earth Fact Sheet) dividida pela velocidade da luz (299.792,458 km/s): 499 s, ou **8 min 19 s**. Ao longo do ano varia de 8 min 11 s a 8 min 27 s. "Uns oito minutos" está certo. |
| 3 | "Nesse tempo, a Terra seguiria girando em volta de um Sol que já não existe." | **Errado: trocar** | O roteiro fala do Sol **se apagar**. Se ele só para de brilhar, a massa continua lá, e a Terra segue em órbita **para sempre**, no escuro, não só por 8 minutos. "Um Sol que já não existe" é outro cenário (o Sol sumir). Nesse caso também vale a ideia dos 8 minutos, porque a gravidade viaja na velocidade da luz (LIGO/Virgo, GW170817). Só que esse não é o cenário do vídeo. A frase nova é certa nos dois cenários. |
| 4 | "Até a Lua, que só brilha com a luz do Sol." | Confirmado | A Lua reflete a luz do Sol. A NASA explica as fases pela parte iluminada pelo Sol (Moon Facts). Cronin, na Live Science: "The moon, which reflects the sun's light, would go completely dark". |
| 5 | "Em uma semana, a temperatura média do planeta cairia para uns dezoito graus negativos." | **Não confirmado: trocar** | Veja a análise logo abaixo. |

**Por que o −18 °C sai (afirmação 5):**
- **De onde parece vir.** A Popular Science (Holly Otterbein, edição de novembro de 2008, atualizada em 2021) diz
  "Within a week, the average global surface temperature would drop below 0°F". Isso é "**abaixo** de −17,8 °C", não
  "para uns −18 °C". A matéria não cita modelo nem especialista para esse número.
- **As outras fontes não batem.** Outras fontes de divulgação dão **0 °C** para a mesma semana (Vsauce e How It Works,
  que vi só no resumo da busca e por isso não uso como fonte). É o sinal de número redondo repetido de um lugar para
  outro.
- **O especialista mais recente diz outra coisa.** A Live Science (29/03/2026) traz um especialista com nome, Michael
  Summers (George Mason University). Ele fala em queda de uns 20 °C por dia no começo e em "almost the whole world
  into subfreezing temperatures within just two to three days". Lagoas congelariam em uma semana e lagos em semanas ou
  meses. Os oceanos durariam "many years, maybe decades".
- **Minha conta de ordem de grandeza.** A camada de cima do oceano (cerca de 50 m) guarda uns 2 × 10⁸ J/m² por grau.
  Perdendo de 240 a 400 W/m², ela esfria só de 0,7 a 1,2 °C por semana. Com 70% do planeta coberto de água, uma
  **média global** de −18 °C em uma semana é improvável. Os continentes, sim, esfriam rápido.
- **Conclusão.** A frase nova fala só do que as duas fontes e a física sustentam juntas: **continentes abaixo de zero
  em poucos dias, mar resistindo**. Nível da frase nova: **provável**.

**Ajuste opcional (não obrigatório):**
- **O que muda:** em "Depois, tudo apaga", as estrelas continuam no céu (Cronin: "distant stars in the sky would still
  be visible"). Se quiser precisão total, troque por "Depois, vira noite." (3 palavras, como a original).
- **Por que fica opcional:** como imagem poética, "tudo apaga" passa.

### Frases corrigidas, prontas para colar

| Onde | Original | Corrigida |
|---|---|---|
| Parágrafo 2 | Nesse tempo, a Terra seguiria girando em volta de um Sol que já não existe. (15 palavras) | **Nesse tempo, você ainda veria no céu a luz de um Sol que já apagou.** (15 palavras) |
| Parágrafo 4 | Em uma semana, a temperatura média do planeta cairia para uns dezoito graus negativos. (14 palavras) | **Em poucos dias, os continentes já estariam abaixo de zero. Só o mar resistiria.** (14 palavras) |
| Rótulo | ~ -18 °C | **ABAIXO DE 0 °C** |

**Recado para a Sofia:**
- A cena do parágrafo 2 não deve mostrar a Terra "soltando" do Sol.
- Se o Sol só apaga, ela continua em órbita.
- A imagem certa é o Sol ainda aceso no céu, com o cronômetro correndo.

**Roteiro completo corrigido** (90 palavras, cerca de 34,6 s de voz):

```text
[mysterious] E se o Sol se apagasse agora? Você não ia perceber. Pelo menos por oito minutos.

A luz do Sol leva uns oito minutos para chegar aqui. Nesse tempo, você ainda veria no céu a luz de um Sol que já apagou.

[calm] Depois, tudo apaga. Até a Lua, que só brilha com a luz do Sol.

Em poucos dias, os continentes já estariam abaixo de zero. Só o mar resistiria.

[curious] Se soubesse que eram os últimos oito minutos de luz, o que você ia fazer? Me conta aqui nos comentários.
```

**Legenda e gancho:**
- O gancho ("8 MINUTOS SEM SABER") está **confirmado**.
- A legenda ("você só ia descobrir oito minutos depois. E o que vem depois é pior") está **confirmada**.
- Nenhuma das duas precisa mudar.

---

## 2. Qui 19/11 · E se você fosse a última pessoa do mundo? · prioridade 2

**Veredito: aprovado com correções.** Trocas:
1. a afirmação 1 ("no primeiro dia, a luz ainda acende") é longa demais: as fontes falam em horas;
2. a afirmação 2 ("em poucos dias elas param") vai pelo mesmo caminho e muda junto;
3. o rótulo da cena das usinas muda de "POUCOS DIAS" para "POUCAS HORAS".

| # | Afirmação | Nível | Situação e fonte |
|---|---|---|---|
| 1 | "No primeiro dia, a luz ainda acende." | **Provável só para as primeiras horas: trocar** | Alan Weisman, autor de *The World Without Us* (2007), em entrevista à Scientific American (01/07/2007): "One of the first things that would happen is that the power would go off". A coluna da equipe de ciência do Straight Dope estima apagões espalhados em 4 a 6 horas, a rede instável em 12 horas e a maior parte dos EUA e do Canadá sem luz em 24 horas. Não achei estudo de engenharia sobre o cenário, então a fonte é de divulgação (por isso "provável"). Mas todas apontam para **horas**, não para um dia inteiro. |
| 2 | "Sem ninguém para cuidar delas, em poucos dias elas param, e as cidades se apagam, uma por uma." | **Provável com ajuste: trocar** | Mesmas fontes. As usinas a combustível começam a cair em horas. Hidrelétricas e painéis solares podem durar mais, o que combina com "vão parando" e "uma por uma". |
| 3 | "Os túneis do metrô dependem de bombas para tirar a água. Com as bombas desligadas, eles começam a alagar." | Confirmado | Weisman (Scientific American, 2007), sobre o metrô de Nova York: "the people who keep the subway going have to pump 13 million gallons of water away", e "Within 48 hours you're going to have a lot of flooding". O exemplo é de Nova York, mas a frase do roteiro é geral e cuidadosa ("começam a alagar"). |
| 4 | "A comida da geladeira estraga. O supermercado vira o seu estoque, mas a comida fresca dura pouco." | Confirmado | É senso comum. O USDA/FSIS orienta que comida perecível fica segura na geladeira sem energia por **só 4 horas**. As páginas do FSIS e da FoodSafety.gov bloquearam a leitura automática (erro 403), então vi esse dado só no trecho da busca. Isso não muda o veredito: a frase não traz número. |
| 5 | "Com os anos, o mato cresce nas rachaduras do asfalto." | Confirmado | Weisman (Scientific American, 2007): "those seeds would establish themselves in the cracks in the pavement. The cracks would widen". |
| 6 | "A chuva entra pelas janelas quebradas e vai estragando os prédios por dentro." | Confirmado | Weisman (Scientific American, 2007): "There's still just as much rainfall as ever on Manhattan", e "these structures were not designed to be waterlogged all the time". |
| 7 | "Pripyat, a cidade esvaziada depois do acidente de Chernobyl, em mil novecentos e oitenta e seis, está tomada por árvores." | Confirmado | World Nuclear Association: o acidente foi em 26/04/1986 e Pripyat foi esvaziada em 27/04/1986 (45 mil moradores). Laćan, McBride e De Witt (2015), *Urban Forestry & Urban Greening* 14(4):1068-1078, doi:10.1016/j.ufug.2015.09.009, mediram a floresta urbana regenerando na cidade (até 8.980 mudas de bordo por hectare) e preveem um mosaico de carvalhos, bordos, choupos e álamos. |

### Frases corrigidas, prontas para colar

| Onde | Original | Corrigida |
|---|---|---|
| Parágrafo 3 | No primeiro dia, a luz ainda acende. (7 palavras) | **Nas primeiras horas, a luz ainda acende.** (7 palavras) |
| Parágrafo 4 | …Sem ninguém para cuidar delas, em poucos dias elas param, e as cidades se apagam, uma por uma. | **…Sem ninguém para cuidar delas, em poucas horas elas vão parando, e as cidades se apagam, uma por uma.** (+1 palavra) |
| Rótulos | "DIA 1", "POUCOS DIAS" | **"DIA 1"** continua. Na cena das usinas, **"POUCAS HORAS"**. **"POUCOS DIAS"** passa para a cena do metrô e da geladeira (o metrô alaga em 36 a 48 h). |

**Roteiro completo corrigido** (178 palavras, cerca de 68,5 s de voz):

```text
[mysterious] E se você acordasse amanhã e fosse a última pessoa do mundo?

Você manda mensagem e ninguém responde. A rua está vazia. Nenhum carro, nenhuma voz... só o vento.

Nas primeiras horas, a luz ainda acende. Parece só um feriado muito estranho.

Mas as usinas de energia precisam de gente. Sem ninguém para cuidar delas, em poucas horas elas vão parando, e as cidades se apagam, uma por uma.

Os túneis do metrô dependem de bombas para tirar a água. Com as bombas desligadas, eles começam a alagar.

[calm] A comida da geladeira estraga. O supermercado vira o seu estoque, mas a comida fresca dura pouco.

Com os anos, o mato cresce nas rachaduras do asfalto. A chuva entra pelas janelas quebradas e vai estragando os prédios por dentro.

E dá para ver isso hoje. Pripyat, a cidade esvaziada depois do acidente de Chernobyl, em mil novecentos e oitenta e seis, está tomada por árvores.

[curious] E você? Qual seria a primeira coisa que você faria se acordasse sozinho no mundo? Me conta aqui nos comentários, que eu quero saber.
```

**Legenda:**
- Diz "no primeiro dia, depois de poucos dias e depois de anos". Pode ficar, porque descreve as etapas do vídeo e não
  afirma quando a luz cai.
- **Corte curto da próxima semana:** a frase das usinas entra já corrigida.

---

## 3. Sex 20/11 · E se a Terra parasse de girar por um segundo? · prioridade 3

**Veredito: aprovado com correções.** Troca:
- a afirmação 6 ("os oceanos passariam por cima da terra") vem de outro cenário. As fontes descrevem uma parada
  **permanente**. Numa parada de **um segundo**, o efeito no mar é uma onda gigante no litoral, não continentes
  cobertos.

**O que muda num segundo:**
- **Durante o segundo:** no Equador, o ar, o mar e você deslizam uns 465 m em relação ao chão.
- **Depois:** o chão volta a girar na mesma velocidade, e o movimento relativo para.
- **Resultado:** um golpe de vento de um segundo, com força parecida com a de uma explosão (pressão dinâmica de
  ½ · 1,2 · 465² ≈ 130 kPa, mais de uma atmosfera), e a água do mar empurrada centenas de metros contra a costa.
- **Conclusão:** "desastre" continua certo, mas o efeito no mar é o tsunami no litoral.

| # | Afirmação | Nível | Situação e fonte |
|---|---|---|---|
| 1 | "Só um segundo já seria um desastre." | Confirmado (conta própria) | O que causa o desastre é a parada brusca, não quanto tempo ela dura. Veja a conta acima. |
| 2 | "Na linha do Equador, que passa pelo Brasil, o chão gira a quase mil e setecentos quilômetros por hora." | Confirmado | Conta com os dados da NASA (Earth Fact Sheet): 2π × 6.378,137 km ÷ 23,9345 h (dia sideral) = **1.674 km/h**. A revista Astronomy (02/02/2026) dá 1.668 km/h. A linha do Equador cruza o Amapá (Macapá), o Pará, o Amazonas e Roraima; a página do IBGE bloqueou a leitura automática (403), mas o fato é de geografia escolar. "Quase mil e setecentos" e o rótulo "~1.670 KM/H" estão certos. |
| 3 | "Mais rápido que o som." | Confirmado | NASA Glenn: o som ao nível do mar, num dia padrão, viaja a "about 761 mph", ou **1.225 km/h**. 1.674 km/h é cerca de 1,37 vez isso. |
| 4 | "Se a Terra parasse de repente, você continuaria indo. O ar e o mar também." | Confirmado | Inércia. Astronomy (02/02/2026): a água e o ar mantêm a velocidade que tinham. |
| 5 | "O ar viraria um vento mais forte que qualquer furacão." | Confirmado | O recorde mundial de rajada reconhecido pela OMM é de **408 km/h** (113,2 m/s), na Ilha de Barrow, Austrália, em 10/04/1996, durante o ciclone Olivia. No Equador seriam 1.674 km/h, quatro vezes mais. Vale até cerca de 78° de latitude (lá a velocidade cai para uns 350 km/h), o que combina com o enigma dos polos. |
| 6 | "E os oceanos passariam por cima da terra." | **Forte demais: trocar** | A Astronomy fala em "inundating coastal and possibly even inner regions" numa parada **permanente**. Num segundo, o que se sustenta são ondas gigantes no litoral. A frase nova é **provável** (Astronomy mais a conta acima). |
| 7 | "Mas tem um lugar onde você quase não ia sentir nada." (resposta: os polos) | Confirmado | A velocidade do chão é 1.674 × cos(latitude): 146 km/h a 85°, 29 km/h a 89° e **zero no polo**. Astronomy: "at the poles, it is reduced to zero". |

### Frase corrigida, pronta para colar

| Onde | Original | Corrigida |
|---|---|---|
| Parágrafo 4 | E os oceanos passariam por cima da terra. (8 palavras) | **E ondas gigantes invadiriam o litoral.** (6 palavras) |

**Comentário fixado (ajuste opcional):**
- **Hoje:** "Resposta: nos polos. Lá o chão quase não gira, então a parada quase não seria sentida." Está certo.
- **Mais preciso:** "Resposta: nos polos. Lá o chão quase não gira, então, na hora da parada, quase nada seria sentido."
- **Por quê:** as ondas e o caos no ar podem chegar depois.

**Roteiro completo corrigido** (90 palavras, cerca de 34,6 s de voz):

```text
[mysterious] E se a Terra parasse de girar por um segundo? Só um segundo já seria um desastre.

Na linha do Equador, que passa pelo Brasil, o chão gira a quase mil e setecentos quilômetros por hora. Mais rápido que o som.

Se a Terra parasse de repente, você continuaria indo. O ar e o mar também.

[calm] O ar viraria um vento mais forte que qualquer furacão. E ondas gigantes invadiriam o litoral.

[curious] Mas tem um lugar onde você quase não ia sentir nada. Sabe qual? Me conta aqui nos comentários.
```

**Recado para a Sofia:**
- A cena dos oceanos deve mostrar uma onda batendo na costa, não um continente coberto de água.
- Não revelar os polos no vídeo, como já estava no briefing.

---

## 4. Sáb 21/11 · E se todas as pessoas do mundo pulassem ao mesmo tempo? · prioridade 4

**Veredito: aprovado.** As cinco afirmações estão certas. "Trilhões de vezes" e "menos que um átomo" são, na verdade,
modestos.

| # | Afirmação | Nível | Situação e fonte |
|---|---|---|---|
| 1 | "Mais de oito bilhões, no mesmo segundo." | Confirmado | ONU (World Population Prospects 2024, resumo em PDF): "up from **8.2 billion in 2024**". A ONU marcou os 8 bilhões em 15/11/2022 (página da ONU DESA, "World population to reach 8 billion on 15 November 2022"). |
| 2 | "Quando você pula, empurra o planeta para o lado contrário." | Confirmado | Terceira lei de Newton e conservação do momento. |
| 3 | "Só que a Terra tem trilhões de vezes mais massa que toda a humanidade." | Confirmado (conta própria) | Veja a conta logo abaixo da tabela. |
| 4 | "Então ela se moveria menos que a largura de um átomo." | Confirmado (conta própria) | Veja a conta logo abaixo da tabela. |
| 5 | "E, quando todo mundo caísse de volta, ela voltaria para o lugar." | Confirmado | O centro de massa do conjunto Terra mais pessoas não se move. Quando todos pousam, a Terra volta exatamente para onde estava. |

**As contas:**
- **Massa (afirmação 3).** A Terra tem 5,9722 × 10²⁴ kg (NASA). A humanidade tem cerca de 8,2 × 10⁹ pessoas × 50 a
  62 kg. O 62 kg é a média dos adultos (Walpole e outros, *BMC Public Health*, 2012, doi:10.1186/1471-2458-12-439). O
  50 kg é hipótese minha, para incluir as crianças. Isso dá de 4,1 a 5,1 × 10¹¹ kg. A razão fica entre **12 e 15
  trilhões de vezes**.
- **Recuo (afirmação 4).** Com o centro de massa de cada pessoa subindo de 0,3 a 0,5 m, a Terra recua
  m·h/M ≈ **2 a 4 × 10⁻¹⁴ m**. Um átomo de hidrogênio tem cerca de 1 × 10⁻¹⁰ m (duas vezes o raio de Bohr,
  5,29 × 10⁻¹¹ m, NIST/CODATA 2022). O recuo é uns **3 mil vezes menor que um átomo**.
- **Outra fonte.** O xkcd What If n.º 8 ("Everybody Jump") chega ao mesmo resultado: "pushed down by less than an
  atom's width".
- **Na vida real, é ainda menos.** Com as pessoas espalhadas pelo globo, parte dos empurrões se cancela. A frase
  continua certa.

**Nota de contagem (não é erro de fato):**
- O roteiro tem **93 palavras**, não 90 (18 + 29 + 23 + 9 + 14 por parágrafo). Dá cerca de 35,8 s de voz, uma palavra
  acima da faixa de 90 a 92.
- **Corte opcional** para voltar a 91: "E, quando todo mundo caísse ~~de volta~~, ela voltaria para o lugar."

**Rótulos:** "8 BILHÕES" e "TRILHÕES DE VEZES MAIS MASSA" estão **confirmados**. A legenda está **confirmada**.

---

## 5. Dom 22/11 · E se você pulasse num buraco que atravessa a Terra? · prioridade 5

**Veredito: aprovado com correções.** Trocas:
1. **Falta dizer que o túnel não tem ar.** Sem isso, a queda livre, as "dezenas de milhares de km/h" e os 40 minutos
   ficam errados. Com ar, você pararia de acelerar logo, como um paraquedista, e nunca chegaria ao outro lado. O
   roteiro só fala do ar no fim, quando a viagem já foi contada.
2. **A saída não fica "no meio" do Pacífico.** Fica na borda oeste do oceano, no Mar das Filipinas.

| # | Afirmação | Nível | Situação e fonte |
|---|---|---|---|
| 1 | "Pulando em São Paulo, você ia sair do outro lado do planeta, no meio do Oceano Pacífico, perto do Japão." | **"Perto do Japão" confirmado; "no meio" errado: trocar** | A antípoda de São Paulo (23,55° S, 46,63° O) é **23,55° N, 133,37° L**, no Mar das Filipinas, que faz parte do Pacífico. Pela minha conta, a terra mais próxima é Oki-Daitō, ilha do Japão, a uns 245 km. Minamidaitō fica a 335 km, Naha (Okinawa) a 645 km e Tóquio a 1.480 km. O Geodatos dá o mesmo ponto (23,548° N, 133,364° L) e Minamidaitō a 332 km. É mar aberto, na borda oeste do Pacífico, não no meio. |
| 2 | "Você ia acelerar sem parar, sem sentir o próprio peso, como um astronauta." | **Certo só sem ar: trocar** | Em queda livre no vácuo, você não sente o peso, como o astronauta em órbita. A aceleração dura até o centro: no modelo PREM, a gravidade até cresce um pouco, para 10,7 m/s², a 3.480 km do centro, e só zera no centro. Com ar, a resistência limita a velocidade. A troca põe "num túnel sem ar" logo no começo. |
| 3 | "No centro da Terra, onde faz um calor parecido com o da superfície do Sol" | Confirmado | ESRF (comunicado de 25/04/2013; Anzellini e outros, *Science* 340:464, 2013): perto do centro, cerca de **6.000 °C** (6.000 ± 500 °C no limite do núcleo interno). NASA (Sun Facts): a superfície do Sol, a fotosfera, tem cerca de **5.500 °C**. Os dois valores são parecidos. |
| 4 | "você passaria na velocidade máxima: dezenas de milhares de quilômetros por hora." | Confirmado (conta própria) | Com a Terra de densidade uniforme, v = √(gR) = **28.500 km/h**. Com a densidade real (modelo PREM, de Dziewonski e Anderson, 1981, integrado camada por camada), dá **35.700 km/h**. Nos dois casos, são "dezenas de milhares". |
| 5 | "a gravidade começa a puxar você de volta. Você vai freando, freando... e chega do outro lado parado, bem na borda." | Confirmado no caso ideal | Sem ar e sem atrito, a energia se conserva e você chega com velocidade zero na borda oposta. Veja a ressalva da rotação abaixo da tabela. |
| 6 | "Uns quarenta minutos depois de pular." | Confirmado | Klotz, *American Journal of Physics* 83:231 (2015), doi:10.1119/1.4898780 (arXiv:1308.1342): "**38 rather than 42 minutes**". Minha conta com o PREM deu **38,2 min**, e com a Terra uniforme, **42,2 min**. "Uns quarenta" e o rótulo "~40 MIN" estão certos. |
| 7 | "Sem ar no túnel, ia e voltava para sempre. Com ar, ia acabar parado no centro da Terra." | Confirmado | Sem perda de energia, a oscilação não para. Com ar, a oscilação vai amortecendo até você parar no ponto de equilíbrio, que é o centro. |
| 8 | "O buraco mais fundo já cavado tem pouco mais de doze quilômetros." | Confirmado | Poço superprofundo de Kola (SG-3), na Rússia: **12.262 m** em 1989. EarthDate, programa da Universidade do Texas em Austin: "the deepest point ever reached below Earth's surface". Existem poços mais **compridos** (inclinados, como o BD-04A, no Catar), mas não mais **fundos**. "Mais fundo" está certo. |
| 9 | "E a Terra tem quase treze mil de diâmetro." | Confirmado | NASA (Earth Fact Sheet): raio médio de 6.371 km, ou **12.742 km** de diâmetro (12.756 km no Equador). "Quase treze mil" e o rótulo "~12.700 KM" estão certos. |

**Ressalva da rotação (não exige troca):**
- **O que acontece.** Um túnel de São Paulo à antípoda não fica no eixo de rotação da Terra. Na vida real, o efeito
  Coriolis (até 2Ωv ≈ 1,4 m/s² na velocidade máxima) jogaria você contra a parede. Só um túnel de polo a polo evita
  isso.
- **Detalhe da saída.** A saída fica em alto-mar, então a boca do túnel estaria no fundo do oceano.
- **Por que não exige troca.** O vídeo já é um cenário ideal ("na vida real, não dá"), e as duas ressalvas não pedem
  mudança. Ficam aqui caso alguém pergunte nos comentários.

### Frases corrigidas, prontas para colar

| Onde | Original | Corrigida |
|---|---|---|
| Parágrafo 2 | …do outro lado do planeta, no meio do Oceano Pacífico, perto do Japão. (20 palavras) | **…do outro lado do planeta, em alto-mar no Oceano Pacífico, perto do Japão.** (20 palavras) |
| Parágrafo 3 | Primeiro, a queda. Você ia acelerar sem parar, sem sentir o próprio peso, como um astronauta. (16 palavras) | **Primeiro, a queda. Num túnel sem ar, você ia acelerar sem parar, flutuando como um astronauta.** (16 palavras) |

**Roteiro completo corrigido** (178 palavras, cerca de 68,5 s de voz):

```text
[mysterious] E se você pulasse num buraco que atravessa a Terra inteira, de um lado ao outro?

Pulando em São Paulo, você ia sair do outro lado do planeta, em alto-mar no Oceano Pacífico, perto do Japão.

[calm] Primeiro, a queda. Num túnel sem ar, você ia acelerar sem parar, flutuando como um astronauta.

No centro da Terra, onde faz um calor parecido com o da superfície do Sol, você passaria na velocidade máxima: dezenas de milhares de quilômetros por hora.

Depois disso, a gravidade começa a puxar você de volta. Você vai freando, freando... e chega do outro lado parado, bem na borda. Uns quarenta minutos depois de pular.

Se ninguém segurar você ali, você cai de novo. Sem ar no túnel, ia e voltava para sempre. Com ar, ia acabar parado no centro da Terra.

Na vida real, não dá. O buraco mais fundo já cavado tem pouco mais de doze quilômetros. E a Terra tem quase treze mil de diâmetro.

[curious] E você? Pularia nesse buraco, se tivesse alguém esperando do outro lado? Me conta aqui nos comentários.
```

**Legenda e outros pontos:**
- **Legenda:** está certa no cenário ideal. Opcional: "Pulando num buraco **sem ar** em São Paulo, você sairia no
  Oceano Pacífico, perto do Japão, uns 40 minutos depois."
- **Gancho:** "SAÍDA: PERTO DO JAPÃO" está **confirmado**.
- **Corte curto da próxima semana:** deve incluir a frase do "túnel sem ar".

---

## As contas, para quem quiser refazer

Os scripts estão no meu rascunho da sessão e não fazem parte do repositório:

- `contas.py`: tempo da luz, velocidade no Equador, pulo, antípoda e túnel uniforme;
- `prem.py`: túnel com o modelo PREM;
- `contar.py`: contagem de palavras.

| Conta | Entrada | Resultado |
|---|---|---|
| Luz do Sol | 149.597.871 km ÷ 299.792,458 km/s | 499 s = 8 min 19 s (8 min 11 s a 8 min 27 s no ano) |
| Velocidade no Equador | 40.075 km ÷ 23,9345 h | 1.674 km/h = 465 m/s |
| Som (15 °C) | NASA Glenn | 1.225 km/h; o Equador gira a 1,37 vez isso |
| Massa Terra ÷ humanidade | 5,9722 × 10²⁴ ÷ (8,2 × 10⁹ × 50 a 62 kg) | 1,2 a 1,5 × 10¹³ (12 a 15 trilhões) |
| Recuo da Terra no pulo | m · h ÷ M, com h de 0,3 a 0,5 m | 2 a 4 × 10⁻¹⁴ m (cerca de 1/3.000 de um átomo) |
| Antípoda de São Paulo | (23,55° S, 46,63° O) → (23,55° N, 133,37° L) | Mar das Filipinas; Oki-Daitō (Japão) a cerca de 245 km |
| Túnel, Terra uniforme | T = π√(R/g); v = √(gR) | 42,2 min; 28.500 km/h |
| Túnel, PREM | integração de g(r) camada por camada | 38,2 min; 35.700 km/h (Klotz 2015: 38 min) |
| Oceano sem Sol | 50 m × 4,1 MJ/m³K; perda de 240 a 400 W/m² | 0,7 a 1,2 °C por semana na camada de cima do mar |

## Fontes (todas acessadas em 17/11/2026)

- NASA, Earth Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
- NASA, Sun Facts: https://science.nasa.gov/sun/facts/
- NASA, Moon Facts: https://science.nasa.gov/moon/facts/
- NASA Glenn, Speed of Sound: https://www.grc.nasa.gov/WWW/k-12/BGP/sound.html
- Live Science, "What would happen to Earth if the sun suddenly vanished?" (29/03/2026; Timothy Cronin, MIT; Michael
  Summers, George Mason): https://www.livescience.com/planet-earth/what-would-happen-to-earth-if-the-sun-suddenly-vanished
- Popular Science, "If the sun went out, how long could life on Earth survive?" (Holly Otterbein, 2008, atualizada em
  2021): https://www.popsci.com/science/article/2013-07/if-sun-went-out-how-long-could-life-earth-survive/
- LIGO/Virgo/Fermi, GW170817 e GRB 170817A (velocidade da gravidade igual à da luz): https://arxiv.org/abs/1710.05834
  (vi só o trecho da busca; serve de apoio ao "Sol sumir", que saiu do roteiro)
- Scientific American, "An Earth Without People" (Steve Mirsky entrevista Alan Weisman, 01/07/2007):
  https://www.scientificamerican.com/article/an-earth-without-people/
- Straight Dope, "When the zombies take over, how long till the electricity fails?" (equipe de ciência, sem data):
  https://www.straightdope.com/columns/read/2165/when-the-zombies-take-over-how-long-till-the-electricity-fails
- World Nuclear Association, Chernobyl Accident 1986:
  https://world-nuclear.org/information-library/safety-and-security/safety-of-plants/chernobyl-accident
- Laćan, McBride e De Witt (2015), registro na FAO AGRIS: https://agris.fao.org/search/en/records/65de2e5c63b8185d9ca77757
- USDA/FSIS, Keep Your Food Safe During Emergencies (página bloqueou a leitura automática; usei só o trecho da busca):
  https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/emergencies/keep-your-food-safe-during-emergencies
- Astronomy, "What happens if Earth stops rotating?" (Edward Herrick-Gleason, 02/02/2026):
  https://www.astronomy.com/science/what-happens-if-earth-stops-rotating/
- OMM, recorde de rajada de vento: https://wmo.int/asu-map?map=Wind_028
- IBGE, Municípios do Hemisfério Norte (página bloqueou a leitura automática):
  https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/43205-municipios-do-hemisferio-norte.html
- ONU, World Population Prospects 2024, resumo (PDF lido):
  https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/files/documents/2024/Jul/wpp2024_summary_of_results_final_web.pdf
- ONU DESA, "World population to reach 8 billion on 15 November 2022":
  https://www.un.org/en/desa/world-population-reach-8-billion-15-november-2022
- Walpole e outros (2012), "The weight of nations", *BMC Public Health*: https://pmc.ncbi.nlm.nih.gov/articles/PMC3408371
- NIST/CODATA 2022, raio de Bohr: https://physics.nist.gov/cgi-bin/cuu/Value?bohrrada0
- xkcd What If n.º 8, "Everybody Jump": https://what-if.xkcd.com/8/
- Klotz (2015), "The Gravity Tunnel in a Non-Uniform Earth": https://arxiv.org/abs/1308.1342
- ESRF, "Earth's centre is 1000 degrees hotter than previously thought" (25/04/2013):
  https://www.esrf.fr/news/general/Earth-Center-Hotter
- EarthDate (Universidade do Texas em Austin), "Kola Superdeep": https://www.earthdate.org/episodes/kola-superdeep
- Geodatos, antípoda de São Paulo: https://www.geodatos.net/en/antipodes/brazil/sao-paulo (só o trecho da busca; a
  conta é minha)

## O que não foi conferido

- **As páginas do Notion.** Não abri nem escrevi o ok nelas, como você pediu. Conferi as afirmações do relatório da
  Gabriela. O plano previa o ok "escrito na página"; isso fica com você ou com a Gabriela.
- **As artes e os storyboards.** Ainda não existem. Os recados para a Sofia estão nas seções do Sol, da Terra e do
  buraco.
- **A rede elétrica sem gente.** Não achei estudo de engenharia sobre o cenário. As fontes são o Weisman e
  divulgação. Por isso, as frases novas falam em "primeiras horas" e "vão parando", sem número exato.
- **Páginas bloqueadas.** FSIS, FoodSafety.gov, IBGE e a página web da ONU recusaram a leitura automática (403). Nos
  casos em que o fato importava (a população), li o PDF da própria ONU.
