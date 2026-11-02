// @vitest-environment node
/**
 * Integração contra a API REAL da F.R.E.Y.A. (Qdrant + Elasticsearch + Neo4j + modelo de linguagem).
 *
 *   FREYA_API_INTEGRACAO=1 npx vitest run src/test/integracao
 *
 * - Só roda com FREYA_API_INTEGRACAO=1; o endereço é FREYA_API_URL ou http://127.0.0.1:8000 (direto, sem o proxy do Vite).
 * - Não cria investigações nem exclui as que já existem: lê uma investigação concluída do histórico, explora o grafo,
 *   guarda e desguarda (devolvendo o estado original).
 * - FREYA_API_INTEGRACAO_CRIAR=1 também cria UMA investigação nova (chama o modelo: ~1 min e custo de uso),
 *   acompanha as etapas ao vivo, confirma o 409 ao excluir durante a execução e a exclui no fim.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  acompanharInvestigacao,
  caminhosEntre,
  criarInvestigacao,
  definirBaseDaApi,
  desguardarInvestigacao,
  ErroDaApi,
  excluirInvestigacao,
  expandirNo,
  guardarInvestigacao,
  listarInvestigacoes,
  obterEvidencia,
  obterGrafo,
  obterInvestigacao,
  obterSaude,
} from "../../services";
import type { Afirmacao, AnaliseProspectiva, GrafoDaInvestigacao, Investigacao, ResumoDeInvestigacao } from "../../types/api";

const ATIVO = process.env.FREYA_API_INTEGRACAO === "1";
const CRIAR = ATIVO && process.env.FREYA_API_INTEGRACAO_CRIAR === "1";
const BASE = process.env.FREYA_API_URL ?? "http://127.0.0.1:8000";

async function erroDe(p: Promise<unknown>): Promise<ErroDaApi> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroDaApi);
    return e as ErroDaApi;
  }
  throw new Error("deveria ter falhado");
}

/** todas as afirmações da análise, para conferir as citações */
function afirmacoes(a: AnaliseProspectiva): Afirmacao[] {
  return [
    ...a.contexto,
    ...a.tendencias_e_sinais,
    ...a.atores.flatMap((x) => x.fundamentos),
    ...a.relacoes_sistemicas.map((x) => x.descricao),
    ...a.variaveis.map((x) => x.descricao),
    ...a.incertezas_criticas.map((x) => x.por_que_importa),
    ...a.desdobramentos.flatMap((x) => [x.descricao, ...x.consequencias_diretas, ...x.consequencias_indiretas]),
    ...a.cenarios.flatMap((c) => [c.logica, ...c.premissas, ...c.desenvolvimento, ...c.consequencias, ...c.sinais]),
  ];
}

