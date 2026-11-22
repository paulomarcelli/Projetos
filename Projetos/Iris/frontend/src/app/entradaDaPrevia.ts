/** Na prévia (um arquivo só, sem servidor), o hash escolhe a tela de abertura. `#cenario-a` abre a análise do cenário A. */
export function entradaDaPrevia(hash: string) {
  const exemplo = "/app/investigacoes/exemplo-flavio-2026";
  const cenario = /^#cenario-([abc])$/i.exec(hash);
  if (cenario) return `${exemplo}/cenarios/${cenario[1].toUpperCase()}`;
  if (hash === "#investigacao") return exemplo;
  if (hash === "#relacoes") return "/app/relacoes";
  // "#app-…" para não colidir com as âncoras da landing (#metodo, #observatorio, #exemplo)
  if (hash === "#app-observatorio") return "/app/observatorio";
  if (hash === "#app-documento") return "/app/documentos/brasil-entre-tarifas";
  if (hash === "#app") return "/app";
  return "/";
}
