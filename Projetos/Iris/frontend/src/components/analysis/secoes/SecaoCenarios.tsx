/**
 * 02 · Futuros possíveis — o núcleo prospectivo: quantas trajetórias até o fim do horizonte, o leque que mostra de
 * onde elas se separam (LequeDosFuturos, lido de `posicao`) e, para cada uma, um cartão curto. Sem probabilidade nem
 * etiqueta de chance: são trajetórias condicionais.
 *
 * Cada cartão leva à Análise do Cenário (`/app/investigacoes/:id/cenarios/:letra`), o segundo nível da investigação:
 * tese, lógica, trajetória, dinâmicas, consequências, inflexões, indicadores e premissas daquele futuro. Passar o
 * cursor ou o foco por um cartão acende o ramo dele no leque.
 */
import { ArrowRight } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { ROTAS } from "../../../config/rotas";
import type { Cenario, CenarioId } from "../../../types/cenario";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { dataDoDia, Versao } from "../../common/Versao";
import { desdeAAnterior, sinaisNovos, versaoAtual, versaoDoCenario } from "../investigacao/versoes";
import { irParaSecao } from "../investigacao/secoes";
import { LequeDosFuturos } from "../prospectiva/LequeDosFuturos";
import { RotuloDeSecao } from "./RotuloDeSecao";

const POR_EXTENSO = ["Nenhuma", "Uma", "Duas", "Três", "Quatro", "Cinco", "Seis"];
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Evidências distintas citadas pelo cenário (premissas, tendências, mecanismos, a favor, contra). */
function evidenciasDoCenario(c: Cenario) {
  const ids = new Set<string>();
  for (const a of [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias, ...c.mecanismos]) for (const e of a.evidencias ?? []) ids.add(e);
  return ids.size;
}

export function SecaoCenarios() {
  const { r } = useResultado();
  const [realce, setRealce] = useState<CenarioId | null>(null);
  const secao = SECOES[1];
  const n = r.cenarios.length;
  const quantas = `${POR_EXTENSO[n] ?? n} ${n === 1 ? "futuro" : "futuros"} até ${r.horizonte.fim}`;
  const novos = sinaisNovos(r);
  return (
    <section id={secao.id} aria-label={secao.titulo} className="flex scroll-mt-[calc(var(--altura-topo,0px)+4.5rem)] flex-col gap-4">
      <RotuloDeSecao numero={secao.numero} nome={secao.titulo} nucleo />
      <h2 tabIndex={-1} data-titulo-secao className="font-editorial text-secao font-medium text-texto outline-none sm:text-titulo">
        {n > 0 ? quantas : "Sem cenários nesta investigação"}
      </h2>
      {n === 0 ? (
        <p className="max-w-[64ch] text-corpo text-texto-2">
          Esta investigação não reuniu dados suficientes para construir cenários. As lacunas estão em "Como esta análise foi feita".
        </p>
      ) : (
        <>
          {r.incertezas.length > 0 && (
            <p className="max-w-[64ch] text-corpo text-texto-2">
              {r.incertezas.length === 1 ? "Uma escolha separa" : `${POR_EXTENSO[r.incertezas.length] ?? r.incertezas.length} escolhas separam`} os futuros:{" "}
              {r.incertezas.map((i, k) => (
                <span key={i.id}>
                  {k > 0 && (k === r.incertezas.length - 1 ? " e " : ", ")}
                  <span className="text-texto">{i.nome.charAt(0).toLowerCase() + i.nome.slice(1)}</span>
                </span>
              ))}
              . Nenhum ramo tem peso ou chance atribuídos.
            </p>
          )}
          {/* o leque é a imagem principal: largura total no desktop; vertical abaixo de md (o tempo desce) */}
          <figure className="painel-leque m-0 mt-2 flex flex-col gap-4 p-4 sm:p-6">
            <div className="hidden md:block">
              <LequeDosFuturos cenarios={r.cenarios} incertezas={r.incertezas} realce={realce} rotuloDoFim={String(r.horizonte.fim)} sinaisNovos={novos} />
            </div>
            <div className="mx-auto w-full max-w-[22rem] md:hidden">
              <LequeDosFuturos cenarios={r.cenarios} incertezas={r.incertezas} realce={realce} rotuloDoFim={String(r.horizonte.fim)} sinaisNovos={novos} vertical />
            </div>
            <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-micro text-texto-2">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-px w-4 bg-texto" />
                presente
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-2 rotate-45 border border-ambar" />
                escolha incerta
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="w-4 border-t border-dashed border-ambar" />
                ramo hipotético
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-ouro" />
                cenário
              </span>
              {novos.length > 0 && (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-ciano" />
                  sinal novo desde a v{versaoAtual(r) - 1}
                </span>
              )}
              <span className="text-texto-3 md:ml-auto">Nenhum ramo tem peso ou chance.</span>
            </figcaption>
          </figure>
          <ul className="m-0 mt-2 grid list-none gap-4 p-0 lg:grid-cols-3">
            {r.cenarios.map((c, i) => (
              <CartaoDoFuturo key={c.id} c={c} indice={i} aoRealcar={setRealce} />
            ))}
          </ul>
          <DesdeAAnterior />
        </>
      )}
    </section>
  );
}

