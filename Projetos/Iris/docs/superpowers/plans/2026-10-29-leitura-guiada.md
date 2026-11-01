# Leitura guiada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `skills/subagent-driven-development/SKILL.md` (recommended) or `skills/executing-plans/SKILL.md` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth area, "Leitura guiada", to the investigation page: a two-part
reading (the system today, read as International Relations → the futures, read as foresight) whose
fixed stage (map, uncertainty matrix, world regions, time ruler) follows the step on screen.

**Architecture:**
- A pure function turns the investigation result into an ordered script of steps; each sub-step
  carries a `Foco` (what the stage shows).
- Stage components read only the `Foco` plus the shared context. They reuse the existing geometry,
  territories, relation styles, `MapaMundo`, the uncertainty matrix and the time glyphs.
- One `IntersectionObserver` picks the active sub-step. Only the scenario steps write the shared
  `vista`.

**Tech Stack:** React 19, TypeScript, Tailwind 4 tokens (`frontend/src/styles/index.css`),
react-router 7, Vitest + Testing Library, Playwright (screenshots). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-29-leitura-guiada-design.md`

All paths below are relative to `frontend/`. Run commands from `frontend/`.

## Global Constraints

- Frontend only. No backend file changes; no new npm dependencies; no Motion in this chunk (CSS only).
- Every text shown comes from `ResultadoDeInvestigacao` fields. No invented links, dates, confidence
  or probabilities.
- The uncertainty cone is qualitative. Its caption must say so: "Cone qualitativo: a incerteza cresce com a distância; não é probabilidade."
- Only step 9 (three futures) writes the shared `vista`. Steps 1–8 and 12–13 render the stage in vista
  `"presente"`; steps 10–11 render the vista currently in effect.
- Stage highlights are visual focus, never `selecao`; only a click changes `selecao`.
- Movement: `transform`/`opacity` only, 240 ms, `var(--ease-saida)`. With `prefers-reduced-motion`,
  no reveal and no layer transition.
- If `IntersectionObserver` is missing, all text is visible and the stage shows step 1.
- No horizontal page scroll at 390, 900, 1280 and 1440 px widths.
- Portuguese UI copy, sentence case, the platform's tone.

## Review Focus

1. Signals whose `quando` has no year ("Anual") → the ruler shows no cursor and the text says the
   period as written. Pinned in Task 1 (`cursor` is `null`).
2. A factor whose evidences are used by no actor or relation → the stage highlights nothing and the
   step says "Sem vínculo com atores ou relações nos dados." Pinned in Tasks 1 and 4.
3. Opening the reading with scenario B already chosen in another tab → `vista` stays B until the
   person scrolls to step 9. Pinned in Task 6.
4. Scrolling back up from step 9 → `vista` is not reverted. Pinned in Task 6.
5. A relation whose endpoint is a bloc or organization without `coord` → it is not drawn as a line
   on the stage map (same rule as the full map), and nothing crashes. Pinned in Task 3.

---

### Task 1: The script (`montarRoteiro`)

**Files:**
- Create: `src/components/leitura/roteiro.ts`
- Modify: `src/components/investigacao/contexto.tsx` (export `interface Indices` and an
  `indexar(r)` export, so it can be used outside the provider)
- Test: `src/test/leitura.test.ts`

**Interfaces:**
- Produces:

```ts
export type Camada = "mapa" | "matriz" | "regioes";
export type Nivel = "multilateral" | "regional" | "domestico";
export interface Foco {
  camada: Camada;
  atores: string[];          // ids lit on the stage
  relacoes: string[];        // ids lit on the stage
  bloco: string | null;      // bloc id whose members are hatched
  nivel: Nivel | null;       // map framing (step 2)
  vista: Vista | null;       // null = the vista in effect
  cursor: { de: number; ate: number } | "hoje" | null; // year span on the ruler
  cone: boolean;             // uncertainty cone open
}
export type Referencia =
  | { tipo: "questao" } | { tipo: "nivel"; id: Nivel } | { tipo: "ator"; id: string }
  | { tipo: "tipoRelacao"; id: TipoRelacao } | { tipo: "bloco"; id: string }
  | { tipo: "evento"; id: string } | { tipo: "variavel"; id: string }
  | { tipo: "incerteza"; id: string } | { tipo: "cenario"; id: CenarioId }
  | { tipo: "implicacoes" } | { tipo: "sinal"; id: string }
  | { tipo: "evidencia"; id: string } | { tipo: "metodo" };
