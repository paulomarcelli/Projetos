# Catálogo do design system — "Scarlet Reality"

Tudo o que as páginas precisam para montar a interface da F.R.E.Y.A. sem cor, raio ou curva solta.
Regra de ouro: **superfícies neutras, escarlate só em interação, seleção, indicadores e energia.**

```ts
import { Botao, BotaoLink, BotaoIcone, Cartao, Pilula, SeloEpistemico, SeloConfiabilidade, CampoTexto, AreaTexto,
  GrupoSegmentado, Interruptor, Dica, EstadoVazio, Esqueleto, Carregando, AvisoDeErro, Dialogo, Abas, cx } from "../components/ui";
import { CabecalhoDaPagina, PainelVidro } from "../components/layout";
import { Logo } from "../components/brand";
import { BotaoTema, useTrocaDeTema, executarRealityShift } from "../components/theme";
```

---

## 1. Tokens e classes (Tailwind 4)

Os tokens ficam em `src/styles/tokens.css` (`--cor-*`, `--raio-*`, `--sombra-*`…) e trocam sozinhos com
`data-tema` — **não use `dark:`**; as classes abaixo já valem para os dois temas.

### Cores (`bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*`, `stroke-*`, `outline-*`, `divide-*`)
| Classe | Uso |
|---|---|
| `fundo` | fundo da aplicação (raro: a casca já pinta) |
| `superficie` · `superficie-2` · `superficie-3` | cartão · área afundada (campo, trilho) · hover forte/selecionado |
| `sobreposicao` | véu de gaveta/diálogo |
| `texto` · `texto-suave` · `texto-fraco` · `texto-invertido` | texto corrido · secundário · dicas e datas · sobre fundo escuro/claro invertido |
| `borda` · `borda-forte` | divisórias discretas · contorno de controle |
| `escarlate` | acento: ícone ativo, link, indicador, número em destaque (AA em texto) |
| `escarlate-forte` | hover/pressão de acento, texto sobre `escarlate-tinta` |
| `escarlate-solido` · `escarlate-solido-hover` · `sobre-escarlate` | preenchimento do botão primário e o texto sobre ele |
| `escarlate-tinta` · `escarlate-brilho` | fundo tingido (seleção suave) · halo/seleção de texto |
| `sucesso` `aviso` `perigo` (+ `-tinta`) | estados |
| `confirmado` `inferencia` `hipotese` (+ `-tinta`) | tipos epistêmicos (prefira o `SeloEpistemico`) |
| `oficial` `enciclopedia` `wiki` (+ `-tinta`) | confiabilidade da fonte (prefira o `SeloConfiabilidade`) |
| `vidro` · `vidro-forte` · `vidro-borda` | preenchimento translúcido (use com `backdrop-blur-vidro`) |

Ex.: `bg-superficie text-texto-suave border border-borda`, `text-escarlate`, `bg-confirmado-tinta text-confirmado`.

### Tipografia
- `font-sans` = a fonte escolhida nas preferências (`--fonte-texto`; padrão Outfit). `font-mono` = IBM Plex Mono — **só para ids, códigos e hashes**.
- Tamanhos em rem (acompanham a escala do texto das preferências): `text-2xs` 11 · `text-xs` 12 · `text-sm` 14 (interface) ·
  `text-base` 16 (texto corrido) · `text-lg` 18 · `text-xl` 22 (título de cartão) · `text-2xl` 28 (título de página no celular) ·
  `text-3xl` 36 (título de página / saudação) · `text-4xl` 48 (raro).
- Números alinhados: classe `fr-numeros` (tabular-nums).

