import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as servicos from "../services";
import { montar } from "./apoioDeTeste";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return {
    ...real,
    obterSaude: vi.fn(async () => ({ status: "ok", motor: "modelo", modelo: "gpt-5.6-terra", grafo: "GrafoNeo4j", base: { hybrid: { documentos: 5047, chunks: 12874 }, grafo: { nos: 5711, arestas: 14566 } } })),
  };
});
vi.mocked(servicos);

const salvas = () => JSON.parse(localStorage.getItem("freya:preferencias") ?? "{}");

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

describe("Configurações", () => {
  it("a prévia mostra o rascunho; nada muda até Aplicar; Cancelar descarta", async () => {
    montar("/configuracoes");
    const previa = await screen.findByTestId("previa");
    expect(previa).toHaveAttribute("data-fonte", "outfit");

    await userEvent.click(screen.getByRole("radio", { name: /Atkinson Hyperlegible/ }));
    await userEvent.click(screen.getByRole("radio", { name: /Grande/ }));
    expect(previa).toHaveAttribute("data-fonte", "atkinson");
    expect(previa).toHaveAttribute("data-escala", "1.125");
    expect(previa.style.fontFamily).toContain("Atkinson Hyperlegible");
    expect(previa.style.getPropertyValue("--texto-2xl")).toBe("31.50px");
    // o resto da interface ainda não mudou
    expect(document.documentElement.dataset.fonte).toBe("outfit");
    expect(document.documentElement.style.fontSize).toBe("100%");
    expect(screen.getByText("Rascunho ainda não aplicado.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(previa).toHaveAttribute("data-fonte", "outfit");
    expect(screen.getByText("Rascunho descartado.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /IBM Plex Sans/ }));
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(document.documentElement.dataset.fonte).toBe("plex");
    await waitFor(() => expect(salvas().fonte).toBe("plex"));
  });

  it("Restaurar padrão pede confirmação e volta às preferências padrão", async () => {
    localStorage.setItem("freya:preferencias", JSON.stringify({ fonte: "inter", escala: 1.25, reduzirMovimento: true, perfil: { nome: "Wanda", funcao: "Bruxa" } }));
    montar("/configuracoes");
    await screen.findByTestId("previa");
    expect(document.documentElement.style.fontSize).toBe("125%");
    await userEvent.click(screen.getByRole("button", { name: "Restaurar padrão" }));
    const d = screen.getByRole("alertdialog", { name: "Restaurar as preferências padrão?" });
    await userEvent.click(within(d).getByRole("button", { name: "Restaurar" }));
    await waitFor(() => expect(salvas()).toMatchObject({ fonte: "outfit", escala: 1, reduzirMovimento: false, perfil: { nome: "Wanda" } }));
    expect(screen.getByTestId("previa")).toHaveAttribute("data-fonte", "outfit");
  });

  it("aparência vale na hora; estado da API vem do /saude", async () => {
    montar("/configuracoes");
    await userEvent.click(await screen.findByRole("switch", { name: "Reduzir movimento" }));
    expect(document.documentElement.dataset.movimento).toBe("reduzido");
    await userEvent.click(screen.getByRole("switch", { name: "Menu lateral recolhido" }));
    await waitFor(() => expect(salvas().menuRecolhido).toBe(true));
    await userEvent.click(screen.getByRole("radio", { name: "Escuro" }));
    await waitFor(() => expect(document.documentElement.dataset.tema).toBe("escuro"));

    const sobre = screen.getByRole("region", { name: "Sobre e estado da API" });
    expect(await within(sobre).findByText("No ar")).toBeInTheDocument();
    expect(within(sobre).getByText("gpt-5.6-terra")).toBeInTheDocument();
    expect(within(sobre).getByText("/api")).toBeInTheDocument();
    expect(within(sobre).getByText(/5\.047 documentos · 12\.874 trechos/)).toBeInTheDocument();
  });
});
