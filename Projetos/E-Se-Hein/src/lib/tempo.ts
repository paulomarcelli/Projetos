// Regras de tempo da composição. Funções puras, testadas em tests/tempo.test.ts.

type ComTempo = { inicioMs: number; fimMs: number };

/** Pausa a partir da qual a palavra sai antes da próxima (Design System: 0,35 s). */
const PAUSA_LONGA_MS = 350;
/** Em pausa longa, a palavra sai 4 quadros depois do fim da fala. */
const SAIDA_MS = 4000 / 30;

/** Índice da palavra que aparece no tempo `ms` do áudio, ou -1. */
export function palavraAtiva(palavras: ComTempo[], ms: number): number {
  for (let i = 0; i < palavras.length; i++) {
    const atual = palavras[i];
    const proxima = palavras[i + 1];
    const limite = proxima && proxima.inicioMs - atual.fimMs <= PAUSA_LONGA_MS ? proxima.inicioMs : atual.fimMs + SAIDA_MS;
    if (ms >= atual.inicioMs && ms < Math.min(limite, proxima ? proxima.inicioMs : Infinity)) return i;
    if (ms < atual.inicioMs) return -1;
  }
  return -1;
}

/** Como no roteiro: mantém a caixa e o ? ou ! do fim; tira vírgula, ponto, dois-pontos e reticências. */
export function formatarPalavra(texto: string): string {
  return texto.replace(/^[^\p{L}\p{N}¿¡]+/u, "").replace(/[^\p{L}\p{N}?!]+$/u, "").replace(/[.,:;…]+(?=[?!]$)/u, "");
}

export const LEGENDA = { tamanho: 112, minimo: 84, larguraMax: 720 };

/** Corpo da legenda: 112 px, encolhendo de 2 em 2 pela largura medida até caber em 720 px (mínimo 84). */
export function tamanhoLegenda(medir: (tamanho: number) => number): number {
  let t = LEGENDA.tamanho;
  while (t > LEGENDA.minimo && medir(t) > LEGENDA.larguraMax) t -= 2;
  return t;
}

/** A palavra i é a de destaque (amarela) do trecho dela? Só a primeira ocorrência. */
export function ehDestaque(
  palavras: { texto: string; paragrafo: number }[],
  i: number,
  trechos: { destaque?: string }[],
): boolean {
  const alvo = trechos[palavras[i].paragrafo]?.destaque;
  if (!alvo) return false;
  const n = normalizar(alvo);
  const primeira = palavras.findIndex((p) => p.paragrafo === palavras[i].paragrafo && normalizar(p.texto) === n);
  return primeira === i;
}

/** Cada cena vai do meio da pausa anterior ao meio da pausa seguinte. */
export function limitesDasCenas(trechos: { inicio: number; fim: number }[], duracao: number): [number, number][] {
  return trechos.map((t, i) => {
    const ini = i === 0 ? 0 : (trechos[i - 1].fim + t.inicio) / 2;
    const fim = i === trechos.length - 1 ? duracao : (t.fim + trechos[i + 1].inicio) / 2;
    return [ini, fim];
  });
}

export type Mistura = {
  /** Cena principal e o progresso dela (0 a 1). */
  a: number;
  pa: number;
  /** Cena seguinte durante a passagem, ou null. */
  b: number | null;
  pb: number;
  /** 0 = só a cena a; 1 = só a cena b. */
  mistura: number;
};

const suave = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * c * (c * (c * 6 - 15) + 10);
};

const progresso = ([ini, fim]: [number, number], t: number) => Math.min(1, Math.max(0, (t - ini) / (fim - ini)));

/** Qual cena (ou quais duas) estão na tela no tempo t, com uma passagem de `passagem` segundos. */
export function misturaDeCenas(limites: [number, number][], t: number, passagem: number): Mistura {
  const meia = passagem / 2;
  for (let i = 0; i < limites.length - 1; i++) {
    const troca = limites[i][1];
    if (t > troca - meia && t < troca + meia) {
      return {
        a: i,
        pa: progresso(limites[i], t),
        b: i + 1,
        pb: progresso(limites[i + 1], t),
        mistura: suave((t - (troca - meia)) / passagem),
      };
    }
  }
  let a = limites.findIndex(([, fim]) => t < fim);
  if (a === -1) a = limites.length - 1;
  return { a, pa: progresso(limites[a], t), b: null, pb: 0, mistura: 0 };
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]/g, "");

/**
 * `aos("palavra", vez)` = segundo, contado do começo da cena, em que a palavra é dita no parágrafo.
 * Se a palavra não estiver no trecho, devolve o meio da cena (a animação não some).
 */
export function criarAos(
  palavras: { texto: string; inicioMs: number; paragrafo: number }[],
  paragrafo: number,
  inicioCena: number,
  duracaoCena: number,
) {
  const doTrecho = palavras.filter((p) => p.paragrafo === paragrafo).map((p) => ({ n: normalizar(p.texto), t: p.inicioMs / 1000 - inicioCena }));
  return (palavra: string, vez = 1) => {
    const alvo = normalizar(palavra);
    const achadas = doTrecho.filter((p) => p.n === alvo);
    return achadas[vez - 1]?.t ?? duracaoCena / 2;
  };
}
