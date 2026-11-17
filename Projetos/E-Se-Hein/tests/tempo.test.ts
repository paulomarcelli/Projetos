import { describe, expect, test } from "vitest";
import { criarAos, ehDestaque, formatarPalavra, limitesDasCenas, misturaDeCenas, palavraAtiva, tamanhoLegenda } from "../src/lib/tempo";

const p = (texto: string, inicioMs: number, fimMs: number) => ({ texto, inicioMs, fimMs, casou: true, paragrafo: 0 });

describe("palavraAtiva", () => {
  const palavras = [p("E", 0, 200), p("se", 250, 500), p("Lua", 2000, 2400)];

  test("mostra a palavra desde o início dela", () => {
    expect(palavraAtiva(palavras, 0)).toBe(0);
    expect(palavraAtiva(palavras, 260)).toBe(1);
  });

  test("pausa curta (até 0,35 s): fica até a próxima palavra", () => {
    expect(palavraAtiva(palavras, 220)).toBe(0);
  });

  test("pausa longa: sai 4 quadros (133 ms) depois do fim da fala", () => {
    expect(palavraAtiva(palavras, 620)).toBe(1);
    expect(palavraAtiva(palavras, 640)).toBe(-1);
    expect(palavraAtiva(palavras, 2100)).toBe(2);
  });

  test("antes da voz e depois do fim não há palavra", () => {
    expect(palavraAtiva(palavras, -100)).toBe(-1);
    expect(palavraAtiva(palavras, 5000)).toBe(-1);
  });
});

describe("formatarPalavra", () => {
  test("mantém a caixa do roteiro e o ? ou ! do fim; tira vírgula, ponto, dois-pontos e reticências", () => {
    expect(formatarPalavra("desaparecesse?")).toBe("desaparecesse?");
    expect(formatarPalavra("marés?")).toBe("marés?");
    expect(formatarPalavra("só...")).toBe("só");
    expect(formatarPalavra("seja:")).toBe("seja");
    expect(formatarPalavra("Lua,")).toBe("Lua");
    expect(formatarPalavra("lugar.")).toBe("lugar");
  });
});

describe("tamanhoLegenda", () => {
  const medir = (letras: number) => (tamanho: number) => letras * tamanho * 0.6;

  test("palavra que cabe fica em 112 px", () => {
    expect(tamanhoLegenda(medir(5))).toBe(112);
  });

  test("palavra larga encolhe de 2 em 2 px até caber em 720 px", () => {
    // 12 letras: 12 * t * 0,6 <= 720 -> t <= 100
    expect(tamanhoLegenda(medir(12))).toBe(100);
  });

  test("nunca fica menor que 84 px", () => {
    expect(tamanhoLegenda(medir(30))).toBe(84);
  });
});

describe("ehDestaque", () => {
  const palavras = [
    { texto: "noites", inicioMs: 0, fimMs: 1, casou: true, paragrafo: 1 },
    { texto: "pretas", inicioMs: 1, fimMs: 2, casou: true, paragrafo: 1 },
    { texto: "pretas.", inicioMs: 3, fimMs: 4, casou: true, paragrafo: 1 },
    { texto: "pretas", inicioMs: 5, fimMs: 6, casou: true, paragrafo: 2 },
  ];
  const trechos = [{ destaque: "x" }, { destaque: "pretas" }, {}];

  test("só a primeira ocorrência da palavra de destaque do trecho", () => {
    expect(palavras.map((_, i) => ehDestaque(palavras, i, trechos))).toEqual([false, true, false, false]);
  });
});

describe("limitesDasCenas", () => {
  test("a troca de cena cai no meio da pausa entre os trechos", () => {
    const trechos = [
      { inicio: 0.2, fim: 4 },
      { inicio: 5, fim: 9 },
    ];
    expect(limitesDasCenas(trechos, 10)).toEqual([
      [0, 4.5],
      [4.5, 10],
    ]);
  });
});

describe("misturaDeCenas", () => {
  const limites: [number, number][] = [
    [0, 10],
    [10, 20],
  ];

  test("no meio da cena há só uma, com o progresso dela", () => {
    expect(misturaDeCenas(limites, 5, 2)).toEqual({ a: 0, pa: 0.5, b: null, pb: 0, mistura: 0 });
  });

  test("perto da troca, mistura as duas de forma suave e contínua", () => {
    const antes = misturaDeCenas(limites, 9.01, 2);
    const meio = misturaDeCenas(limites, 10, 2);
    const depois = misturaDeCenas(limites, 10.99, 2);
    expect(meio.a).toBe(0);
    expect(meio.b).toBe(1);
    expect(meio.mistura).toBeCloseTo(0.5);
    expect(antes.mistura).toBeLessThan(0.01);
    expect(depois.mistura).toBeGreaterThan(0.99);
  });

  test("antes do começo e depois do fim fica preso nas pontas", () => {
    expect(misturaDeCenas(limites, -1, 2)).toMatchObject({ a: 0, pa: 0, b: null });
    expect(misturaDeCenas(limites, 25, 2)).toMatchObject({ a: 1, pa: 1, b: null });
  });
});

describe("criarAos", () => {
  const palavras = [
    { texto: "As", inicioMs: 19000, fimMs: 19200, casou: true, paragrafo: 2 },
    { texto: "marés.", inicioMs: 21600, fimMs: 22000, casou: true, paragrafo: 2 },
    { texto: "Marés", inicioMs: 23200, fimMs: 23500, casou: true, paragrafo: 2 },
    { texto: "Outra", inicioMs: 30000, fimMs: 30500, casou: true, paragrafo: 3 },
  ];

  test("devolve o segundo da palavra dentro da cena, sem ligar para acento e caixa", () => {
    const aos = criarAos(palavras, 2, 17, 9);
    expect(aos("mares")).toBeCloseTo(4.6);
    expect(aos("marés", 2)).toBeCloseTo(6.2);
  });

  test("palavra que não está no trecho cai no meio da cena", () => {
    const aos = criarAos(palavras, 2, 17, 9);
    expect(aos("outra")).toBeCloseTo(4.5);
  });
});
