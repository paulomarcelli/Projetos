import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as servicos from "../services";
import type { ResumoDeInvestigacao } from "../types/api";
import { fixtures, montar, resumoDe } from "./apoioDeTeste";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return { ...real, listarInvestigacoes: vi.fn(), excluirInvestigacao: vi.fn(), guardarInvestigacao: vi.fn(), desguardarInvestigacao: vi.fn() };
});
const s = vi.mocked(servicos);

function lista(): ResumoDeInvestigacao[] {
  const thor = resumoDe(fixtures.investigacao());
  const china = resumoDe(fixtures.investigacaoFora());
  return [
    { ...china, criada_em: "2026-11-02T22:40:00Z" },
    { ...thor, guardada: true },
    { ...thor, id: "rodando1", questao: "Qual o futuro de Wakanda depois de T'Challa?", estado: "analisando", cenarios: 0, criada_em: "2026-11-02T20:00:00Z", atualizada_em: "2026-11-02T23:29:00Z" },
    { ...thor, id: "ontem1", questao: "O que pode acontecer com a Feiticeira Escarlate?", criada_em: "2026-11-01T18:00:00Z" },
    { ...thor, id: "semana1", questao: "Que conexão existe entre Thanos e Tony Stark?", estado: "falhou", erro: "tempo esgotado", cenarios: 0, criada_em: "2026-10-29T10:00:00Z" },
    { ...thor, id: "velha1", questao: "Qual o futuro dos Vingadores depois de Thanos?", criada_em: "2026-09-01T10:00:00Z" },
  ];
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T23:30:00Z") });
  localStorage.clear();
  s.listarInvestigacoes.mockResolvedValue(lista());
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Histórico", () => {
  it("agrupa por dia: Hoje, Ontem, Esta semana, Mais antigas", async () => {
    montar("/historico");
    await screen.findByRole("heading", { level: 2, name: /^Hoje/ });
    const grupos = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent?.match(/^(Hoje|Ontem|Esta semana|Mais antigas) /)?.[1]);
    expect(grupos).toEqual(["Hoje", "Ontem", "Esta semana", "Mais antigas"]);
    const hoje = screen.getByRole("region", { name: /^Hoje/ });
    expect(within(hoje).getAllByRole("listitem")).toHaveLength(3);
    expect(within(hoje).getAllByText("Analisando").length).toBeGreaterThan(0);
    expect(screen.getByText("tempo esgotado")).toBeInTheDocument();
    expect(s.listarInvestigacoes).toHaveBeenCalledWith(expect.objectContaining({ limite: 1000 }));
  });

  it("filtra por texto (sem acento), estado e só guardadas", async () => {
    montar("/historico");
    await screen.findByRole("heading", { level: 2, name: /^Hoje/ });
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar no histórico" }), "feiticeira");
    expect(screen.getAllByRole("link", { name: /Feiticeira Escarlate/ })).toHaveLength(1);
    expect(screen.getByText("1 de 6 análises")).toBeInTheDocument();
    await userEvent.clear(screen.getByRole("searchbox", { name: "Buscar no histórico" }));

    await userEvent.click(screen.getByRole("radio", { name: /Falharam/ }));
    expect(screen.getAllByRole("link", { name: /Thanos e Tony Stark/ })).toHaveLength(1);
    await userEvent.click(screen.getByRole("radio", { name: /Todas/ }));

    await userEvent.click(screen.getByRole("switch", { name: "Só guardadas" }));
    expect(screen.getAllByRole("link", { name: /Thor e Loki/ })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /China e Taiwan/ })).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar no histórico" }), "zzz");
    expect(screen.getByText("Nenhuma análise com esses filtros")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByText("6 análises")).toBeInTheDocument();
  });

  it("excluir é otimista e volta com o aviso se a API recusar", async () => {
    let rejeitar: (e: unknown) => void = () => {};
    s.excluirInvestigacao.mockImplementation(() => new Promise((_, r) => (rejeitar = r)));
    montar("/historico");
    const cartao = (await screen.findAllByRole("link", { name: /China e Taiwan/ }))[0].closest("li")!;
    await userEvent.click(within(cartao).getByRole("button", { name: "Excluir análise" }));
    const dialogo = screen.getByRole("alertdialog", { name: "Excluir esta análise?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));
    // sai na hora
    await waitFor(() => expect(screen.queryByRole("link", { name: /China e Taiwan/ })).not.toBeInTheDocument());
    rejeitar(new servicos.ErroDaApi("servidor", "erro interno", 500));
    // volta, no mesmo lugar, e o aviso explica
    expect(await screen.findByText(/Não consegui excluir: erro interno\. A análise continua no histórico\./)).toBeInTheDocument();
    const links = screen.getAllByRole("link").filter((a) => a.classList.contains("fr-cartao-link"));
    expect(links[0]).toHaveTextContent(/China e Taiwan/);
  });

  it("excluir com sucesso some de vez; em execução, o diálogo explica em vez de chamar a API", async () => {
    s.excluirInvestigacao.mockResolvedValue(undefined);
    montar("/historico");
    const cartao = (await screen.findAllByRole("link", { name: /Feiticeira/ }))[0].closest("li")!;
    await userEvent.click(within(cartao).getByRole("button", { name: "Excluir análise" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText(/Análise excluída/)).toBeInTheDocument();
    expect(s.excluirInvestigacao).toHaveBeenCalledWith("ontem1");

    const rodando = screen.getAllByRole("link", { name: /Wakanda/ })[0].closest("li")!;
    await userEvent.click(within(rodando).getByRole("button", { name: /Excluir/ }));
    const d = screen.getByRole("alertdialog", { name: "Esta análise ainda está em execução" });
    await userEvent.click(within(d).getByRole("button", { name: "Entendi" }));
    expect(s.excluirInvestigacao).toHaveBeenCalledTimes(1);
  });

  it("guardar pelo cartão é otimista; erro desfaz", async () => {
    s.guardarInvestigacao.mockRejectedValueOnce(new servicos.ErroDaApi("indisponivel", "x"));
    montar("/historico");
    const cartao = (await screen.findAllByRole("link", { name: /China e Taiwan/ }))[0].closest("li")!;
    await userEvent.click(within(cartao).getByRole("button", { name: "Guardar análise" }));
    expect(await screen.findByText(/Não consegui guardar: a API não respondeu/)).toBeInTheDocument();
    expect(within(cartao).getByRole("button", { name: "Guardar análise" })).toHaveAttribute("aria-pressed", "false");
  });

  it("histórico vazio e API fora do ar", async () => {
    s.listarInvestigacoes.mockResolvedValueOnce([]);
    const { unmount } = montar("/historico");
    expect(await screen.findByText("Nenhuma análise no histórico")).toBeInTheDocument();
    unmount();
    s.listarInvestigacoes.mockRejectedValueOnce(new servicos.ErroDaApi("indisponivel", "x"));
    montar("/historico");
    expect(await screen.findByText("Não consegui falar com a F.R.E.Y.A.")).toBeInTheDocument();
  });
});