function CartaoDoFuturo({ c, indice, aoRealcar }: { c: Cenario; indice: number; aoRealcar: (id: CenarioId | null) => void }) {
  const { r, ix } = useResultado();
  const primeiroSinal = c.indicadores.map((id) => ix.sinais.get(id)).find((s) => s !== undefined);
  const nEvidencias = evidenciasDoCenario(c);
  const nSinais = r.sinais.filter((s) => s.favorece.includes(c.id) || s.enfraquece.includes(c.id)).length;
  const acender = () => aoRealcar(c.id);
  const apagar = () => aoRealcar(null);
  return (
    <li
      className="surgir flex"
      // Entrada em cascata (60 ms entre cartões); com "reduzir movimento" o CSS zera a duração.
      style={{ animationDelay: `${indice * 60}ms` } as CSSProperties}
    >
      <Link
        to={ROTAS.cenarioDaInvestigacao(r.id, c.id)}
        aria-label={`Cenário ${c.id}: ${c.nome}. Abrir a análise aprofundada`}
        onMouseEnter={acender}
        onMouseLeave={apagar}
        onFocus={acender}
        onBlur={apagar}
        className="group cartao cartao-interativo flex w-full flex-col gap-3 p-5 text-left no-underline"
      >
        <span className="flex items-center gap-2 text-micro text-texto-3">
          <span>{c.arquetipo}</span>
          <span className="numeros font-dados text-ambar">
            {r.horizonte.inicio}–{r.horizonte.fim}
          </span>
        </span>
        <span className="flex items-center gap-3 text-secao font-normal text-texto">
          <Letra id={c.id} tamanho="grande" />
          <span className="text-balance">{c.nome}</span>
        </span>
        <span className="text-corpo text-texto-2">{c.ideia}</span>
        {primeiroSinal && (
          <span className="mt-auto flex flex-col gap-1 pt-1">
            <span className="text-micro font-medium text-texto-3">Primeiro sinal a observar</span>
            <span className="text-corpo text-texto">{primeiroSinal.sinal}</span>
          </span>
        )}
        <span className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 ${primeiroSinal ? "" : "mt-auto"}`}>
          <Versao numero={versaoDoCenario(r, c.id)} />
          {r.proximaRevisao && <span className="numeros font-dados text-micro text-texto-3">revisar em {dataDoDia(r.proximaRevisao)}</span>}
        </span>
        <span className="text-micro text-texto-3">
          {plural(c.premissas.length, "premissa", "premissas")} · {plural(nEvidencias, "evidência", "evidências")} · {plural(nSinais, "sinal", "sinais")}
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-1 text-corpo text-ciano-texto">
          Abrir o cenário
          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

/** Faixa "Desde a vN": o que mudou na versão em vigor, contado do histórico, com o caminho para o monitoramento. */
function DesdeAAnterior() {
  const { r } = useResultado();
  const d = desdeAAnterior(r);
  if (!d) return null;
  const conta = (tipo: string) => d.entradas.filter((e) => e.tipo === tipo).length;
  const partes = [
    [conta("nova-evidencia"), "evidência nova", "evidências novas"],
    [conta("nova-interpretacao"), "leitura revista", "leituras revistas"],
    [conta("revisao-premissa"), "premissa em revisão", "premissas em revisão"],
    [conta("revisao-cenario"), "cenário reescrito", "cenários reescritos"],
  ] as const;
  const texto = partes.filter(([k]) => k > 0).map(([k, um, varios]) => plural(k, um, varios));
  return (
    <div className="flex flex-col gap-2 rounded-painel bg-grafite px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
      <p className="m-0 text-corpo font-medium text-texto">
        Desde a v{d.anterior} <span className="numeros font-dados text-micro font-normal text-texto-3">({d.entradas[0].data})</span>
      </p>
      <p className="m-0 flex-1 text-legenda text-texto-2">{texto.join(" · ")}</p>
      <button type="button" onClick={() => irParaSecao("sec-monitoramento")} className="inline-flex min-h-11 w-fit items-center gap-1 text-corpo text-ciano-texto hover:underline">
        Ver o monitoramento
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
