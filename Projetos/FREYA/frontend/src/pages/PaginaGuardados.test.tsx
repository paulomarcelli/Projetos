import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as servicos from "../services";
import { fixtures, montar, resumoDe } from "./apoioDeTeste";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return { ...real, listarInvestigacoes: vi.fn(), obterInvestigacao: vi.fn(), guardarInvestigacao: vi.fn(), desguardarInvestigacao: vi.fn() };
});
const s = vi.mocked(servicos);

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

describe("Guardados", () => {
  it("lista só as guardadas, com os nomes dos primeiros cenários, e remove com desfazer", async () => {
    const inv = { ...fixtures.investigacao(), guardada: true };
    s.listarInvestigacoes.mockResolvedValue([resumoDe(inv)]);
    s.obterInvestigacao.mockResolvedValue(inv);
    s.desguardarInvestigacao.mockResolvedValue(undefined);
    s.guardarInvestigacao.mockResolvedValue(undefined);
    montar("/guardados");
    expect(await screen.findByRole("link", { name: inv.questao })).toBeInTheDocument();
    expect(s.listarInvestigacoes).toHaveBeenCalledWith(expect.objectContaining({ guardadas: true }));
    const cenarios = await screen.findByRole("list", { name: "Primeiros cenários" });
    expect(within(cenarios).getAllByRole("listitem").map((li) => li.textContent)).toEqual(inv.analise!.cenarios.map((c) => c.nome));
    // a limitação do backend, dita com calma
    expect(screen.getByText(/Guarda-se a análise inteira/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remover dos guardados" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: inv.questao })).not.toBeInTheDocument());
    expect(s.desguardarInvestigacao).toHaveBeenCalledWith(inv.id);
    await userEvent.click(await screen.findByRole("button", { name: "Desfazer" }));
    expect(s.guardarInvestigacao).toHaveBeenCalledWith(inv.id);
    await waitFor(() => expect(s.listarInvestigacoes).toHaveBeenCalledTimes(2));
  });

  it("vazio explica como guardar", async () => {
    s.listarInvestigacoes.mockResolvedValue([]);
    montar("/guardados");
    expect(await screen.findByText("Nada guardado ainda")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o histórico" })).toHaveAttribute("href", "/historico");
  });
});
