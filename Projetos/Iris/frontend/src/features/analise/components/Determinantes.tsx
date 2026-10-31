/**
 * "Fatores determinantes" da análise: o estado atual de cada fator, o que ainda não se sabe, os
 * atores (por número de relações registradas, não por importância) e os eventos recentes.
 */
import { useMemo } from "react";
import { useResultado } from "../../investigacao/contexto";
import { NOME_TIPO_ATOR } from "../../investigacao/nomes";
import { LinhaAfirmacao } from "../../investigacao/components/pecas";
import { Bloco, LinkDeArea, Parte } from "./blocos";

const LIMITE_ATORES = 8;
const EVENTOS_RECENTES = 4;

/** Fatores: uma linha por fator (nome · estado atual · por que importa), sem um cartão para cada. */
function ListaDeFatores() {
  const { r } = useResultado();
  return (
    <div className="flex flex-col">
      <div aria-hidden="true" className="hidden grid-cols-[minmax(10rem,13rem)_minmax(0,1.2fr)_minmax(0,1fr)] gap-6 pb-2 text-micro font-medium text-texto-3 md:grid">
        <span>Fator</span>
        <span>Estado atual</span>
        <span>Por que importa</span>
      </div>
      <dl className="m-0">
        {r.variaveis.map((v) => (
          <div key={v.id} className="grid gap-x-6 gap-y-1.5 border-t border-linha py-4 md:grid-cols-[minmax(10rem,13rem)_minmax(0,1.2fr)_minmax(0,1fr)]">
            <dt className="text-corpo font-medium text-texto">{v.nome}</dt>
            <dd className="m-0">
              <span className="sr-only">Estado atual: </span>
              <LinhaAfirmacao a={v.estadoAtual} compacta />
            </dd>
            <dd className="m-0 text-legenda text-texto-2">
              <span className="sr-only">Por que importa: </span>
              {v.porQueImporta}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** O que ainda não se sabe: cada incerteza crítica como um espectro entre dois polos (âmbar). */
function Incertezas() {
  const { r } = useResultado();
  return (
    <ul className="m-0 flex list-none flex-col gap-6 p-0">
      {r.incertezas.map((i) => (
        <li key={i.id} className="flex flex-col gap-2.5">
          <p className="text-corpo text-texto">
            {i.pergunta}
            {i.id === r.principalIncerteza && <span className="ml-2 whitespace-nowrap text-micro text-ambar">· principal</span>}
          </p>
          {/* Espectro entre os dois polos: a resposta pode cair em qualquer ponto da linha. */}
          <div className="flex flex-col gap-1.5">
            <span aria-hidden="true" className="relative block h-px bg-[linear-gradient(to_right,var(--color-ambar),transparent_35%,transparent_65%,var(--color-ambar))] opacity-60">
              <span className="absolute -top-[3px] left-0 size-[7px] rounded-full bg-ambar" />
              <span className="absolute -top-[3px] right-0 size-[7px] rounded-full bg-ambar" />
            </span>
            <p className="flex justify-between gap-4 text-micro text-texto-2">
              <span>{i.polos[0]}</span>
              <span className="sr-only">ou</span>
              <span className="text-right">{i.polos[1]}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Atores: os que têm mais relações registradas primeiro. Cada um abre no painel contextual
 * (papel, relações, evidências, implicações por cenário).
 */
function Atores() {
  const { r, selecao, selecionar } = useResultado();
  const atores = useMemo(() => {
    const grau = new Map<string, number>();
    for (const x of r.relacoes) {
      grau.set(x.de, (grau.get(x.de) ?? 0) + 1);
      grau.set(x.para, (grau.get(x.para) ?? 0) + 1);
    }
    return [...r.atores]
      .sort((a, b) => (grau.get(b.id) ?? 0) - (grau.get(a.id) ?? 0))
      .slice(0, LIMITE_ATORES)
      .map((a) => ({ ...a, relacoes: grau.get(a.id) ?? 0 }));
  }, [r]);
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {atores.map((a) => {
        const ativo = selecao?.tipo === "ator" && selecao.id === a.id;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => selecionar({ tipo: "ator", id: a.id })}
              aria-pressed={ativo}
              title={a.papel}
              aria-label={`${a.curto}, ${NOME_TIPO_ATOR[a.tipo]}, ${a.relacoes} ${a.relacoes === 1 ? "relação" : "relações"}`}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full py-1 pr-1.5 pl-3.5 transition-colors duration-150 ${
                ativo ? "bg-ciano-suave ring-1 ring-ciano/60" : "bg-grafite/60 hover:bg-grafite"
              }`}
            >
              <span className="text-corpo text-texto">{a.curto}</span>
              <span className="text-micro text-texto-3">{NOME_TIPO_ATOR[a.tipo]}</span>
              {/* Número de relações registradas: ordem contável, não importância. */}
              <span aria-hidden="true" className="numeros grid min-w-7 place-items-center rounded-full bg-abismo/60 px-1.5 py-0.5 text-micro text-texto-2">
                {a.relacoes}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Os eventos observados mais recentes: o "agora" de onde os cenários partem. */
function EventosRecentes() {
  const { r, selecionar, selecao } = useResultado();
  const recentes = r.linhaDoTempo.filter((e) => e.categoria === "observado").slice(-EVENTOS_RECENTES).reverse();
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {recentes.map((e) => (
        <li key={e.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
          <span className="numeros pt-px font-dados text-micro text-texto-3">{e.data}</span>
          <button
            type="button"
            onClick={() => selecionar({ tipo: "evento", id: e.id })}
            aria-pressed={selecao?.tipo === "evento" && selecao.id === e.id}
            className="text-left text-legenda text-texto underline decoration-linha-forte underline-offset-4 transition-colors duration-150 hover:decoration-ciano"
          >
            {e.texto}
          </button>
        </li>
      ))}
    </ol>
  );
}

/** C. O que determina o fenômeno: fatores em linhas; abaixo, incertezas, atores e eventos. */
export function Determinantes() {
  const { r, irPara } = useResultado();
  return (
    <Bloco id="t-fatores" titulo="Fatores determinantes" descricao="O estado atual de cada fator, o que ainda não se sabe, quem age e o que acabou de acontecer.">
      <ListaDeFatores />
      <div className="grid gap-10 pt-4 md:grid-cols-2 xl:grid-cols-3">
        <Parte id="t-incertezas" titulo="O que ainda não se sabe">
          <Incertezas />
        </Parte>
        <Parte id="t-atores" titulo="Atores" acao={<LinkDeArea aoClicar={() => irPara("relacoes")}>Ver as relações no mapa</LinkDeArea>}>
          <p className="-mt-2 text-micro text-texto-3">
            {Math.min(LIMITE_ATORES, r.atores.length)} de {r.atores.length}, pelo número de relações registradas
          </p>
          <Atores />
        </Parte>
        <Parte id="t-eventos" titulo="Eventos recentes" acao={<LinkDeArea aoClicar={() => irPara("timeline")}>Linha do tempo completa</LinkDeArea>}>
          <EventosRecentes />
        </Parte>
      </div>
    </Bloco>
  );
}
