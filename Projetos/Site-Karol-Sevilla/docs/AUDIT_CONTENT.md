# Auditoria de conteúdo — precisão histórica e coerência narrativa

> Fase 4, auditoria cruzada. Responsável: Agente 1 (pesquisa). Data: 2026-10-16.
> Escopo: `index.html` (todo o conteúdo) e `assets/js/app.js`, `player.js`, `ui.js`. Os JS não têm dados de faixas próprios: o player lê tudo do HTML.
> Referência: `docs/RESEARCH_KAROL_SEVILLA.md` (versão verificada) e releitura das fontes ✓ (Infobae [33], Excélsior [35], UnoTV [4], Los Andes [5][75], La Hora [13], Apple Music [85]–[90], oEmbed do YouTube, API do Commons).
> O site não foi editado.

## O que foi conferido e está correto

- **Marcadores [n]:** o site cita 38 fontes, e todos os `href="#fonte-n"` têm destino na lista. Cada `<li>` usa `value="n"`, então o número exibido bate com o do dossiê. Não há fonte listada que não seja citada. Os títulos e URLs da lista conferem com o dossiê.
- **Âncoras internas:** todas existem. A única "ausente", `#i-...`, está num comentário HTML.
- **Créditos musicais:**
  - Compositores de "Mariposas" e "Más linda", faixas 9 e 3, durações, data 08/07/2026, selo Walt Disney Records e crédito "Elenco de Soy Luna, Disney & Karol Sevilla": tudo bate com a Apple Music [85].
  - Selos e anos dos singles batem com [27][31][87]–[90]: KIVA, TMBC, UMG México, Smash The House, Warner México.
- **Links:**
  - Todos os 64 links externos foram testados. Responderam 200, exceto:
    - Instagram e vídeos do YouTube: 429, limite de requisições do teste;
    - VíaPaís: 403, bloqueio a robôs.
  - Os vídeos do YouTube foram conferidos um a um por oEmbed; todos são do canal oficial ou de DisneyMusicLAVEVO.
  - Os links oficiais (YouTube, Instagram, TikTok @karolsevillaokay, X @karolsevilla, Facebook, Spotify e Apple Music) são os da página "About" do canal oficial [91].
- **Imagens:**
  - Autor, licença e arquivo dos 5 créditos batem com o Commons.
  - As proporções das cópias WebP batem com as dos originais, ou seja, não houve recorte: 0,851; 0,826; 0,717; 0,667; 0,667.
  - A imagem OG está declarada como adaptação, o que está correto.
  - As duas imagens CC BY-SA aparecem com a observação de que seguem sob a mesma licença.
- **Letras:** nenhuma letra de música reproduzida. Os trechos em espanhol são citações curtas de entrevistas, todas conferidas na fonte: *me comió el personaje*, *una amiga*, *imperfecta*, *sanador*.
- **Itens de "Precisa de validação":** nenhum aparece como certo. A origem de "Mariposas" em *Imperfecta*, o tema de "Más linda", o KCA 2018, *La Casa de los Famosos*, "Quiero volver" e "Juego de mentiras" não aparecem no site. Bom.
- **Etiquetas Fato / Nas palavras dela / Nossa leitura:** de modo geral, bem aplicadas. As lições e a conclusão estão marcadas como leitura nossa.

## Achados

