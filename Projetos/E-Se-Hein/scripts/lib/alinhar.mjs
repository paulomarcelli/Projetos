// Alinha o roteiro exato com as palavras da transcrição.
// O roteiro manda na grafia; a transcrição manda no tempo.

/** Remove as marcações de voz ([calm], [mysterious]…) e devolve as palavras com o parágrafo. */
export function extrairPalavras(roteiro) {
  const semMarcas = roteiro.replace(/\[[^\]]*\]/g, " ");
  const paragrafos = semMarcas
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const palavras = [];
  paragrafos.forEach((p, paragrafo) => {
    for (const texto of p.split(/\s+/)) {
      if (normalizar(texto)) palavras.push({ texto, paragrafo });
    }
  });
  return palavras;
}

/** Caixa baixa, sem acento e sem pontuação: serve só para comparar. */
export function normalizar(palavra) {
  return palavra
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]/g, "");
}

function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

function parecidas(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5) return false;
  return distancia(a, b) / Math.max(a.length, b.length) <= 0.2;
}

/**
 * @param {{texto: string, paragrafo: number}[]} roteiro
 * @param {{text: string, startMs: number, endMs: number}[]} whisper
 */
export function alinhar(roteiro, whisper) {
  const ouvidas = whisper.filter((p) => normalizar(p.text));
  if (ouvidas.length === 0) throw new Error("Transcrição vazia: não há tempo para alinhar.");

  const a = roteiro.map((p) => normalizar(p.texto));
  const b = ouvidas.map((p) => normalizar(p.text));

  // Maior subsequência comum (palavras iguais ou quase iguais) = âncoras de tempo.
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = parecidas(a[i], b[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const par = new Array(n).fill(-1);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (parecidas(a[i], b[j]) && lcs[i][j] === lcs[i + 1][j + 1] + 1) {
      par[i] = j;
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
    else j++;
  }

  const saida = roteiro.map((p, i) => ({
    texto: p.texto,
    paragrafo: p.paragrafo,
    inicioMs: par[i] >= 0 ? ouvidas[par[i]].startMs : 0,
    fimMs: par[i] >= 0 ? ouvidas[par[i]].endMs : 0,
    casou: par[i] >= 0,
  }));

  // Sequências sem par: dividem o tempo das palavras ouvidas entre as âncoras vizinhas
  // (ou o silêncio entre elas, se não sobrou palavra ouvida), na proporção do tamanho.
  let i = 0;
  while (i < n) {
    if (par[i] >= 0) {
      i++;
      continue;
    }
    let k = i;
    while (k < n && par[k] < 0) k++;
    const jAntes = i > 0 ? par[i - 1] : -1;
    const jDepois = k < n ? par[k] : m;
    const limiteIni = jAntes >= 0 ? ouvidas[jAntes].endMs : 0;
    const limiteFim = jDepois < m ? ouvidas[jDepois].startMs : ouvidas[m - 1].endMs;
    let ini = limiteIni;
    let fim = limiteFim;
    if (jDepois - jAntes > 1) {
      ini = Math.max(limiteIni, ouvidas[jAntes + 1].startMs);
      fim = Math.min(limiteFim, ouvidas[jDepois - 1].endMs);
    }
    if (fim < ini) fim = ini;
    const pesos = saida.slice(i, k).map((p) => Math.max(1, normalizar(p.texto).length));
    const total = pesos.reduce((s, x) => s + x, 0);
    let cursor = ini;
    for (let q = i; q < k; q++) {
      const fatia = ((fim - ini) * pesos[q - i]) / total;
      saida[q].inicioMs = Math.round(cursor);
      cursor += fatia;
      saida[q].fimMs = q === k - 1 ? fim : Math.round(cursor);
    }
    i = k;
  }

  // Garantia final: nada anda para trás.
  for (let q = 1; q < n; q++) {
    if (saida[q].inicioMs < saida[q - 1].fimMs) saida[q].inicioMs = saida[q - 1].fimMs;
    if (saida[q].fimMs < saida[q].inicioMs) saida[q].fimMs = saida[q].inicioMs;
  }
  return saida;
}

/** Um trecho por parágrafo, com início e fim em segundos. */
export function montarTrechos(palavras) {
  const trechos = [];
  for (const p of palavras) {
    const t = trechos[p.paragrafo] ?? (trechos[p.paragrafo] = { palavras: [] });
    t.palavras.push(p);
  }
  return trechos.filter(Boolean).map(({ palavras: ps }) => ({
    texto: ps.map((p) => p.texto).join(" "),
    inicio: ps[0].inicioMs / 1000,
    fim: ps[ps.length - 1].fimMs / 1000,
  }));
}

/**
 * Corrige os tempos com as pausas medidas no áudio (ffmpeg silencedetect).
 * O Whisper acerta bem onde a fala recomeça, mas estica as palavras por cima das pausas.
 * @param {{inicioMs: number, fimMs: number}[]} silencios
 */
export function ajustarAoSilencio(palavras, silencios) {
  const r = palavras.map((p) => ({ ...p }));
  for (let i = 0; i < r.length; i++) {
    const w = r[i];
    for (const s of silencios) {
      const dentroIni = w.inicioMs >= s.inicioMs && w.inicioMs < s.fimMs;
      const pertoDoFim = w.inicioMs - s.inicioMs > s.fimMs - w.fimMs;
      if (dentroIni && w.fimMs <= s.fimMs && pertoDoFim) {
        // Palavra inteira dentro da pausa, colada no fim dela: foi dita logo depois.
        const dur = Math.max(w.fimMs - w.inicioMs, 120);
        w.inicioMs = s.fimMs;
        w.fimMs = s.fimMs + dur;
        const prox = r[i + 1];
        if (prox && prox.inicioMs < w.fimMs) {
          prox.inicioMs = w.fimMs;
          prox.fimMs = Math.max(prox.fimMs, prox.inicioMs);
        }
      } else if (dentroIni && w.fimMs <= s.fimMs && i > 0) {
        // Palavra inteira dentro da pausa: foi dita antes dela. Divide o tempo com a anterior.
        const ant = r[i - 1];
        const meio = Math.round((ant.inicioMs + ant.fimMs) / 2);
        w.inicioMs = meio;
        w.fimMs = ant.fimMs;
        ant.fimMs = meio;
      } else if (dentroIni && w.fimMs > s.fimMs) {
        w.inicioMs = s.fimMs;
      } else if (s.inicioMs > w.inicioMs && s.inicioMs < w.fimMs && s.inicioMs - w.inicioMs < 120 && s.fimMs < w.fimMs) {
        // A pausa começa logo no início da palavra: ela só é dita depois da pausa.
        w.inicioMs = s.fimMs;
      } else if (s.inicioMs > w.inicioMs && s.inicioMs < w.fimMs) {
        w.fimMs = s.inicioMs;
        // A fala recomeça no fim da pausa: a palavra seguinte começa ali.
        const prox = r[i + 1];
        if (prox && prox.inicioMs >= s.fimMs && prox.inicioMs - s.fimMs < 300) prox.inicioMs = s.fimMs;
      }
    }
  }
  return r;
}
