import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseDaApi, definirBaseDaApi, foiCancelado, mensagemDoDetalhe, montarUrl, requisitar } from "./cliente";
import { ErroDaApi } from "./erros";
import { obterSaude } from "./saude";

function resposta(status: number, corpo?: unknown, bruto?: string): Response {
  const texto = bruto ?? (corpo === undefined ? "" : JSON.stringify(corpo));
  return new Response(status === 204 ? null : texto, { status, headers: { "Content-Type": "application/json" } });
}

/** fetch que só termina quando o sinal aborta (para testar tempo limite e cancelamento) */
function fetchPendurado() {
  return vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_ok, falha) => {
        init.signal?.addEventListener("abort", () => falha(new DOMException("aborted", "AbortError")));
      }),
  );
}

async function erroDe(p: Promise<unknown>): Promise<ErroDaApi> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroDaApi);
    return e as ErroDaApi;
  }
  throw new Error("deveria ter falhado");
}

let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchFalso = vi.fn();
  vi.stubGlobal("fetch", fetchFalso);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  definirBaseDaApi(null);
});

describe("endereço", () => {
  it("usa /api em desenvolvimento e VITE_FREYA_API quando definida", () => {
    vi.stubEnv("VITE_FREYA_API", "");
    expect(baseDaApi()).toBe("");
    vi.unstubAllEnvs();
    expect(baseDaApi()).toBe("/api");
    vi.stubEnv("VITE_FREYA_API", "https://freya.exemplo/api/");
    expect(baseDaApi()).toBe("https://freya.exemplo/api");
  });

  it("a sobrescrita vence e monta a consulta sem valores vazios", () => {
    definirBaseDaApi("http://127.0.0.1:8000");
    expect(montarUrl("/investigacoes", { guardadas: true, limite: undefined, x: null })).toBe("http://127.0.0.1:8000/investigacoes?guardadas=true");
    expect(montarUrl("/a", { no: "character:thanos", de: "a b&c" })).toBe("http://127.0.0.1:8000/a?no=character%3Athanos&de=a+b%26c");
  });
});

describe("requisitar", () => {
  it("GET devolve o JSON e manda Accept", async () => {
    fetchFalso.mockResolvedValue(resposta(200, { status: "ok" }));
    await expect(obterSaude()).resolves.toEqual({ status: "ok" });
    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe("/api/saude");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({ Accept: "application/json" });
    expect(init.body).toBeUndefined();
  });

  it("POST manda o corpo em JSON", async () => {
    fetchFalso.mockResolvedValue(resposta(202, { id: "x" }));
    await requisitar("/investigacoes", { metodo: "POST", corpo: { questao: "q" } });
    const [, init] = fetchFalso.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"questao":"q"}');
  });

  it("204 devolve undefined", async () => {
    fetchFalso.mockResolvedValue(resposta(204));
    await expect(requisitar("/x", { metodo: "DELETE" })).resolves.toBeUndefined();
  });

  it.each([
    [404, { detail: "investigação não encontrada" }, "nao_encontrado", "investigação não encontrada"],
    [404, { detail: "Not Found" }, "nao_implementado", "A API ainda não oferece esta operação."],
    [405, { detail: "Method Not Allowed" }, "nao_implementado", "A API ainda não oferece esta operação."],
    [501, undefined, "nao_implementado", "A API ainda não oferece esta operação."],
    [409, { detail: "investigação ainda não concluída (estado: analisando)" }, "conflito", "investigação ainda não concluída (estado: analisando)"],
    [422, { detail: "A questão de investigação é curta demais." }, "invalido", "A questão de investigação é curta demais."],
    [500, undefined, "servidor", "A API respondeu com um erro. (HTTP 500)"],
    [502, undefined, "indisponivel", "A API da F.R.E.Y.A. não está respondendo."],
    [503, undefined, "indisponivel", "A API da F.R.E.Y.A. não está respondendo."],
  ] as const)("HTTP %i vira %s", async (status, corpo, tipo, mensagem) => {
    fetchFalso.mockResolvedValue(resposta(status, corpo));
    const e = await erroDe(requisitar("/x"));
    expect(e.tipo).toBe(tipo);
    expect(e.status).toBe(status);
    expect(e.message).toBe(mensagem);
  });

  it("422 de validação do FastAPI vira mensagem em português", async () => {
    fetchFalso.mockResolvedValue(
      resposta(422, {
        detail: [{ type: "string_too_short", loc: ["body", "questao"], msg: "String should have at least 8 characters", ctx: { min_length: 8 } }],
      }),
    );
    const e = await erroDe(requisitar("/investigacoes", { metodo: "POST", corpo: {} }));
    expect(e.tipo).toBe("invalido");
    expect(e.message).toBe('O campo "questão" precisa ter pelo menos 8 caracteres.');
  });

  it("falha de rede vira indisponivel", async () => {
    fetchFalso.mockRejectedValue(new TypeError("Failed to fetch"));
    const e = await erroDe(requisitar("/x"));
    expect(e.tipo).toBe("indisponivel");
    expect(e.status).toBeNull();
  });

  it("resposta 200 que não é JSON vira servidor", async () => {
    fetchFalso.mockResolvedValue(resposta(200, undefined, "<html>"));
    expect((await erroDe(requisitar("/x"))).tipo).toBe("servidor");
  });

  it("tempo esgotado vira indisponivel", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchPendurado());
    const p = erroDe(requisitar("/x", { tempoLimite: 1000 }));
    await vi.advanceTimersByTimeAsync(1001);
    const e = await p;
    expect(e.tipo).toBe("indisponivel");
    expect(e.message).toMatch(/demorou demais/);
  });

  it("cancelado pelo chamador rejeita com AbortError, não com ErroDaApi", async () => {
    vi.stubGlobal("fetch", fetchPendurado());
    const c = new AbortController();
    const p = requisitar("/x", { sinal: c.signal });
    c.abort();
    const e = await p.catch((x: unknown) => x);
    expect(foiCancelado(e)).toBe(true);
    expect(e).not.toBeInstanceOf(ErroDaApi);

    const ja = new AbortController();
    ja.abort();
    expect(foiCancelado(await requisitar("/x", { sinal: ja.signal }).catch((x: unknown) => x))).toBe(true);
  });
});

describe("mensagemDoDetalhe", () => {
  it("aceita texto, lista de erros e outros formatos", () => {
    expect(mensagemDoDetalhe("texto")).toBe("texto");
    expect(mensagemDoDetalhe([{ type: "missing", loc: ["query", "no"] }])).toBe('O campo "nó" é obrigatório.');
    expect(mensagemDoDetalhe([{ type: "less_than_equal", loc: ["query", "limite"], ctx: { le: 200 } }])).toBe(
      'O campo "limite" precisa ser no máximo 200.',
    );
    expect(mensagemDoDetalhe([{ type: "json_invalid", loc: ["body", 1] }])).toBe("O pedido enviado não é um JSON válido.");
    expect(mensagemDoDetalhe({ algo: 1 })).toBeNull();
  });
});