| ID | Gravidade | Local (seção + trecho) | Problema | Correção exata proposta (texto substituto) |
|---|---|---|---|---|
| C1 | **Alta** | Capítulo 2, `#cap2-soy-luna`: "…estreou em março de 2016 no Disney Channel América Latina, com Karol, aos 15 anos, como Luna Valente. [8][33]" | **Erro factual.** Ela nasceu em 9/11/1999, então tinha **16 anos** em março de 2016. A Infobae [33] diz que ela tinha 15 anos quando **chegou à Argentina** (2015), não na estreia. O erro veio do dossiê, que já foi corrigido. | "<cite>Soy Luna</cite> estreou em março de 2016 no Disney Channel América Latina, com Karol como Luna Valente. [8] Ela tinha chegado à Argentina para gravar a série aos 15 anos. [33] A série teve três temporadas e 220 capítulos até 2018. [35]" |
| C2 | Média | Capítulo 1, `#cap1-primeiros-papeis`: "**Fato** Entre 2006 e 2008, ela estudou atuação no Centro de Educación Artística (CEA) da Televisa. … [1][96]" | **Fonte não sustenta o dado.** As Wikipedias [1][96] dizem só que ela estudou no CEA "na infância". Os anos 2006–2008 vêm só de uma biografia secundária ([2], que não está na lista do site). | "**Fato** Na infância, ela estudou atuação no Centro de Educación Artística (CEA) da Televisa. Estreou em novela em 2008, em <cite>Querida enemiga</cite>, como Gina. …" (resto igual) |
| C3 | Média | Capítulo 1, `#cap1-avo`: "Karol lembra, **rindo**, que fez o papel de uma árvore **no meio de centenas de crianças**." | **Detalhes acrescentados à fala dela.** A UnoTV [4] não diz que ela riu. A fonte só diz que ela foi "árvore 583", e "centenas de crianças" é dedução nossa. | "Karol lembra que, na gravação, fez o papel de uma árvore, a de número 583." |
| C4 | Média | Capítulo 3, segundo parágrafo: "A mãe a apoiou quando ela cancelou a primeira turnê solo, um dia antes do show." · Lição 2: "No começo da carreira solo, ela cancelou uma turnê quando percebeu que não estava bem." | **Incompleto e pode enganar.** Na Infobae [33], ela conta que cancelou um dia antes, mas que **depois a turnê foi feita**, "quando yo ya estuve un poco mejor". Dito só "cancelou", parece que a turnê nunca aconteceu. | Capítulo 3: "A mãe a apoiou quando ela cancelou a primeira turnê solo um dia antes do show; a turnê só aconteceu depois, quando ela já estava melhor." · Lição 2: "No começo da carreira solo, ela suspendeu uma turnê quando percebeu que não estava bem e só a retomou quando se sentiu melhor. Parar pode ser uma decisão responsável." |
| C5 | Baixa | Capítulo 2, `#cap2-teste`: "disse que sabia cantar e dançar, **o que era verdade**, e que sabia patinar, o que não era." | **Avaliação nossa dentro de um trecho "Nas palavras dela".** Na fonte [5], ela só diz que respondeu "sim". "O que era verdade" é juízo nosso. | "Ela também contou um detalhe do teste: disse que sabia cantar e dançar e que sabia patinar, mas nunca tinha subido em patins." |
| C6 | Baixa | Capítulo 3, `#cap3-depressao`: "…e resumiu que <q>me comió el personaje</q>." | **Citação cortada.** A frase original é "Un poco me comió el personaje" [33]. Sem o "un poco", a fala fica mais forte do que ela disse. | "…e resumiu que <q lang=\"es\">un poco me comió el personaje</q>." |
| C7 | Baixa | Universo musical, "Nossa leitura" de Mariposas: "…coescrito pela artista que contou ter **"se perdido"** depois da série." | **Aspas sugerem citação literal**, mas "se perdido" é uma paráfrase em português. Nas fontes ela fala em perder a identidade [33]. | "…coescrito pela artista que contou ter perdido a própria identidade depois da série." |
| C8 | Baixa | Universo musical, "Nossa leitura" final: "…dez anos depois da estreia, agora também como compositora." | **Impreciso.** Ela já compunha antes: "Miedo de sentir" (2023), "Anónimo", "Cenicienta" e "Otro Mood". A novidade é ser coautora das canções **de Luna**. | "As duas faixas marcam o reencontro de Karol com Luna dez anos depois da estreia, agora também como coautora das canções da personagem." |
| C9 | Baixa | Músicas, faixa 12, "Vuélveme a mirar así": "tema da novela <cite>Soltero con hijas</cite> [86]" + "Sem link oficial confirmado nesta pesquisa" | **Fonte errada para o dado e link existente.** A página da Apple Music [86] confirma a data, mas não diz que é tema da novela; isso vem da Wikipedia [1][96]. O canal oficial tem o clipe (oEmbed ✓): https://www.youtube.com/watch?v=nXZ7WZTVZIw. Na Apple Music: https://music.apple.com/es/album/vu%C3%A9lveme-a-mirar-as%C3%AD/1497160957?i=1497160960 | Texto: "Karol Sevilla · tema da novela <cite>Soltero con hijas</cite> [1][96]". Trocar "Sem link oficial…" por dois links: "YouTube" → `https://www.youtube.com/watch?v=nXZ7WZTVZIw` (aria-label "Ver o clipe de Vuélveme a mirar así no YouTube (abre em nova aba)") e "Apple Music" → `https://music.apple.com/es/album/vu%C3%A9lveme-a-mirar-as%C3%AD/1497160957?i=1497160960`. |
| C10 | Baixa | Músicas, faixa 13, "Mil besos por segundo": "Sem link oficial confirmado nesta pesquisa" | **Existe link oficial** na página de artista da Apple Music [86]. | Trocar por um link "Apple Music" → `https://music.apple.com/es/album/mil-besos-por-segundo/1453621714?i=1453621715` (aria-label "Ouvir Mil besos por segundo na Apple Music (abre em nova aba)"). |
| C11 | Baixa | Capítulo 3, `#cap3-volta`: "No mesmo ano **voltou a Luna**, em…" · Linha do tempo 2026: "**Volta a Luna** em <cite>Volver a rodar</cite>" | **Português ambíguo.** "Voltou a" costuma pedir um verbo ("voltou a cantar"), e a leitura fica truncada. | Capítulo: "No mesmo ano voltou a interpretar Luna, em <cite>Soy Luna: Volver a rodar</cite>, que estreou…" · Linha do tempo: "Volta a ser Luna em <cite>Volver a rodar</cite>" |
| C12 | Baixa | Créditos de imagem: "Karol Sevilla em show, 2017 … **Autora**: Melina" | **Gênero presumido.** O Commons registra só "Melina", um canal do YouTube. | "Autoria: Melina (canal no YouTube)." |
| C13 | Baixa | Sobre o site: "O site não toca áudio, **não coleta dados** e não usa cookies." | **Afirmação ampla demais.** A página carrega fontes do Google Fonts (fonts.googleapis.com e fonts.gstatic.com), e o navegador envia o IP do visitante ao Google. O player também grava a faixa escolhida no `sessionStorage` do navegador, mas isso fica só no aparelho. | "O site não toca áudio, não usa cookies nem ferramentas de análise. As fontes tipográficas são carregadas do Google Fonts." |
| C14 | Baixa | Capítulo 2, `#cap2-soy-luna`: fonte [8] (Wikipedia, "Soy Luna") para a data de estreia | **Fonte não relida.** Na verificação, a página deu HTTP 429. A data (14/03/2016) é consistente entre várias fontes, e o site diz só "março de 2016". Risco baixo, mas convém reler [8] antes da publicação final. | Sem mudança de texto. Ação: abrir [8] e confirmar "March 2016". |
| C15 | Baixa | Lição 5, "Base factual": "…e à AP/La Hora. [13] **Ler no Capítulo 3**" | **Coerência de navegação.** A fala sobre o medo de estrear no pop urbano [13] está no Capítulo 2 (`#cap2-solo`), não no 3. | "…e à AP/La Hora [13]. Ler nos Capítulos 2 e 3", com link para `#cap2-solo` além do atual `#cap3-imagem`. Ou manter um link só, apontando para `#cap3-imagem`, e tirar [13] da base. |
| C16 | Baixa | Capítulo 3, segundo parágrafo: 'tem um **"sinal"** combinado com a mãe' | **Aspas de citação em uma tradução** ("seña" na fonte). | "…e tem um sinal combinado com a mãe para avisar." |