export interface Subpasso { chave: string; ref: Referencia; foco: Foco; escreveVista?: CenarioId }
export interface Passo { numero: number; parte: "sistema" | "futuros" | "fecho"; titulo: string; subpassos: Subpasso[] }
export function montarRoteiro(r: ResultadoDeInvestigacao, ix: Indices): Passo[];
export function anosDe(quando: string): { de: number; ate: number } | null; // "2027–2028" → {2027, 2028}; "Out. 2028" → {2028, 2028}; "Anual" → null
```

Step rules (titles copied verbatim):

| n | parte | título | sub-steps and foco |
|---|---|---|---|
| 1 | sistema | A questão internacional | one, `questao`; all `estado` actors with `coord`; cursor `"hoje"` |
| 2 | sistema | Níveis de análise | one per non-empty level, in order multilateral, regional, domestico; `grupo` multilateral→multilateral, americas/europa/asia→regional, brasil→domestico; `nivel` set; atores = that level's actors |
| 3 | sistema | Atores | actors by relation count (desc), `estado` first then the rest, max 8; atores = the actor + endpoints of its `presente` relations |
| 4 | sistema | Relações de poder | one per `TipoRelacao` that has relations with `presente !== null`, in `RELACOES` order; relacoes = those ids; atores = their endpoints |
| 5 | sistema | Alinhamentos e blocos | one per bloc with `membros.presente` non-empty; `bloco` set; atores = members |
| 6 | sistema | A trajetória até aqui | one per `categoria === "observado"` event, in data order; atores = `ev.atores`; relacoes = `ev.relacoes ?? []`; cursor = `{de: ev.ano, ate: ev.ano}` |
| 7 | futuros | Forças motrizes | one per variable; atores/relacoes = items of `ix.ondeSeUsa` for each id in `estadoAtual.evidencias` with tipo ator/relacao; cursor `"hoje"`; cone true |
| 8 | futuros | Incertezas críticas | one per uncertainty; camada `matriz`; cone true |
| 9 | futuros | Três futuros | one per scenario; `vista` and `escreveVista` = its id; atores = `atoresDecisivos`; cursor = `{de: horizonte.inicio, ate: horizonte.fim}`; cone true |
| 10 | futuros | Implicações | one, `implicacoes`; camada `regioes`; vista null; cone true |
| 11 | futuros | Sinais de alerta | one per signal; vista null; cursor = `anosDe(quando)`; cone true |
| 12 | fecho | Evidências | top 5 by `ix.usosDaEvidencia` (desc, ties by data order); atores/relacoes from `ix.ondeSeUsa` |
| 13 | fecho | Método e limites | one, `metodo`; cursor null; cone true |

Default foco values: `camada "mapa"`, empty arrays, `bloco/nivel null`. Vista is `"presente"`
unless the table says otherwise.

- [ ] **Step 1: Write the failing tests** in `src/test/leitura.test.ts` with `INVESTIGACAO_EXEMPLO` and `indexar`:
  - `montarRoteiro` returns 13 steps; `numero` is 1..13; `parte` sequence 6×sistema, 5×futuros, 2×fecho;
  - step 6 has as many sub-steps as observed events, each with `cursor.de === ev.ano`;
  - step 9 sub-steps have `escreveVista` A, B, C, and no other sub-step has `escreveVista`;
  - every sub-step outside steps 9–11 has `foco.vista === "presente"`;
  - step 8 sub-steps have `camada "matriz"` and step 10 has `"regioes"`;
  - `anosDe("2027–2028")` → `{de:2027, ate:2028}`, `anosDe("Out. 2028")` → `{de:2028, ate:2028}`, `anosDe("Anual")` → `null`;
  - the step-11 sub-step for `s-prodes` has `foco.cursor === null`;
  - for a result where one variable's evidences are used nowhere (clone the example and set
    `estadoAtual.evidencias = []`), that sub-step has empty `atores` and `relacoes`.
- [ ] **Step 2:** Run `npx vitest run src/test/leitura.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Export `Indices` and `indexar` from `contexto.tsx`; implement `roteiro.ts` per the table.
- [ ] **Step 4:** Run `npx vitest run src/test/leitura.test.ts && npx tsc -b --noEmit`. Expected: PASS, no type errors.
- [ ] **Step 5:** Commit `feat(leitura): roteiro da leitura guiada a partir do resultado`.

