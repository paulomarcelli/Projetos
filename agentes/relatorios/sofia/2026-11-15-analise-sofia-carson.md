# Análise de design · Sofia Carson · a voz (T-0001)

**Data:** 15/11/2026 · **Por:** Sofia · **Site analisado:** <https://paulomarcelli.github.io/Projetos/Projetos/Sofia-Carson/> (no ar)

> **Figma não estava disponível nesta sessão.** As ferramentas do Figma pedem autorização. Não abri o arquivo
> `41SYetZSfkGCyXrWKMkLl1` e não comparei o site com o Design System de lá. Tudo aqui vem do site no ar e do código em
> `Projetos/Sofia-Carson/`. Nada foi alterado no site, no Figma ou na publicação.

## 1. Pedido

Analisar o design do fã-site com capturas reais do site no ar e dizer o que está forte, o que está fraco e o que mudar,
em ordem de prioridade.

## 2. A ideia

**A ideia do site, em uma frase:** o filme fica preso atrás de uma folha cor de osso e aparece pelos furos; o nome dela
é o maior furo.

**Veredito, em uma frase:** a ideia é forte e chega até o rodapé; o que falta é proteger o texto que fica sobre o
filme, dar um controle de pausa e resolver a ação principal, que hoje leva a um cadastro que não faz nada.

**Partes da `design-skills` usadas:** `direcao-de-arte` (`taste-skill/references/pt-BR/critique.md` e `tells.md`: as
quatorze leituras, a nota e os tetos), `critique-visual-hierarchy`, `critique-typography`, `critique-color`,
`critique-composition`, `accessibility-audit` e `review-animations`.

### Nota (formato da `direcao-de-arte`)

```
RODADA 1
Visto em um segundo: o nome SOFIA em branco sobre um retrato em preto e branco.
Ideia (uma frase): o filme preso atrás da folha, visto pelos furos.
Elemento vivo: o filme (cinco planos em loop) que aparece na janela, no furo do meio e nas letras do rodapé.
Palavras de layout por seção: topo=cartaz / a voz=frase e janela / palco=grade de três / trajetória=sangrada /
fã-clube=dividida e nome gigante
Notas: design 7,5 · usabilidade 6,5 · criatividade 8 · conteúdo 6,5 → geral 7,2
Tetos aplicados: pela regra da casa da skill, rótulos em mono acima do texto limitam a nota geral a 6,5.
```

Sobre o teto: os rótulos em Geist Mono fazem parte da linguagem do modelo Lusco, então é uma escolha, não um descuido.
Registro as duas notas: **7,2 na conta, 6,5 com o teto**. O problema real dos rótulos é o tamanho (11 px), não existirem.

## 3. O que está forte

1. **A ideia aparece em todas as seções.** Janela cinemascope, furo do meio e letras vazadas no rodapé são a mesma
   coisa dita três vezes, em tamanhos diferentes. Capturas: `d1280-01-y680.webp`, `d1280-02-y1360.webp`,
   `d1280-06-y3495.webp`.
2. **Topo como cartaz.** Um ponto focal só: o nome em 169 px (em 1280) contra texto de 14 px. Salto de 12 vezes.
   Captura: `d1280-00-topo.webp`.
3. **Cor com disciplina.** Osso, tinta, um cinza e o filme. Sem cor de destaque, sem gradiente de enfeite.
   Tinta sobre osso dá 16,2:1.
4. **Seções com composições diferentes.** Nenhuma palavra de layout se repete (ver a nota acima).
5. **Responsivo sólido.** Sem rolagem lateral em 320, 390, 768, 1280, 1920 e no celular deitado (844 × 390).
   O celular é uma composição própria: o furo vem antes das fotos, a janela muda de proporção.
6. **"Reduzir movimento" bem tratado.** A intro some, o filme vira foto parada, a rolagem volta a ser a nativa e a
   página fica inteira. Captura: `folha-reduzido-1280.webp`.
7. **Base técnica limpa.** Console sem erro nem aviso nos cinco tamanhos, CLS entre 0,0001 e 0,0016, 1,47 MB no total
   (1,14 MB é o filme). A intro só usa `transform` e dá para pular com rolagem, toque ou tecla.
8. **Honestidade.** Aviso de fã-site no rodapé, aviso de que o cadastro não envia nada, `alt` descritivo nas duas
   fotos, `h1` com nome acessível "Sofia Carson, a voz", o reel fecha com Esc e devolve o foco.

## 4. O que está fraco e o que mudar (em ordem de prioridade)

Cada item diz o tipo: **visual**, **conteúdo** ou **código**.

### Prioridade 1 · atrapalha ler ou usar

