import { Check, CircleDashed, Minus } from "lucide-react";
import { Epistemico } from "../Epistemico";
import type { CenarioId, Metodo } from "../../lib/investigacao";
import { type Aba, useResultado } from "./contexto";
import { Letra, LinhaAfirmacao } from "./pecas";

// ------------------------------------------------------------------ fatores de mudança

export function FatoresDeMudanca() {
  const { r, vista, setVista } = useResultado();
  const tendencias = [...new Map(r.cenarios.flatMap((c) => c.tendencias).map((t) => [t.texto, t])).values()];
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="t-incertezas" className="flex flex-col gap-4">
        <div>
          <h2 id="t-incertezas" className="font-editorial text-secao text-texto">
            Incertezas críticas
          </h2>
          <p className="max-w-[64ch] text-legenda text-texto-2">
            Fatores de alto impacto cuja evolução não se pode prever. São os eixos que geram os cenários; a linha mostra onde cada cenário se posiciona.
          </p>
        </div>
        <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
          {r.incertezas.map((i) => {
            const em = (polo: 0 | 1) => r.cenarios.filter((c) => c.posicao[i.id] === polo);
            const indiferentes = r.cenarios.filter((c) => c.posicao[i.id] === null);
            return (
              <li key={i.id} className={`painel flex flex-col gap-3 p-4 ${i.id === r.principalIncerteza ? "border-ambar/40" : ""}`}>
                {i.id === r.principalIncerteza && <p className="text-micro text-ambar">Principal incerteza estratégica</p>}
                <div>
                  <p className="font-editorial text-leitura text-texto">{i.nome}</p>
                  <p className="text-legenda text-texto-2">{i.pergunta}</p>
                </div>
                <div className="flex flex-col gap-2" aria-label={`Posição dos cenários entre ${i.polos[0]} e ${i.polos[1]}`}>
                  <div className="relative h-8">
                    <span aria-hidden="true" className="absolute inset-x-3 top-1/2 h-px bg-linha-forte" />
                    {([0, 1] as const).map((polo) => (
                      <span key={polo} className={`absolute top-1/2 flex -translate-y-1/2 gap-1 ${polo === 0 ? "left-0" : "right-0"}`}>
                        {em(polo).map((c) => (
                          <button key={c.id} type="button" onClick={() => setVista(c.id)} aria-label={`Cenário ${c.id}`} className="rounded-fino">
                            <Letra id={c.id} ativa={vista === c.id} />
                          </button>
                        ))}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between gap-4 text-micro text-texto-2">
                    <span className="max-w-[45%]">{i.polos[0]}</span>
                    <span className="max-w-[45%] text-right">{i.polos[1]}</span>
                  </div>
                  {indiferentes.length > 0 && (
                    <p className="text-micro text-texto-3">
                      Indiferente em {indiferentes.map((c) => `${c.id} (${c.nome})`).join(", ")}: o cenário é definido pela outra incerteza.
                    </p>
                  )}
                </div>
                <LinhaAfirmacao a={i.porQue} compacta />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="t-variaveis" className="flex flex-col gap-4">
        <div>
          <h2 id="t-variaveis" className="font-editorial text-secao text-texto">
            Variáveis-chave
          </h2>
          <p className="max-w-[64ch] text-legenda text-texto-2">O estado observado hoje, com a evidência, e a direção que cada variável toma em cada cenário.</p>
        </div>
        <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0">
          {r.variaveis.map((v) => (
            <li key={v.id} className="grid gap-3 py-4 first:pt-0 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="font-editorial text-leitura text-texto">{v.nome}</p>
                <p className="text-legenda text-texto-2">{v.porQueImporta}</p>
                <LinhaAfirmacao a={v.estadoAtual} compacta />
              </div>
              <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
                {(["A", "B", "C"] as CenarioId[]).map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setVista(id)}
                      aria-pressed={vista === id}
                      className={`flex h-full w-full gap-2 rounded-padrao border p-2.5 text-left text-legenda transition-colors ${
                        vista === id ? "border-ambar/45 bg-ambar-suave text-texto" : "border-linha text-texto-2 hover:border-linha-forte"
                      }`}
                    >
                      <Letra id={id} ativa={vista === id} />
                      <span className="min-w-0">{v.direcao[id]}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-tendencias" className="flex flex-col gap-4">
        <h2 id="t-tendencias" className="font-editorial text-secao text-texto">
          Tendências observadas
        </h2>
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
          {tendencias.map((t) => (
            <li key={t.texto}>
              <LinhaAfirmacao a={t} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ método e revisão

const APLICACAO: Record<Metodo["aplicacao"], { rotulo: string; icone: typeof Check; cor: string }> = {
  aplicado: { rotulo: "Aplicado", icone: Check, cor: "text-ciano-texto" },
  parcial: { rotulo: "Parcial", icone: CircleDashed, cor: "text-ambar" },
  "nao-aplicado": { rotulo: "Não aplicado", icone: Minus, cor: "text-texto-3" },
};

export const FLUXO: { aba: Aba; titulo: string; texto: string }[] = [
  { aba: "sistema", titulo: "Compreender o sistema", texto: "Atores, relações e condições atuais." },
  { aba: "fatores", titulo: "Identificar fatores de mudança", texto: "Incertezas críticas, variáveis e tendências." },
  { aba: "cenarios", titulo: "Construir futuros alternativos", texto: "Premissas, mecanismos e condições de cada cenário." },
  { aba: "tempo", titulo: "Explorar a evolução temporal", texto: "Marcos, pontos de inflexão e indicadores." },
  { aba: "evidencias", titulo: "Verificar a fundamentação", texto: "Evidências, fontes e limitações." },
  { aba: "metodo", titulo: "Revisar a análise", texto: "Métodos aplicados, condições de revisão e versões." },
];

export function MetodoERevisao() {
  const { r, irPara } = useResultado();
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="t-principio" className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 id="t-principio" className="font-editorial text-secao text-texto">
            Prospectiva, não previsão
          </h2>
          <p className="max-w-[60ch] text-legenda text-texto-2">
            Esta investigação explora futuros plausíveis e as condições que os produziriam. Nenhum cenário é um destino: decisões humanas, interações estratégicas e eventos
            inesperados podem mudar as trajetórias. Por isso não há probabilidades, pesos ou índices: não existe método nem dado que os sustente aqui.
          </p>
        </div>
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {FLUXO.map((p, i) => (
            <li key={p.aba}>
              <button type="button" onClick={() => irPara(p.aba)} className="flex w-full items-baseline gap-3 rounded-padrao px-2 py-1.5 text-left hover:bg-grafite">
                <span className="numeros font-dados text-micro text-texto-3">{i + 1}</span>
                <span className="min-w-0">
                  <span className="text-legenda text-texto">{p.titulo}</span>
                  <span className="text-legenda text-texto-2"> · {p.texto}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="t-metodos" className="flex flex-col gap-4">
        <div>
          <h2 id="t-metodos" className="font-editorial text-secao text-texto">
            Métodos prospectivos
          </h2>
          <p className="max-w-[64ch] text-legenda text-texto-2">Escolhidos conforme a pergunta. Só aparece como aplicado o que foi de fato executado.</p>
        </div>
        <ul className="m-0 flex list-none flex-col divide-y divide-linha border-y border-linha p-0">
          {r.metodos.map((m) => {
            const a = APLICACAO[m.aplicacao];
            const Icone = a.icone;
            return (
              <li key={m.nome} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,14rem)_7.5rem_minmax(0,1fr)] sm:gap-4">
                <div>
                  <p className="text-corpo text-texto">{m.nome}</p>
                  <p className="text-micro text-texto-3">{m.finalidade}</p>
                </div>
                <p className={`flex items-center gap-1.5 text-legenda ${a.cor}`}>
                  <Icone size={14} aria-hidden="true" /> {a.rotulo}
                </p>
                <p className="text-legenda text-texto-2">{m.como}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="t-premissas" className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 id="t-premissas" className="font-editorial text-secao text-texto">
            Premissas gerais
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {r.premissas.map((p, i) => (
              <li key={i}>
                <LinhaAfirmacao a={p} compacta />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-editorial text-secao text-texto">Limitações</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {r.limitacoes.map((p, i) => (
              <li key={i}>
                <LinhaAfirmacao a={p} compacta />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="t-revisoes" className="flex flex-col gap-3">
        <h2 id="t-revisoes" className="font-editorial text-secao text-texto">
          Revisões
        </h2>
        <p className="max-w-[64ch] text-legenda text-texto-2">
          Cada cenário declara o que obrigaria a revê-lo (na aba Cenários). Numa investigação sobre o presente, os indicadores seriam monitorados e as revisões ficariam
          registradas aqui. Este exemplo é contrafactual, então só registra as correções feitas pelo próprio analista.
        </p>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {r.revisoes.map((v, i) => (
            <li key={i} className="flex gap-3 text-legenda">
              <span className="shrink-0 font-dados text-micro text-texto-3">{v.data}</span>
              <span className="text-texto">{v.texto}</span>
            </li>
          ))}
        </ol>
        <p className="text-micro text-texto-3">
          <Epistemico tipo="limitacao" rotulo="Sem monitoramento automático: depende do motor e de uma base de sinais, ainda inexistentes." />
        </p>
      </section>
    </div>
  );
}
