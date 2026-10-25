import { estadosDosAgentes } from "../componentes/PainelAgentes";
import { rotuloDaFaixa, formatarValor } from "../lib/rotulos";
import type { Evento } from "../api/tipos";
import eventos from "../teste/fixtures/eventos.json";

describe("rótulos", () => {
  it("usa a mesma regra de faixa do backend", () => {
    const r = ["baixa", "média", "alta"];
    expect(rotuloDaFaixa(0, 0, 100, r)).toBe("baixa");
    expect(rotuloDaFaixa(50, 0, 100, r)).toBe("média");
    expect(rotuloDaFaixa(100, 0, 100, r)).toBe("alta");
    expect(rotuloDaFaixa(10, 0, 100, [])).toBeNull();
  });
  it("formata valores com unidade", () => {
    expect(formatarValor(60, "%")).toBe("60 %");
    expect(formatarValor(1.5, "")).toBe("1,5");
  });
});

describe("estado dos agentes", () => {
  const ev = eventos as Evento[];
  it("marca todos como concluídos ao fim de uma execução real", () => {
    const e = estadosDosAgentes(ev, true);
    expect(e).toEqual({ orquestrador: "concluido", researcher: "concluido", analyst: "concluido", verifier: "concluido" });
  });
  it("durante a execução só o agente corrente fica ativo", () => {
    const ate = ev.findIndex((x) => x.agente === "analyst" && x.tipo === "inicio");
    const e = estadosDosAgentes(ev.slice(0, ate + 1), false);
    expect(e.researcher).toBe("concluido");
    expect(e.analyst).toBe("ativo");
    expect(e.verifier).toBe("aguardando");
  });
  it("erro de um agente aparece como falha", () => {
    const e = estadosDosAgentes([{ seq: 1, ts: "", agente: "analyst", tipo: "erro", mensagem: "cota", dados: {} }], true);
    expect(e.analyst).toBe("erro");
  });
});
