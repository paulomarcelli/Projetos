/**
 * Cartão de um cenário (o mesmo componente para A, B e C). Campos vindos só do próprio cenário e dos sinais que ele
 * cita; nada calculado nem estimado. Ver TresCenarios para a composição e a origem dos dados.
 */
import { ArrowRight, PanelRightOpen } from "lucide-react";
import type { CSSProperties } from "react";
import type { Cenario } from "../../../types/cenario";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";

/** Evidências distintas citadas pelo cenário (premissas, tendências, mecanismos, a favor, contra). */
function evidenciasDoCenario(c: Cenario) {
  const ids = new Set<string>();
  for (const a of [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias, ...c.mecanismos]) for (const e of a.evidencias ?? []) ids.add(e);
  return ids.size;
}

/**
 * Cartão curto de um cenário: o que basta para comparar os três de relance (nome, trajetória em uma frase e o
 * primeiro sinal a observar) e as contagens do que está por trás. O completo (os dez itens: lógica, premissas,
 * consequências, indicadores, condições, evidências e versões anteriores) abre no painel lateral, sem sair da página,
 * para não repetir aqui o que o painel já mostra.
 *
 * Interação: clicar no cartão destaca o cenário (mesmo destaque na matriz, nas tabelas, no mapa e na timeline). Pelo
 * teclado, o destaque é o botão do título (aria-pressed). Os botões internos não propagam o clique.
 */
export function CartaoDeCenario({ c, indice }: { c: Cenario; indice: number }) {
  const { r, ix, vista, setVista, selecionar, irPara } = useResultado();
  const ativo = vista === c.id;
  const alternar = () => setVista(ativo ? "presente" : c.id);
  const primeiroSinal = c.indicadores.map((id) => ix.sinais.get(id)).find((s) => s !== undefined);
  const nEvidencias = evidenciasDoCenario(c);
  const revisadas = new Set(r.monitoramento?.revisoesDePremissas.filter((x) => x.cenario === c.id).map((x) => x.premissa)).size;
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  return (
    <li
      // Entrada em cascata (60 ms entre cartões); com "reduzir movimento" o CSS zera a duração.
      style={{ animationDelay: `${indice * 60}ms` } as CSSProperties}
      data-selecionado={ativo || undefined}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button, a")) alternar();
      }}
      className="cartao cartao-interativo surgir flex cursor-pointer flex-col gap-4 p-5"
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

      <p className="text-legenda leading-relaxed text-texto-2">{c.ideia}</p>

      {primeiroSinal && (
        <div className="mt-auto flex flex-col gap-1 border-t border-linha pt-3.5">
          <p className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">Primeiro sinal a observar</p>
          <p className="text-legenda font-medium text-texto">{primeiroSinal.sinal}</p>
          {primeiroSinal.quando && <p className="numeros font-dados text-micro text-ambar">{primeiroSinal.quando}</p>}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-micro text-texto-3">
          {plural(c.premissas.length, "premissa", "premissas")} · {plural(nEvidencias, "evidência", "evidências")}
          {revisadas > 0 && <span className="text-ambar"> · {plural(revisadas, "premissa revista", "premissas revistas")}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="botao botao-secundario botao-pequeno"
            onClick={() => {
              setVista(c.id);
              selecionar({ tipo: "cenario", id: c.id });
            }}
          >
            <PanelRightOpen size={14} aria-hidden="true" />
            Explorar o cenário
          </button>
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno"
            aria-label={`Abrir o cenário ${c.id} na linha do tempo: ${c.nome}`}
            onClick={() => {
              setVista(c.id);
              irPara("timeline");
            }}
          >
            Linha do tempo
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </li>
  );
}
