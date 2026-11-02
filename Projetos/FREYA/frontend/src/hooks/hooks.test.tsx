import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as servicos from "../services";
import type { ResumoDeInvestigacao } from "../types/api";
import { agruparPorDia, duracao, quando, rotuloDoId } from "./formatacao";
import { mensagemDoErro } from "./erros";
import { useHistorico } from "./useHistorico";
import { useRecurso } from "./useRecurso";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return { ...real, listarInvestigacoes: vi.fn(), excluirInvestigacao: vi.fn(), guardarInvestigacao: vi.fn(), desguardarInvestigacao: vi.fn() };
});
const s = vi.mocked(servicos);
afterEach(() => vi.clearAllMocks());

const item = (id: string, criada_em: string, extra: Partial<ResumoDeInvestigacao> = {}): ResumoDeInvestigacao => ({
  id,
  questao: `Questão ${id}`,
  horizonte: null,
  estado: "concluida",
  erro: null,
  guardada: false,
  cenarios: 3,
  criada_em,
  atualizada_em: criada_em,
  ...extra,
});

describe("formatação", () => {
  const agora = new Date(2026, 10, 2, 23, 30);
  it("agrupa por dia em pt-BR, sem grupos vazios", () => {
    const g = agruparPorDia([item("a", new Date(2026, 10, 2, 9).toISOString()), item("b", new Date(2026, 10, 1, 9).toISOString()), item("c", new Date(2026, 9, 1).toISOString())], agora);
    expect(g.map((x) => x.titulo)).toEqual(["Hoje", "Ontem", "Mais antigas"]);
    expect(g[0].subtitulo).toBe("2 de novembro de 2026");
    expect(g[1].subtitulo).toBe("1 de novembro de 2026");
  });
  it("datas, durações e rótulos", () => {
    expect(quando(new Date(2026, 10, 2, 22, 36).toISOString(), agora)).toBe("Hoje, 22:36");
    expect(quando(new Date(2026, 10, 1, 18, 1).toISOString(), agora)).toBe("Ontem, 18:01");
    expect(duracao(48_400)).toBe("48 s");
    expect(duracao(65_000)).toBe("1 min 05 s");
    expect(rotuloDoId("character:thor-thor-odinson")).toBe("Thor Thor Odinson");
  });
  it("mensagens por tipo de erro", () => {
    expect(mensagemDoErro(new servicos.ErroDaApi("indisponivel", "x")).titulo).toBe("Não consegui falar com a F.R.E.Y.A.");
    expect(mensagemDoErro(new servicos.ErroDaApi("nao_encontrado", "x")).titulo).toBe("Análise não encontrada");
    expect(mensagemDoErro(new servicos.ErroDaApi("invalido", "A questão é curta demais.")).texto).toBe("A questão é curta demais.");
    expect(mensagemDoErro(new servicos.ErroDaApi("conflito", "ainda não concluída.")).texto).toMatch(/Espere a análise terminar/);
  });
});

describe("useRecurso", () => {
  it("nunca devolve os dados de outra chave e cancela a anterior", async () => {
    const sinais: AbortSignal[] = [];
    const carregar = vi.fn((sinal: AbortSignal) => {
      sinais.push(sinal);
      return new Promise<string>((ok) => setTimeout(() => ok(`dados ${sinais.length}`), 5));
    });
    const { result, rerender } = renderHook(({ k }) => useRecurso(k, carregar), { initialProps: { k: "a" as string | null } });
    await waitFor(() => expect(result.current.dados).toBe("dados 1"));
    rerender({ k: "b" });
    expect(result.current.dados).toBeNull();
    expect(result.current.carregando).toBe(true);
    rerender({ k: "c" });
    expect(sinais[1].aborted).toBe(true);
    await waitFor(() => expect(result.current.dados).toBe("dados 3"));
    rerender({ k: null });
    expect(result.current.dados).toBeNull();
    expect(result.current.carregando).toBe(false);
  });
});

describe("useHistorico", () => {
  it("excluir é otimista e, se a API recusar (409), devolve o item ao lugar com a explicação", async () => {
    s.listarInvestigacoes.mockResolvedValue([item("a", "2026-11-02T10:00:00Z"), item("b", "2026-11-02T09:00:00Z"), item("c", "2026-11-02T08:00:00Z")]);
    let rejeitar: (e: unknown) => void = () => {};
    s.excluirInvestigacao.mockImplementation(() => new Promise((_, r) => (rejeitar = r)));
    const { result } = renderHook(() => useHistorico());
    await waitFor(() => expect(result.current.itens).toHaveLength(3));
    let promessa!: Promise<{ ok: boolean; mensagem: string }>;
    act(() => {
      promessa = result.current.excluir(result.current.itens![1]);
    });
    expect(result.current.itens!.map((x) => x.id)).toEqual(["a", "c"]);
    expect(result.current.pendentes.has("b")).toBe(true);
    await act(async () => {
      rejeitar(new servicos.ErroDaApi("conflito", "em execução", 409));
      const r = await promessa;
      expect(r.ok).toBe(false);
      expect(r.mensagem).toMatch(/ainda está em execução/);
    });
    expect(result.current.itens!.map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(result.current.pendentes.size).toBe(0);
  });

  it("guardar/remover otimista; na lista de guardados, remover tira o item", async () => {
    s.listarInvestigacoes.mockResolvedValue([item("a", "2026-11-02T10:00:00Z", { guardada: true })]);
    s.desguardarInvestigacao.mockResolvedValue(undefined);
    const { result } = renderHook(() => useHistorico({ guardadas: true }));
    await waitFor(() => expect(result.current.itens).toHaveLength(1));
    await act(async () => {
      const r = await result.current.alternarGuardada(result.current.itens![0]);
      expect(r.ok).toBe(true);
    });
    expect(result.current.itens).toHaveLength(0);
    expect(s.listarInvestigacoes).toHaveBeenCalledWith(expect.objectContaining({ guardadas: true }));
  });
});