### Raios, sombras, curvas, camadas
| | |
|---|---|
| Raios | `rounded-sm` 6 · `rounded-md` 8 · `rounded-lg` 10 · `rounded-xl` 12 (botão, campo, item) · `rounded-2xl` 20 (cartão) · `rounded-3xl` 28 (cartão grande do histórico) · `rounded-4xl` 36 (painel de vidro) · `rounded-full` |
| Sombras | `shadow-baixa` (repouso) · `shadow-media` (vidro, flutuante) · `shadow-alta` (diálogo) · `shadow-escarlate` (botão primário) |
| Curvas | `ease-out` (entrar/sair — padrão) · `ease-in-out` (mover na tela) · `ease-drawer` (gavetas). Durações: pressão 160ms, dica 125ms, hover 150ms, popover 200ms, menu 260ms, gaveta 400ms |
| Desfoque | `backdrop-blur-vidro` |
| Camadas | `z-(--z-cabecalho)` 20 · `z-(--z-menu)` 30 · `z-(--z-gaveta)` 40 · `z-(--z-dialogo)` 50 · `z-(--z-dica)` 60 |

### Variantes próprias
| Variante | Quando |
|---|---|
| `passar:` | hover **só** com ponteiro fino (use no lugar de `hover:` para qualquer coisa que se mova ou mude de fundo) |
| `movimento:` | só quando o movimento é permitido (sem `prefers-reduced-motion` e sem `data-movimento="reduzido"`) |
| `sem-movimento:` | o inverso: versão reduzida |
| `escuro:` | só no tema escuro (quase nunca necessário) |

Ex.: `transition-transform duration-200 ease-out movimento:passar:-translate-y-0.5`.
Com `motion/react`, leia `usePreferencias().movimentoReduzido` (cobre sistema **e** preferência) — o `MotionConfig reducedMotion="user"` só vê o sistema.

### Utilidades CSS
`fr-vidro` (painel de vidro avulso), `fr-numeros`, `sr-only` (Tailwind).

---

## 2. Componentes

### Botao / BotaoLink / classesDoBotao
| Prop | Tipo | Padrão |
|---|---|---|
| `variante` | `"primario" \| "secundario" \| "fantasma" \| "perigo"` | `"secundario"` |
| `tamanho` | `"pequeno"` (36px) `\| "medio"` (44px) `\| "grande"` (52px) | `"medio"` |
| `icone`, `iconeDireita` | `ReactNode` (lucide, sem `size`: o CSS dimensiona) | — |
| `carregando` | `boolean` — giro no lugar do ícone, `aria-busy`, desabilitado | `false` |
| `rotuloCarregando` | texto para leitor de tela | `"Carregando"` |
| `larguraTotal` | `boolean` | `false` |
+ todos os atributos de `<button>`. Pressão: `scale(0.97)` em 160ms.
`BotaoLink` = mesmo visual num `<Link to>` do react-router. `classesDoBotao({variante, tamanho})` devolve as classes para outro elemento.
Use **um** `primario` por tela (a ação principal). `perigo` só para excluir.

### BotaoIcone
Botão redondo só com ícone (44px, como os da referência Genie).
`rotulo` (**obrigatório**, vira `aria-label` e a dica) · `children` (o ícone) · `variante: "vidro" | "fantasma" | "solido"` (`"vidro"`) ·
`tamanho: "pequeno" | "medio" | "grande"` · `dica` (`true`) · `ladoDaDica` (`"cima"`) · `pressionado` → `aria-pressed` (ex.: guardar).
Ex.: `<BotaoIcone rotulo="Enviar" variante="solido"><ArrowUp /></BotaoIcone>`.

### Cartao
`variante: "plano" | "vidro" | "interativo"` (`"plano"`) · `espaco: "nenhum" | "pequeno" | "medio" | "grande"` (14/20/28px; `"medio"`) ·
`raio: "medio" | "grande"` (20/28px) · `como` (elemento: `"article"`, `"li"`…).
Cartão inteiro clicável: `variante="interativo"` + ponha a classe `fr-cartao-link` no `<Link>` principal (o link cobre o cartão;
o foco do teclado acende a borda escarlate). Botões secundários dentro precisam de `relative z-10`.

### Pilula
`tom: "neutro" | "escarlate" | "sucesso" | "aviso" | "perigo"` · `icone` · `tamanho: "pequeno" | "medio"`. Não é botão.
Use `escarlate` só para contagens que pedem ação ou destaque raro.

