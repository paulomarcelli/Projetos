/**
 * As seções da investigação. A tela de análise está sendo refeita por partes: por enquanto mostra só o diagnóstico
 * atual e os futuros possíveis; o mapa, a linha do tempo e as fontes continuam na seção própria deles (Exploração).
 * O índice fixo, as âncoras e os testes usam SECOES: trocar aqui troca em todos os lugares.
 */
export const SECOES = [
  { id: "sec-diagnostico", numero: "01", nome: "Diagnóstico", titulo: "Diagnóstico atual", pergunta: "O que está acontecendo e por que isso importa?" },
  { id: "sec-cenarios", numero: "02", nome: "Futuros", titulo: "Futuros possíveis", pergunta: "Quais futuros podem surgir?" },
  {
    id: "sec-exploracao",
    numero: "03",
    nome: "Exploração",
    titulo: "Exploração e evidências",
    pergunta: "Como as informações se relacionam e de onde vieram as conclusões?",
  },
] as const;

/** Seções prontas, fora da tela por enquanto (voltam nas próximas partes). Não entram no índice. */
export const SECOES_EM_PAUSA = [
  { id: "sec-comparacao", numero: "—", nome: "Comparação", titulo: "Comparação estratégica", pergunta: "O que diferencia os futuros possíveis?" },
  { id: "sec-monitoramento", numero: "—", nome: "Monitoramento", titulo: "Monitoramento prospectivo", pergunta: "O que devemos observar daqui para frente?" },
] as const;

export type SecaoId = (typeof SECOES)[number]["id"] | (typeof SECOES_EM_PAUSA)[number]["id"];

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
