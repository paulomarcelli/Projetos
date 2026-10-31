import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { abaDoEndereco } from "../features/investigacao/contexto";
import { PaginaAnalise } from "../pages/Analise/PaginaAnalise";
import { ResultadoDaInvestigacao } from "../features/investigacao/components/ResultadoDaInvestigacao";
import { INVESTIGACAO_EXEMPLO as r } from "../previa/investigacao-exemplo";

describe("integridade do exemplo (rastreabilidade)", () => {
  const evidencias = new Set(r.evidencias.map((e) => e.id));
  const fontes = new Set(r.fontes.map((f) => f.id));
  const atores = new Set(r.atores.map((a) => a.id));
  const sinais = new Set(r.sinais.map((s) => s.id));
  const relacoes = new Set(r.relacoes.map((x) => x.id));
  const todasAsAfirmacoes = [
    r.avisoDeContexto,
    ...r.premissas,
    ...r.limitacoes,
    ...r.incertezas.map((i) => i.porQue),
    ...r.variaveis.map((v) => v.estadoAtual),
    ...r.atores.flatMap((a) => a.caracteristicas),
    ...r.relacoes.flatMap((x) => (x.presente ? [x.presente] : [])),
    ...r.cenarios.flatMap((c) => [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias]),
  ];

  it("toda referência aponta para algo que existe", () => {
    for (const a of todasAsAfirmacoes) for (const e of a.evidencias ?? []) expect(evidencias, e).toContain(e);
    for (const e of r.evidencias) for (const f of e.fontes) expect(fontes, f).toContain(f);
    for (const x of r.relacoes) {
      expect(atores).toContain(x.de);
      expect(atores).toContain(x.para);
      for (const c of Object.values(x.cenarios)) for (const e of c.evidencias ?? []) expect(evidencias).toContain(e);
    }
    for (const ev of r.linhaDoTempo) {
      for (const a of ev.atores) expect(atores, ev.id).toContain(a);
      for (const x of ev.relacoes ?? []) expect(relacoes, ev.id).toContain(x);
      for (const s of ev.sinais ?? []) expect(sinais, ev.id).toContain(s);
      for (const e of ev.evidencias ?? []) expect(evidencias, ev.id).toContain(e);
    }
    for (const b of r.blocos) {
      expect(atores).toContain(b.ator);
      for (const m of Object.values(b.membros).flat()) expect(atores, b.id).toContain(m);
    }
    for (const a of r.atores.filter((x) => x.tipo === "estado")) expect(a.mapa, a.id).toBeTruthy();
    for (const c of r.cenarios) {
      for (const s of c.indicadores) expect(sinais).toContain(s);
      for (const a of c.atoresDecisivos) expect(atores).toContain(a);
    }
  });

  it("fato ou evidência sem fonte diz isso no próprio texto", () => {
    for (const a of todasAsAfirmacoes) {
      if ((a.tipo === "fato" || a.tipo === "evidencia") && !a.evidencias?.length) expect(a.texto).toMatch(/Fonte não registrada/);
    }
  });

  it("evento observado tem evidência; projetado nunca é observado", () => {
    for (const ev of r.linhaDoTempo) {
      if (ev.categoria === "observado") expect(ev.evidencias?.length, ev.id).toBeGreaterThan(0);
      if (ev.cenarios) expect(ev.categoria, ev.id).not.toBe("observado");
    }
  });

  it("nenhum cenário recebe probabilidade ou percentual", () => {
    for (const c of r.cenarios) expect(`${c.nome} ${c.sintese}`).not.toMatch(/%|probabilidade de/i);
  });

  it("toda fonte conferida traz o trecho literal; as não conferidas dizem por quê", () => {
    for (const f of r.fontes) {
      if (f.conferencia === "conferido") expect(f.trecho, f.id).toBeTruthy();
      else expect(f.limitacoes, f.id).toBeTruthy();
    }
  });
});