**1. Texto claro sobre o filme sem proteção.** *(visual + código)*
Medi o fundo atrás de cada texto em seis momentos do filme (os 13 s da montagem). No plano da janela com a cidade, o
contraste cai abaixo do mínimo de 4,5:1 para texto pequeno:

| Onde (1280 px) | Pior contraste médio | Pior nos pontos mais claros |
|---|---|---|
| Pílula "Ver a montagem" (contorno) | 2,4:1 | 2,1:1 |
| Links da nav no topo | 3,5:1 | 2,4:1 |
| Canto direito do topo ("Oscar 2023") | 3,5:1 | 2,9:1 |
| Links da nav na Trajetória | 3,9:1 | 2,6:1 |
| Frase do furo "Só a voz e o palco" | 5,4:1 | 2,5:1 |

Capturas: `plano-2-topo-1280.webp`, `d1280-01-y680.webp`. No celular a média passa (8:1), mas os pontos claros caem a
2,6:1 no título e 3,4:1 nas etapas da Trajetória (`c390-05-y3600.webp`, `deitado844-06.webp`).
**Mudar:** escurecer a faixa do topo do filme (a vinheta de cima hoje é 28% de preto; subir para perto de 55% na altura
da nav) e começar mais cedo o degradê da Trajetória. Outra saída, melhor: escurecer o plano da janela na montagem.

**2. O filme não tem pausa.** *(código)*
O vídeo toca em loop, com trepidação e grão, e não há como parar. Isso reprova o critério 2.2.2 da WCAG (nível A):
movimento que começa sozinho e dura mais de 5 s precisa de um controle. O reel também abre sem controles.
**Mudar:** uma pílula "Pausar o filme" (na nav ou no rodapé) que para vídeo, trepidação e grão. É um componente novo:
entra no Design System antes de ir para o código.

**3. A ação principal promete um fã-clube que não existe.** *(conteúdo)*
A única pílula cheia da página, "Entrar no fã-clube", aparece duas vezes e leva a um cadastro que não envia nem guarda
nada. O aviso é honesto, mas o destaque maior do site aponta para um beco. Capturas: `folha-cadastro.webp`.
**Mudar (precisa da decisão do Paulo):**
- **A, que eu recomendo:** a ação principal vira "Ouvir" (o link do Apple Music, que já existe) e o cadastro vira uma
  brincadeira assumida, com outro nome ("Qual é a sua canção?").
- **B:** tirar o cadastro e fechar a página com as raízes e o nome vazado.

**4. Foco do teclado quase invisível.** *(código)*
A ordem do Tab está certa (12 paradas, lógica). O problema é o anel:
- na pílula cheia sobre o filme o anel é de 1 px na cor da tinta, e some no fundo escuro (`foco-06-detalhe.webp`);
- nos campos o foco só engrossa o fio de 1 para 2 px (`foco-08-detalhe.webp`);
- a marca do centro da nav recebe foco no topo, quando está invisível (`foco-04.webp`).

**Mudar:** anel de 2 px com afastamento de 3 px, na cor da superfície (luz sobre o filme, tinta sobre a folha); nos
campos, anel ou fio de 3 px; a marca fica fora do Tab enquanto estiver invisível.

### Prioridade 2 · enfraquece o design

**5. Intro longa, em toda visita.** *(código + visual)*
Do abrir até o nome aparecer: 4,9 a 6,0 s nos quatro tamanhos, com rede rápida. Os primeiros 2 s são tela preta com dois
rótulos de 11 px. Ela repete a cada visita e nada avisa que dá para pular. No celular, os rótulos ficam por cima das
fotos da coluna. Capturas: `folha-intro-1280.webp`, `folha-intro-390.webp` (quadros 06 a 09).
**Mudar:** intro completa só na primeira visita da sessão; nas seguintes, direto para o crescimento do último quadro.
No celular, os rótulos somem quando a coluna começa a subir.

**6. Texto pequeno demais, e não cresce.** *(visual)*
Em 1280 há 11 tamanhos diferentes. Dezesseis textos estão em 11 px (mono em caixa-alta) e outros dezesseis em 14 px.
O tamanho base de 16,6 px é usado em um parágrafo só. Em 1920 os pequenos continuam em 11 e 14 px e ficam miúdos
(`folha-1920.webp`). O cinza `--tinta-2` sobre osso dá 4,54:1: passa por um fio, e em 11 px cansa.
**Mudar:** mono em 12 a 13 px; legendas, notas e etapas em 15 a 16 px; os pequenos crescem um degrau acima de 1600 px.
Reduzir a escala para seis ou sete tamanhos.

