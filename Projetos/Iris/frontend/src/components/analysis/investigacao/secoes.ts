/**
 * As cinco seções da investigação, na ordem em que um analista pensa: o presente, os futuros, o que os diferencia,
 * o que acompanhar e de onde vem cada conclusão. Cada uma responde a UMA pergunta, mostrada no cabeçalho dela.
 * O índice fixo, as âncoras e os testes usam esta lista: trocar aqui troca em todos os lugares.
 */
export const SECOES = [
  { id: "sec-diagnostico", numero: "01", nome: "Diagnóstico", titulo: "Diagnóstico estratégico", pergunta: "O que está acontecendo e por que isso importa?" },
  { id: "sec-cenarios", numero: "02", nome: "Cenários", titulo: "Cenários prospectivos", pergunta: "Quais futuros podem surgir?" },
  { id: "sec-comparacao", numero: "03", nome: "Comparação", titulo: "Comparação estratégica", pergunta: "O que diferencia os futuros possíveis?" },
  { id: "sec-monitoramento", numero: "04", nome: "Monitoramento", titulo: "Monitoramento prospectivo", pergunta: "O que devemos observar daqui para frente?" },
  { id: "sec-exploracao", numero: "05", nome: "Exploração", titulo: "Exploração e evidências", pergunta: "Como as informações se relacionam e de onde vieram as conclusões?" },
] as const;

export type SecaoId = (typeof SECOES)[number]["id"];

/** Leva até uma seção respeitando "reduzir movimento" (a rolagem suave do CSS também respeita). */
export function irParaSecao(id: SecaoId) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView?.({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  // O cabeçalho da seção recebe o foco (sem rolar de novo), para o leitor de tela anunciar onde chegou.
  el.querySelector<HTMLElement>("[data-titulo-secao]")?.focus({ preventScroll: true });
  // Marca de chegada: um traço ciano breve ao lado do título (CSS; nenhum efeito com "reduzir movimento").
  el.classList.remove("secao-chegou");
  void el.offsetWidth;
  el.classList.add("secao-chegou");
}
