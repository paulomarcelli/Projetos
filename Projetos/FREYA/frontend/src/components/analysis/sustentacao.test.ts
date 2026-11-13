import { describe, expect, it } from "vitest";
import { fixtures } from "../../pages/apoioDeTeste";
import { avaliarSustentacao } from "./sustentacao";

describe("avaliarSustentacao", () => {
  it("China/Taiwan (fora do MCU) tem sustentação fraca, pelos dados", () => {
    const s = avaliarSustentacao(fixtures.investigacaoFora(), fixtures.grafoFora());
    expect(s.fraca).toBe(true);
    expect(s).toMatchObject({ evidencias: 8, nos: 1, arestas: 0, rebaixadas: 17 });
    expect(s.motivos.join(" ")).toMatch(/nenhuma relação/);
  });

  it("sem o grafo ainda, usa o resumo da recuperação", () => {
    expect(avaliarSustentacao(fixtures.investigacaoFora(), null).fraca).toBe(true);
  });

  it("Thor/Loki (dentro do MCU) não dispara o aviso, mesmo com limitações", () => {
    const s = avaliarSustentacao(fixtures.investigacao(), fixtures.grafo());
    expect(s.fraca).toBe(false);
    expect(s.arestas).toBe(169);
  });
});
