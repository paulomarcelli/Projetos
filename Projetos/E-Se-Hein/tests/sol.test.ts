import { describe, expect, test } from "vitest";
import { formatarCronometro, nivelTermometro, restanteCronometro } from "../src/lib/sol";

describe("restanteCronometro", () => {
  // Começa em 8:00 (480 s) no início e chega a 0 no fim, em linha reta (tempo acelerado).
  test("antes do início fica em 8:00", () => {
    expect(restanteCronometro(0, 1, 14)).toBe(480);
    expect(restanteCronometro(1, 1, 14)).toBe(480);
  });
  test("no meio, proporcional", () => {
    expect(restanteCronometro(7.5, 1, 14)).toBeCloseTo(240);
  });
  test("no fim e depois fica em 0", () => {
    expect(restanteCronometro(14, 1, 14)).toBe(0);
    expect(restanteCronometro(30, 1, 14)).toBe(0);
  });
});

describe("formatarCronometro", () => {
  test("M:SS com dois dígitos nos segundos", () => {
    expect(formatarCronometro(480)).toBe("8:00");
    expect(formatarCronometro(0)).toBe("0:00");
    expect(formatarCronometro(65, 1)).toBe("1:05");
  });
  test("anda em passos de 15 s, arredondando para cima (só mostra 0:00 no fim)", () => {
    expect(formatarCronometro(479)).toBe("8:00");
    expect(formatarCronometro(465)).toBe("7:45");
    expect(formatarCronometro(464.9)).toBe("7:45");
    expect(formatarCronometro(0.4)).toBe("0:15");
  });
  test("com 13 s para 8 minutos, o texto muda no máximo 3 vezes por segundo", () => {
    const fps = 30;
    let trocas = 0;
    let anterior = "";
    const porSegundo: number[] = [];
    for (let q = 0; q <= 14 * fps; q++) {
      const t = formatarCronometro(restanteCronometro(q / fps, 1, 14));
      if (t !== anterior && anterior) trocas++;
      anterior = t;
      if (q % fps === fps - 1) {
        porSegundo.push(trocas);
        trocas = 0;
      }
    }
    expect(Math.max(...porSegundo)).toBeLessThanOrEqual(3);
  });
});

describe("nivelTermometro", () => {
  test("começa no nível de cima, termina no de baixo, sem passar dos dois", () => {
    expect(nivelTermometro(0, 2, 5, 0.75, 0.2)).toBe(0.75);
    expect(nivelTermometro(5, 2, 5, 0.75, 0.2)).toBeCloseTo(0.2);
    expect(nivelTermometro(9, 2, 5, 0.75, 0.2)).toBeCloseTo(0.2);
    const meio = nivelTermometro(3.5, 2, 5, 0.75, 0.2);
    expect(meio).toBeLessThan(0.75);
    expect(meio).toBeGreaterThan(0.2);
  });
});
