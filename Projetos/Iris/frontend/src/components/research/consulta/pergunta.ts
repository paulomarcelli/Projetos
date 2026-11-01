/**
 * A pergunta de uma investigação: exemplos de partida e a checagem simples do que costuma fazer
 * uma boa pergunta prospectiva (quem age, o que muda, sobre o que tem efeito).
 * Usado no formulário da plataforma e na landing ("teste uma pergunta").
 *
 * A checagem é por PALAVRAS (nomes próprios e verbos comuns), não uma análise: serve de lembrete
 * enquanto se escreve e nunca bloqueia o envio. As interfaces que a mostram dizem isso.
 */

export const EXEMPLO =
  "Como uma mudança na política externa brasileira pode afetar a ordem internacional nos próximos cinco anos?";

/** Perguntas de partida (só formulações; nenhuma afirma um fato). */
export const EXEMPLOS = [
  EXEMPLO,
  "Como a transição energética pode mudar o peso dos países produtores de petróleo até 2035?",
  "Que efeitos uma reforma do Conselho de Segurança da ONU teria sobre o Sul Global?",
];

/** Os três critérios da checagem simples (ver o comentário do arquivo). */
export const CRITERIOS: { id: string; rotulo: string; dica: string; ok: (t: string) => boolean }[] = [
  {
    id: "ator",
    rotulo: "Um ator",
    dica: "país, organização ou grupo (Brasil, ONU, Mercosul…)",
    // Nome próprio no meio da frase ou sigla (diferencia maiúsculas), ou um ator comum por nome.
    ok: (t) => /[a-zà-ú,;:]\s+[A-ZÀ-Ú][a-zà-ú]+|\b[A-Z]{2,}\b/.test(t) || /brasil|china|estados unidos|\beua\b|europ|rússia|índia|\bonu\b|otan/i.test(t),
  },
  {
    id: "mudanca",
    rotulo: "Uma mudança",
    dica: "o que se transforma (eleição, acordo, crise, reforma…)",
    ok: (t) => /\b(se|caso|mudan|mud[ae]|transi|reform|acordo|elei|crise|conflit|guerra|san[cç]|sa[ií]da|ascens|decl[ií]n|aument|queda|ruptura|alinhament)/i.test(t),
  },
  {
    id: "efeito",
    rotulo: "Um efeito",
    dica: "sobre o que ela age (comércio, segurança, ordem regional…)",
    ok: (t) => /\b(afet|impact|efeito|consequ|alter|influ|transform|reconfigur|redefin|peso|equil[ií]brio|ordem)/i.test(t),
  },
];

