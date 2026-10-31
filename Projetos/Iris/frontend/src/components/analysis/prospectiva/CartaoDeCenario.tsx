/**
 * Cartão de um cenário (o mesmo componente para A, B e C). Campos vindos só do próprio cenário;
 * nada calculado nem estimado. Ver TresCenarios para a composição e a origem dos dados.
 */
import { ArrowRight, PanelRightOpen } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { Cenario, Efeito } from "../../../types/cenario";
import { useResultado } from "../investigacao/contexto";
import { ChipAtor, Letra } from "../investigacao/pecas";

const EFEITO: Record<Efeito, { rotulo: string; cor: string }> = {
  aproximacao: { rotulo: "aproximação", cor: "var(--color-ciano)" },
  atrito: { rotulo: "atrito", cor: "var(--color-ambar)" },
  misto: { rotulo: "misto", cor: "var(--color-texto-2)" },
  neutro: { rotulo: "sem mudança", cor: "var(--color-texto-3)" },
};

/** Evidências distintas citadas pelo cenário (premissas, tendências, mecanismos, a favor, contra). */
function evidenciasDoCenario(c: Cenario) {
  const ids = new Set<string>();
  for (const a of [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias, ...c.mecanismos]) for (const e of a.evidencias ?? []) ids.add(e);
  return ids.size;
}

/** Uma parte do cartão: rótulo curto e conteúdo. Em três colunas, alinha com as dos vizinhos. */
function Parte({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="text-micro font-medium text-texto-3">{rotulo}</p>
      {children}
    </div>
  );
}

/** Número de partes do cartão: as linhas da subgrade (alinhamento entre os três cartões). */
export const PARTES = 9;

/**
 * Cartão de um cenário. O essencial fica visível (nome, ideia, lógica, consequências, atores,
 * condições, sinais, incertezas); o completo (premissas, mecanismos, mapa das consequências,
 * evidências a favor e contra, limitações) abre no painel, sem sair da página.
 *
 * Interação: clicar no cartão destaca o cenário (mesmo destaque na matriz, nas tabelas, no mapa
 * e na timeline). Pelo teclado, o destaque é o botão do título (aria-pressed). Chips de ator e
 * botões internos não propagam o clique.
 */
export function CartaoDeCenario({ c, indice }: { c: Cenario; indice: number }) {
  const { r, ix, vista, setVista, selecionar, irPara } = useResultado();
  const ativo = vista === c.id;
  const alternar = () => setVista(ativo ? "presente" : c.id);
  const sinais = c.indicadores.map((id) => ix.sinais.get(id)).filter((s) => s !== undefined);
  const nEvidencias = evidenciasDoCenario(c);
  return (
    <li
      // Entrada em cascata (60 ms entre cartões); com "reduzir movimento" o CSS zera a duração.
      style={{ animationDelay: `${indice * 60}ms`, "--partes": PARTES } as CSSProperties}
      data-selecionado={ativo || undefined}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button, a")) alternar();
      }}
      className="cartao cartao-interativo surgir flex cursor-pointer flex-col gap-5 p-5 @4xl:row-span-(--partes) @4xl:grid @4xl:grid-rows-subgrid @4xl:gap-y-5"
    >
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2.5 text-micro text-texto-3">
          <Letra id={c.id} ativa={ativo} tamanho="grande" />
          <span>{c.arquetipo}</span>
          <span aria-hidden="true">·</span>
          <span className="numeros font-dados text-ambar">
            {r.horizonte.inicio}–{r.horizonte.fim}
          </span>
        </p>
        <h3 className="m-0 font-editorial text-secao font-medium text-texto">
          <button type="button" aria-pressed={ativo} aria-label={`Cenário ${c.id}: ${c.nome}`} onClick={alternar} className="text-left">
            {c.nome}
          </button>
        </h3>
      </header>

      <p className="text-corpo text-texto">{c.ideia}</p>

      <Parte rotulo="Lógica">
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {c.mecanismos.map((m) => (
            <li key={m.condicao} className="text-legenda text-texto-2">
              {m.condicao} <ArrowRight size={12} aria-label="leva a" className="inline align-[-1px] text-texto-3" /> <span className="text-texto">{m.consequencia}</span>
            </li>
          ))}
        </ul>
      </Parte>

      <Parte rotulo="Consequências">
        <p className="text-legenda text-texto">{c.impacto}</p>
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
          {c.consequencias.map((q) => (
            <li key={q.regiao} className="inline-flex items-center gap-1.5 text-micro text-texto-2" title={q.texto}>
              <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: EFEITO[q.efeito].cor }} />
              {q.regiao}: {EFEITO[q.efeito].rotulo}
            </li>
          ))}
        </ul>
      </Parte>

      <Parte rotulo="Atores decisivos">
        <div className="flex flex-wrap gap-1.5">
          {c.atoresDecisivos.map((a) => (
            <ChipAtor key={a} id={a} />
          ))}
        </div>
      </Parte>

      <Parte rotulo="Depende de">
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-legenda text-texto-2">
          {c.condicoes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Parte>

      <Parte rotulo="Sinais a acompanhar">
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-legenda text-texto-2">
          {sinais.map((s) => (
            <li key={s.id}>{s.sinal}</li>
          ))}
        </ul>
      </Parte>

      <Parte rotulo="Incertezas">
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-legenda text-texto-2">
          {c.incertezas.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Parte>

      <footer className="flex flex-col gap-3 border-t border-linha pt-4">
        <p className="text-micro text-texto-3">
          {nEvidencias} {nEvidencias === 1 ? "evidência vinculada" : "evidências vinculadas"} · {c.favoraveis.length} a favor, {c.contrarias.length} contra
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="botao botao-secundario botao-pequeno"
            onClick={() => {
              setVista(c.id);
              selecionar({ tipo: "cenario", id: c.id });
            }}
          >
            <PanelRightOpen size={14} aria-hidden="true" />
            Detalhes e evidências
          </button>
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno"
            aria-label={`Abrir o cenário ${c.id} na timeline: ${c.nome}`}
            onClick={() => {
              setVista(c.id);
              irPara("timeline");
            }}
          >
            Na timeline
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </li>
  );
}