describe.skipIf(!ATIVO)("API real", () => {
  let lista: ResumoDeInvestigacao[] = [];
  let inv: Investigacao;
  let grafo: GrafoDaInvestigacao;

  beforeAll(async () => {
    definirBaseDaApi(BASE);
    lista = await listarInvestigacoes();
    // uma investigação concluída com cenários e duas ou mais entidades focais (para testar caminhos)
    for (const r of lista.filter((x) => x.estado === "concluida" && x.cenarios > 0).slice(0, 10)) {
      const g = await obterGrafo(r.id);
      if (g.focais.length >= 2 && g.arestas.length > 0) {
        inv = await obterInvestigacao(r.id);
        grafo = g;
        break;
      }
    }
    if (!inv) throw new Error("a base precisa de ao menos uma investigação concluída com cenários e duas entidades focais");
  }, 60_000);

  afterAll(() => definirBaseDaApi(null));

  it("saúde: motor e base indexada", async () => {
    const s = await obterSaude();
    expect(s.status).toBe("ok");
    expect(["modelo", "deterministico"]).toContain(s.motor);
    expect(typeof s.grafo).toBe("string");
    if (s.base) {
      expect(s.base.hybrid.chunks).toBeGreaterThan(0);
      expect(s.base.grafo.nos).toBeGreaterThan(0);
    }
  });

  it("histórico: resumos completos, mais recentes primeiro, filtro de guardadas", async () => {
    expect(lista.length).toBeGreaterThan(0);
    for (const r of lista) {
      expect(Object.keys(r).sort()).toEqual(["atualizada_em", "cenarios", "criada_em", "erro", "estado", "guardada", "horizonte", "id", "questao"]);
      expect(typeof r.guardada).toBe("boolean");
      expect(Number.isInteger(r.cenarios)).toBe(true);
    }
    const tempos = lista.map((r) => Date.parse(r.criada_em));
    expect(tempos).toEqual([...tempos].sort((a, b) => b - a));
    const guardadas = await listarInvestigacoes({ guardadas: true });
    expect(guardadas.every((r) => r.guardada)).toBe(true);
    const outras = await listarInvestigacoes({ guardadas: false });
    expect(outras.every((r) => !r.guardada)).toBe(true);
    expect((await listarInvestigacoes({ limite: 1 })).length).toBe(1);
  });

  it("investigação concluída: contrato e citações válidas", () => {
    expect(inv.estado).toBe("concluida");
    expect(inv.grafo).toBe(`/investigacoes/${inv.id}/grafo`);
    expect(typeof inv.guardada).toBe("boolean");
    expect(inv.etapas.map((e) => e.nome)).toEqual(["recuperacao", "analise", "validacao_e_grafo"]);
    expect(inv.etapas.every((e) => e.fim !== null)).toBe(true);
    const a = inv.analise!;
    expect(a.questao).toBe(inv.questao);
    expect(a.cenarios.length).toBeGreaterThan(0);
    expect(Object.keys(a.validacao).sort()).toEqual(["citacoes_invalidas", "entidades_desconhecidas", "rebaixadas", "removidas"]);
    for (const af of afirmacoes(a)) {
      expect(["confirmado", "inferencia", "hipotese"]).toContain(af.tipo);
      for (const e of af.evidencias) expect(inv.evidencias[e], `evidência ${e} citada e ausente`).toBeDefined();
    }
    for (const [id, ev] of Object.entries(inv.evidencias)) {
      expect(ev.id).toBe(id);
      expect(ev.fonte.url).toMatch(/^https?:\/\//);
    }
  });

  it("grafo: nós, arestas e evidências consistentes", () => {
    const nos = new Set(grafo.nos.map((n) => n.id));
    const arestas = new Set(grafo.arestas.map((a) => a.id));
    expect(grafo.focais.every((f) => nos.has(f))).toBe(true);
    for (const a of grafo.arestas) {
      expect(nos.has(a.origem) && nos.has(a.destino)).toBe(true);
      expect(a.evidencias.length).toBeGreaterThan(0);
      for (const e of a.evidencias) expect(grafo.evidencias[e], `aresta ${a.id} cita ${e}`).toBeDefined();
    }
    for (const p of grafo.sequencia) {
      expect(p.nos.every((n) => nos.has(n))).toBe(true);
      expect(p.arestas.every((x) => arestas.has(x))).toBe(true);
    }
    for (const c of [...grafo.caminhos, ...grafo.cenarios]) expect(c.arestas.every((x) => arestas.has(x))).toBe(true);
    expect(grafo.cenarios.map((c) => c.id)).toEqual(inv.analise!.cenarios.map((c) => c.id));
    expect(Object.keys(grafo.legenda).sort()).toEqual(["papeis", "tipos_de_no", "tipos_de_relacao"]);
    const porTipo = Object.values(grafo.legenda.tipos_de_no).reduce((s, t) => s + t.quantidade, 0);
    expect(porTipo).toBe(grafo.nos.length);
  });

  it("expandir um nó focal", async () => {
    const exp = await expandirNo(inv.id, grafo.focais[0], 8);
    expect(exp.no).toBe(grafo.focais[0]);
    const doGrafo = new Set(grafo.nos.map((n) => n.id));
    expect(exp.nos.every((n) => !doGrafo.has(n.id) && n.papel === "expansao")).toBe(true);
    for (const a of exp.arestas) for (const e of a.evidencias) expect(exp.evidencias[e]).toBeDefined();
    expect((await erroDe(expandirNo(inv.id, "character:nao-existe-xyz"))).tipo).toBe("nao_encontrado");
  });

  it("caminhos entre duas entidades focais", async () => {
    const [de, para] = grafo.focais;
    const c = await caminhosEntre(inv.id, de, para);
    expect(c.de).toBe(de);
    expect(c.para).toBe(para);
    expect(c.existe).toBe(c.caminhos.length > 0);
    for (const cam of c.caminhos) {
      expect(cam.nos[0]).toBe(de);
      expect(cam.nos[cam.nos.length - 1]).toBe(para);
      for (const a of cam.arestas) for (const e of a.evidencias) expect(c.evidencias[e]).toBeDefined();
    }
  });

  it("evidência com a fonte", async () => {
    const eid = grafo.arestas[0].evidencias[0];
    const ev = await obterEvidencia(inv.id, eid);
    expect(ev).toEqual(grafo.evidencias[eid]);
    expect((await erroDe(obterEvidencia(inv.id, "E999999"))).tipo).toBe("nao_encontrado");
  });

  it("guardar e desguardar (devolve o estado original)", async () => {
    const original = inv.guardada;
    try {
      await guardarInvestigacao(inv.id);
      expect((await obterInvestigacao(inv.id)).guardada).toBe(true);
      expect((await listarInvestigacoes({ guardadas: true })).some((r) => r.id === inv.id)).toBe(true);
      await desguardarInvestigacao(inv.id);
      expect((await obterInvestigacao(inv.id)).guardada).toBe(false);
      expect((await listarInvestigacoes({ guardadas: true })).some((r) => r.id === inv.id)).toBe(false);
    } finally {
      await (original ? guardarInvestigacao(inv.id) : desguardarInvestigacao(inv.id));
    }
    expect((await erroDe(guardarInvestigacao("naoexiste000"))).tipo).toBe("nao_encontrado");
  });

  it("erros: inexistente e questão inválida (sem criar nada)", async () => {
    expect((await erroDe(obterInvestigacao("naoexiste000"))).tipo).toBe("nao_encontrado");
    expect((await erroDe(excluirInvestigacao("naoexiste000"))).tipo).toBe("nao_encontrado");
    const e = await erroDe(criarInvestigacao("curta"));
    expect(e.tipo).toBe("invalido");
    expect(e.message).toBe('O campo "questão" precisa ter pelo menos 8 caracteres.');
  });

  it.skipIf(!CRIAR)(
    "criar, acompanhar ao vivo, 409 durante a execução e excluir ao terminar",
    async () => {
      const criada = await criarInvestigacao("Que conexão existe entre Thanos e Gamora?", "após Avengers: Infinity War");
      expect(criada.estado).toBe("pendente");
      try {
        expect((await erroDe(excluirInvestigacao(criada.id))).tipo).toBe("conflito");
        const estados: string[] = [];
        const versoes: string[] = [];
        const final = await new Promise<Investigacao>((resolve, reject) => {
          const a = acompanharInvestigacao(
            criada.id,
            (i) => {
              estados.push(i.estado);
              versoes.push(`${i.estado}|${i.atualizada_em}`);
              if (i.estado === "concluida" || i.estado === "falhou") resolve(i);
            },
            (e) => {
              a.cancelar();
              reject(e);
            },
          );
        });
        expect(final.estado, final.erro ?? "").toBe("concluida");
        expect(estados[estados.length - 1]).toBe("concluida");
        expect(new Set(versoes).size).toBe(versoes.length); // um aviso por mudança, nunca repetido
        expect((await listarInvestigacoes({ limite: 5 })).some((r) => r.id === criada.id && r.cenarios === final.analise!.cenarios.length)).toBe(true);
      } finally {
        // espera terminar se o teste falhou no meio, para a exclusão não dar 409
        for (let i = 0; i < 60; i++) {
          const atual = await obterInvestigacao(criada.id).catch(() => null);
          if (!atual || atual.estado === "concluida" || atual.estado === "falhou") break;
          await new Promise((r) => setTimeout(r, 2000));
        }
        await excluirInvestigacao(criada.id).catch(() => undefined);
      }
      expect((await erroDe(obterInvestigacao(criada.id))).tipo).toBe("nao_encontrado");
      expect((await listarInvestigacoes()).some((r) => r.id === criada.id)).toBe(false);
    },
    180_000,
  );
});