### Task 2: Shared pieces made reusable

**Files:**
- Modify: `src/components/cenarios/ComparacaoDeCenarios.tsx` (export `MatrizDasIncertezas`)
- Modify: `src/components/cenarios/DetalheDoCenario.tsx` (export `EFEITO`; `CartaoDeCenario.tsx`
  keeps its own dot colors, which have a different purpose)
- Modify: `src/components/timeline/TimelineProspectiva.tsx` (export `mesDoRotulo`)
- Modify: `src/components/relacoes/MapaGeopolitico.tsx` → move the country list (`paises`: state
  actors with `coord` and `isoNum`, projected) and the "drawable relations" filter (`desenhaveis`)
  into `src/components/relacoes/apoioDoMapa.ts` as pure functions, used by both maps:
  `paisesNoMapa(r): { a: Ator; x: number; y: number }[]` and
  `relacoesDesenhaveis(r, ehPais: Set<string>, blocoPorAtor: Map<string, Bloco>): Relacao[]`.

**Interfaces:**
- Produces: `MatrizDasIncertezas()`, `EFEITO`, `mesDoRotulo(rotulo: string): number`, `paisesNoMapa`, `relacoesDesenhaveis` as above.

- [ ] **Step 1:** Add tests in `src/test/leitura.test.ts`: `paisesNoMapa(INVESTIGACAO_EXEMPLO)` contains only `estado` actors with `coord`; `relacoesDesenhaveis` returns no relation whose both endpoints are non-country actors without a bloc anchor.
- [ ] **Step 2:** Run the new tests. Expected: FAIL.
- [ ] **Step 3:** Move the code (behavior unchanged) and export the pieces.
- [ ] **Step 4:** Run `npx vitest run && npx tsc -b --noEmit`. Expected: all tests pass (the existing map tests prove behavior is unchanged).
- [ ] **Step 5:** Commit `refactor(relacoes): peças do mapa reutilizáveis pela leitura`.

### Task 3: Stage map (`MapaDoPalco`)