### SeloEpistemico
`tipo: "confirmado" | "inferencia" | "hipotese"` → **Confirmado** (verde-azulado, ✓) · **Inferência** (azul, Waypoints) ·
**Hipótese** (âmbar, lâmpada, borda tracejada). `compacto` = só o ícone (vira `role="img"` com nome). Tem `title` com a descrição.
Mapa exportado: `EPISTEMICO[tipo].rotulo/descricao/Icone`.

### SeloConfiabilidade
`confiabilidade: "oficial" | "enciclopedia" | "wiki_fas" | string` → **Fonte oficial** (ShieldCheck) · **Enciclopédia** (BookOpen) ·
**Wiki de fãs** (Users); qualquer outro valor → **Fonte não classificada**. `compacto` igual ao anterior. Mapa: `CONFIABILIDADE`.

### CampoTexto / AreaTexto
`rotulo` (**obrigatório**, visível — nada de placeholder como rótulo) · `dica` · `erro` (marca `aria-invalid` e troca a dica) ·
`rotuloOculto` · `prefixo` (ícone à esquerda, só CampoTexto) · `classeDoGrupo` · `required` (asterisco escarlate) + atributos nativos.
`AreaTexto` aceita `rows` (4). Foco: borda e halo escarlates.

### GrupoSegmentado
`rotulo` (aria-label do grupo) · `opcoes: { valor, rotulo, icone?, rotuloAcessivel?, desativada? }[]` · `valor` ·
`aoMudar(valor, { origem: {x, y} })` · `tamanho: "pequeno" | "medio"` · `larguraTotal`.
`radiogroup` com setas/Home/End e foco itinerante; o indicador desliza (200ms ease-out).
**Seletor de tema nas configurações:** `const { trocarPara } = useTrocaDeTema();` e `aoMudar={(t, { origem }) => trocarPara(t, origem)}` —
o Reality Shift sai do segmento clicado.

### Interruptor
`marcado` · `aoMudar(boolean)` · `rotulo` · `descricao?` · `desativado?`. `role="switch"`, linha com rótulo à esquerda.

### Dica
`texto` · `children` (**um** elemento focável) · `lado: "cima" | "baixo" | "direita" | "esquerda"` · `desativada` · `redundante`
(texto igual ao nome acessível: não duplica a leitura) · `atraso` (350ms; vizinhas abrem na hora). Abre com ponteiro fino e foco de
teclado, fecha com Esc/saída/rolagem; vai num portal com posição fixa (escapa de `overflow`).

### EstadoVazio
`icone` · `titulo` · `texto?` · `acao?` · `tamanho: "compacto" | "medio"`. Ex.: histórico vazio com `<BotaoLink variante="primario" to={rotas.novaAnalise}>`.

### Esqueleto / Carregando
`Esqueleto`: `forma: "linha" | "bloco" | "circulo"` · `largura` · `altura` · `linhas` (a última mais curta). Decorativo (`aria-hidden`).
`Carregando`: `rotulo` ("Carregando…") · `rotuloOculto` · `tamanho`. `role="status"` + `aria-live="polite"` — use **um** por região
que carrega, junto dos esqueletos. Para as etapas ao vivo da investigação, troque o `rotulo` a cada etapa.

### AvisoDeErro
`titulo` ("Algo deu errado") · `texto` · `aoTentarNovamente?` · `rotuloDaAcao` ("Tentar de novo") · `tentando` · `acoes?`. `role="alert"`.
Escolha o texto pelo `ErroDaApi.tipo`: `indisponivel` → "A API da F.R.E.Y.A. não respondeu", `nao_encontrado` → "Análise não encontrada"…