**7. Fã-clube: buraco no meio e texto sob o título errado.** *(visual + conteúdo)*
Em 1280 o texto termina em 541 px e o cadastro começa em 864 px; em 1920 o vazio ocupa quase metade da largura
(`d1280-05-y3400.webp`, `folha-1920.webp`). E o parágrafo sobre Barranquilla e o UNICEF, que é biografia, está embaixo de
"Entre para o fã-clube".
**Mudar:** as raízes ganham bloco e título próprios ("Raízes"); o cadastro (ou o que ficar no lugar) alinha com uma
coluna da grade.

**8. Três grades que quase batem.** *(visual)*
A terceira coluna começa em 846 px nas fotos, 864 px no cadastro e 867 px nas etapas (em 1280); em 1920, 1272, 1297 e
1496 px. Diferença de 18 a 25 px parece erro, não escolha.
**Mudar:** uma grade só de três colunas, com o mesmo vão, para fotos, etapas e cadastro.

**9. O nome cobre o rosto em dois dos cinco planos.** *(visual, na montagem)*
No plano do microfone o nome fica sobre a boca e a mão; no plano de olhos fechados, sobre o rosto inteiro
(`plano-1-topo-1280.webp`, `plano-4-topo-1280.webp`). Num site sobre a voz, tapar a boca é o contrário da ideia.
**Mudar:** reenquadrar esses dois planos na montagem, com o rosto no terço de cima ou de lado.

**10. A página sobre a voz é muda.** *(conteúdo)*
Não há som, nem trecho, nem vídeo: só um link para o Apple Music. A página também é curta (5,4 telas em 1280) e tem
duas fotos.
**Mudar:** cada item da Trajetória ganha um link para o vídeo ou a faixa oficial. Os links precisam da checagem do
Sabrina antes de entrar.

### Prioridade 3 · acabamento

**11. Fio de 1 px na borda esquerda do rodapé.** *(código)* Aparece ao lado do nome vazado, do topo do SVG até o
rodapé. Captura: `detalhe-rodape-borda-esquerda.webp`. **Mudar:** fazer o SVG passar 1 px das bordas.

**12. Rodapé do celular desalinhado.** *(visual)* A linha "Fotos: direitos dos autores · Apple Music" vai para a
direita enquanto o resto está à esquerda (`c390-07-y4327.webp`). **Mudar:** alinhar à esquerda abaixo de 720 px.

**13. Alvos de toque pequenos.** *(código)* Links da nav 33 × 20 px, "Ver a montagem" do topo 134 × 15 px, "Apple
Music" do rodapé 92 × 16 px, pílulas 36 px e campos 38 px no celular. **Mudar:** área de toque de 44 px (a mínima
aceitável é 24 px).

**14. Legendas que não dizem nada.** *(conteúdo)* As duas fotos têm "Retrato · P&B". **Mudar:** dizer de onde é a foto
e de quem é o crédito, ou tirar a segunda linha.

**15. Entradas iguais em tudo.** *(código)* Quatorze blocos sobem 26 px em 0,9 a 1,1 s, todos do mesmo jeito. É lento
e compete com o movimento que importa, o do filme. **Mudar:** 12 px em 0,6 s, e só em títulos e fotos.

**16. O reel repete o que já está na tela.** *(conteúdo)* "Ver a montagem" abre o mesmo filme do fundo, sem controles
e em 720p esticado (`reel-1280.webp`). **Mudar:** dar controles (pausa e barra) ou tirar esse botão.

**17. Erro do cadastro longe do campo.** *(código)* A mensagem aparece embaixo do aviso, no mesmo estilo do resto, e o
campo não é marcado como inválido. **Mudar:** mensagem junto do campo e `aria-invalid`.

**18. Títulos de canção em inglês sem marcação de idioma.** *(código)* O leitor de tela lê "Applause" e "Come Back
Home" com pronúncia de português. **Mudar:** `lang="en"` nesses trechos.

## 5. O que mudou

No site, no Figma e na publicação: **nada** (era só análise). Arquivos criados:

- `agentes/relatorios/sofia/2026-11-15-analise-sofia-carson.md` (este relatório)
- `agentes/relatorios/sofia/2026-11-15-sofia-carson/` (capturas, medidas e os scripts que as geraram)
- `agentes/memoria/sofia.md` (regras aprendidas e registro da tarefa)

## 6. Capturas

Tudo em `agentes/relatorios/sofia/2026-11-15-sofia-carson/`:

| O quê | Arquivos |
|---|---|
| Celular 390 × 844 | `c390-00-topo.webp` a `c390-07-y4327.webp`, folha `folha-390.webp` |
| Tablet 768 × 1024 | `t768-*.webp`, folha `folha-768.webp` |
| Desktop 1280 × 800 | `d1280-00-topo.webp` a `d1280-06-y3495.webp` |
| Desktop 1920 × 1080 | `d1920-*.webp`, folha `folha-1920.webp` |
| Intro, quadro a quadro | pasta `intro/`, folhas `folha-intro-1280.webp` e `folha-intro-390.webp` |
| Os cinco planos do filme no topo | `plano-0` a `plano-6-topo-1280.webp`, folha `folha-planos-1280.webp` |
| Reduzir movimento | `r1280-*.webp`, folha `folha-reduzido-1280.webp` |
| Teclado e foco | `foco-*.webp`, folha `folha-foco.webp` |
| Cadastro (erro e sucesso) e reel | `cadastro-*.webp`, `reel-1280.webp` |
| Celular deitado e 320 px | `deitado844-*.webp`, `c320-*.webp`, folhas `folha-deitado.webp` e `folha-320.webp` |
| Detalhes ampliados | `detalhe-*.webp` |
| Medidas | `medidas-*.json` (tamanhos de texto, alvos, contraste sobre o filme, console, rede) |
| Scripts | `captura.cjs`, `extras.cjs`, `folha.cjs`, `resumo.cjs` |

## 7. Conferido em

- **Site no ar**, Chromium do Playwright, `deviceScaleFactor: 1`, rolagem em passos de 40 px e 2,5 s de espera antes
  de cada captura.
- **Tamanhos:** 390 × 844, 768 × 1024, 1280 × 800, 1920 × 1080, mais 844 × 390 (deitado) e 320 × 640.
- **Console e rede:** sem erro nem aviso em todos; nenhuma requisição falhou (no modo "reduzir movimento" o vídeo é
  cancelado de propósito).
- **Sem rolagem lateral** em nenhum tamanho.
- **Teclado:** 16 Tabs em 1280, ordem e anel de foco registrados.
- **Contraste sobre o filme:** medido nos pixels da captura, com o texto escondido, em 6 momentos por texto.
- **Build:** não rodei; a análise foi do que está publicado.

## 8. Ficou de fora

- **Figma:** sem acesso nesta sessão. Não conferi se o site segue as variáveis, os estilos e os componentes do arquivo.
- **`Projetos/Sofia-Carson/docs/design-system.md` não existe.** O Design System está só no Figma e num parágrafo do
  README. Não criei o documento porque a tarefa era só análise e, sem o Figma, ele sairia sem conferência.
- **Só Chromium.** Safari e Firefox não foram testados, nem aparelho de verdade.
- **Leitor de tela:** não testei com um; os pontos de acessibilidade vêm do código, do teclado e das medidas.
- **Sensação da rolagem suave** (Lenis com `lerp` de 0,05, bem pesado): captura não mostra isso. Vale testar à mão.
- **LCP:** a medida do Playwright não é confiável aqui (a intro cobre a página). Use o PageSpeed para esse número.
- **Fatos:** não reconferi as fontes do README; não era o pedido.
- **Capturas:** tiradas em PNG (38 MB) e convertidas depois para WebP (4,4 MB, até 1600 px de largura) para irem ao
  repositório. Os scripts ainda gravam PNG.

## 9. Próximos passos (backlog)

| # | O quê | Tipo | Quem |
|---|---|---|---|
| 1 | Paulo decide a ação principal: opção A (ouvir + cadastro como brincadeira) ou B (sem cadastro) | conteúdo | Paulo |
| 2 | Autorizar o Figma, conferir o site contra o Design System e criar `docs/design-system.md` | design | Sofia |
| 3 | Acrescentar ao Design System: proteção do texto sobre o filme, pílula "Pausar o filme", anel de foco de 2 px, escala de texto revista, grade única de três colunas | design | Sofia |
| 4 | Implementar os itens 1, 2 e 4 (contraste, pausa, foco) | código | Karol |
| 5 | Intro só na primeira visita da sessão e rótulos fora das fotos no celular | código | Karol |
| 6 | Reenquadrar os dois planos em que o nome cobre o rosto e escurecer o plano da janela | montagem | Sofia |
| 7 | Fã-clube: bloco "Raízes" com título próprio e alinhamento na grade | design + código | Sofia, Karol |
| 8 | Links oficiais de vídeo ou faixa para os três itens da Trajetória, com fonte | conteúdo | Sabrina |
| 9 | Acabamento: itens 11 a 18 | código | Karol |
| 10 | Conferir a tela pronta contra o Design System, com Safari e aparelho de verdade | QA | Sabrina |
