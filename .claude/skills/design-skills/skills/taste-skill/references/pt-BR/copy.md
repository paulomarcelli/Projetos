# Palavras

A copy (o texto da página) é a primeira decisão de design. Uma headline que precisa de quatro linhas não se salva com tipografia,
e uma página de slogans não se salva com layout. Escreva a página como texto puro antes de qualquer markup.

## Sumário

1. Escreva o argumento primeiro
2. A headline de duas linhas (com a cota de caracteres)
3. Formatos de headline que funcionam
4. Frase de apoio, texto corrido, botões
5. Prova sem inventar
6. O que soa como gerado
7. Microtipografia

## 1. Escreva o argumento primeiro

Responda em uma linha cada, numa nota de rascunho:

- Quem está lendo, e o que já sabe?
- O que é isto, dito do jeito que quem fez diria a um amigo?
- Em que única coisa o leitor deve acreditar depois de uma tela?
- O que o faria acreditar (uma imagem da coisa, um número, um nome, uma demonstração)?
- O que ele faz em seguida?

Depois liste a página como afirmações, uma por seção, cada uma com a sua prova:

```
1. É uma banqueta de carvalho de três pés, feita sob encomenda. → a banqueta, grande
2. Cada assento sai de uma tábua só, então o veio é seu.        → três closes
3. Leva seis semanas, e você pode acompanhar.                   → as etapas, fotografadas
4. Custa R$ 240 e é entregue por quem fez.                      → preço, botão
```

Seção sem afirmação é enchimento; apague. É também assim que você escapa da ordem batida de
hero, logos, recursos, depoimento, preços, chamada para ação: a ordem do argumento é a ordem da
página.

## 2. A headline de duas linhas

A headline é um título. Ela se lê numa olhada. Nos sites estudados das galerias, a headline do hero tem
mediana de 5 palavras, e 70% ficam em uma ou duas linhas na largura de desktop. Toda headline da sua página, em
todo viewport, cabe em **duas linhas ou menos**. O `inspect.mjs` mede isso em 1440, 768 e 390 pixels
e reprova a página se não couber.

A restrição é aritmética, então faça a conta antes de se apaixonar por uma frase:

```
caracteres por linha ≈ largura da linha em px ÷ (tamanho da fonte em px × k)

k ≈ 0.40  fontes condensadas
k ≈ 0.50  a maioria das grotescas e serifadas em tamanho display, tracking apertado
k ≈ 0.58  fontes largas / expandidas, composição toda em caixa-alta
```

| Onde | Largura da linha | Tamanho | Por linha | Cota de duas linhas |
| --- | --- | --- | --- | --- |
| Celular 390, gutters de 20 px | 350 px | 44 px | ~16 | **~32 caracteres** |
| Celular 390, gutters de 20 px | 350 px | 34 px | ~21 | ~42 caracteres |
| Tablet 768 | 690 px | 64 px | ~22 | ~44 caracteres |
| Desktop, largura de 12 colunas | 1.100 px | 104 px | ~21 | ~42 caracteres |
| Desktop, meia largura | 620 px | 72 px | ~17 | ~34 caracteres |

Então uma headline de hero com **cerca de 32 caracteres ou menos** (de quatro a seis palavras) sobrevive em todo lugar num
tamanho confiante. Até uns 42 funciona se o tamanho no celular descer para a casa dos 30 e poucos. Passou disso, você está
escrevendo uma frase; leve o resto para a frase de apoio.

Controlar a quebra:

- Dê à headline um `max-width` em `ch` para ela quebrar onde você quer, e acrescente
  `text-wrap: balance` para as duas linhas saírem parelhas.
- Onde a quebra importa (quase sempre), escreva-a: `Banquetas para<br> cozinhas pequenas`. Confira a
  captura do celular; se uma linha escrita quebrar lá, esconda o `<br>` num breakpoint ou encurte.
- Nunca conserte uma headline longa só diminuindo o tamanho. Uma headline tímida de 28 px com nove palavras é pior que
  cinco palavras em 64 px.
- Evite uma palavra órfã sozinha na segunda linha. Reequilibre cortando uma palavra, não mexendo na largura.

Os títulos de seção seguem a mesma regra e são mais curtos: de duas a cinco palavras.

**Frase de destaque não é headline.** Uma frase de abertura ou uma citação em tamanho grande (a frase-manifesto
depois do hero, um depoimento) é um parágrafo: marque como `<p>` ou `<blockquote>`, mantenha em cerca de
25 palavras e use o tamanho de frase de destaque, que o inspetor entende como 36 px ou menos no desktop, 32 px num
tablet e 24 px no celular. Aí ela pode ir até umas três linhas (quatro no celular). Maior que
isso, ou marcada como título, ou posta como a linha principal da primeira dobra, ela é uma headline e
ganha duas linhas. No julgamento às cegas, uma frase grande em três linhas ou mais foi lida como headline longa
todas as vezes, qualquer que fosse o markup; se as palavras importam tanto assim, corte-as para uma headline
de duas linhas.

## 3. Formatos de headline que funcionam

Todos vistos várias vezes nos sites das galerias. Escolha o mais simples que for verdadeiro.

- **O nome.** A marca ou a pessoa, bem grande, com uma descrição de uma linha em outro lugar.
  Mais forte quando o nome é curto e o assunto é visual (estúdios, restaurantes, hotéis, pessoas).
- **O que é.** "Uma estante de vinil no bolso." "Móveis para cômodos pequenos." A categoria, dita com
  uma palavra específica.
- **A afirmação.** "Seu banco não faz isso." Uma frase que um concorrente não poderia assinar.
- **A instrução.** "Entenda seu dinheiro." Verbo primeiro, curta.
- **O lugar ou o momento.** "Antártida." "Paraty, desde 1984." Para hotelaria, eventos, viagens.

