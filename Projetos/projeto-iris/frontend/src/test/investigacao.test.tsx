import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { Relacoes } from "../pages/Relacoes";
import { PaginaDaInvestigacao, ResultadoInvestigacao } from "../pages/ResultadoInvestigacao";
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
        <ResultadoInvestigacao r={r} />
      </MemoryRouter>,
    );
  }

  it("fora da prévia, todo endereço leva ao estado vazio (não há motor)", () => {
    render(
      <MemoryRouter initialEntries={["/app/investigacoes/exemplo-flavio-2026"]}>
        <Routes>
          <Route path="/app/investigacoes/:id" element={<PaginaDaInvestigacao />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Investigação não encontrada")).toBeInTheDocument();
  });

  it("visão geral: síntese, cenários e acesso à seção Relações (o mapa não fica aqui)", () => {
    montar();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Visão geral", "Cenários", "Linha do tempo", "Fontes"]);
    expect(screen.queryByRole("group", { name: /Relações entre países/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorar as relações no mapa/ })).toHaveAttribute("href", "/app/relacoes/exemplo-flavio-2026");
  });
  it("cenários: cartão curto, detalhes sob demanda e comparação pelos mesmos critérios", async () => {
    montar();
    await userEvent.click(screen.getByRole("tab", { name: "Cenários" }));
    expect(screen.getAllByText("Impacto principal")).toHaveLength(3);
    expect(screen.queryByText("Premissas")).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /Ver detalhes/ })[1]);
    expect(screen.getByText("Premissas")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Comparar lado a lado/ }));
    const tabela = screen.getByRole("table", { name: /Comparação dos cenários/ });
    expect(within(tabela).getByText("Gatilho")).toBeInTheDocument();
    expect(within(tabela).getByText("Rever se")).toBeInTheDocument();
  });

  it("linha do tempo: só o filtro de cenário, futuro separado do passado, evento abre no painel", async () => {
    montar();
    await userEvent.click(screen.getByRole("tab", { name: "Linha do tempo" }));
    expect(screen.getByRole("separator", { name: /Hoje/ })).toBeInTheDocument();
    expect(screen.queryByText("Adesão plena ao Escudo das Américas.")).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("group", { name: "Cenário projetado no futuro" })).getByRole("button", { name: /^B/ }));
    expect(screen.getByText("Adesão plena ao Escudo das Américas.")).toBeInTheDocument();
    await userEvent.click(screen.getByText("STF condena Jair Bolsonaro a 27 anos e 3 meses."));
    expect(screen.getByRole("complementary", { name: "Painel contextual" })).toHaveTextContent("Atores envolvidos");
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
        <Relacoes r={r} />
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
    await userEvent.click(screen.getByRole("button", { name: /mudanças em relação a hoje/ }));
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

  it("a lista em texto é a alternativa acessível ao mapa", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { name: /Lista/ }));
    expect(screen.getByText(/relações hoje/)).toBeInTheDocument();
  });
});
