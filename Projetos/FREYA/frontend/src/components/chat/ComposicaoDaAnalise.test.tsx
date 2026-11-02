import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { montar } from "../../pages/apoioDeTeste";
import * as servicos from "../../services";

vi.mock("../../services", async (original) => {
  const real = await original<typeof import("../../services")>();
  return {
    ...real,
    criarInvestigacao: vi.fn(),
    acompanharInvestigacao: vi.fn(() => ({ cancelar: vi.fn() })),
    listarInvestigacoes: vi.fn(async () => []),
    obterSaude: vi.fn(async () => ({ status: "ok", motor: "modelo", modelo: null, grafo: "x", base: null })),
  };
});
const s = vi.mocked(servicos);

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

describe("Composição da análise (Nova análise)", () => {
  it("exemplo preenche questão e horizonte; enviar cria a investigação e abre a página dela", async () => {
    s.criarInvestigacao.mockResolvedValue({ id: "abc123", estado: "pendente", acompanhar: "/investigacoes/abc123" });
    const { roteador } = montar("/analises/nova");
    expect(screen.getByRole("heading", { level: 1, name: "Nova análise" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Como a relação entre Thor e Loki pode evoluir\?/ }));
    expect(screen.getByRole("textbox", { name: "Questão prospectiva" })).toHaveValue("Como a relação entre Thor e Loki pode evoluir?");
    expect(screen.getByRole("textbox", { name: "Horizonte (opcional)" })).toHaveValue("após Avengers: Endgame");
    // exemplos nunca enviam sozinhos (cada análise chama um modelo pago)
    expect(s.criarInvestigacao).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(s.criarInvestigacao).toHaveBeenCalledWith("Como a relação entre Thor e Loki pode evoluir?", "após Avengers: Endgame");
    await waitFor(() => expect(roteador.state.location.pathname).toBe("/analises/abc123"));
  });

  it("mostra a validação do backend (422) no próprio campo e não perde o texto", async () => {
    s.criarInvestigacao.mockRejectedValue(new servicos.ErroDaApi("invalido", 'O campo "questão" precisa ter pelo menos 8 caracteres.', 422));
    montar("/");
    const campo = screen.getByRole("textbox", { name: "Questão prospectiva" });
    await userEvent.type(campo, "Thor?{Enter}");
    expect(await screen.findByText('O campo "questão" precisa ter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveValue("Thor?");
  });

  it("questão vazia avisa sem chamar a API; API fora do ar mostra o aviso", async () => {
    s.criarInvestigacao.mockRejectedValue(new servicos.ErroDaApi("indisponivel", "x"));
    montar("/");
    await userEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(screen.getByText("Escreva a questão que você quer investigar.")).toBeInTheDocument();
    expect(s.criarInvestigacao).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole("textbox", { name: "Questão prospectiva" }), "Qual o futuro de Wakanda depois de T'Challa?");
    await userEvent.click(screen.getByRole("button", { name: "Analisar" }));
    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("Não consegui falar com a F.R.E.Y.A.")).toBeInTheDocument();
  });

  it("saúda pelo nome do perfil e lembra o escopo do MCU", () => {
    localStorage.setItem("freya:preferencias", JSON.stringify({ perfil: { nome: "Wanda Maximoff", funcao: "x" } }));
    montar("/");
    expect(screen.getByText("Olá, Wanda!")).toBeInTheDocument();
    expect(screen.getByText(/A base cobre a continuidade dos filmes e séries do MCU/)).toBeInTheDocument();
  });
});