describe("resultado de investigação", () => {
  function montar() {
    return render(
      <MemoryRouter>
        <ResultadoDaInvestigacao r={r} />
      </MemoryRouter>,
    );
  }

  it("fora da prévia, todo endereço leva ao estado vazio (não há motor)", () => {
    render(
      <MemoryRouter initialEntries={["/app/investigacoes/exemplo-flavio-2026"]}>
        <Routes>
          <Route path="/app/investigacoes/:id" element={<PaginaAnalise />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Investigação não encontrada")).toBeInTheDocument();
  });

  it("três áreas: Análise, Mapa de relações e Timeline prospectiva; a análise é a entrada", () => {
    montar();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Análise", "Mapa de relações", "Timeline prospectiva"]);
    expect(screen.getByRole("tab", { name: "Análise" })).toHaveAttribute("aria-selected", "true");
  });

  it("o endereço antigo da leitura guiada (que saiu) abre a análise", () => {
    expect(abaDoEndereco("leitura")).toBe("analise");
    montar();
    expect(screen.queryByRole("button", { name: "Ler como percurso" })).not.toBeInTheDocument();
  });

  it("o cenário escolhido na análise continua escolhido depois de passar pela timeline", async () => {
    montar();
    const lista = screen.getByRole("heading", { name: /^Três futuros possíveis$/ }).closest("section")!;
    await userEvent.click(within(lista).getByRole("button", { name: /Cenário B:/ }));
    await userEvent.click(screen.getByRole("tab", { name: "Timeline prospectiva" }));
    await userEvent.click(screen.getByRole("tab", { name: "Mapa de relações" }));
    expect(screen.getByRole("group", { name: new RegExp(`cenário B: ${r.cenarios[1].nome}`) })).toBeInTheDocument();
  });

  it("análise: fenômeno, incertezas, fatores, atores e futuros; evidências recolhidas; o mapa não fica aqui", async () => {
    montar();
    expect(screen.getByText(r.sintese)).toBeInTheDocument();
    for (const t of [/O que ainda não se sabe/, /^Fatores determinantes$/, /^Atores$/, /^Três futuros possíveis$/, /^Comparação entre os cenários$/])
      expect(screen.getByRole("heading", { name: t })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Relações entre países/ })).not.toBeInTheDocument();
    // Ator abre no painel contextual.
    await userEvent.click(screen.getByRole("button", { name: /^EUA, / }));
    expect(screen.getByRole("complementary", { name: "Painel contextual" })).toHaveTextContent("Papel na dinâmica");
    // Evidências ficam recolhidas até o clique.
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Evidências e fontes/ }));
    expect(screen.getByRole("searchbox", { name: "Pesquisar afirmações e fontes" })).toBeInTheDocument();
  });

  it("os três cenários ficam lado a lado na análise, com o essencial visível e o detalhe no painel", async () => {
    montar();
    const lista = screen.getByRole("heading", { name: /^Três futuros possíveis$/ }).closest("section")!;
    for (const c of r.cenarios) {
      // Nome, ideia e as partes essenciais estão na tela, sem clique.
      expect(within(lista).getByRole("button", { name: new RegExp(`Cenário ${c.id}: ${c.nome}`) })).toBeInTheDocument();
      expect(within(lista).getByText(c.ideia)).toBeInTheDocument();
    }
    for (const parte of ["Lógica", "Consequências", "Atores decisivos", "Depende de", "Sinais a acompanhar", "Incertezas"])
      expect(within(lista).getAllByText(parte)).toHaveLength(3);
    // Destacar um cenário é o mesmo estado do mapa e da timeline (aria-pressed no título).
    const titulo = within(lista).getByRole("button", { name: /Cenário C:/ });
    await userEvent.click(titulo);
    expect(titulo).toHaveAttribute("aria-pressed", "true");
    // O detalhe completo abre no painel contextual, sem sair da análise.
    await userEvent.click(within(lista).getAllByRole("button", { name: "Detalhes e evidências" })[1]);
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByRole("heading", { level: 3, name: r.cenarios[1].nome })).toBeInTheDocument();
    expect(within(painel).getByText("Premissas")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Análise" })).toHaveAttribute("aria-selected", "true");
  });

  it("a comparação usa só dados da investigação: posição nas incertezas, direções, sinais e agenda", () => {
    montar();
    const comp = screen.getByRole("heading", { name: /^Comparação entre os cenários$/ }).closest("section")!;
    expect(within(comp).getByText(/não atribui probabilidade, nota nem peso/)).toBeInTheDocument();
    // Matriz: cada cenário descrito pelos polos das suas premissas.
    const [x] = r.incertezas;
    const a = r.cenarios[0];
    expect(within(comp).getByRole("button", { name: new RegExp(`Cenário A, ${a.nome}: ${x.nome}, ${x.polos[a.posicao[x.id]!]}`) })).toBeInTheDocument();
    // Direções: um texto por fator e cenário, vindo de `direcao`.
    const tabela = within(comp).getByRole("table", { name: /Direção de cada fator/ });
    expect(within(tabela).getByText(r.variaveis[0].direcao.B)).toBeInTheDocument();
    // Sinais: cada sinal com a palavra "favorece" ou "enfraquece" (não só cor).
    const sinais = within(comp).getByRole("table", { name: /Sinais de alerta/ });
    expect(within(sinais).getAllByRole("row")).toHaveLength(r.sinais.length + 1);
    // Nada de percentuais na comparação.
    expect(comp.textContent).not.toMatch(/\d+\s?%/);
  });

  it("o cenário escolhido na análise abre a timeline nele e continua escolhido no mapa", async () => {
    montar();
    const b = r.cenarios[1];
    await userEvent.click(screen.getByRole("button", { name: /Abrir o cenário B na timeline/ }));
    expect(screen.getByRole("tab", { name: "Timeline prospectiva" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 3, name: b.nome })).toBeInTheDocument();
    expect(screen.getByText("Premissas")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Mapa de relações" }));
    expect(screen.getByRole("group", { name: new RegExp(`cenário B: ${b.nome}`) })).toBeInTheDocument();
  });

  it("timeline: faixas por cenário, eventos focáveis que abrem no painel, comparação e alternativa em lista", async () => {
    montar();
    await userEvent.click(screen.getByRole("tab", { name: "Timeline prospectiva" }));
    expect(screen.getByRole("group", { name: /Timeline de/ })).toBeInTheDocument();
    // Escolher a faixa B pelo rótulo da faixa.
    await userEvent.click(screen.getByRole("button", { name: /^Cenário B:/ }));
    expect(screen.getByRole("button", { name: /^Cenário B:/ })).toHaveAttribute("aria-pressed", "true");
    // Evento: foco mostra a legenda; Enter abre no painel.
    const evento = screen.getByRole("button", { name: /STF condena Jair Bolsonaro/ });
    fireEvent.focus(evento);
    expect(screen.getAllByText("STF condena Jair Bolsonaro a 27 anos e 3 meses.").length).toBeGreaterThan(0);
    fireEvent.keyDown(evento, { key: "Enter" });
    expect(screen.getByRole("complementary", { name: "Painel contextual" })).toHaveTextContent("Atores envolvidos");
    // Comparação pelos mesmos critérios.
    await userEvent.click(screen.getByRole("button", { name: /Comparar lado a lado/ }));
    expect(within(screen.getByRole("table", { name: /Comparação dos cenários/ })).getByText("Gatilho")).toBeInTheDocument();
    // Alternativa em texto da visualização.
    await userEvent.click(screen.getByRole("button", { name: /Ver como lista/ }));
    expect(screen.getByRole("separator", { name: /Hoje/ })).toBeInTheDocument();
  });

  it("endereços antigos de área continuam válidos", () => {
    render(
      <MemoryRouter initialEntries={["/x?area=cenarios"]}>
        <Routes>
          <Route path="/x" element={<ResultadoDaInvestigacao r={r} abaInicial={abaDoEndereco("cenarios")} />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("tab", { name: "Timeline prospectiva" })).toHaveAttribute("aria-selected", "true");
    expect(abaDoEndereco("visao")).toBe("analise");
    expect(abaDoEndereco("evidencias")).toBe("analise");
  });

  it("método e revisão abrem no painel, fora da navegação principal", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { name: "Como esta análise foi feita" }));
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByText("Métodos")).toBeInTheDocument();
    expect(within(painel).getByText("Revisões")).toBeInTheDocument();
  });
});

