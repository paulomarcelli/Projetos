import { describe, expect, test } from "vitest";
import {
  extrairPalavras,
  alinhar,
  montarTrechos,
  normalizar,
  ajustarAoSilencio,
} from "../scripts/lib/alinhar.mjs";

const w = (text, startMs, endMs) => ({ text, startMs, endMs, timestampMs: null, confidence: null });

describe("extrairPalavras", () => {
  test("tira as marcações de voz e guarda o parágrafo de cada palavra", () => {
    const roteiro = "[mysterious] E se a Lua sumisse? Sem barulho.\n\n[calm] Depois, o mar.";
    expect(extrairPalavras(roteiro)).toEqual([
      { texto: "E", paragrafo: 0 },
      { texto: "se", paragrafo: 0 },
      { texto: "a", paragrafo: 0 },
      { texto: "Lua", paragrafo: 0 },
      { texto: "sumisse?", paragrafo: 0 },
      { texto: "Sem", paragrafo: 0 },
      { texto: "barulho.", paragrafo: 0 },
      { texto: "Depois,", paragrafo: 1 },
      { texto: "o", paragrafo: 1 },
      { texto: "mar.", paragrafo: 1 },
    ]);
  });

  test("reticências coladas não viram palavra", () => {
    const nomes = extrairPalavras("Ela só... não estaria").map((p) => p.texto);
    expect(nomes).toEqual(["Ela", "só...", "não", "estaria"]);
  });
});

describe("normalizar", () => {
  test("ignora caixa, acento e pontuação", () => {
    expect(normalizar(" Desaparecesse?")).toBe("desaparecesse");
    expect(normalizar("à")).toBe("a");
    expect(normalizar("só...")).toBe("so");
  });
});

describe("alinhar", () => {
  test("copia os tempos quando as palavras batem, com a grafia do roteiro", () => {
    const roteiro = extrairPalavras("E se a Lua");
    const whisper = [w(" e", 100, 200), w(" se", 200, 300), w(" a", 300, 350), w(" lua", 350, 700)];
    const r = alinhar(roteiro, whisper);
    expect(r.map((p) => p.texto)).toEqual(["E", "se", "a", "Lua"]);
    expect(r.map((p) => [p.inicioMs, p.fimMs])).toEqual([[100, 200], [200, 300], [300, 350], [350, 700]]);
    expect(r.every((p) => p.casou)).toBe(true);
  });

  test("palavra escrita diferente ('1/3') recebe o tempo do trecho e não desloca as seguintes", () => {
    const roteiro = extrairPalavras("com um terço do tamanho");
    const whisper = [w(" com", 0, 200), w(" 1/3", 200, 800), w(" do", 800, 900), w(" tamanho", 900, 1400)];
    const r = alinhar(roteiro, whisper);
    expect(r[0]).toMatchObject({ texto: "com", inicioMs: 0, fimMs: 200, casou: true });
    expect(r[1].casou).toBe(false);
    expect(r[2].casou).toBe(false);
    expect(r[1].inicioMs).toBe(200);
    expect(r[2].fimMs).toBe(800);
    expect(r[1].fimMs).toBe(r[2].inicioMs);
    expect(r[3]).toMatchObject({ texto: "do", inicioMs: 800, fimMs: 900, casou: true });
    expect(r[4]).toMatchObject({ texto: "tamanho", inicioMs: 900, fimMs: 1400 });
  });

  test("palavra inventada pelo Whisper é ignorada", () => {
    const roteiro = extrairPalavras("o mar subiu");
    const whisper = [w(" o", 0, 100), w(" mar", 100, 400), w(" uh", 400, 500), w(" subiu", 500, 900)];
    const r = alinhar(roteiro, whisper);
    expect(r.map((p) => [p.texto, p.inicioMs])).toEqual([["o", 0], ["mar", 100], ["subiu", 500]]);
  });

  test("aceita diferença pequena de grafia em palavra longa", () => {
    const r = alinhar(extrairPalavras("estabiliza"), [w(" estabilisa", 0, 600)]);
    expect(r[0]).toMatchObject({ casou: true, inicioMs: 0, fimMs: 600 });
  });

  test("os tempos nunca andam para trás", () => {
    const roteiro = extrairPalavras("a b c d e f");
    const whisper = [w(" a", 0, 100), w(" x", 100, 200), w(" f", 900, 1000)];
    const r = alinhar(roteiro, whisper);
    for (let i = 0; i < r.length; i++) {
      expect(r[i].fimMs).toBeGreaterThanOrEqual(r[i].inicioMs);
      if (i > 0) expect(r[i].inicioMs).toBeGreaterThanOrEqual(r[i - 1].fimMs);
    }
  });

  test("recusa transcrição vazia com erro claro", () => {
    expect(() => alinhar(extrairPalavras("oi"), [])).toThrow(/transcrição vazia/i);
  });
});

