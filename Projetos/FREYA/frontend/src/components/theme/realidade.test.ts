import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executarRealityShift, realityShiftEmAndamento } from "./realidade";

const origem = { x: 100, y: 40 };

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("data-troca-suave");
});

describe("executarRealityShift", () => {
  it("com movimento reduzido, chama trocarTema imediatamente e só esmaece a cor", async () => {
    vi.useFakeTimers();
    const trocar = vi.fn();
    const p = executarRealityShift(origem, trocar, { reduzido: true });
    expect(trocar).toHaveBeenCalledTimes(1); // síncrono, antes de qualquer quadro
    expect(document.documentElement).toHaveAttribute("data-troca-suave");
    expect(document.querySelector(".fr-realidade-tela")).toBeNull(); // nada de partículas nem anéis
    await vi.advanceTimersByTimeAsync(300);
    await p;
    expect(document.documentElement).not.toHaveAttribute("data-troca-suave");
  });

  it("respeita data-movimento=\"reduzido\" quando a opção não é passada", () => {
    vi.useFakeTimers();
    document.documentElement.dataset.movimento = "reduzido";
    const trocar = vi.fn();
    void executarRealityShift(origem, trocar);
    expect(trocar).toHaveBeenCalledTimes(1);
    delete document.documentElement.dataset.movimento;
    return vi.advanceTimersByTimeAsync(300);
  });

  it("ignora cliques repetidos enquanto o efeito roda", async () => {
    vi.useFakeTimers();
    const trocar = vi.fn();
    const a = executarRealityShift(origem, trocar, { reduzido: true });
    const b = executarRealityShift(origem, trocar, { reduzido: true });
    expect(b).toBe(a);
    expect(realityShiftEmAndamento()).toBe(true);
    await vi.advanceTimersByTimeAsync(300);
    await a;
    expect(trocar).toHaveBeenCalledTimes(1);
    expect(realityShiftEmAndamento()).toBe(false);
  });

  it("sem canvas nem View Transitions, ainda troca o tema (uma vez)", async () => {
    vi.useFakeTimers();
    const trocar = vi.fn();
    const p = executarRealityShift(origem, trocar);
    expect(trocar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(600);
    await p;
    expect(trocar).toHaveBeenCalledTimes(1);
  });

  it("com canvas, desenha a energia e remove a tela no fim", async () => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    const ctxFalso = new Proxy(
      {},
      {
        get: (_, chave) => (chave === "createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}),
        set: () => true,
      },
    ) as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctxFalso as never);
    const trocar = vi.fn();
    const p = executarRealityShift(origem, trocar);
    expect(document.querySelector(".fr-realidade-tela")).not.toBeNull();
    expect(trocar).not.toHaveBeenCalled(); // primeiro a energia se concentra no botão
    await vi.advanceTimersByTimeAsync(2000);
    await p;
    expect(trocar).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".fr-realidade-tela")).toBeNull();
  });
});
