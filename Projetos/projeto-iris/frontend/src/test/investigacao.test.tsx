import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
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

  it("primeira tela: síntese, principal incerteza, mapa e acesso a cenários e evidências", () => {
    montar();
    expect(screen.getByText("Principal incerteza estratégica")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sistema/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("group", { name: /Mapa de atores/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /evidências · 16 fontes/ })).toBeInTheDocument();
  });

  it("selecionar um ator abre o painel com os 7 blocos; a citação abre a cadeia de rastreabilidade", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { name: /^Estados Unidos \(governo Trump\)/ }));
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    for (const t of ["Identificação", "Papel na dinâmica", "Interesses e capacidades", "Evidências", "Incertezas e limitações", "Implicações nos cenários"]) {
      expect(within(painel).getByText(t)).toBeInTheDocument();
    }
    await userEvent.click(within(painel).getAllByRole("button", { name: /^Ver evidência e fontes/ })[0]);
    expect(within(painel).getByText("Implicação prospectiva")).toBeInTheDocument();
    expect(within(painel).getAllByRole("link").length).toBeGreaterThan(0);
    // volta ao ator sem perder o contexto
    await userEvent.click(within(painel).getByRole("button", { name: "Voltar ao item anterior" }));
    expect(within(painel).getByText("Papel na dinâmica")).toBeInTheDocument();
  });

  it("trocar para um cenário mostra o que muda em relação ao presente", async () => {
    montar();
    await userEvent.click(screen.getAllByRole("button", { name: /^B: Cenário B/ })[0]);
    expect(screen.getByText(/O que muda no cenário B/)).toBeInTheDocument();
  });

  it("cenários podem ser comparados pelos mesmos critérios", async () => {
    montar();
    await userEvent.click(screen.getByRole("tab", { name: /Cenários/ }));
    await userEvent.click(screen.getByRole("button", { name: "Comparar A, B e C" }));
    const tabela = screen.getByRole("table", { name: /Comparação dos cenários/ });
    expect(within(tabela).getByText("Mecanismo principal")).toBeInTheDocument();
    expect(within(tabela).getByText("Revisar se")).toBeInTheDocument();
  });

  it("a linha do tempo filtra por categoria e abre o evento no painel", async () => {
    montar();
    await userEvent.click(screen.getByRole("tab", { name: /Linha do tempo/ }));
    await userEvent.click(within(screen.getByRole("group", { name: "Categorias de informação" })).getByRole("button", { name: /Projetado/ }));
    expect(screen.queryByText("Adesão plena ao Escudo das Américas.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("STF condena Jair Bolsonaro a 27 anos e 3 meses."));
    expect(screen.getByRole("complementary", { name: "Painel contextual" })).toHaveTextContent("Atores envolvidos");
  });
});