### Dialogo
`aberto` · `aoFechar` · `titulo` · `descricao?` · `children?` · `acoes?` · `tipo: "padrao" | "alerta"` · `fecharNoFundo` (não em alertas) ·
`largura: "pequena" | "media" | "grande"` (26/36/48rem).
`<dialog>` nativo (`showModal`): camada superior, fundo inerte, Esc fecha; o foco vai para `[data-autofoco]` e volta para quem abriu.
```tsx
<Dialogo aberto={aberto} aoFechar={fechar} tipo="alerta" titulo="Excluir análise?"
  descricao="Ela sai do histórico. Esta ação não pode ser desfeita."
  acoes={<><Botao data-autofoco onClick={fechar}>Cancelar</Botao><Botao variante="perigo" onClick={excluir}>Excluir</Botao></>} />
```

### Abas
`rotulo` · `abas: { id, rotulo, icone?, contagem?, conteudo }[]` · `ativa?` (controlado) · `ativaInicial?` · `aoMudar?` · `classeDoPainel?`.
tablist/tab/tabpanel, setas/Home/End com ativação automática; sublinhado escarlate desliza.

---

## 3. Estrutura e painéis (`components/layout`)

### Estrutura (já no roteador)
Fundo ambiente + menu lateral de vidro + barra do topo (menu no celular, `BotaoTema` à direita) + `<main id="conteudo">`.
A página **não** precisa de margem lateral nem de fundo: o `<main>` já tem respiro (16px celular / 20–28px desktop) e largura
máxima de 90rem. A barra do topo ocupa 64px antes do conteúdo; no desktop ela é transparente.

### CabecalhoDaPagina
`titulo` (o único `<h1>`) · `subtitulo?` · `acoes?` (à direita; quebra embaixo no celular) · `voltar?: { para, rotulo? }` · `children?`.

### PainelVidro — o "New Chat" da referência
`titulo?` (h2 centralizado) · `inicio?` / `fim?` (botões nas pontas do título) · `rodape?` (preso ao pé: o campo da pergunta) ·
`como` · `tamanho: "grande"` (36px de raio, 32px de respiro) `| "medio"` (28/24). O corpo rola por dentro: dê altura ao painel
(ex.: `className="h-[calc(100dvh-7rem)]"`) quando quiser o rodapé fixo.
Campo em pílula da referência ("Ask me anything…"): `<CampoTexto rotulo="Questão prospectiva" rotuloOculto classeDoGrupo="flex-1 [&_.fr-campo-caixa]:rounded-full" />`
e, ao lado, `<BotaoIcone variante="solido" rotulo="Analisar"><ArrowUp /></BotaoIcone>`.

### Composição do dashboard (sugestão, a partir da referência Genie)
```
grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6
├─ coluna: <h2 class="text-xl font-medium">Hoje</h2>, <Cartao variante="vidro" raio="grande"> com o explorador do grafo,
│          "Ontem", lista de <Cartao variante="interativo"> com as análises
└─ <PainelVidro titulo="Nova análise" rodape={campo + botão}> saudação (text-3xl font-light / font-semibold) e cartões de ação
```

---

## 4. Marca e tema

- `Logo`: `tamanho` (altura px, 32) · `variante: "simbolo" | "completa"` · `animada` (a estrela pequena cintila no hover) · `titulo`
  ("" = decorativa). Cores pelo tema (`--logo-de/meio/ate`).
- `BotaoTema`: sol ⇄ lua; dispara o **Scarlet Reality Shift** a partir do próprio centro.
- `useTrocaDeTema()` → `{ tema, trocarPara(tema, origem?), alternar(origem?) }` — use em qualquer outro controle de tema.
- `executarRealityShift(origem, trocarTema, { reduzido?, temaNovo? })` — a função de baixo nível.

## 5. Movimento — o que já está decidido
- Pressão: `scale(0.97)` 160ms `ease-out` em botões/itens (já embutido). Hover de cor 150ms `ease`.
- Hover que move ou muda fundo: sempre `passar:`.
- Entradas de lista: no máximo 30–80ms de escalonamento, só `opacity` + `translateY(8px)`, e nunca em listas vistas o dia todo.
- Nada de `transition-all`: nomeie as propriedades (`transition-[opacity,transform]`).
- Toda animação nova vem com a versão `sem-movimento:` (mantém cor/opacidade, tira deslocamento).