Formatos a evitar, porque são a média de todas as landing pages:

- O preencha-as-lacunas: "A plataforma com IA para times modernos".
- O trio: "Rápido. Simples. Seguro." ou "Planeje. Construa. Entregue."
- A correção: "Não é só uma ferramenta, é um fluxo de trabalho". Também "Mais que um …".
- "X, reimaginado / redefinido / descomplicado". "Bem-vindo a …". "Conheça …" para um produto que ninguém conhece.
- Uma pergunta que o leitor não fez.
- Uma headline que precisa dos dois-pontos: "Ledgerly: notas fiscais para freelancers". Tire o nome, ele já está na
  navegação.
- Uma palavra da headline com estilo diferente (itálico, serifa, colorida, sublinhada, numa pílula).

Use só a inicial maiúscula (sentence case). Sem ponto final, a menos que a voz da direção use ponto em todo lugar.

## 4. Frase de apoio, texto corrido, botões

**Frase de apoio.** Uma frase, de no máximo umas 22 palavras, que diz concretamente o que a coisa é e
para quem é. É para onde vai o detalhe cortado da headline. Ela nunca repete a headline com
outras palavras.

**Texto corrido.** Parágrafos curtos de afirmações simples. Prefira o substantivo específico e o número real: "envia
em uma semana" em vez de "entrega rápida"; "38 lugares" em vez de "aconchegante". Leia cada frase e pergunte se uma
outra empresa poderia publicá-la sem mudar nada; se sim, afie ou corte.

**Botões.** Diga a ação ou a coisa: "Reservar mesa", "Ver os planos", "Baixar para Mac".
De uma a três palavras. A ação principal tem um nome só em toda a página. Um botão principal por
tela; uma segunda ação é um link de texto simples. Nada de seta em todo link e botão; no máximo uma
seta, na ação principal, se a direção usar setas.

**Navegação.** O logotipo, até cinco links simples, uma ação. Os rótulos dos links são substantivos únicos.

## 5. Prova sem inventar

Nunca invente clientes, citações de pessoas com nome, logos de imprensa, números de usuários, avaliações ou benchmarks.
Prova inventada é desonesta e também um cacoete conhecido.

Quando o briefing não traz prova, use o que é verdadeiro por construção:

- Mostre a própria coisa, grande. Uma demonstração real vale mais que qualquer citação.
- Diga como funciona, de forma específica.
- Use fatos do briefing (preço, lugar, ano, materiais, o que está incluído).
- Se uma seção de depoimentos ou de logos for pedida explicitamente e não houver reais, construa a seção
  com conteúdo de exemplo claramente fictício e diga isso no relatório final, para ser trocado antes do
  lançamento. Não ponha nomes de empresas reais nem pessoas reais nela.

**Detalhes de exemplo são diferentes de prova, e são esperados.** Quando o briefing dá o formato do
conteúdo mas não todos os detalhes (seis quartos "a partir de R$ 140", "um cardápio curto", doze palestrantes), escreva o
conjunto completo de detalhes plausíveis: cada quarto com nome, cama, vista e diária própria; cada prato com
seu preço; cada palestrante com o título da palestra. Um design só pode ser julgado na densidade real, e uma página
que mostra uma diária onde existem seis quartos parece inacabada. Liste todo detalhe de exemplo no relatório para
o cliente confirmar ou trocar.

## 6. O que soa como gerado

O `lint.mjs` aponta a maioria destes.

- Verbos e adjetivos do gênero: unlock (desbloquear), unleash (liberar), supercharge (turbinar), elevate (elevar), empower (empoderar), streamline (simplificar),
  seamless (sem atrito), effortless (sem esforço), robust (robusto), cutting-edge (de ponta), next-generation (de nova geração), world-class (de classe mundial), all-in-one (tudo em um), blazing fast (ultrarrápido).
- Rótulos que fingem ser editoriais: "Field notes" (Bastidores), "The details" (Os detalhes), "Our philosophy" (Nossa essência), "Quietly trusted
  by" (A confiança discreta de). Um título de seção pode ser simplesmente "Preços".
- Texto de mobília: faixas de local ou de hora, "Desde 2024", coordenadas, carimbos de versão, "Scroll" (Role), "(Scroll
  to explore)" (Role para explorar), créditos de foto falsos, linhas de status como "Disponível para projetos" com um ponto, sequências de
  palavras separadas por pontos médios ou barras.
- O travessão como hábito. Um ou dois numa página parecem escrita; dez parecem um modelo. Use ponto final.
- Legendas explicativas que narram o design: "Um layout limpo e minimalista para…".
- Rótulos de etapa que repetem números: "Passo 1", "Fase 02".
- Três itens paralelos em todo lugar: três recursos, três números, três passos. Use o número que o
  conteúdo tem.

## 7. Microtipografia

- Aspas e apóstrofos curvos (“ ” ’), reticências de verdade (…), meia-risca para intervalos (9–5).
- Espaço não separável entre um número e sua unidade, e antes da última palavra curta de uma headline
  quando ela ficaria órfã (`&nbsp;`).
- `font-variant-numeric: tabular-nums` onde números se alinham em colunas (preços, tabelas).
- `text-wrap: balance` nos títulos, `text-wrap: pretty` nos parágrafos.
- Nada em caixa-alta com mais de três palavras; se usar caixa-alta, acrescente tracking (espaço entre letras) de 0,02–0,06em.
- Nenhum texto abaixo de 13 px. Nenhum parágrafo centralizado com mais de três linhas. Nenhum texto justificado.
