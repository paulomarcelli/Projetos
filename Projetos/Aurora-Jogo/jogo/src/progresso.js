/*
 * Progressão da Aurora (skill `rpg`) e salvamento (skill `save-systems`). Sem nada gráfico.
 * Moedas de prata caem das criaturas e chefes; na Fogueira Lunar ela evolui um atributo por vez.
 */
export const VERSAO_SAVE = 1;
export const ATRIBUTOS = {
  vigor:    { nome: 'Vigor',    descricao: 'Mais vida' },
  foco:     { nome: 'Foco',     descricao: 'Mais mana' },
  forca:    { nome: 'Força',    descricao: 'Golpes de lâmina mais fortes' },
  precisao: { nome: 'Precisão', descricao: 'Flechas mais fortes' },
};

export function novoProgresso() {
  return { nivel: 1, moedas: 0, atributos: { vigor: 5, foco: 5, forca: 5, precisao: 5 }, fogueira: null };
}

export function derivados(p) {
  const a = p.atributos;
  return {
    vidaMax: 60 + a.vigor * 12,
    manaMax: 20 + a.foco * 8,
    danoLamina: 8 + a.forca * 3,
    danoFlecha: 6 + a.precisao * 3,
  };
}

/** Moedas para ir do nível n ao n+1: diferença de uma curva cúbica (níveis iniciais rápidos). */
export function custoNivel(n) {
  return Math.round((20 * ((n + 1) ** 3 - n ** 3)) / 3);
}

export function evoluir(p, atributo) {
  if (!(atributo in ATRIBUTOS)) return { ok: false, progresso: p, motivo: 'atributo desconhecido' };
  const custo = custoNivel(p.nivel);
  if (p.moedas < custo) return { ok: false, progresso: p, motivo: 'moedas insuficientes' };
  return {
    ok: true,
    progresso: {
      ...p,
      nivel: p.nivel + 1,
      moedas: p.moedas - custo,
      atributos: { ...p.atributos, [atributo]: p.atributos[atributo] + 1 },
    },
  };
}

export function serializar(p) {
  return JSON.stringify({ versao: VERSAO_SAVE, ...p });
}

/** Carrega com cuidado: texto inválido, save de versão mais nova ou campos faltando → null. */
export function desserializar(texto) {
  let dados;
  try { dados = JSON.parse(texto); } catch { return null; }
  if (!dados || typeof dados !== 'object' || !Number.isInteger(dados.versao)) return null;
  if (dados.versao > VERSAO_SAVE) return null;          // save de uma versão futura do jogo
  const { versao, ...p } = dados;
  if (!Number.isInteger(p.nivel) || typeof p.moedas !== 'number' || !p.atributos) return null;
  return p;
}
