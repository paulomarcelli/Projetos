import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { abaDoEndereco } from "../components/analysis/investigacao/contexto";
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

  it("cinco seções, na ordem do raciocínio, cada uma com a sua pergunta; o índice leva a cada uma", () => {
    montar();
    const titulos: string[] = SECOES.map((x) => x.titulo);
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent)
        .filter((t) => titulos.includes(t ?? "")),
    ).toEqual(titulos);
    for (const x of SECOES) expect(screen.getByText(x.pergunta)).toBeInTheDocument();
    const indice = screen.getByRole("navigation", { name: "Seções da investigação" });
    const links = within(indice).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(SECOES.map((x) => `#${x.id}`));
    expect(links[0]).toHaveAttribute("aria-current", "location");
    // botão de voltar ao topo existe (aparece depois de rolar)
    const topo = document.querySelector("button.voltar-ao-topo");
    expect(topo).toHaveAttribute("aria-label", "Voltar ao início da investigação");
    expect(topo).not.toHaveAttribute("data-visivel"); // só aparece depois de rolar
  });

  it("cabeçalho compacto: aviso contrafactual numa linha; a origem abre em 'Ver contexto'", async () => {
    montar();
    expect(screen.getByRole("heading", { level: 1, name: r.pergunta })).toBeInTheDocument();
    expect(screen.getByText(r.avisoDeContexto.texto, { exact: false })).toBeInTheDocument();
    const ver = screen.getByRole("button", { name: /Ver contexto/ });
    expect(ver).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("contexto-da-investigacao")).toHaveClass("hidden");
    await userEvent.click(ver);
    expect(screen.getByRole("button", { name: /Ocultar contexto/ })).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("contexto-da-investigacao")).not.toHaveClass("hidden");
    expect(screen.getByText(r.origem)).toBeInTheDocument();
  });

  it("faixa de números: horizonte, cenários, incertezas, sinais e evidências, cada um levando ao seu lugar", async () => {
    montar();
    const faixa = screen.getByRole("list", { name: "A investigação em números" });
    expect(faixa).toHaveTextContent(`${r.horizonte.inicio}–${r.horizonte.fim}`);
    const botao = (rotulo: RegExp) => within(faixa).getByRole("button", { name: rotulo });
    expect(botao(new RegExp(`^${r.cenarios.length} cenários: ir para 02`))).toBeInTheDocument();
    expect(botao(new RegExp(`^${r.incertezas.length} incertezas críticas: ir para 01`))).toBeInTheDocument();
    expect(botao(new RegExp(`^${r.sinais.length} sinais a observar: ir para 04`))).toBeInTheDocument();
    // evidências abre a vista de fontes na seção 05
    await userEvent.click(botao(new RegExp(`^${r.evidencias.length} evidências: ir para 05`)));
    expect(screen.getByRole("tab", { name: "Evidências e fontes" })).toHaveAttribute("aria-selected", "true");
  });

  it("01 diagnóstico: primeira dobra com síntese, o que separa os futuros e o mapa; a leitura completa abre na página", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Diagnóstico estratégico" });
    expect(within(sec).getByText(r.sintese)).toBeInTheDocument();
    // o que separa os futuros: cada incerteza com a pergunta e quais cenários ela separa (lido de `posicao`)
    expect(within(sec).getByRole("heading", { name: "O que separa os futuros" })).toBeInTheDocument();
    for (const i of r.incertezas) expect(within(sec).getAllByText(i.pergunta, { exact: false }).length).toBeGreaterThan(0);
    expect(within(sec).getAllByText(/^Separa/).length).toBe(r.incertezas.length);
    // o mapa dos futuros (matriz 2×2) está na primeira dobra
    expect(within(sec).getByRole("heading", { name: "Mapa dos futuros" })).toBeInTheDocument();
    const [x] = r.incertezas;
    const a = r.cenarios[0];
    expect(within(sec).getByRole("button", { name: new RegExp(`Cenário A, ${a.nome}: ${x.nome}, ${x.polos[a.posicao[x.id]!]}`) })).toBeInTheDocument();
    // a leitura completa (interpretação e dinâmicas) abre na própria página
    const abrir = within(sec).getByRole("button", { name: /Ler o diagnóstico completo/ });
    expect(abrir).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(abrir);
    expect(within(sec).getByRole("button", { name: /Recolher o diagnóstico completo/ })).toHaveAttribute("aria-expanded", "true");
    for (const t of ["Interpretação estratégica da Iris", "Dinâmicas geopolíticas e fatores determinantes", "Por que estas incertezas"])
      expect(within(sec).getByRole("heading", { name: t })).toBeInTheDocument();
    // os fatores aparecem na narrativa (nome: estado atual), não numa tabela à parte
    expect(within(sec).getByText(new RegExp(`^${r.variaveis[0].nome}:`))).toBeInTheDocument();
    expect(within(sec).getByText("Marcas:")).toBeInTheDocument();
    // um ator citado no texto abre no painel contextual
    await userEvent.click(within(sec).getAllByRole("button", { name: "EUA" })[0]);
    expect(screen.getByRole("complementary", { name: "Painel contextual" })).toHaveTextContent("Papel na dinâmica");
  });

  it("02 cenários: três cartões curtos e o detalhe completo (os dez itens) no painel", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Cenários prospectivos" });
    for (const c of r.cenarios) {
      expect(within(sec).getByRole("button", { name: new RegExp(`Cenário ${c.id}: ${c.nome}`) })).toBeInTheDocument();
      expect(within(sec).getByText(c.ideia)).toBeInTheDocument();
    }
    // cartão curto: a trajetória, o primeiro sinal a observar e as contagens; o resto fica no painel
    expect(within(sec).getAllByText("Primeiro sinal a observar")).toHaveLength(3);
    for (const c of r.cenarios) expect(within(sec).getByText(r.sinais.find((x) => x.id === c.indicadores[0])!.sinal)).toBeInTheDocument();
    expect(within(sec).getAllByText(/premissas? · \d+ evidências?/)).toHaveLength(3);
    expect(within(sec).queryByText("Lógica de desenvolvimento")).not.toBeInTheDocument();
    const titulo = within(sec).getByRole("button", { name: /Cenário C:/ });
    await userEvent.click(titulo);
    expect(titulo).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(sec).getAllByRole("button", { name: "Explorar o cenário" })[1]);
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByRole("heading", { level: 3, name: r.cenarios[1].nome })).toBeInTheDocument();
    for (const item of [
      "Lógica de desenvolvimento",
      "Premissas fundamentais",
      "Consequências estratégicas",
      "Indicadores observáveis",
      "Sinais de mudança",
      "Condições que favorecem",
      "Condições que enfraquecem",
      "Atualização e versões anteriores",
    ])
      expect(within(painel).getByText(item)).toBeInTheDocument();
    expect(within(painel).getByText(/atualizado em .*sem probabilidade atribuída/)).toBeInTheDocument();
    // sem monitoramento, as premissas dizem "sem revisão registrada" (e nunca "confirmada")
    expect(within(painel).getAllByText("Sem revisão registrada")).toHaveLength(r.cenarios[1].premissas.length);
  });

  it("03 comparação: só o que diferencia os futuros, sem repetir a matriz (que subiu ao diagnóstico), sem percentuais", () => {
    montar();
    const sec = screen.getByRole("region", { name: "Comparação estratégica" });
    expect(within(sec).getByText(/não atribui probabilidade, nota nem peso/)).toBeInTheDocument();
    expect(within(within(sec).getByRole("table", { name: /Direção de cada fator/ })).getByText(r.variaveis[0].direcao.B)).toBeInTheDocument();
    // condições, gatilhos e revisão numa tabela só
    const condicoes = within(sec).getByRole("table", { name: /Condições, gatilhos e o que levaria a revisar/ });
    expect(within(condicoes).getByText(r.cenarios[0].revisao[0])).toBeInTheDocument();
    expect(within(condicoes).getByText(r.cenarios[0].condicoes[0])).toBeInTheDocument();
    // os sinais não se repetem aqui: a comparação aponta para o monitoramento
    expect(within(sec).queryByRole("table", { name: /Sinais de alerta/ })).not.toBeInTheDocument();
    expect(within(sec).getByRole("link", { name: "04 Monitoramento" })).toHaveAttribute("href", "#sec-monitoramento");
    expect(matrizAplicavel(r)).toBe(true);
    expect(within(sec).queryByRole("button", { name: /^Cenário A, / })).not.toBeInTheDocument();
    expect(within(sec).queryByRole("table", { name: /Linha do tempo/ })).not.toBeInTheDocument();
  });

  it("01 a matriz 2×2 não é forçada quando a investigação não a sustenta: o mapa vira lista", () => {
    const umaSo = { ...r, incertezas: r.incertezas.slice(0, 1) };
    expect(matrizAplicavel(umaSo)).toBe(false);
    render(
      <MemoryRouter>
        <ResultadoDaInvestigacao r={umaSo} />
      </MemoryRouter>,
    );
    const sec = screen.getByRole("region", { name: "Diagnóstico estratégico" });
    expect(within(sec).getByRole("heading", { name: "Mapa dos futuros" })).toBeInTheDocument();
    expect(within(sec).queryByRole("button", { name: /^Cenário A, / })).not.toBeInTheDocument();
    expect(within(sec).getByText(umaSo.incertezas[0].nome)).toBeInTheDocument();
  });

  it("04 monitoramento sem servidor: sinais a observar na frente, estado num cartão e nenhuma caixa vazia", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Monitoramento prospectivo" });
    expect(within(sec).getByText("Acompanhamento automático inativo")).toBeInTheDocument();
    // sem servidor, acontecimentos, impacto e revisão não ocupam a página com estados vazios
    expect(within(sec).queryByRole("heading", { name: "Novos acontecimentos" })).not.toBeInTheDocument();
    expect(within(sec).queryByText(/Sem acontecimentos novos/)).not.toBeInTheDocument();
    expect(within(sec).queryByText("Nenhuma registrada")).not.toBeInTheDocument();
    // os sinais: os cinco primeiros à vista, o resto a um clique
    expect(within(sec).getByRole("heading", { name: "Sinais a observar" })).toBeInTheDocument();
    expect(within(sec).getByText(r.sinais[0].sinal)).toBeInTheDocument();
    const ultimo = r.sinais.at(-1)!;
    expect(within(sec).queryByText(ultimo.sinal)).not.toBeInTheDocument();
    await userEvent.click(within(sec).getByRole("button", { name: `Ver os ${r.sinais.length} sinais` }));
    expect(within(sec).getByText(ultimo.sinal)).toBeInTheDocument();
    // o histórico continua vindo do que existe
    expect(within(sec).getByText(r.revisoes[0].texto)).toBeInTheDocument();
    expect(within(sec).getByText(new RegExp(`Versão ${r.versao} em vigor`))).toBeInTheDocument();
    expect(within(sec).getByText(/versões anteriores dos cenários não estão disponíveis/)).toBeInTheDocument();
    expect(within(sec).queryByText("Fictício")).not.toBeInTheDocument();
  });

  it("04 demonstração (só prévia/desenvolvimento): dados fictícios marcados como tais, ligados e desligados", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Monitoramento prospectivo" });
    await userEvent.click(within(sec).getByRole("button", { name: "Ver com dados fictícios" }));
    expect(within(sec).getByText(/Demonstração da interface/)).toBeInTheDocument();
    const impacto = within(sec).getByRole("table", { name: /Impacto de cada acontecimento/ });
    expect(within(impacto).getAllByText("Exige investigação").length).toBeGreaterThan(0);
    expect(within(sec).getAllByText("Fictício").length).toBeGreaterThan(2);
    expect(within(sec).getByText("Contradita")).toBeInTheDocument();
    for (const t of ["Nova evidência", "Nova interpretação", "Revisão de premissa", "Revisão de cenário"])
      expect(within(sec).getByText(`· ${t}`)).toBeInTheDocument();
    // sem placar: nenhuma soma de impactos por cenário
    expect(sec.textContent).not.toMatch(/\d+\s+(favorecem|confirmam)/);
    await userEvent.click(within(sec).getByRole("button", { name: "Voltar aos dados da investigação" }));
    expect(within(sec).queryByText("Fictício")).not.toBeInTheDocument();
  });

  it("04 com monitoramento do servidor: sem botão de demonstração e com versões anteriores consultáveis", async () => {
    const real = { ...r, monitoramento: { ...MONITORAMENTO_DEMONSTRACAO, demonstracao: undefined } };
    render(
      <MemoryRouter>
        <ResultadoDaInvestigacao r={real} />
      </MemoryRouter>,
    );
    const sec = screen.getByRole("region", { name: "Monitoramento prospectivo" });
    expect(within(sec).queryByRole("button", { name: /dados fictícios/ })).not.toBeInTheDocument();
    expect(within(sec).queryByText(/Demonstração da interface/)).not.toBeInTheDocument();
    await userEvent.click(within(sec).getByRole("button", { name: "cenário B, versão 2" }));
    const painel = screen.getByRole("complementary", { name: "Painel contextual" });
    expect(within(painel).getByText("Versão 2 · 27 out. 2026")).toBeInTheDocument();
    // a premissa revista aparece com o efeito no detalhe do cenário
    expect(within(painel).getByText("Contradita")).toBeInTheDocument();
  });

  it("05 exploração: mapa, linha do tempo e evidências como vistas; links de outras seções abrem a vista", async () => {
    montar();
    const sec = screen.getByRole("region", { name: "Exploração e evidências" });
    expect(
      within(sec)
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Mapa de relações", "Linha do tempo", "Evidências e fontes"]);
    const b = r.cenarios[1];
    await userEvent.click(screen.getByRole("button", { name: /Abrir o cenário B na linha do tempo/ }));
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
