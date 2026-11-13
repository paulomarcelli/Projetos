import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoInvestigacao, Etapa, Investigacao } from "../../types/api";
import type { ErroDaApi } from "../api/erros";
import { acompanharInvestigacao, estaEmAndamento } from "./investigacoes";

function inv(estado: EstadoInvestigacao, etapas: Partial<Etapa>[] = [], atualizada = "2026-11-02T10:00:00Z"): Investigacao {
  return {
    id: "abc",
    questao: "Como a relação entre Thor e Loki pode evoluir?",
    horizonte: null,
    estado,
    etapas: etapas.map((e) => ({ nome: "recuperacao", inicio: "2026-11-02T10:00:00Z", fim: null, resumo: {}, ...e })),
    erro: null,
    analise: null,
    grafo: null,
    evidencias: {},
    criada_em: "2026-11-02T10:00:00Z",
    atualizada_em: atualizada,
    guardada: false,
  };
}

const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status });

/** fila de respostas; cada item é um valor (200), um Response ou um Error (falha de rede) */
function filaDeFetch(itens: (Investigacao | Response | Error)[]) {
  return vi.fn(async (_url: string, _init: RequestInit) => {
    const i = itens.length > 1 ? itens.shift()! : itens[0];
    if (i instanceof Error) throw i;
    return i instanceof Response ? i.clone() : json(i);
  });
}

let oculto = false;

beforeEach(() => {
  vi.useFakeTimers();
  oculto = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => oculto });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("acompanharInvestigacao", () => {
  it("consulta na hora, avisa só quando muda e para ao concluir", async () => {
    const f = filaDeFetch([
      inv("pendente"),
      inv("pendente"),
      inv("recuperando", [{}], "2026-11-02T10:00:01Z"),
      inv("analisando", [{ fim: "x" }, { nome: "analise" }], "2026-11-02T10:00:02Z"),
      inv("concluida", [{ fim: "x" }, { nome: "analise", fim: "y" }], "2026-11-02T10:00:03Z"),
      inv("concluida"),
    ]);
    vi.stubGlobal("fetch", f);
    const aoAtualizar = vi.fn();
    acompanharInvestigacao("abc", aoAtualizar);
    await vi.advanceTimersByTimeAsync(0);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe("/api/investigacoes/abc");
    await vi.advanceTimersByTimeAsync(1500 * 4);
    expect(f).toHaveBeenCalledTimes(5);
    expect(aoAtualizar.mock.calls.map((c) => (c[0] as Investigacao).estado)).toEqual(["pendente", "recuperando", "analisando", "concluida"]);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(f).toHaveBeenCalledTimes(5);
  });

  it("para também em falhou", async () => {
    const f = filaDeFetch([inv("analisando"), { ...inv("falhou"), erro: "modelo de linguagem: limite" }]);
    vi.stubGlobal("fetch", f);
    const aoAtualizar = vi.fn();
    acompanharInvestigacao("abc", aoAtualizar);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(f).toHaveBeenCalledTimes(2);
    expect(aoAtualizar.mock.lastCall?.[0].erro).toBe("modelo de linguagem: limite");
  });

  it("erro de rede avisa, espaça as consultas até 5 s e continua", async () => {
    const f = filaDeFetch([new TypeError("rede"), new TypeError("rede"), new TypeError("rede"), inv("analisando"), inv("concluida")]);
    vi.stubGlobal("fetch", f);
    const aoErro = vi.fn();
    const aoAtualizar = vi.fn();
    acompanharInvestigacao("abc", aoAtualizar, aoErro);
    await vi.advanceTimersByTimeAsync(0);
    expect(aoErro).toHaveBeenCalledTimes(1);
    expect((aoErro.mock.calls[0][0] as ErroDaApi).tipo).toBe("indisponivel");
    await vi.advanceTimersByTimeAsync(2999); // depois de 1 erro: 3 s
    expect(f).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(f).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000); // depois de 2 erros: 6 s, limitado a 5 s
    expect(f).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(5000);
    expect(f).toHaveBeenCalledTimes(4);
    expect(aoAtualizar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1500); // resposta boa: volta a 1,5 s
    expect(f).toHaveBeenCalledTimes(5);
    expect(aoAtualizar.mock.lastCall?.[0].estado).toBe("concluida");
    expect(aoErro).toHaveBeenCalledTimes(3);
  });

  it("investigação excluída (404) encerra o acompanhamento", async () => {
    const f = filaDeFetch([json({ detail: "investigação não encontrada" }, 404)]);
    vi.stubGlobal("fetch", f);
    const aoErro = vi.fn();
    acompanharInvestigacao("abc", vi.fn(), aoErro);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(f).toHaveBeenCalledTimes(1);
    expect((aoErro.mock.calls[0][0] as ErroDaApi).tipo).toBe("nao_encontrado");
  });

  it("cancelar para os relógios e aborta a requisição em andamento", async () => {
    let sinal: AbortSignal | undefined;
    const f = vi.fn((_url: string, init: RequestInit) => {
      sinal = init.signal ?? undefined;
      return new Promise<Response>((_ok, falha) => sinal?.addEventListener("abort", () => falha(new DOMException("x", "AbortError"))));
    });
    vi.stubGlobal("fetch", f);
    const aoAtualizar = vi.fn();
    const aoErro = vi.fn();
    const a = acompanharInvestigacao("abc", aoAtualizar, aoErro);
    await vi.advanceTimersByTimeAsync(0);
    a.cancelar();
    expect(sinal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(f).toHaveBeenCalledTimes(1);
    expect(aoAtualizar).not.toHaveBeenCalled();
    expect(aoErro).not.toHaveBeenCalled();
  });

  it("cancelar entre consultas não deixa relógio pendente", async () => {
    const f = filaDeFetch([inv("analisando")]);
    vi.stubGlobal("fetch", f);
    const a = acompanharInvestigacao("abc", vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    a.cancelar();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("pausa com a aba escondida e consulta na hora ao voltar", async () => {
    const f = filaDeFetch([inv("analisando")]);
    vi.stubGlobal("fetch", f);
    acompanharInvestigacao("abc", vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    oculto = true;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(f).toHaveBeenCalledTimes(1);
    oculto = false;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(f).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1500);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("estaEmAndamento", () => {
    expect(["pendente", "recuperando", "analisando", "validando"].every((e) => estaEmAndamento(e as EstadoInvestigacao))).toBe(true);
    expect(estaEmAndamento("concluida") || estaEmAndamento("falhou")).toBe(false);
  });
});
