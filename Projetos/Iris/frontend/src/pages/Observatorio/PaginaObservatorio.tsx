/**
 * Observatório (/app/observatorio), tela "Observatório" do docs/design-system.md: o ciclo em fichas, a linha do semestre
 * (chamada, revisões de cenário, prazos e hoje), as entregas da turma com a versão do cenário usada, os cenários do
 * observatório e o resumo do uso de IA. Responde "o que a turma entrega e quando".
 *
 * Ainda não há servidor para ciclos e turmas (contrato em types/observatorio.ts). Fora da prévia, a página diz isso e
 * oferece o caminho que existe; na prévia, mostra o ciclo de exemplo, marcado como exemplo.
 */
import { ArrowRight, CalendarRange } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { LinhaDeEntrega } from "../../components/common/LinhaDeEntrega";
import { dataDoDia } from "../../components/common/Versao";
import { PREVIA } from "../../config/env";
import { ROTAS } from "../../config/rotas";
import { CICLO_EXEMPLO, CICLOS_EXEMPLO, HOJE_DO_EXEMPLO } from "../../previa/observatorio-exemplo";
import type { Ciclo, Marco } from "../../types/observatorio";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dia = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const diaEMes = (d: string) => dataDoDia(d).slice(0, 5);

/** Linha do semestre: posição de cada marco pela data, entre o início e o fim do ciclo. */
function LinhaDoSemestre({ ciclo, hoje }: { ciclo: Ciclo; hoje: string }) {
  const ini = dia(ciclo.inicio);
  const fim = dia(ciclo.fim);
  const pos = (d: string) => `${Math.min(100, Math.max(0, ((dia(d) - ini) / (fim - ini)) * 100))}%`;
  const meses: { nome: string; data: string }[] = [];
  for (let a = +ciclo.inicio.slice(0, 4), m = +ciclo.inicio.slice(5, 7); `${a}-${String(m).padStart(2, "0")}-01` <= ciclo.fim; m === 12 ? ((m = 1), a++) : m++) {
    const d = `${a}-${String(m).padStart(2, "0")}-15`;
    if (d > ciclo.inicio && d < ciclo.fim) meses.push({ nome: MESES[m - 1], data: d });
  }
  const proximo = ciclo.marcos.find((x) => x.tipo === "prazo" && x.data >= hoje);
  const faltam = proximo ? Math.round((dia(proximo.data) - dia(hoje)) / 86400000) : null;
  const marca = (x: Marco) =>
    x.tipo === "revisao-cenario" ? (
      <span className="block size-2.5 rounded-[2px] bg-ouro" />
    ) : x.tipo === "prazo" ? (
      <span className="block size-2.5 rounded-full border-[1.5px] border-texto bg-institucional" />
    ) : (
      <span className="block size-2.5 rounded-full bg-texto-3" />
    );
  return (
    <section aria-labelledby="t-semestre" className="flex flex-col gap-4 rounded-painel bg-institucional p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="t-semestre" className="m-0 text-secao font-normal text-texto">
          O que a turma entrega e quando
        </h2>
        <p className="numeros m-0 font-dados text-micro text-ciano-texto">
          hoje {diaEMes(hoje)}
          {proximo && faltam !== null && ` · ${faltam} ${faltam === 1 ? "dia" : "dias"} para ${proximo.rotulo.toLowerCase()}`}
        </p>
      </div>
      {/* desktop e tablet: a linha; os marcos acima (chamada e revisões) e abaixo (prazos) */}
      <div aria-hidden="true" className="relative mx-2 hidden h-28 lg:block">
        <div className="absolute top-12 right-0 left-0 h-px bg-linha-forte" />
        {ciclo.marcos.map((x, i) => (
          <div key={x.data + x.tipo} className="absolute top-12 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(x.data) }}>
            {marca(x)}
            <span
              // o primeiro rótulo cresce para a direita e o último para a esquerda, para não sair da faixa
              className={`absolute text-micro whitespace-nowrap text-texto-2 ${x.tipo === "prazo" ? "top-9" : "bottom-5"} ${
                i === 0 ? "left-0" : i === ciclo.marcos.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
              }`}
            >
              {x.rotulo} · {diaEMes(x.data)}
            </span>
          </div>
        ))}
        <div className="absolute top-7 h-10 w-0.5 -translate-x-1/2 bg-ciano" style={{ left: pos(hoje) }} />
        {meses.map((m) => (
          <span key={m.nome} className="absolute top-16 -translate-x-1/2 font-dados text-micro text-texto-3" style={{ left: pos(m.data) }}>
            {m.nome}
          </span>
        ))}
      </div>
      {/* lista acessível (e a forma da linha no celular) */}
      <ol className="m-0 flex list-none flex-col gap-2 p-0 lg:sr-only">
        {ciclo.marcos.map((x) => (
          <li key={x.data + x.tipo} className={`flex items-center gap-3 text-legenda ${x.data < hoje ? "text-texto-3" : "text-texto-2"}`}>
            <span aria-hidden="true">{marca(x)}</span>
            <span className="numeros w-12 font-dados text-micro">{diaEMes(x.data)}</span>
            <span>
              {x.rotulo}
              <span className="sr-only">{x.tipo === "prazo" ? " (prazo)" : x.tipo === "revisao-cenario" ? " (revisão de cenário)" : ""}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A página com um ciclo carregado (exportada para os testes). */
export function Observatorio({ ciclo, hoje }: { ciclo: Ciclo; hoje: string }) {
  const [escolhido, setEscolhido] = useState(ciclo.id);
  const entregues = ciclo.entregas.filter((e) => e.estado === "entregue").length;
  const revisados = ciclo.registros.filter((r) => r.revisao.estado === "revisado").length;
  const comDocumento = ciclo.entregas.find((e) => e.documento);
  return (
    <div className="mx-auto flex w-full max-w-[67.5rem] flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-[calc(1.5rem*var(--escala-titulo))] font-normal text-texto sm:text-titulo">Observatório de Comércio Exterior</h1>
            <span className="rounded-fino bg-grafite px-2 py-1 text-micro text-texto-2">Dados de exemplo</span>
          </div>
          <p className="numeros m-0 text-corpo text-texto-2">
            Ciclo {ciclo.id} · {dataDoDia(ciclo.inicio).slice(0, 5)} a {dataDoDia(ciclo.fim)} · Turma de RI
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROTAS.documentos} className="botao botao-primario">
            Nova entrega
          </Link>
        </div>
      </header>

      <div role="group" aria-label="Ciclo" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-micro text-texto-3">Ciclo</span>
        {CICLOS_EXEMPLO.map((c) => (
          <button key={c.id} type="button" aria-pressed={escolhido === c.id} onClick={() => setEscolhido(c.id)} className="ficha">
            {c.id} · {c.tema}
          </button>
        ))}
      </div>

      {escolhido !== ciclo.id ? (
        <EstadoVazio icone={<CalendarRange size={22} strokeWidth={1.5} aria-hidden="true" />} titulo={`Ciclo ${escolhido}`}>
          O exemplo só traz o ciclo {ciclo.id}. Com o servidor, cada ciclo mostra a própria linha do semestre, as entregas e os cenários usados.
        </EstadoVazio>
      ) : (
        <>
          <LinhaDoSemestre ciclo={ciclo} hoje={hoje} />
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <section aria-labelledby="t-entregas" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="t-entregas" className="m-0 text-secao font-normal text-texto">
                  Entregas do ciclo
                </h2>
                <p className="numeros m-0 font-dados text-micro text-texto-3">
                  {entregues} de {ciclo.entregas.length} {entregues === 1 ? "entregue" : "entregues"}
                </p>
              </div>
              <ul className="m-0 list-none border-t border-linha p-0">
                {ciclo.entregas.map((e) => (
                  <LinhaDeEntrega
                    key={e.id}
                    e={e}
                    acao={
                      e.documento ? (
                        <Link to={ROTAS.documento(e.documento)} className="inline-flex min-h-11 items-center text-legenda text-ciano-texto hover:underline">
                          Abrir<span className="sr-only"> {e.titulo}</span>
                        </Link>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            </section>

            <aside aria-labelledby="t-cenarios-obs" className="painel-leque flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1">
                <h2 id="t-cenarios-obs" className="m-0 text-secao font-normal text-texto">
                  Cenários do observatório
                </h2>
                <p className="m-0 text-legenda text-texto-2">
                  Uma investigação compartilhada pela turma. Cada revisão gera uma versão; as entregas citam a versão que usaram.
                </p>
              </div>
              <ul className="m-0 flex list-none flex-col p-0">
                {ciclo.cenarios.map((c) => {
                  const atrasada = c.proximaRevisao < hoje;
                  return (
                    <li key={c.cenario} className="flex items-start gap-3 border-t border-linha py-3">
                      <span aria-hidden="true" className="mt-0.5 inline-grid size-7 shrink-0 place-items-center rounded-fino bg-ouro text-corpo font-medium text-abismo">
                        {c.cenario}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className="m-0 text-corpo text-texto">
                          <span className="sr-only">Cenário {c.cenario}: </span>
                          {c.nome}
                        </p>
                        <p className={`numeros m-0 font-dados text-micro ${atrasada ? "text-ambar" : "text-texto-3"}`}>
                          v{c.versao} · próxima: {atrasada ? "revisão atrasada" : dataDoDia(c.proximaRevisao)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col gap-1 border-t border-linha pt-4">
                <h3 className="m-0 text-corpo font-medium text-texto">Uso de IA na turma</h3>
                <p className="m-0 text-legenda text-texto-2">
                  {ciclo.registros.length} {ciclo.registros.length === 1 ? "registro" : "registros"} · {revisados} {revisados === 1 ? "revisado" : "revisados"} ·{" "}
                  {ciclo.registros.length - revisados} aguardando revisão humana
                </p>
                {comDocumento?.documento && (
                  <Link to={ROTAS.documento(comDocumento.documento)} className="inline-flex min-h-11 w-fit items-center gap-1 text-corpo text-ciano-texto hover:underline">
                    Abrir o registro
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

export function PaginaObservatorio() {
  if (!PREVIA)
    return (
      <EstadoVazio
        icone={<CalendarRange size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="O Observatório aparece quando houver um ciclo"
        acao={
          <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
            Ver as investigações
          </Link>
        }
      >
        Aqui vão ficar o ciclo do semestre, a linha com a chamada, as revisões de cenário e os prazos, as entregas da turma e o resumo do uso
        de IA. O servidor de ciclos e turmas ainda não existe.
      </EstadoVazio>
    );
  return <Observatorio ciclo={CICLO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />;
}

export default PaginaObservatorio;