describe("seção Relações (mapa geopolítico)", () => {
  function montar() {
    return render(
      <MemoryRouter>
        <ResultadoDaInvestigacao r={r} abaInicial="relacoes" />
      </MemoryRouter>,
    );
  }

  it("mostra o título da investigação e o seletor Hoje / A / B / C da mesma investigação", () => {
    montar();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(r.pergunta);
    const seletor = screen.getByRole("group", { name: /Vista do mapa/ });
    expect(within(seletor).getAllByRole("button").map((b) => b.textContent?.replace(/\s+/g, " ").trim())).toEqual(["Hoje", "Cenário A", "Cenário B", "Cenário C"]);
  });

  it("trocar de cenário atualiza a identificação, lista as mudanças e preserva o zoom", async () => {
    montar();
    const svg = screen.getByRole("group", { name: /Relações entre países/ });
    const antes = svg.getAttribute("viewBox");
    await userEvent.click(screen.getByRole("button", { name: /Cenário B/ }));
    expect(screen.getByRole("group", { name: /cenário B: Alinhamento hemisférico/ })).toBeInTheDocument();
    expect(svg.getAttribute("viewBox")).toBe(antes);
    await userEvent.click(screen.getByRole("button", { name: /O que mudou em relação a hoje/ }));
    // agrupado pelo tipo de mudança, com o mesmo glifo do mapa
    expect(screen.getByRole("region", { name: "Mudam de natureza" })).toHaveTextContent(/competição.*→.*cooperação/);
    expect(screen.getByText("Brasil entra no Escudo das Américas")).toBeInTheDocument();
  });

  it("clicar num país abre o painel com o essencial; detalhes e fontes ficam a um clique", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { name: /^Estados Unidos \(governo Trump\)/ }));
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByText("Papel na dinâmica")).toBeInTheDocument();
    await userEvent.click(within(painel).getByText("Evidências e detalhes"));
    await userEvent.click(within(painel).getAllByRole("button", { name: /^Ver evidência e fontes/ })[0]);
    expect(within(painel).getByText("Implicação prospectiva")).toBeInTheDocument();
  });

  it("a legenda compacta também filtra as categorias de relação", async () => {
    montar();
    const coop = screen.getByRole("button", { name: /^Cooperação/ });
    expect(coop).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(coop);
    expect(coop).toHaveAttribute("aria-pressed", "false");
  });

  it("a legenda permite destacar os blocos com países do mapa e mostra quem entra no cenário", async () => {
    montar();
    const blocos = screen.getByRole("group", { name: /^Blocos/ });
    expect(within(blocos).getAllByRole("button").map((b) => b.textContent?.replace(/\d|[+−]/g, "").trim())).toEqual(["Escudo", "Mercosul", "BRICS"]);
    const brics = within(blocos).getByRole("button", { name: /BRICS/ });
    await userEvent.click(brics);
    expect(brics).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Brasil, China")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Cenário B/ }));
    expect(within(blocos).getByRole("button", { name: /Escudo/ })).toHaveTextContent("+1");
  });

  it("a lista em texto é a alternativa acessível ao mapa", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { name: /Lista/ }));
    expect(screen.getByText(/relações hoje/)).toBeInTheDocument();
  });
});
