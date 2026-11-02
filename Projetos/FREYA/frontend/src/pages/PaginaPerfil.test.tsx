import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as servicos from "../services";
import { fixtures, montar, resumoDe } from "./apoioDeTeste";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return { ...real, listarInvestigacoes: vi.fn() };
});
const s = vi.mocked(servicos);

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

describe("Perfil", () => {
  it("edita nome e função com prévia das iniciais, salva no navegador e avisa que não há contas", async () => {
    const inv = fixtures.investigacao();
    s.listarInvestigacoes.mockResolvedValue([resumoDe(inv, { guardada: true }), resumoDe(fixtures.investigacaoFora())]);
    montar("/perfil");
    expect(await screen.findByText(/Seu perfil fica salvo só neste navegador — a F\.R\.E\.Y\.A\. ainda não tem contas de usuário/)).toBeInTheDocument();

    const nome = screen.getByRole("textbox", { name: /Nome/ });
    await userEvent.clear(nome);
    await userEvent.type(nome, "Wanda Maximoff");
    await userEvent.clear(screen.getByRole("textbox", { name: "Função" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Função" }), "Feiticeira");
    expect(screen.getByText("WM")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem("freya:preferencias")!).perfil).toEqual({ nome: "Wanda Maximoff", funcao: "Feiticeira" }));
    expect(screen.getByText("Perfil salvo neste navegador.")).toBeInTheDocument();
    // o menu lateral acompanha
    expect(within(screen.getByRole("complementary", { name: "Menu lateral" })).getByText("Wanda Maximoff")).toBeInTheDocument();

    // atividade a partir dos dados reais
    const atividade = screen.getByRole("region", { name: "Atividade" });
    expect(within(atividade).getByText("Análises").nextElementSibling).toHaveTextContent("2");
    expect(within(atividade).getByText("Guardadas").nextElementSibling).toHaveTextContent("1");
    expect(within(atividade).getByText("Cenários gerados").nextElementSibling).toHaveTextContent("6");
  });

  it("nome vazio não salva", async () => {
    s.listarInvestigacoes.mockResolvedValue([]);
    montar("/perfil");
    await userEvent.clear(await screen.findByRole("textbox", { name: /Nome/ }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));
    expect(screen.getByText("Escreva como a F.R.E.Y.A. deve chamar você.")).toBeInTheDocument();
  });
});