describe("montarTrechos", () => {
  test("um trecho por parágrafo, do início da primeira palavra ao fim da última", () => {
    const palavras = [
      { texto: "Oi.", paragrafo: 0, inicioMs: 300, fimMs: 600, casou: true },
      { texto: "Tudo", paragrafo: 1, inicioMs: 1500, fimMs: 1800, casou: true },
      { texto: "bem?", paragrafo: 1, inicioMs: 1800, fimMs: 2250, casou: true },
    ];
    expect(montarTrechos(palavras)).toEqual([
      { texto: "Oi.", inicio: 0.3, fim: 0.6 },
      { texto: "Tudo bem?", inicio: 1.5, fim: 2.25 },
    ]);
  });
});

describe("ajustarAoSilencio", () => {
  const pal = (texto, inicioMs, fimMs) => ({ texto, paragrafo: 0, inicioMs, fimMs, casou: true });

  test("palavra inteira dentro da pausa volta para antes dela, dividindo o tempo com a anterior", () => {
    const r = ajustarAoSilencio(
      [pal("mais", 9140, 9640), pal("lá.", 9640, 10100), pal("A", 10100, 10230)],
      [{ inicioMs: 9584, fimMs: 10223 }],
    );
    expect(r[0]).toMatchObject({ inicioMs: 9140, fimMs: 9362 });
    expect(r[1]).toMatchObject({ inicioMs: 9362, fimMs: 9584 });
    expect(r[2]).toMatchObject({ inicioMs: 10223, fimMs: 10230 });
  });

  test("palavra longa que começa antes da pausa termina quando a pausa começa", () => {
    const r = ajustarAoSilencio([pal("desaparecesse,", 3460, 5020), pal("sem", 5020, 5070)], [{ inicioMs: 4439, fimMs: 4939 }]);
    expect(r[0]).toMatchObject({ inicioMs: 3460, fimMs: 4439 });
    expect(r[1].inicioMs).toBe(4939);
    expect(r[1].fimMs).toBeGreaterThan(r[1].inicioMs);
  });

  test("palavra dentro da pausa, colada no fim dela, foi dita logo depois", () => {
    const r = ajustarAoSilencio(
      [pal("tamanho.", 25700, 26400), pal("E", 26470, 26530), pal("isso", 26530, 26880)],
      [{ inicioMs: 26152, fimMs: 26530 }],
    );
    expect(r[0]).toMatchObject({ inicioMs: 25700, fimMs: 26152 });
    expect(r[1].inicioMs).toBe(26530);
    expect(r[1].fimMs).toBeGreaterThan(26530);
    expect(r[2].inicioMs).toBeGreaterThanOrEqual(r[1].fimMs);
  });

  test("palavra que mal começou quando a pausa começa é dita depois da pausa", () => {
    const r = ajustarAoSilencio(
      [pal("costa.", 27610, 28220), pal("Caranguejos", 28220, 29060), pal("e", 29060, 29120)],
      [{ inicioMs: 28253, fimMs: 28577 }],
    );
    expect(r[1]).toMatchObject({ inicioMs: 28577, fimMs: 29060 });
    expect(r[0].fimMs).toBe(28220);
  });

  test("não mexe em palavra longe das pausas", () => {
    const original = [pal("mar", 100, 400)];
    expect(ajustarAoSilencio(original, [{ inicioMs: 2000, fimMs: 2500 }])).toEqual(original);
  });
});
