/*
 * Motor de inferência genérico (encadeamento para frente).
 *
 * Não sabe nada sobre investimentos: recebe fatos e regras e devolve os fatos
 * concluídos e a trilha de raciocínio. Trocar as regras troca o "especialista".
 *
 * Regra: { id, nome, prioridade?, se(fatos) => boolean, entao(fatos) => novosFatos, explicacao: texto | (fatos) => texto }
 */
(function (raiz, fabrica) {
  const modulo = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = modulo; // Node (testes)
  else raiz.Motor = modulo;                                                  // navegador
})(typeof self !== 'undefined' ? self : this, function () {
  function inferir(fatosIniciais, regras) {
    let fatos = { ...fatosIniciais };
    const trilha = [];
    const disparadas = new Set();
    // Maior prioridade primeiro; empate mantém a ordem da base.
    const ordenadas = [...regras].sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0));

    let houveNovidade = true;
    while (houveNovidade) {
      houveNovidade = false;
      for (const regra of ordenadas) {
        if (disparadas.has(regra.id) || !regra.se(fatos)) continue;
        fatos = { ...fatos, ...regra.entao(fatos) };
        disparadas.add(regra.id);
        trilha.push({
          id: regra.id,
          nome: regra.nome,
          explicacao: typeof regra.explicacao === 'function' ? regra.explicacao(fatos) : regra.explicacao,
        });
        houveNovidade = true;
        break; // recomeça pela regra de maior prioridade com os fatos novos
      }
    }
    return { fatos, trilha };
  }

  return { inferir };
});
