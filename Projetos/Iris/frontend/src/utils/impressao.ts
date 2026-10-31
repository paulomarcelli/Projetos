/**
 * Impressão e PDF: abre as seções <details> recolhidas antes de imprimir (no papel não há
 * clique) e as fecha de volta depois. O resto da adaptação ao papel é CSS (@media print em
 * styles/globais.css): tema claro forçado e interface (menu, abas, painéis, botões) escondida.
 * Conteúdo que só existe depois de um clique (ex.: o detalhe de um cenário) não é montado aqui:
 * imprime-se o que está aberto na tela.
 */
export function prepararImpressao() {
  const abertos: HTMLDetailsElement[] = [];
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("details:not([open])").forEach((d) => {
      (d as HTMLDetailsElement).open = true;
      abertos.push(d as HTMLDetailsElement);
    });
  });
  window.addEventListener("afterprint", () => {
    abertos.splice(0).forEach((d) => (d.open = false));
  });
}