**Files:**
- Create: `src/components/leitura/MapaDoPalco.tsx`
- Test: `src/test/leitura.test.tsx` (component tests live here; Task 1's pure tests stay in `.ts`)

**Interfaces:**
- Consumes: `Foco` (Task 1); `paisesNoMapa`, `relacoesDesenhaveis`, `ESTILO`, `naCurva`, `useTransicao` (Task 2 / existing); `Territorios`; `relacaoNaVista`, `useResultado`.
- Produces: `MapaDoPalco({ foco, vista }: { foco: Foco; vista: Vista }): JSX.Element`.

Behavior:
- SVG `viewBox 0 0 LARGURA ALTURA`, inside a `<figure>` with `role="group"` and `aria-label`
  "Mapa do passo: {n} atores em destaque, {m} relações".
- Relation lines: the drawable relations visible in `vista`, styled by `ESTILO`, as a quadratic
  curve with its control point offset perpendicular to the chord. Lines in `foco.relacoes` get
  opacity 1 and 1.6× width; the rest 0.18.
- Country nodes are `<button>`s via `foreignObject`, or SVG `<g role="button" tabIndex=0>`
  following the full map's pattern, named "{curto}, abrir detalhes". Click/Enter →
  `selecionar({tipo:"ator", id})`. Nodes in `foco.atores` are lit; the rest 0.3 opacity.
- `foco.bloco` → pass the bloc members' `isoNum` set to `Territorios` (`bloco` prop).
- `foco.nivel` framing: a CSS transform on the content group. multilateral = whole map; regional =
  bbox of lit actors + 60 units padding; domestico = bbox of the `brasil`-group actors with a
  country node, or Brazil's capital ± 120 units.
- Transitions: transform 600 ms `--ease-saida`, opacity 240 ms; `motion-reduce:transition-none`.

- [ ] **Step 1: Failing tests** (render inside `ProvedorDoResultado` with the example):
  - with `foco.atores = ["eua"]`, the "EUA" node has `data-aceso` and the "China" node does not;
  - clicking the "EUA" node opens `complementary` "Painel contextual" containing "Papel na dinâmica";
  - with a foco listing a relation whose endpoint is the Mercosur bloc, rendering does not throw and draws no line for it;
  - the figure's aria-label counts match the foco.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `MapaDoPalco`.
- [ ] **Step 4:** Run `npx vitest run src/test/leitura.test.tsx`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(leitura): mapa do palco (só leitura, com foco)`.

### Task 4: Time ruler and step content

**Files:**
- Create: `src/components/leitura/ReguaDoTempo.tsx`
- Create: `src/components/leitura/ConteudoDoPasso.tsx`
- Test: `src/test/leitura.test.tsx`

**Interfaces:**
- Consumes: `Foco`, `Subpasso`, `Referencia` (Task 1); `GlifoTempo`, `LinhaAfirmacao`, `Citacoes`,
  `Letra`, `ChipAtor` (`investigacao/pecas`); `Epistemico`; `mesDoRotulo`, `EFEITO` (Task 2).
- Produces:
  - `ReguaDoTempo({ foco, vista }: { foco: Foco; vista: Vista }): JSX.Element`;
  - `ConteudoDoSubpasso({ sub }: { sub: Subpasso }): JSX.Element`.

Ruler: years from `min(ev.ano)` to `horizonte.fim`. HOJE at the start of `horizonte.inicio` (same
convention as `TimelineProspectiva`). Observed events and scheduled events as `GlifoTempo`. Scenario
events only when `vista` is a scenario (that scenario's). The cursor is a band from `de` to `ate+1`,
with an `aria-label` like "Período em foco: 2027–2028". The cone after HOJE is shown when
`foco.cone`, with the Global Constraints caption.

Content per `ref.tipo` (fields only, no rewritten text):
- `questao`: pergunta, natureza + avisoDeContexto (LinhaAfirmacao), escopo, horizonte;
- `nivel`: level name + actors with `NOME_TIPO_ATOR`;
- `ator`: nome, tipo, papel, `caracteristicas` (LinhaAfirmacao);
- `tipoRelacao`: the type label and description from `RELACOES`; each relation "{de} → {para}",
  `presente.texto` with its epistemic marker and `tema` (`NOME_TEMA`);
- `bloco`: name, members today;
- `evento`: `data` exactly as written, texto, epistemic category, citations;
- `variavel`: nome, estadoAtual (LinhaAfirmacao), porQueImporta, direção A/B/C (Letra). If the
  sub-step foco is empty, add "Sem vínculo com atores ou relações nos dados.";
- `incerteza`: pergunta, polos, porQue;
- `cenario`: Letra + arquétipo + nome, ideia, síntese, premissas, gatilhos, condições;
- `implicacoes`: the scenario in effect; consequences by region with `EFEITO` labels; or, if
  vista is "presente", "Escolha um futuro no passo anterior para ver as implicações.";
- `sinal`: sinal, leitura, onde, `quando` as written, favorece/enfraquece with words;
- `evidencia`: afirmação, evidência, fontes (veículo, data), and the button "Ver a cadeia completa" → `selecionar({tipo:"evidencia", id})`;
- `metodo`: each `metodos` item with `aplicacao` in words; `limitacoes`; `revisoes`.

- [ ] **Step 1: Failing tests:**
  - ruler with cursor `{de:2027, ate:2028}` exposes "Período em foco: 2027–2028";
  - ruler with `cone:false` has no element with the cone caption; with `true` it does;
  - `evento` content shows `ev.data` verbatim (e.g. "25 out. 2026");
  - `variavel` with empty foco shows "Sem vínculo com atores ou relações nos dados.";
  - `sinal` `s-prodes` shows "Anual" and the words "favorece" / "enfraquece";
  - `metodo` lists every method name;
  - no rendered content of steps 9–11 matches `/\d+\s?%/`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement both components.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(leitura): régua do tempo e conteúdo de cada passo`.

### Task 5: The reading area (`AreaDeLeitura`) with the scroll engine

**Files:**
- Create: `src/components/leitura/usePassoAtivo.ts`
- Create: `src/components/leitura/Palco.tsx`
- Create: `src/components/leitura/AreaDeLeitura.tsx`
- Modify: `src/styles/index.css` (classes `.leitura-revelar`, `.palco-camada`)
- Test: `src/test/leitura.test.tsx`

**Interfaces:**
- Consumes: Tasks 1, 3 and 4; `MatrizDasIncertezas`, `MapaMundo`, `EFEITO`.
- Produces:
  - `usePassoAtivo(chaves: string[]): { ativo: string; registrar: (chave: string) => (el: HTMLElement | null) => void; observador: boolean }`.
    One `IntersectionObserver` with `rootMargin "-45% 0px -45% 0px"`. `ativo` defaults to the first
    key. `observador` is false when the API is missing.
  - `Palco({ sub, numero, total }: { sub: Subpasso; numero: number; total: number }): JSX.Element`.
    Stacks the layers (map / matrix / regions) with opacity crossfade, plus the ruler and the live
    legend. It shows "Visualização do passo {numero} de {total}" and has an `aria-live="polite"`
    description.
  - `AreaDeLeitura(): JSX.Element`.

Layout:
- `lg`: two columns (text 5/12, stage 7/12); stage `sticky top-[calc(var(--altura-topo,0px)+5.5rem)] h-[calc(100dvh-8rem)]`.
- `< lg`: stage sticky on top at `h-[40svh]` with the button "Ocultar visualização" /
  "Mostrar visualização" (`aria-expanded`).
- `< lg`: the stage map labels only lit actors, and a button "Ver relações em lista" opens
  `ListaDeRelacoes` (existing) with the relations visible in the effective vista.
- Step index: `nav aria-label="Passos da leitura"` with the 13 titles as anchor links (`#passo-{n}`), grouped by part ("O sistema hoje", "Os futuros", "Em que isso se apoia").
- Each step is a `section` with `id="passo-{n}"` and an `h2`; each sub-step is a block registered
  with `usePassoAtivo`.
- Reveal: text blocks get `data-oculto` only when `observador` is true and reduced motion is off;
  the attribute is removed the first time a block intersects. CSS: `[data-oculto]` = opacity 0 +
  8 px translate; the element keeps its size.
- Vista writing: `useEffect` on the active sub-step. If it has `escreveVista`, call
  `setVista(escreveVista)`. Nothing else writes `vista`.
- The stage's effective vista: `sub.foco.vista ?? vista` (context).

- [ ] **Step 1: Failing tests** (mock `IntersectionObserver` with a class that stores the callback and lets the test fire `isIntersecting` for an element):
  - initially the stage says "Visualização do passo 1 de 13";
  - firing intersection for the first step-9 block calls through to the shared `vista` = "A" (assert the "Mapa de relações" tab later shows scenario A, or read it via a probe consumer);
  - with `vista` set to "B" before mounting, firing steps 1–8 keeps "B" (probe consumer);
  - firing a step-9 block and then a step-3 block keeps the scenario written by step 9;
  - with `window.matchMedia` returning `reduce`, no element has `data-oculto`;
  - with `IntersectionObserver` deleted from `globalThis`, no element has `data-oculto` and the stage shows step 1;
  - the index has 13 links with the exact titles.
  - with `window.matchMedia("(min-width: 1024px)")` false, "Ver relações em lista" opens a list containing "Brasil → EUA".
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `usePassoAtivo`, `Palco`, `AreaDeLeitura` and the CSS.
- [ ] **Step 4:** Run `npx vitest run && npx tsc -b --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(leitura): área de leitura com palco fixo e passo ativo`.

### Task 6: Wire it into the investigation

**Files:**
- Modify: `src/components/investigacao/contexto.tsx` (`Aba` adds `"leitura"`; `ABAS` gets
  `{ id: "leitura", nome: "Leitura guiada" }` last)
- Modify: `src/pages/investigacao/ResultadoInvestigacao.tsx` (render `AreaDeLeitura` for
  `aba === "leitura"`; side panel enabled; page stays "ampla")
- Modify: `src/components/analise/AreaDeAnalise.tsx` (the "Nesta análise" index gets a final item, the button "Ler como percurso" → `irPara("leitura")`)
- Test: `src/test/investigacao.test.tsx`

- [ ] **Step 1: Failing tests:**
  - the tablist has four tabs, the last named "Leitura guiada";
  - `?area=leitura` (via `abaDoEndereco("leitura")`) opens it;
  - "Ler como percurso" selects the "Leitura guiada" tab;
  - after choosing scenario B in the analysis and opening the reading, the map tab still shows scenario B (Review Focus 3).
- [ ] **Step 2:** Run. Expected: FAIL. Update the existing "três áreas" test title and expectations to four areas.
- [ ] **Step 3:** Implement the wiring.
- [ ] **Step 4:** Run `npx vitest run && npx tsc -b --noEmit && npm run build && npm run build:previa`. Expected: all pass, both builds succeed.
- [ ] **Step 5:** Commit `feat(investigacao): aba Leitura guiada`.

### Task 7: Verify in the browser, document, preview

**Files:**
- Modify: `docs/DESIGN.md` (§11.3: the reading, its two parts and stage rules)
- Modify: `docs/ARQUITETURA.md` (folder `components/leitura/`)

- [ ] **Step 1:** With the preview server (`npx vite --mode previa`), use Playwright to open
  `#investigacao`, select the "Leitura guiada" tab, scroll through all 13 steps and take
  screenshots at 1440×900, 900×1100 and 390×844, in both themes. Expected: no console errors; the
  stage changes with each step; no horizontal scroll
  (`document.documentElement.scrollWidth === innerWidth`).
- [ ] **Step 2:** Same with `reducedMotion: "reduce"`. Expected: no `[data-oculto]` elements; the
  stage changes without transitions.
- [ ] **Step 3:** Keyboard: Tab reaches the step index, the stage nodes and the hide/show button; Enter on a node opens the panel; Esc closes it.
- [ ] **Step 4:** Fix whatever the screenshots reveal (cut text, overlapping labels, abrupt layers) and re-run Steps 1–3.
- [ ] **Step 5:** Update the two docs. Run `npx vitest run && npm run build && npm run build:previa`. Expected: all pass.
- [ ] **Step 6:** Commit `docs: leitura guiada`. Republish the preview artifact.
