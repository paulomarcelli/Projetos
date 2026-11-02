import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorDePreferencias } from "../../contexts/Preferencias";
import { fixtures } from "../../pages/apoioDeTeste";
import * as servicos from "../../services";
import type { GrafoDaInvestigacao } from "../../types/api";
import { ExploradorDoGrafo } from "./ExploradorDoGrafo";
import { curvaturas, mesclar, daExpansao, dadosIniciais } from "./modelo";

vi.mock("../../services", async (original) => {
  const real = await original<typeof import("../../services")>();
  return { ...real, expandirNo: vi.fn(), caminhosEntre: vi.fn() };
});
const s = vi.mocked(servicos);

function montar(grafo: GrafoDaInvestigacao, props: Partial<Parameters<typeof ExploradorDoGrafo>[0]> = {}) {
  return render(
    <ProvedorDePreferencias>
      <ExploradorDoGrafo investigacaoId="32aa2add9f5b" grafo={grafo} {...props} />
    </ProvedorDePreferencias>,
  );
}

const no = (id: string) => document.querySelector(`[data-no-id="${id}"]`) as SVGGElement;

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

describe("ExploradorDoGrafo", () => {
  it("desenha os 99 nós e as 169 arestas do grafo real, com as focais em destaque", () => {
    montar(fixtures.grafo());
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(99);
    expect(document.querySelectorAll("[data-aresta-id]")).toHaveLength(169);
    expect(screen.getByRole("group", { name: /Grafo da investigação: 99 entidades e 169 relações/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thor, personagem, entidade focal" })).toBeInTheDocument();
    // posições calculadas (a simulação assentou e parou)
    expect(no("character:loki").getAttribute("transform")).toMatch(/^translate\(-?\d/);
    // legenda de tipos com as contagens da API
    const filtros = screen.getByRole("group", { name: "Filtrar por tipo de entidade" });
    expect(within(filtros).getByRole("button", { name: /Personagem\s*41/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("clicar num nó abre o painel com descrição, atributos e relações em português", async () => {
    montar(fixtures.grafo());
    await userEvent.click(no("character:loki"));
    const painel = screen.getByRole("complementary", { name: "Detalhes do grafo" });
    expect(within(painel).getByRole("heading", { name: "Loki", level: 3 })).toBeInTheDocument();
    const loki = fixtures.grafo().nos.find((n) => n.id === "character:loki")!;
    expect(within(painel).getByText(loki.descricao!)).toBeInTheDocument();
    expect(within(painel).getByText("Nome real")).toBeInTheDocument();
    expect(within(painel).getByRole("heading", { name: /Relações neste grafo/ })).toHaveTextContent("(42)");
    expect(within(painel).getAllByText(/^aliado de/).length).toBeGreaterThan(0);
    // ir a um vizinho pelo painel
    await userEvent.click(within(painel).getAllByRole("button", { name: "Thor" })[0]);
    expect(within(painel).getByRole("heading", { name: "Thor", level: 3 })).toBeInTheDocument();
    expect(document.querySelector('[data-no-id][aria-pressed="true"]')?.getAttribute("aria-label")).toMatch(/^Thor,/);
    expect(no("character:loki")).toHaveAttribute("aria-pressed", "false");
  });

  it("teclado: Tab entra num nó, setas passam de um a outro e Enter abre o painel", async () => {
    const u = userEvent.setup();
    montar(fixtures.grafo());
    const primeiro = no("character:thor-thor-odinson");
    primeiro.focus();
    expect(primeiro).toHaveAttribute("tabindex", "0");
    await u.keyboard("{ArrowRight}");
    await waitFor(() => expect(no("character:loki")).toHaveFocus());
    await u.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Loki", level: 3 })).toBeInTheDocument();
    await u.keyboard("{Escape}");
  });

  it("filtrar por tipo esconde os nós e as arestas daquele tipo", async () => {
    montar(fixtures.grafo());
    const filtros = screen.getByRole("group", { name: "Filtrar por tipo de entidade" });
    await userEvent.click(within(filtros).getByRole("button", { name: /Acontecimento\s*40/ }));
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(59);
    expect(document.querySelectorAll('[data-no-id^="event:"]')).toHaveLength(0);
    expect(screen.getByText(/\(de 99\)/)).toBeInTheDocument();
  });

  it("ver como lista mostra as tabelas de entidades e relações", async () => {
    montar(fixtures.grafo());
    await userEvent.click(screen.getByRole("button", { name: "Ver como lista" }));
    const tabelas = screen.getAllByRole("table");
    expect(tabelas).toHaveLength(2);
    expect(within(tabelas[0]).getByRole("button", { name: "Thor" })).toBeInTheDocument();
    expect(within(tabelas[1]).getAllByRole("row")).toHaveLength(170); // cabeçalho + 169
    await userEvent.click(within(tabelas[0]).getByRole("button", { name: "Loki" }));
    expect(screen.getByRole("heading", { name: /Relações de Loki/ })).toBeInTheDocument();
  });

  it("destacar um caminho entre as focais e um cenário (grafo.caminhos / grafo.cenarios)", async () => {
    montar(fixtures.grafo());
    const seletor = screen.getByRole("combobox", { name: "Destacar" });
    await userEvent.selectOptions(seletor, "caminho:P1");
    expect(screen.getByText("Caminho P1: Thor → Loki")).toBeInTheDocument();
    const arestaP1 = document.querySelector('[data-aresta-id="character:loki|ALLY_OF|character:thor-thor-odinson|marvel:character:loki:on-screen"]');
    expect(arestaP1).toHaveClass("stroke-escarlate");
    await userEvent.selectOptions(seletor, "cenario:C2");
    expect(screen.getByText("Cenário C2: Reaproximação condicional")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-aresta-id].stroke-escarlate")).toHaveLength(10);
  });

  it("expandir vizinhos junta os nós novos com papel expansão", async () => {
    s.expandirNo.mockResolvedValue(fixtures.expansao());
    // movimento reduzido: a simulação reassenta de uma vez, sem quadros animados
    localStorage.setItem("freya:preferencias", JSON.stringify({ reduzirMovimento: true }));
    montar(fixtures.grafo());
    await userEvent.click(no("character:loki"));
    await userEvent.click(screen.getByRole("button", { name: "Expandir vizinhos" }));
    expect(s.expandirNo).toHaveBeenCalledWith("32aa2add9f5b", "character:loki", 12);
    expect(await screen.findByText(/Entraram 3 entidades novas/)).toBeInTheDocument();
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(102);
    expect(no("character:jane-foster")).toBeInTheDocument();
  });

  it("caminho até… pede à API e destaca o que voltar (ou diz que não há caminho)", async () => {
    s.caminhosEntre.mockResolvedValueOnce(fixtures.caminho());
    montar(fixtures.grafo());
    await userEvent.click(no("character:thor-thor-odinson"));
    await userEvent.click(screen.getByRole("button", { name: "Caminho até…" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Caminho de Thor até…" }), "Loki");
    await userEvent.click(within(screen.getByRole("list", { name: "Entidades do grafo" })).getByRole("button", { name: /^Loki\s*Personagem$/ }));
    expect(s.caminhosEntre).toHaveBeenCalledWith("32aa2add9f5b", "character:thor-thor-odinson", "character:loki");
    expect(await screen.findByText(/5 caminhos até Loki/)).toBeInTheDocument();
    expect(screen.getByText("Caminho até Loki")).toBeInTheDocument();

    s.caminhosEntre.mockResolvedValueOnce({ de: "a", para: "character:zeus", existe: false, caminhos: [], evidencias: {} });
    await userEvent.clear(screen.getByRole("textbox", { name: "Caminho de Thor até…" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Caminho de Thor até…" }), "Zeus");
    await userEvent.click(within(screen.getByRole("list", { name: "Entidades do grafo" })).getAllByRole("button", { name: /^Zeus/ })[0]);
    expect(await screen.findByText(/Sem caminho entre/)).toBeInTheDocument();
  });

  it("reproduzir a revelação começa pelas focais e pode ser pulada", async () => {
    montar(fixtures.grafo());
    await userEvent.click(screen.getByRole("button", { name: "Reproduzir" }));
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(2);
    expect(screen.getAllByText("entidades focais").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "Pular" }));
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(99);
  });

  it("grafo sem relações (fora do domínio) mostra o estado vazio explicado", () => {
    montar(fixtures.grafoFora());
    expect(screen.getByText("Sem relações para explorar")).toBeInTheDocument();
    expect(screen.getByText(/China/)).toBeInTheDocument();
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(0);
  });

  it("modo compacto: clicar num nó chama aoEscolherNo (sem painel)", async () => {
    const aoEscolherNo = vi.fn();
    montar(fixtures.grafo(), { modo: "compacto", aoEscolherNo });
    await userEvent.click(no("character:loki"));
    expect(aoEscolherNo).toHaveBeenCalledWith("character:loki");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});

describe("modelo do grafo", () => {
  it("arestas paralelas Thor–Loki se abrem em leque e a expansão não duplica", () => {
    const g = fixtures.grafo();
    const c = curvaturas(g.arestas);
    const paralelas = g.arestas.filter((a) => [a.origem, a.destino].sort().join() === ["character:loki", "character:thor-thor-odinson"].sort().join());
    // no sentido canônico do par, cada uma fica numa curva diferente
    const canonico = paralelas.map((a) => (a.origem < a.destino ? c.get(a.id)! : -c.get(a.id)!));
    expect(new Set(canonico).size).toBe(paralelas.length);
    const uma = mesclar(dadosIniciais(g), daExpansao(fixtures.expansao()));
    const duas = mesclar(uma, daExpansao(fixtures.expansao()));
    expect(duas.nos).toHaveLength(uma.nos.length);
    expect(uma.nos.filter((n) => n.papel === "expansao")).toHaveLength(3);
  });
});
