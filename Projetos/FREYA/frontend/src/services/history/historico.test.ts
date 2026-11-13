import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErroDaApi } from "../api/erros";
import { caminhosEntre, expandirNo, obterEvidencia, obterGrafo } from "../graph/grafo";
import { criarInvestigacao, obterInvestigacao } from "../investigations/investigacoes";
import { desguardarInvestigacao, excluirInvestigacao, guardarInvestigacao, listarInvestigacoes } from "./historico";

let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchFalso = vi.fn(async (_url: string, init: RequestInit) =>
    init.method === "PUT" || init.method === "DELETE" ? new Response(null, { status: 204 }) : new Response("[]", { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchFalso);
});

afterEach(() => vi.unstubAllGlobals());

function chamada(i = 0): [string, string] {
  const [url, init] = fetchFalso.mock.calls[i];
  return [url, init.method];
}

describe("histórico e guardados", () => {
  it("lista com e sem filtro", async () => {
    await listarInvestigacoes();
    await listarInvestigacoes({ guardadas: true });
    await listarInvestigacoes({ guardadas: false, limite: 20 });
    expect(chamada(0)).toEqual(["/api/investigacoes", "GET"]);
    expect(chamada(1)).toEqual(["/api/investigacoes?guardadas=true", "GET"]);
    expect(chamada(2)).toEqual(["/api/investigacoes?guardadas=false&limite=20", "GET"]);
  });

  it("excluir, guardar e desguardar usam os métodos certos e devolvem undefined", async () => {
    await expect(excluirInvestigacao("abc")).resolves.toBeUndefined();
    await expect(guardarInvestigacao("abc")).resolves.toBeUndefined();
    await expect(desguardarInvestigacao("abc")).resolves.toBeUndefined();
    expect(chamada(0)).toEqual(["/api/investigacoes/abc", "DELETE"]);
    expect(chamada(1)).toEqual(["/api/investigacoes/abc/guardada", "PUT"]);
    expect(chamada(2)).toEqual(["/api/investigacoes/abc/guardada", "DELETE"]);
  });

  it("excluir em execução vira conflito", async () => {
    fetchFalso.mockResolvedValueOnce(new Response(JSON.stringify({ detail: "investigação ainda em execução" }), { status: 409 }));
    const e = await excluirInvestigacao("abc").catch((x: ErroDaApi) => x);
    expect(e).toBeInstanceOf(ErroDaApi);
    expect((e as ErroDaApi).tipo).toBe("conflito");
  });
});

describe("investigação e grafo", () => {
  it("cria com horizonte nulo quando vazio", async () => {
    await criarInvestigacao("Como a relação entre Thor e Loki pode evoluir?", "  ");
    await criarInvestigacao("Como a relação entre Thor e Loki pode evoluir?", "após Endgame");
    expect(chamada(0)).toEqual(["/api/investigacoes", "POST"]);
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toEqual({ questao: "Como a relação entre Thor e Loki pode evoluir?", horizonte: null });
    expect(JSON.parse(fetchFalso.mock.calls[1][1].body).horizonte).toBe("após Endgame");
  });

  it("codifica ids e chaves de nó", async () => {
    await obterInvestigacao("a/b");
    await obterGrafo("abc");
    await expandirNo("abc", "character:thanos", 10);
    await expandirNo("abc", "character:thanos");
    await caminhosEntre("abc", "character:thor-thor-odinson", "character:loki");
    await caminhosEntre("abc", "character:thor", "character:loki", 3);
    await obterEvidencia("abc", "E12");
    expect(fetchFalso.mock.calls.map((c) => c[0])).toEqual([
      "/api/investigacoes/a%2Fb",
      "/api/investigacoes/abc/grafo",
      "/api/investigacoes/abc/grafo/expandir?no=character%3Athanos&limite=10",
      "/api/investigacoes/abc/grafo/expandir?no=character%3Athanos",
      "/api/investigacoes/abc/grafo/caminho?de=character%3Athor-thor-odinson&para=character%3Aloki",
      "/api/investigacoes/abc/grafo/caminho?de=character%3Athor&para=character%3Aloki&max_saltos=3",
      "/api/investigacoes/abc/evidencias/E12",
    ]);
  });
});
