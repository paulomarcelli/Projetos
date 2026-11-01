import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import type React from "react";
import { abaDoEndereco, ProvedorDoResultado } from "../components/analysis/investigacao/contexto";
import { PainelContextual } from "../components/analysis/investigacao/PainelContextual";
import { SecaoComparacao } from "../components/analysis/secoes/SecaoComparacao";
import { SecaoMonitoramento } from "../components/analysis/secoes/SecaoMonitoramento";
import { SECOES } from "../components/analysis/investigacao/secoes";
import { matrizAplicavel } from "../components/analysis/prospectiva/ComparacaoDeCenarios";
import { MONITORAMENTO_DEMONSTRACAO } from "../previa/monitoramento-demonstracao";
import { PaginaAnalise } from "../pages/Analysis/PaginaAnalise";
import { ResultadoDaInvestigacao } from "../components/analysis/investigacao/ResultadoDaInvestigacao";
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

  it("as seções da análise, na ordem; o índice leva a cada uma", () => {
    montar();
    const regioes = SECOES.map((x) => screen.getByRole("region", { name: x.titulo }));
    // na ordem da lista: cada seção vem depois da anterior no documento
    for (let i = 1; i < regioes.length; i++) expect(regioes[i - 1].compareDocumentPosition(regioes[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const indice = screen.getByRole("navigation", { name: "Seções da investigação" });
    const links = within(indice).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(SECOES.map((x) => `#${x.id}`));
    expect(links[0]).toHaveAttribute("aria-current", "location");
    // comparação e monitoramento estão em pausa: fora da tela e do índice
    expect(screen.queryByRole("region", { name: "Comparação estratégica" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Monitoramento prospectivo" })).not.toBeInTheDocument();
    const topo = document.querySelector("button.voltar-ao-topo");
    expect(topo).toHaveAttribute("aria-label", "Voltar ao início da investigação");
    expect(topo).not.toHaveAttribute("data-visivel"); // só aparece depois de rolar
  });

  it("cabeçalho: só o rótulo e a pergunta (e as ações de método e impressão)", () => {
    montar();
    expect(screen.getByText("Iris · Investigação prospectiva")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: r.pergunta })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Como esta análise foi feita" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "A investigação em números" })).not.toBeInTheDocument();
  });

  it("01 diagnóstico atual: o título curto e um parágrafo", () => {
    montar();
    const sec = screen.getByRole("region", { name: "Diagnóstico atual" });
    expect(within(sec).getByText("01")).toBeInTheDocument();
    expect(within(sec).getByRole("heading", { level: 2, name: r.manchete })).toBeInTheDocument();
    expect(within(sec).getByText(r.sintese)).toBeInTheDocument();
  });

  it("01 sem manchete, a seção abre direto no parágrafo (nada é inventado)", () => {
    render(
      <MemoryRouter>
        <ResultadoDaInvestigacao r={{ ...r, manchete: undefined }} />
      </MemoryRouter>,
    );
    const sec = screen.getByRole("region", { name: "Diagnóstico atual" });
    expect(within(sec).queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(within(sec).getByText(r.sintese)).toBeInTheDocument();
  });

  it("02 futuros possíveis: núcleo prospectivo, quantas trajetórias e cada cenário com letra, nome e frase; o cartão abre o detalhe", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Futuros possíveis" });
    expect(within(sec).getByText("Núcleo prospectivo")).toBeInTheDocument();
    expect(within(sec).getByRole("heading", { level: 2, name: `Três trajetórias até ${r.horizonte.fim}` })).toBeInTheDocument();
    for (const c of r.cenarios) {
      expect(within(sec).getByRole("button", { name: new RegExp(`^Cenário ${c.id}: ${c.nome}`) })).toBeInTheDocument();
      expect(within(sec).getByText(c.ideia)).toBeInTheDocument();
    }
    // sem probabilidade nem etiqueta de chance
    expect(sec.textContent).not.toMatch(/%|provável|possível\b/i);
    const b = within(sec).getByRole("button", { name: /^Cenário B:/ });
    await userEvent.click(b);
    expect(b).toHaveAttribute("aria-pressed", "true");
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByRole("heading", { level: 3, name: r.cenarios[1].nome })).toBeInTheDocument();
    for (const item of ["Lógica de desenvolvimento", "Premissas fundamentais", "Consequências estratégicas", "Indicadores observáveis", "Sinais de mudança"])
      expect(within(painel).getByText(item)).toBeInTheDocument();
    expect(within(painel).getAllByText("Sem revisão registrada")).toHaveLength(r.cenarios[1].premissas.length);
  });

  // Comparação e monitoramento estão prontos, fora da tela por enquanto: os testes renderizam as seções diretamente.
  function montarEmPausa(secao: React.ReactNode, resultado = r) {
    return render(
      <MemoryRouter>
        <ProvedorDoResultado r={resultado}>
          {secao}
          <PainelContextual />
        </ProvedorDoResultado>
      </MemoryRouter>,
    );
  }

  it("em pausa · comparação: só o que diferencia os futuros, sem percentuais", () => {
    montarEmPausa(<SecaoComparacao />);
    const sec = screen.getByRole("region", { name: "Comparação estratégica" });
    expect(within(sec).getByText(/não atribui probabilidade, nota nem peso/)).toBeInTheDocument();
    expect(within(within(sec).getByRole("table", { name: /Direção de cada fator/ })).getByText(r.variaveis[0].direcao.B)).toBeInTheDocument();
    const condicoes = within(sec).getByRole("table", { name: /Condições, gatilhos e o que levaria a revisar/ });
    expect(within(condicoes).getByText(r.cenarios[0].revisao[0])).toBeInTheDocument();
    expect(matrizAplicavel(r)).toBe(true);
    expect(matrizAplicavel({ ...r, incertezas: r.incertezas.slice(0, 1) })).toBe(false);
  });

  it("em pausa · monitoramento sem servidor: sinais na frente, estado num cartão, nenhuma caixa vazia", async () => {
    montarEmPausa(<SecaoMonitoramento />);
    const sec = screen.getByRole("region", { name: "Monitoramento prospectivo" });
    expect(within(sec).getByText("Acompanhamento automático inativo")).toBeInTheDocument();
    expect(within(sec).queryByRole("heading", { name: "Novos acontecimentos" })).not.toBeInTheDocument();
    const ultimo = r.sinais.at(-1)!;
    expect(within(sec).queryByText(ultimo.sinal)).not.toBeInTheDocument();
    await userEvent.click(within(sec).getByRole("button", { name: `Ver os ${r.sinais.length} sinais` }));
    expect(within(sec).getByText(ultimo.sinal)).toBeInTheDocument();
    expect(within(sec).getByText(new RegExp(`Versão ${r.versao} em vigor`))).toBeInTheDocument();
    expect(within(sec).queryByText("Fictício")).not.toBeInTheDocument();
  });

  it("em pausa · monitoramento com dados de demonstração: cada item marcado como fictício, sem placar", () => {
    montarEmPausa(<SecaoMonitoramento />, { ...r, monitoramento: MONITORAMENTO_DEMONSTRACAO });
    const sec = screen.getByRole("region", { name: "Monitoramento prospectivo" });
    expect(within(sec).getByText(/Demonstração da interface/)).toBeInTheDocument();
    expect(within(within(sec).getByRole("table", { name: /Impacto de cada acontecimento/ })).getAllByText("Exige investigação").length).toBeGreaterThan(0);
    expect(within(sec).getAllByText("Fictício").length).toBeGreaterThan(2);
    expect(sec.textContent).not.toMatch(/\d+\s+(favorecem|confirmam)/);
  });

  it("em pausa · monitoramento do servidor: versões anteriores consultáveis no painel", async () => {
    montarEmPausa(<SecaoMonitoramento />, { ...r, monitoramento: { ...MONITORAMENTO_DEMONSTRACAO, demonstracao: undefined } });
    const sec = screen.getByRole("region", { name: "Monitoramento prospectivo" });
    expect(within(sec).queryByText(/Demonstração da interface/)).not.toBeInTheDocument();
    await userEvent.click(within(sec).getByRole("button", { name: "cenário B, versão 2" }));
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByText("Versão 2 · 27 out. 2026")).toBeInTheDocument();
    expect(within(painel).getByText("Contradita")).toBeInTheDocument();
  });

  it("exploração: mapa, linha do tempo e evidências como vistas, separadas da análise; o cenário escolhido acompanha", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Exploração e evidências" });
    expect(
      within(sec)
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Mapa de relações", "Linha do tempo", "Evidências e fontes"]);
    const b = r.cenarios[1];
    // escolher o cenário na seção 02 destaca o mesmo cenário na linha do tempo e no mapa
    await userEvent.click(screen.getByRole("button", { name: /^Cenário B:/ }));
    await userEvent.click(within(sec).getByRole("tab", { name: "Linha do tempo" }));
    expect(within(sec).getByRole("tab", { name: "Linha do tempo" })).toHaveAttribute("aria-selected", "true");
    expect(within(sec).getByRole("heading", { level: 3, name: b.nome })).toBeInTheDocument();
    await userEvent.click(within(sec).getByRole("tab", { name: "Mapa de relações" }));
    expect(within(sec).getByRole("group", { name: new RegExp(`cenário B: ${b.nome}`) })).toBeInTheDocument();
    await userEvent.click(within(sec).getByRole("tab", { name: "Evidências e fontes" }));
    expect(within(sec).getByRole("searchbox", { name: "Pesquisar afirmações e fontes" })).toBeInTheDocument();
  });

  it("05 linha do tempo: faixas por cenário, eventos focáveis que abrem no painel, comparação e alternativa em lista", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Exploração e evidências" });
    await userEvent.click(within(sec).getByRole("tab", { name: "Linha do tempo" }));
    const vista = within(sec).getByRole("tabpanel");
    expect(within(vista).getByRole("group", { name: /Timeline de/ })).toBeInTheDocument();
    await userEvent.click(within(vista).getByRole("button", { name: /^Cenário B:/ }));
    expect(within(vista).getByRole("button", { name: /^Cenário B:/ })).toHaveAttribute("aria-pressed", "true");
    const evento = within(vista).getByRole("button", { name: /STF condena Jair Bolsonaro/ });
    fireEvent.focus(evento);
    expect(screen.getAllByText("STF condena Jair Bolsonaro a 27 anos e 3 meses.").length).toBeGreaterThan(0);
    fireEvent.keyDown(evento, { key: "Enter" });
    expect(screen.getByRole("complementary", { name: "Painel contextual" })).toHaveTextContent("Atores envolvidos");
    await userEvent.click(within(vista).getByRole("button", { name: /Comparar lado a lado/ }));
    expect(within(screen.getByRole("table", { name: /Comparação dos cenários/ })).getByText("Gatilho")).toBeInTheDocument();
    await userEvent.click(within(vista).getByRole("button", { name: /Ver como lista/ }));
    expect(screen.getByRole("separator", { name: /Hoje/ })).toBeInTheDocument();
  });

  it("endereços antigos de área continuam válidos e abrem a vista na seção 05", () => {
    render(
      <MemoryRouter initialEntries={["/x?area=cenarios"]}>
        <Routes>
          <Route path="/x" element={<ResultadoDaInvestigacao r={r} abaInicial={abaDoEndereco("cenarios")} />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("tab", { name: "Linha do tempo" })).toHaveAttribute("aria-selected", "true");
    expect(abaDoEndereco("visao")).toBeNull();
    expect(abaDoEndereco("leitura")).toBeNull();
    expect(abaDoEndereco("evidencias")).toBe("evidencias");
    expect(abaDoEndereco("fontes")).toBe("evidencias");
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
    expect(
      within(seletor)
        .getAllByRole("button")
        .map((b) => b.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["Hoje", "Cenário A", "Cenário B", "Cenário C"]);
  });

  it("trocar de cenário atualiza a identificação, lista as mudanças e preserva o zoom", async () => {
    montar();
    const svg = screen.getByRole("group", { name: /Relações entre países/ });
    const antes = svg.getAttribute("viewBox");
    await userEvent.click(within(screen.getByRole("group", { name: /Vista do mapa/ })).getByRole("button", { name: /Cenário B/ }));
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
    // no painel lateral da página os detalhes já vêm abertos (o flutuante do mapa os recolhia)
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
    expect(
      within(blocos)
        .getAllByRole("button")
        .map((b) => b.textContent?.replace(/\d|[+−]/g, "").trim()),
    ).toEqual(["Escudo", "Mercosul", "BRICS"]);
    const brics = within(blocos).getByRole("button", { name: /BRICS/ });
    await userEvent.click(brics);
    expect(brics).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Brasil, China")).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("group", { name: /Vista do mapa/ })).getByRole("button", { name: /Cenário B/ }));
    expect(within(blocos).getByRole("button", { name: /Escudo/ })).toHaveTextContent("+1");
  });

  it("a lista em texto é a alternativa acessível ao mapa", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { name: /Lista/ }));
    expect(screen.getByText(/relações hoje/)).toBeInTheDocument();
  });
});
