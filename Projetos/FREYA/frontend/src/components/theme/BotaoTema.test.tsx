import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorDePreferencias } from "../../contexts/Preferencias";
import { BotaoTema } from "./BotaoTema";
import { realityShiftEmAndamento } from "./realidade";

beforeEach(() => {
  localStorage.clear();
  // jsdom não tem canvas: o efeito cai no caminho sem canvas (troca + esmaecimento de cor).
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

// O efeito ignora cliques enquanto roda (inclusive o esmaecimento de 220ms): espera entre os testes.
afterEach(async () => {
  await waitFor(() => expect(realityShiftEmAndamento()).toBe(false));
});

function montar(tema: "claro" | "escuro") {
  localStorage.setItem("freya:preferencias", JSON.stringify({ tema }));
  render(
    <ProvedorDePreferencias>
      <BotaoTema />
    </ProvedorDePreferencias>,
  );
}

describe("BotaoTema", () => {
  it("no claro, oferece o modo escuro e troca o tema ao clicar", async () => {
    const usuario = userEvent.setup();
    montar("claro");
    const botao = screen.getByRole("button", { name: "Ativar modo escuro" });
    expect(document.documentElement.dataset.tema).toBe("claro");

    await usuario.click(botao);
    expect(document.documentElement.dataset.tema).toBe("escuro");
    expect(screen.getByRole("button", { name: "Ativar modo claro" })).toBe(botao);
    expect(botao).toHaveAttribute("data-tema-atual", "escuro");
    expect(JSON.parse(localStorage.getItem("freya:preferencias") ?? "{}").tema).toBe("escuro");
  });

  it("no escuro, oferece o modo claro e volta", async () => {
    const usuario = userEvent.setup();
    montar("escuro");
    await usuario.click(screen.getByRole("button", { name: "Ativar modo claro" }));
    expect(document.documentElement.dataset.tema).toBe("claro");
    expect(screen.getByRole("button", { name: "Ativar modo escuro" })).toBeInTheDocument();
  });

  it("com movimento reduzido, troca na hora", async () => {
    localStorage.setItem("freya:preferencias", JSON.stringify({ tema: "claro", reduzirMovimento: true }));
    render(
      <ProvedorDePreferencias>
        <BotaoTema />
      </ProvedorDePreferencias>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Ativar modo escuro" }).click();
    });
    expect(document.documentElement.dataset.tema).toBe("escuro");
  });
});
