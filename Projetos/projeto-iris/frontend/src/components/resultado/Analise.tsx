import { Check, CircleDashed, Minus } from "lucide-react";
import type { Metodo } from "../../lib/investigacao";
import { useResultado } from "./contexto";
import { LinhaAfirmacao } from "./pecas";

const APLICACAO: Record<Metodo["aplicacao"], { rotulo: string; icone: typeof Check; cor: string }> = {
  aplicado: { rotulo: "Aplicado", icone: Check, cor: "text-ciano-texto" },
  parcial: { rotulo: "Parcial", icone: CircleDashed, cor: "text-ambar" },
  "nao-aplicado": { rotulo: "Não aplicado", icone: Minus, cor: "text-texto-3" },
};

function Titulo({ children }: { children: string }) {
  return <h3 className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">{children}</h3>;
}

/**
 * "Como esta análise foi feita": método, premissas, limitações e revisões. Não é uma aba: abre no
 * painel lateral, porque é consulta de apoio, não tarefa do dia a dia.
 */
export function PainelMetodo() {
  const { r } = useResultado();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-legenda text-texto-2">
        Investigação prospectiva, não previsão: explora futuros plausíveis e as condições que os produziriam. Sem probabilidades, pesos ou índices, porque não há método nem
        dado que os sustente.
      </p>

      <section className="flex flex-col gap-2">
        <Titulo>Métodos</Titulo>
        <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0">
          {r.metodos.map((m) => {
            const a = APLICACAO[m.aplicacao];
            const Icone = a.icone;
            return (
              <li key={m.nome}>
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-1.5 [&::-webkit-details-marker]:hidden">
                    <span className="text-legenda text-texto">{m.nome}</span>
                    <span className={`inline-flex shrink-0 items-center gap-1 text-micro ${a.cor}`}>
                      <Icone size={13} aria-hidden="true" /> {a.rotulo}
                    </span>
                  </summary>
                  <p className="pb-2.5 text-legenda text-texto-2">
                    <span className="text-texto-3">{m.finalidade} </span>
                    {m.como}
                  </p>
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <Titulo>Premissas gerais</Titulo>
        {r.premissas.map((p, i) => (
          <LinhaAfirmacao key={i} a={p} compacta />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <Titulo>Limitações</Titulo>
        {r.limitacoes.map((p, i) => (
          <LinhaAfirmacao key={i} a={p} compacta />
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <Titulo>Revisões</Titulo>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {r.revisoes.map((v, i) => (
            <li key={i} className="flex flex-col text-legenda">
              <span className="font-dados text-micro text-texto-3">{v.data}</span>
              <span className="text-texto-2">{v.texto}</span>
            </li>
          ))}
        </ol>
        <p className="text-micro text-texto-3">Cada cenário declara o que obrigaria a revê-lo. O monitoramento automático depende do motor, ainda inexistente.</p>
      </section>
    </div>
  );
}
