/**
 * A estrutura da resposta orientada ao futuro: compreender o presente (diagnóstico) → identificar as dinâmicas
 * estratégicas → construir futuros (cenários) → monitorar sinais → atualizar.
 *
 * Quando o motor escreve o diagnóstico e as dinâmicas (`r.diagnostico`, `r.dinamicas`), eles são usados como vêm.
 * Sem eles, as duas partes são MONTADAS a partir de campos que o resultado já tem, sem acrescentar nada:
 * - diagnóstico: o aviso de contexto (o que está acontecendo), a incerteza principal (o problema central e por que
 *   importa) e as implicações prospectivas declaradas nas evidências;
 * - dinâmicas: os acontecimentos observados, os atores centrais com os seus interesses e as relações que mantêm
 *   (cooperação, rivalidade, dependência), os fatores em jogo e as demais incertezas, como texto corrido.
 * Cada afirmação mantém o tipo epistêmico e as evidências de origem: nada vira fato por ter sido reorganizado.
 */
import type { Afirmacao } from "../../../types/fonte";
import type { Diagnostico, ParagrafoDeDinamica, ResultadoDeInvestigacao } from "../../../types/investigacao";
import type { TipoRelacao } from "../../../types/relacao";
import { atoresCentrais } from "../conversa/complementos";

const IMPLICACOES = 3;
const ACONTECIMENTOS = 3;
const ATORES = 4;
const RELACOES_POR_ATOR = 2;

export const NATUREZA: Record<TipoRelacao, string> = {
  cooperacao: "Cooperação",
  competicao: "Rivalidade",
  conflito: "Conflito",
  dependencia: "Dependência",
  influencia: "Influência",
  fluxo: "Fluxo",
};

export function montarDiagnostico(r: ResultadoDeInvestigacao): Diagnostico & { problemaPolos?: [string, string] } {
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza) ?? r.incertezas[0];
  if (r.diagnostico) return { ...r.diagnostico, problemaPolos: principal?.polos };

  // implicações: primeiro as das evidências que sustentam a incerteza principal, depois as demais
  const daPrincipal = new Set(principal?.porQue.evidencias ?? []);
  const ordenadas = [...r.evidencias].sort((a, b) => Number(daPrincipal.has(b.id)) - Number(daPrincipal.has(a.id)));
  const implicacoes: Afirmacao[] = ordenadas
    .filter((e) => e.implicacao.trim())
    .slice(0, IMPLICACOES)
    .map((e) => ({ tipo: "inferencia", texto: e.implicacao, evidencias: [e.id] }));

  return {
    situacao: [r.avisoDeContexto],
    problema: principal ? { tipo: "incerteza", texto: principal.pergunta, evidencias: principal.porQue.evidencias } : { tipo: "incerteza", texto: r.sintese },
    relevancia: principal ? principal.porQue : { tipo: "limitacao", texto: "Esta investigação não declarou uma incerteza principal." },
    implicacoes,
    problemaPolos: principal?.polos,
  };
}

export function montarDinamicas(r: ResultadoDeInvestigacao): ParagrafoDeDinamica[] {
  if (r.dinamicas?.length) return r.dinamicas;
  const paragrafos: ParagrafoDeDinamica[] = [];
  const nome = (id: string) => r.atores.find((a) => a.id === id)?.nome ?? id;

  // 1. o que aconteceu: os acontecimentos observados mais recentes
  const recentes = r.linhaDoTempo
    .filter((e) => e.categoria === "observado")
    .sort((a, b) => a.ano - b.ano)
    .slice(-ACONTECIMENTOS);
  if (recentes.length)
    paragrafos.push({ afirmacoes: recentes.map((e) => ({ tipo: "fato", texto: `${e.data}: ${e.texto}`, evidencias: e.evidencias })) });

  // 2. quem age, o que quer e com quem se alia ou rivaliza (cada relação aparece uma vez só)
  const usadas = new Set<string>();
  for (const a of atoresCentrais(r, ATORES)) {
    const afirmacoes: Afirmacao[] = [];
    const interesse = a.caracteristicas[0];
    afirmacoes.push(interesse ? { ...interesse, texto: `${a.nome}, ${minuscula(a.papel.replace(/\.$/, ""))}: ${interesse.texto}` } : { tipo: "fato", texto: `${a.nome}: ${a.papel}` });
    const atores = [a.id];
    const relacoes = r.relacoes.filter((rel) => (rel.de === a.id || rel.para === a.id) && rel.presente && !usadas.has(rel.id)).slice(0, RELACOES_POR_ATOR);
    for (const rel of relacoes) {
      usadas.add(rel.id);
      const outro = rel.de === a.id ? rel.para : rel.de;
      atores.push(outro);
      afirmacoes.push({ ...rel.presente!, texto: `${NATUREZA[rel.tipo]} com ${nome(outro)}: ${rel.presente!.texto}` });
    }
    paragrafos.push({ afirmacoes, atores });
  }

  // 3. os fatores em jogo: o estado atual (com evidência) e por que importa (leitura do analista)
  if (r.variaveis.length)
    paragrafos.push({
      afirmacoes: r.variaveis.flatMap((v): Afirmacao[] => [
        { ...v.estadoAtual, texto: `${v.nome}: ${v.estadoAtual.texto}` },
        { tipo: "inferencia", texto: v.porQueImporta },
      ]),
    });

  // 4. as outras incertezas, que também abrem caminhos diferentes
  const outras = r.incertezas.filter((i) => i.id !== r.principalIncerteza);
  if (outras.length)
    // a pergunta é a incerteza; a justificativa mantém o tipo com que foi declarada
    paragrafos.push({ afirmacoes: outras.flatMap((i): Afirmacao[] => [{ tipo: "incerteza", texto: i.pergunta }, i.porQue]) });

  return paragrafos;
}

/** "Ator central…" → "ator central…", para o papel caber no meio da frase (siglas como "EUA" ficam). */
function minuscula(s: string) {
  return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}