### Observações sem necessidade de correção

- **Hero** ("ela começou como figurante ainda criança") e **linha do tempo** ("c. 2006 Figurante em *Plaza Sésamo*, levada pela avó"): a figuração aparece na Wikipedia [1]; o papel da avó é relato dela [4]. Aceitável, porque o capítulo correspondente tem a etiqueta correta.
- **Tom dos capítulos e da conclusão:** coerente, sem exagero de "superação", com a advertência de que o processo não está "concluído". Fatos e falas estão bem separados. A conclusão ("Como as mariposas da canção…") está marcada como "Nossa leitura". Adequado.
- **Fontes [52]–[54], [15], [16], [59] e [6], [7]:** foram lidas só pelo resumo da busca. O conteúdo que o site atribui a elas é genérico e coerente com o relato verificado em [33]. Risco baixo.
- **Ortografia e concordância:** fora C11, C12 e C16, nada a corrigir. O uso de "o personagem" (Lição 3) e "a personagem" (capítulos) é aceito no português do Brasil. Se quiser uniformizar, use "a personagem" nos dois.

## Conclusão

O conteúdo está bem fundamentado. Os créditos musicais, selos, datas, links oficiais, créditos de imagem e a numeração das fontes batem com o dossiê verificado, e não há letras reproduzidas nem itens pendentes apresentados como certos. Há **um erro factual de gravidade alta (C1, a idade na estreia de *Soy Luna*)**, que veio do dossiê e já foi corrigido lá. Há também três ajustes médios de fidelidade às fontes (C2 anos do CEA, C3 detalhes acrescentados, C4 turnê "cancelada" que depois aconteceu). Os demais são refinamentos de baixa gravidade: citações exatas, dois links oficiais que faltavam e o português. Com C1 a C4 aplicados, o site pode ser considerado historicamente preciso.
