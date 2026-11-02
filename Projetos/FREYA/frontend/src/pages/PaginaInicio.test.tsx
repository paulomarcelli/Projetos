import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as servicos from "../services";
import { fixtures, montar, resumoDe } from "./apoioDeTeste";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return {
    ...real,
    listarInvestigacoes: vi.fn(),
    obterGrafo: vi.fn(),
    obterSaude: vi.fn(),
    criarInvestigacao: vi.fn(),
    acompanharInvestigacao: vi.fn(() => ({ cancelar: vi.fn() })),
  };
});

const s = vi.mocked(servicos);
const SAUDE = { status: "ok", motor: "modelo", modelo: "gpt-5.6-terra", grafo: "GrafoNeo4j", base: { hybrid: { documentos: 5047, chunks: 12874 }, grafo: { nos: 5711, arestas: 14566 } } };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T23:30:00Z") });
  localStorage.clear();
  s.obterSaude.mockResolvedValue(SAUDE);
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Dashboard", () => {
  it("sem análises: explorador vazio e elegante, sem grafo de mentira", async () => {
    s.listarInvestigacoes.mockResolvedValue([]);
    montar("/");
    expect(await screen.findByText("O grafo aparece aqui quando a primeira análise terminar")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma análise ainda")).toBeInTheDocument();
    expect(s.obterGrafo).not.toHaveBeenCalled();
    expect(document.querySelectorAll("[data-no-id]")).toHaveLength(0);
    // o painel Nova análise continua disponível, com a saudação do perfil
    expect(screen.getByText("Olá, Analista!")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova análise" })).toBeInTheDocument();
  });

  it("com análises: grafo real da mais recente e a lista por dia", async () => {
    const thor = fixtures.investigacao();
    const china = fixtures.investigacaoFora();
    // China/Taiwan é a mais recente, mas não tem relações: o explorador mostra a anterior e diz isso
    s.listarInvestigacoes.mockResolvedValue([resumoDe(china, { criada_em: "2026-11-02T22:40:00Z" }), resumoDe(thor), resumoDe(thor, { id: "ontem1", criada_em: "2026-11-01T15:00:00Z" })]);
    s.obterGrafo.mockImplementation(async (id) => (id === china.id ? fixtures.grafoFora() : fixtures.grafo()));
    montar("/");

    await waitFor(() => expect(document.querySelectorAll("[data-no-id]").length).toBe(99));
    const explorador = screen.getByRole("region", { name: "Explorador do grafo" });
    expect(within(explorador).getByText("99 entidades · 169 relações")).toBeInTheDocument();
    expect(within(explorador).getByText(/não tem relações no grafo; mostrando a anterior/)).toBeInTheDocument();
    expect(within(explorador).getByRole("link", { name: /Abrir/ })).toHaveAttribute("href", `/analises/${thor.id}?aba=grafo`);

    expect(screen.getByRole("heading", { name: /^Hoje/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Ontem/ })).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: thor.questao });
    expect(links[0]).toHaveAttribute("href", `/analises/${thor.id}`);
    expect(screen.getByText(/Motor: modelo · 12\.874 trechos · 5\.711 nós/)).toBeInTheDocument();
  });

  it("API fora do ar: aviso com tentar de novo, sem quebrar a página", async () => {
    s.listarInvestigacoes.mockRejectedValueOnce(new servicos.ErroDaApi("indisponivel", "A API da F.R.E.Y.A. não está respondendo.", 502));
    s.obterSaude.mockRejectedValue(new servicos.ErroDaApi("indisponivel", "fora", null));
    montar("/");
    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("Não consegui falar com a F.R.E.Y.A.")).toBeInTheDocument();
    expect(await screen.findByText("API fora do ar")).toBeInTheDocument();

    s.listarInvestigacoes.mockResolvedValueOnce([]);
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Nenhuma análise ainda")).toBeInTheDocument();
  });
});
