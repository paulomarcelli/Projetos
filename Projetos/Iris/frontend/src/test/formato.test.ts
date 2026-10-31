import { describe, expect, it } from "vitest";
import { autores, contar, cortarNoMeio, idioma, numero, tamanho, tituloDoDocumento } from "../utils/formatadores";
import { dataCompacta, quando } from "../utils/data";

describe("formatação", () => {
  it("usa plural correto em português", () => {
    expect(contar(0, "documento", "documentos")).toBe("0 documentos");
    expect(contar(1, "documento", "documentos")).toBe("1 documento");
    expect(contar(1284, "documento", "documentos")).toBe("1.284 documentos");
  });

  it("nunca mostra NaN, null ou undefined", () => {
    expect(numero(Number.NaN)).toBe("—");
    expect(numero(null)).toBe("—");
    expect(numero(undefined)).toBe("—");
    expect(tamanho(-1)).toBe("—");
    expect(dataCompacta("não é data")).toBe("—");
  });

  it("formata tamanhos de arquivo", () => {
    expect(tamanho(512)).toBe("512 B");
    expect(tamanho(3_584)).toBe("3,5 KB");
    expect(tamanho(52_428_800)).toBe("50 MB");
  });

  it("datas relativas só até uma semana", () => {
    const agora = new Date("2026-10-27T12:00:00Z");
    expect(quando("2026-10-27T11:59:40Z", agora)).toBe("agora mesmo");
    expect(quando("2026-10-27T09:00:00Z", agora)).toBe("há 3 horas");
    expect(quando("2026-09-01T12:00:00Z", agora)).not.toMatch(/há/);
  });

  it("corta no meio sem partir emoji ou letras compostas", () => {
    const hash = "9f8e7d6c5b4a39289f8e7d6c5b4a39280000000000000001";
    expect(cortarNoMeio(hash, 17)).toBe("9f8e7d6c…00000001");
    expect(cortarNoMeio("🦊🦊🦊🦊🦊🦊🦊🦊🦊🦊", 5)).toBe("🦊🦊…🦊🦊");
    expect(cortarNoMeio("curto", 24)).toBe("curto");
  });

  it("título cai para o nome do arquivo quando não há título", () => {
    expect(tituloDoDocumento({ title: "  ", original_filename: "a.pdf" })).toEqual({ texto: "a.pdf", ehNomeDeArquivo: true });
    expect(tituloDoDocumento({ title: "Título", original_filename: "a.pdf" }).ehNomeDeArquivo).toBe(false);
  });

  it("resume listas longas de autores", () => {
    expect(autores(null)).toBeNull();
    expect(autores(["A", "B"])).toBe("A; B");
    expect(autores(["A", "B", "C"])).toBe("A; B e mais 1");
    expect(autores(["A", "B", "C", "D", "E"])).toBe("A; B e mais 3");
  });

  it("nomeia idiomas", () => {
    expect(idioma("pt")).toMatch(/portugu/i);
    expect(idioma(null)).toBe("—");
  });
});
