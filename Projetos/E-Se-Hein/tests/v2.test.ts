import { describe, expect, test } from "vitest";
import { estadoNoTempo, formatarContagem, frasesDaLegenda, limitesDosPlanos, valorDaContagem } from "../src/lib/v2";

const palavra = (texto: string, ini: number, fim: number, paragrafo: number) => ({
  texto,
  inicioMs: ini * 1000,
  fimMs: fim * 1000,
  casou: true,
  paragrafo,
});

describe("limitesDosPlanos", () => {
  const dados = {
    duracaoAudio: 20,
    trechos: [
      { inicio: 0.1, fim: 4 },
      { inicio: 5, fim: 9 },
      { inicio: 10, fim: 19.5 },
    ],
  };
  const spec = {
    fechamento: 4,
    planos: [
      { id: "A", cena: "x", modo: "dia", trechos: [1, 2] },
      { id: "B", cena: "y", modo: "noite", trechos: [3], fim_do_video: true },
    ],
  };
  test("corta no meio da pausa entre trechos e o primeiro começa em 0", () => {
    const p = limitesDosPlanos(dados, spec);
    expect(p[0]).toMatchObject({ id: "A", inicio: 0, fim: 9.5 });
    expect(p[1].inicio).toBe(9.5);
  });
  test("quadros sem buraco: o fim de um é o começo do outro", () => {
    const p = limitesDosPlanos(dados, spec);
    expect(p[0].deQuadro + p[0].quadros).toBe(p[1].deQuadro);
    expect(p[0].deQuadro).toBe(0);
    expect(p[0].quadros).toBe(285);
  });
  test("o último plano vai até 1 s depois da voz (o fechamento cobre o resto)", () => {
    const p = limitesDosPlanos(dados, spec);
    expect(p[1].fim).toBe(21);
    expect(p[1].quadros).toBe(Math.round(21 * 30) - Math.round(9.5 * 30));
  });
});

describe("frasesDaLegenda", () => {
  const palavras = [
    palavra("Você", 1, 1.3, 0),
    palavra("acorda.", 1.3, 1.8, 0),
    palavra("Nenhum", 2, 2.3, 0),
    palavra("carro,", 2.3, 2.6, 0),
    palavra("nenhuma", 2.7, 3, 0),
    palavra("voz...", 3, 3.5, 0),
    palavra("só", 3.8, 4, 0),
    palavra("o", 4, 4.1, 0),
    palavra("vento.", 4.1, 4.6, 0),
    palavra("Em", 6, 6.2, 1),
    palavra("mil", 6.2, 6.4, 1),
    palavra("novecentos", 6.4, 6.9, 1),
    palavra("e", 6.9, 7, 1),
    palavra("oitenta", 7, 7.3, 1),
    palavra("e", 7.3, 7.4, 1),
    palavra("seis,", 7.4, 7.8, 1),
    palavra("acabou.", 8, 8.5, 1),
  ];
  const frases = frasesDaLegenda(palavras);
  test("quebra no fim da frase (. ? !), não nas reticências", () => {
    expect(frases.map((f) => f.texto)).toEqual(["Você acorda.", "Nenhum carro, nenhuma voz... só o vento.", "Em 1986, acabou."]);
  });
  test("o ano dito por extenso vira 1986", () => {
    expect(frases[2].texto).toBe("Em 1986, acabou.");
  });
  test("tempo: começa na primeira palavra e fica até a próxima frase (no máximo 0,5 s depois da fala)", () => {
    expect(frases[0]).toMatchObject({ inicio: 1, fim: 2 });
    expect(frases[1]).toMatchObject({ inicio: 2, fim: 5.1 });
  });
  test("frase longa (mais de 60 caracteres) quebra na vírgula mais perto do meio", () => {
    const longa = frasesDaLegenda([
      palavra("Sem", 0, 0.2, 0),
      palavra("ninguém", 0.2, 0.5, 0),
      palavra("para", 0.5, 0.7, 0),
      palavra("cuidar", 0.7, 1, 0),
      palavra("delas,", 1, 1.3, 0),
      palavra("em", 1.4, 1.5, 0),
      palavra("poucas", 1.5, 1.8, 0),
      palavra("horas", 1.8, 2, 0),
      palavra("elas", 2, 2.2, 0),
      palavra("vão", 2.2, 2.4, 0),
      palavra("parando,", 2.4, 2.9, 0),
      palavra("e", 3, 3.1, 0),
      palavra("as", 3.1, 3.2, 0),
      palavra("cidades", 3.2, 3.6, 0),
      palavra("se", 3.6, 3.7, 0),
      palavra("apagam.", 3.7, 4.2, 0),
    ]);
    expect(longa.map((f) => f.texto)).toEqual(["Sem ninguém para cuidar delas,", "em poucas horas elas vão parando, e as cidades se apagam."]);
    expect(longa.every((f) => f.texto.length <= 60)).toBe(true);
    expect(longa[1].inicio).toBe(1.4);
  });
});

describe("frase longa sem vírgula", () => {
  test("quebra antes do ' e ' mais perto do meio", () => {
    const ws = "A chuva entra pelas janelas quebradas e vai estragando os prédios por dentro.".split(" ");
    const frases = frasesDaLegenda(ws.map((w, i) => palavra(w, i * 0.3, i * 0.3 + 0.25, 0)));
    expect(frases.map((f) => f.texto)).toEqual(["A chuva entra pelas janelas quebradas", "e vai estragando os prédios por dentro."]);
  });
  test("ou antes de outra conjunção (se, que, mas, ou)", () => {
    const ws = "Qual seria a primeira coisa que você faria se acordasse sozinho no mundo?".split(" ");
    const frases = frasesDaLegenda(ws.map((w, i) => palavra(w, i * 0.3, i * 0.3 + 0.25, 0)));
    expect(frases.map((f) => f.texto)).toEqual(["Qual seria a primeira coisa que você faria", "se acordasse sozinho no mundo?"]);
  });
});

describe("contagem do canto", () => {
  test("8,3 bilhões com vírgula brasileira", () => {
    expect(formatarContagem(8.3e9)).toEqual({ numero: "8,3", unidade: "bilhões" });
  });
  test("milhões, mil e unidades no caminho", () => {
    expect(formatarContagem(42e6)).toEqual({ numero: "42", unidade: "milhões" });
    expect(formatarContagem(1.5e6)).toEqual({ numero: "2", unidade: "milhões" });
    expect(formatarContagem(3200)).toEqual({ numero: "3", unidade: "mil" });
    expect(formatarContagem(1)).toEqual({ numero: "1", unidade: "" });
  });
  test("a contagem anda em escala logarítmica e chega exata no fim", () => {
    expect(valorDaContagem(8.3e9, 1, 0)).toBeCloseTo(8.3e9);
    expect(valorDaContagem(8.3e9, 1, 1)).toBe(1);
    const meio = valorDaContagem(8.3e9, 1, 0.5);
    expect(meio).toBeGreaterThan(1e4);
    expect(meio).toBeLessThan(1e6);
  });
});

describe("estadoNoTempo", () => {
  const estados = [{ inicio: 0, a: 1 }, { inicio: 5, a: 2 }, { inicio: 9, a: 3 }];
  test("pega o último estado que já começou", () => {
    expect(estadoNoTempo(estados, 0).atual.a).toBe(1);
    expect(estadoNoTempo(estados, 6).atual.a).toBe(2);
    expect(estadoNoTempo(estados, 6).anterior?.a).toBe(1);
    expect(estadoNoTempo(estados, 20).atual.a).toBe(3);
  });
});
