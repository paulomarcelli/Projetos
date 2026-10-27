import { afterEach, describe, expect, it, vi } from "vitest";
import { ErroApi, listarDocumentos, obterDocumento, prontidao, removerDocumento, resumoDaBase } from "../lib/api";

function responder(status: number, corpo: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(corpo === undefined ? null : JSON.stringify(corpo), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("cliente da API", () => {
  it("monta a consulta de listagem com paginação e filtro", async () => {
    const f = responder(200, { items: [], total: 0, limit: 5, offset: 10 });
    vi.stubGlobal("fetch", f);
    await listarDocumentos({ limit: 5, offset: 10, status: "failed" });
    expect(f.mock.calls[0][0]).toBe("/documents?limit=5&offset=10&status=failed");
  });

  it("traduz o erro da API para ErroApi com código e mensagem", async () => {
    vi.stubGlobal("fetch", responder(404, { detail: "Documento não encontrado.", code: "not_found" }));
    const erro = await obterDocumento("x").catch((e) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({ status: 404, codigo: "not_found", message: "Documento não encontrado." });
  });

  it("servidor fora do ar vira erro 'offline' com mensagem clara", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const erro = await listarDocumentos().catch((e) => e);
    expect(erro).toMatchObject({ status: 0, codigo: "offline" });
    expect(erro.message).toMatch(/servidor/);
  });

  it("5xx sem JSON (proxy com a API fora do ar) vira 'offline'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>erro</html>", { status: 502 })));
    const erro = await listarDocumentos().catch((e) => e);
    expect(erro).toMatchObject({ status: 0, codigo: "offline" });
  });

  it("4xx sem JSON não quebra o cliente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 405 })));
    const erro = await listarDocumentos().catch((e) => e);
    expect(erro).toMatchObject({ status: 405, codigo: "http_405" });
  });

  it("remoção aceita 204 sem corpo", async () => {
    const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", f);
    await expect(removerDocumento("abc")).resolves.toBeUndefined();
    expect(f.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });

  it("prontidão 503 continua sendo dado (não erro)", async () => {
    vi.stubGlobal("fetch", responder(503, { status: "not_ready", checks: { database: "ok", pgvector: "missing" } }));
    await expect(prontidao()).resolves.toMatchObject({ status: "not_ready" });
  });

  it("resumo da base usa os totais do banco, por estado", async () => {
    const f = vi.fn(async (url: string) => {
      const status = new URL(url, "http://x").searchParams.get("status");
      const totais: Record<string, number> = { completed: 7, failed: 2, processing: 1, pending: 0 };
      return new Response(JSON.stringify({ items: [], total: status ? totais[status] : 10, limit: 1, offset: 0 }), { status: 200 });
    });
    vi.stubGlobal("fetch", f);
    const r = await resumoDaBase();
    expect(r.total).toBe(10);
    expect(r.porStatus).toEqual({ pending: 0, processing: 1, completed: 7, failed: 2 });
    expect(r.amostraCompleta).toBe(false);
  });
});
