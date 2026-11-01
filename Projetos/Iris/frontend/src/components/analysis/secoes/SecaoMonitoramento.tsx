/**
 * 04 Monitoramento prospectivo — "O que devemos observar daqui para frente?"
 *
 * A investigação não é um relatório parado: depois de criada, ela recebe acontecimentos novos e avalia como eles se
 * relacionam com os cenários. Cinco partes:
 *   A. novos acontecimentos (data, título, descrição, fonte, relação com a investigação, cenários afetados);
 *   B. impacto nos cenários (favorece · enfraquece · neutro · ambíguo · exige investigação, sempre justificado);
 *   C. revisão de premissas (reforçada · enfraquecida · contradita · obsoleta · exige revisão);
 *   D. indicadores de acompanhamento (os sinais da investigação, com a última observação e a tendência);
 *   E. histórico de atualizações (criação, nova evidência, nova interpretação, revisão de premissa e de cenário).
 *
 * De onde vêm os dados: `r.monitoramento` (contrato em types/monitoramento.ts), que o servidor ainda não produz.
 * Sem ele, A, B e C mostram estados vazios que dizem o que falta; D usa os sinais que a investigação já tem; E usa o
 * registro de revisões que já existe (`r.revisoes`). Nada é guardado no navegador nem simulado como real.
 * Acontecimento não é confirmação: a interface nunca soma impactos num "placar" de cenários.
 */
import { ChevronDown, FlaskConical, Radar } from "lucide-react";
import { type ReactNode, useState } from "react";
import { IMPACTO, TENDENCIA, TIPO_DE_ACONTECIMENTO, TIPO_DE_MUDANCA } from "../../../config/semantica";
import type { Acontecimento, EntradaDoHistorico, TipoDeMudanca } from "../../../types/monitoramento";
import { Etiqueta } from "../../common/Etiqueta";
import { SecaoDaInvestigacao, Subtitulo } from "../blocos";
import { Frase } from "../conversa/resposta/partes";
import { useResultado } from "../investigacao/contexto";
import { Citacoes, Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { Premissas } from "../prospectiva/DetalheDoCenario";

export function SecaoMonitoramento({
  demonstracao,
}: {
  /** Só na prévia e em desenvolvimento: liga e desliga a demonstração com dados fictícios. */
  demonstracao?: { ativa: boolean; alternar: () => void };
}) {
  const { r } = useResultado();
  const m = r.monitoramento;
  return (
    <SecaoDaInvestigacao
      secao={SECOES[3]}
      acao={
        demonstracao && (
          <button type="button" onClick={demonstracao.alternar} aria-pressed={demonstracao.ativa} className="botao botao-fantasma botao-pequeno">
            <FlaskConical size={14} aria-hidden="true" />
            {demonstracao.ativa ? "Voltar aos dados da investigação" : "Ver com dados fictícios"}
          </button>
        )
      }
    >
      {m?.demonstracao && (
        <p role="note" className="rounded-padrao border border-ambar/45 bg-ambar-suave px-4 py-3 text-legenda text-texto">
          <span className="font-medium">Demonstração da interface.</span> Os acontecimentos, impactos, revisões e versões abaixo são fictícios, criados só para
          mostrar como esta seção funciona. Não aconteceram e não alteram a investigação.
        </p>
      )}

      {/* O que fazer agora fica na frente: os sinais a observar (já existem na investigação). O estado do
          acompanhamento, as versões e a legenda ficam num cartão ao lado, em vez de caixas vazias empilhadas. */}
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <section aria-labelledby="t-indicadores" className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <Subtitulo id="t-indicadores" titulo="Sinais a observar">
            O que merece atenção contínua, quando e onde acompanhar, e a que futuros cada sinal dá ou tira força. Um sinal não confirma um cenário.
          </Subtitulo>
          <Indicadores />
        </section>
        <aside aria-label="Estado do acompanhamento" className="cartao flex min-w-0 flex-col gap-5 self-start p-5 lg:col-span-4">
          <Estado />
          <section aria-labelledby="t-historico" className="flex flex-col gap-3 border-t border-linha pt-4">
            <h3 id="t-historico" className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">
              Histórico de versões
            </h3>
            <Historico />
          </section>
          <section aria-labelledby="t-legenda-efeitos" className="flex flex-col gap-2 border-t border-linha pt-4">
            <h3 id="t-legenda-efeitos" className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">
              Como ler os efeitos
            </h3>
            <Legenda />
          </section>
        </aside>
      </div>

      {/* Acontecimentos, impacto e revisão de premissas só existem com o servidor de monitoramento. Sem ele, o
          cartão de estado diz o que falta, e a página não gasta altura com três caixas vazias. */}
      {m && (
        <>
          <Parte
            id="t-acontecimentos"
            letra="A"
            titulo="Novos acontecimentos"
            texto="Notícias, documentos, declarações e dados identificados desde a última atualização."
          >
            {m.acontecimentos.length > 0 ? (
              <ol className="m-0 flex list-none flex-col p-0">
                {m.acontecimentos.map((a) => (
                  <ItemDeAcontecimento key={a.id} a={a} />
                ))}
              </ol>
            ) : (
              <Vazio>Nenhum acontecimento novo registrado desde {m.verificadoEm}.</Vazio>
            )}
          </Parte>

          {m.acontecimentos.length > 0 && (
            <Parte
              id="t-impacto"
              letra="B"
              titulo="Impacto nos cenários"
              texto="Como cada acontecimento se relaciona com cada futuro, e por quê. Um acontecimento não confirma um cenário."
            >
              <MatrizDeImpacto acontecimentos={m.acontecimentos} />
            </Parte>
          )}

          <Parte id="t-premissas" letra="C" titulo="Revisão de premissas" texto="As premissas de cada cenário e o que as evidências novas fizeram com elas.">
            <div className="grid gap-x-8 gap-y-8 lg:grid-cols-3">
              {r.cenarios.map((c) => (
                <section key={c.id} aria-label={`Premissas do cenário ${c.id}: ${c.nome}`} className="flex min-w-0 flex-col gap-3">
                  <p className="flex items-center gap-2 text-corpo text-texto">
                    <Letra id={c.id} /> {c.nome}
                  </p>
                  <Premissas c={c} />
                </section>
              ))}
            </div>
          </Parte>
        </>
      )}
    </SecaoDaInvestigacao>
  );
}

/** Estado do acompanhamento: a última verificação, ou que ele ainda não existe e o que falta para existir. */
function Estado() {
  const { r } = useResultado();
  const m = r.monitoramento;
  return (
    <div className="flex flex-col gap-2 text-legenda text-texto-2">
      <p className="flex items-center gap-2 font-medium text-texto">
        <Radar size={16} aria-hidden="true" className={m ? "text-ciano-texto" : "text-texto-3"} />
        {m ? "Acompanhamento ativo" : "Acompanhamento automático inativo"}
      </p>
      {m ? (
        <p>
          Última verificação: <span className="text-texto">{m.verificadoEm}</span>
        </p>
      ) : (
        <p>
          Novos acontecimentos, impacto nos cenários e revisão de premissas aparecem aqui quando o servidor de monitoramento existir. Até lá, a lista ao lado
          diz o que vigiar e onde.
        </p>
      )}
    </div>
  );
}

function Parte({ id, letra, titulo, texto, children }: { id: string; letra: string; titulo: string; texto: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-linha pt-6">
      <Subtitulo id={id} titulo={titulo} prefixo={letra}>
        {texto}
      </Subtitulo>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="max-w-[68ch] rounded-padrao border border-dashed border-linha-forte px-4 py-3 text-legenda text-texto-2">{children}</p>;
}

function Ficticio() {
  const { r } = useResultado();
  return r.monitoramento?.demonstracao ? <span className="rounded-fino border border-ambar/45 px-1.5 text-micro text-ambar">Fictício</span> : null;
}

/** A. Um acontecimento: data e tipo, título, descrição, fonte, relação com a investigação e cenários afetados. */
function ItemDeAcontecimento({ a }: { a: Acontecimento }) {
  const { ix } = useResultado();
  const fontes = a.fontes.map((f) => ix.fontes.get(f)).filter((f) => f !== undefined);
  return (
    <li className="grid gap-x-6 gap-y-2 border-t border-linha py-5 first:border-t-0 first:pt-0 md:grid-cols-[9rem_minmax(0,1fr)]">
      <p className="flex flex-col gap-1 text-micro text-texto-3">
        <span className="numeros font-dados">{a.data}</span>
        <span>{TIPO_DE_ACONTECIMENTO[a.tipo]}</span>
        {a.incorporadoNaVersao ? <span>Incorporado na versão {a.incorporadoNaVersao}</span> : <span className="text-ambar">Ainda não incorporado</span>}
      </p>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-corpo font-medium text-texto">
          {a.titulo} <Ficticio />
        </p>
        <p className="text-legenda text-texto-2">{a.descricao}</p>
        <p className="text-legenda text-texto-2">
          <span className="text-texto-3">Relação com a investigação: </span>
          <Frase a={a.relacao} />
        </p>
        <p className="text-micro text-texto-3">
          {fontes.length > 0 ? (
            <>
              Fonte:{" "}
              {fontes.map((f, i) => (
                <span key={f.id}>
                  {i > 0 && "; "}
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-ciano-texto underline-offset-4 hover:underline">
                    [{ix.numero.get(f.id)}] {f.veiculo}
                  </a>
                  , {f.data}
                </span>
              ))}
            </>
          ) : (
            <span className="text-ambar">
              Sem fonte verificável
              {a.fontes.length === 0 ? " (exemplo fictício)" : ""}.
            </span>
          )}
        </p>
        <ul aria-label="Cenários potencialmente afetados" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
          {a.impactos.map((x) => (
            <li key={x.cenario} className="inline-flex items-center gap-1.5">
              <Letra id={x.cenario} />
              <Etiqueta estado={IMPACTO[x.impacto]} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/**
 * B. Acontecimentos × cenários. Cada célula: a classificação (símbolo + palavra) e a justificativa. No celular, cada
 * acontecimento vira um bloco com os três cenários embaixo. Sem totais: somar impactos sugeriria confirmação.
 */
function MatrizDeImpacto({ acontecimentos }: { acontecimentos: Acontecimento[] }) {
  const { r, vista } = useResultado();
  return (
    <table className="w-full border-collapse text-left text-legenda max-md:block">
      <caption className="sr-only">Impacto de cada acontecimento em cada cenário, com a justificativa</caption>
      <thead className="max-md:hidden">
        <tr>
          <th scope="col" className="w-[28%] pr-4 pb-3 text-micro font-medium text-texto-3">
            Acontecimento
          </th>
          {r.cenarios.map((c) => (
            <th key={c.id} scope="col" className={`rounded-t-padrao px-3 pb-3 font-normal ${vista === c.id ? "bg-ciano-suave" : ""}`}>
              <span className="flex items-center gap-2 pt-2 text-texto">
                <Letra id={c.id} ativa={vista === c.id} />
                <span className="truncate">{c.nome}</span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:flex max-md:flex-col max-md:gap-5">
        {acontecimentos.map((a) => (
          <tr key={a.id} className="border-t border-linha align-top max-md:flex max-md:flex-col max-md:gap-3 max-md:pt-4">
            <th scope="row" className="py-3 pr-4 font-normal max-md:p-0">
              <span className="block text-texto">{a.titulo}</span>
              <span className="block text-micro text-texto-3">{a.data}</span>
            </th>
            {r.cenarios.map((c) => {
              const x = a.impactos.find((i) => i.cenario === c.id);
              return (
                <td key={c.id} className={`px-3 py-3 max-md:flex max-md:gap-2.5 max-md:p-0 ${vista === c.id ? "bg-ciano-suave max-md:bg-transparent" : ""}`}>
                  <span className="md:hidden">
                    <Letra id={c.id} />
                  </span>
                  {x ? (
                    <span className="flex flex-col items-start gap-1.5">
                      <Etiqueta estado={IMPACTO[x.impacto]} />
                      <span className="text-micro leading-relaxed text-texto-2">
                        {x.justificativa.texto}
                        <Citacoes ids={x.justificativa.evidencias} />
                      </span>
                    </span>
                  ) : (
                    <span className="text-micro text-texto-3">Não avaliado</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Legenda() {
  return (
    <p aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-micro text-texto-3">
      {Object.values(IMPACTO).map((e) => (
        <Etiqueta key={e.rotulo} estado={e} />
      ))}
    </p>
  );
}

/** D. Os indicadores (sinais) com cenários relacionados, evidências do fator, última observação e tendência. */
/**
 * D. Sinais a observar, como linha do tempo vertical: a data à esquerda, o nó sobre um fio contínuo e o sinal à direita.
 * Os primeiros cinco à vista e o resto a um clique. A coluna "última observação / tendência"
 * só aparece quando existe alguma observação; sem nenhuma, repetir "nenhuma registrada" em cada linha só ocupa espaço
 * (o cartão de estado já diz que o acompanhamento não está ativo).
 */
const SINAIS_VISIVEIS = 5;
function Indicadores() {
  const { r } = useResultado();
  const [todos, setTodos] = useState(false);
  const observacoes = r.monitoramento?.observacoes ?? [];
  if (!r.sinais.length) return <Vazio>Esta investigação não declarou indicadores para acompanhar.</Vazio>;
  const comObservacoes = observacoes.length > 0;
  const lista = todos ? r.sinais : r.sinais.slice(0, SINAIS_VISIVEIS);
  return (
    <div className="flex flex-col gap-2">
      <ol className="m-0 flex list-none flex-col p-0">
        {lista.map((s) => {
          const fator = r.variaveis.find((v) => v.id === s.variavel);
          const ultima = observacoes.filter((o) => o.sinal === s.id).at(-1);
          return (
            <li
              key={s.id}
              className={`group/sinal grid gap-x-4 gap-y-2 pb-6 last:pb-0 ${
                comObservacoes
                  ? "sm:grid-cols-[6.5rem_1.25rem_minmax(0,1fr)] lg:grid-cols-[6.5rem_1.25rem_minmax(0,1.3fr)_minmax(0,1fr)]"
                  : "sm:grid-cols-[6.5rem_1.25rem_minmax(0,1fr)]"
              }`}
            >
              <p className="numeros pt-0.5 font-dados text-micro text-ambar sm:text-right">{s.quando}</p>
              {/* linha do tempo: o nó do sinal sobre um fio contínuo (some no celular, onde a data fica acima) */}
              <span aria-hidden="true" className="relative hidden justify-center sm:flex">
                <span className="absolute top-2 -bottom-6 w-px bg-linha-forte group-last/sinal:hidden" />
                <span className="relative mt-1 size-3 rounded-full border-2 border-ambar bg-abismo" />
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-corpo font-medium text-texto">{s.sinal}</p>
                <p className="text-legenda leading-relaxed text-texto-2">{s.leitura}</p>
                <p className="text-micro text-texto-3">
                  Onde acompanhar: {s.ondeAcompanhar}
                  {fator && (
                    <>
                      {" "}
                      · Evidência do fator ({fator.nome}): <Citacoes ids={fator.estadoAtual.evidencias} />
                    </>
                  )}
                </p>
                <ul aria-label="Cenários relacionados" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-micro">
                  {s.favorece.map((c) => (
                    <li key={`f${c}`} className="inline-flex items-center gap-1.5">
                      <Letra id={c} /> <Etiqueta estado={IMPACTO.favorece} />
                    </li>
                  ))}
                  {s.enfraquece.map((c) => (
                    <li key={`e${c}`} className="inline-flex items-center gap-1.5">
                      <Letra id={c} /> <Etiqueta estado={IMPACTO.enfraquece} />
                    </li>
                  ))}
                </ul>
              </div>
              {comObservacoes && (
                <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-4 gap-y-1.5 text-legenda">
                  <dt className="text-texto-3">Última observação</dt>
                  <dd className="m-0 text-texto-2">
                    {ultima ? (
                      <>
                        <span className="font-dados text-micro text-texto-3">{ultima.data}</span> · {ultima.texto} <Ficticio />
                        <Citacoes ids={ultima.evidencias} />
                      </>
                    ) : (
                      "Nenhuma registrada"
                    )}
                  </dd>
                  <dt className="text-texto-3">Tendência</dt>
                  <dd className={`m-0 ${ultima?.tendencia ? "text-texto" : "text-texto-3"}`}>
                    {ultima?.tendencia ? TENDENCIA[ultima.tendencia] : "Dados insuficientes para dizer"}
                  </dd>
                </dl>
              )}
            </li>
          );
        })}
      </ol>
      {r.sinais.length > SINAIS_VISIVEIS && (
        <button
          type="button"
          aria-expanded={todos}
          onClick={() => setTodos((v) => !v)}
          className="inline-flex min-h-10 w-fit items-center gap-1.5 text-legenda font-medium text-ciano-texto hover:underline"
        >
          {todos ? "Mostrar só os primeiros" : `Ver os ${r.sinais.length} sinais`}
          <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${todos ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

/** Marca de cada tipo de mudança: forma e cor diferentes, sempre com o nome escrito ao lado. */
const MARCA: Record<TipoDeMudanca, string> = {
  criacao: "size-2.5 rounded-full border-2 border-texto-3 bg-abismo",
  "nova-evidencia": "size-2.5 rotate-45 bg-ciano",
  "nova-interpretacao": "size-2.5 rounded-full bg-texto",
  "revisao-premissa": "size-2.5 rounded-sm border-2 border-ambar bg-abismo",
  "revisao-cenario": "size-2.5 rounded-sm bg-ambar",
};

/**
 * E. Histórico: as entradas tipadas do monitoramento ou, sem ele, o registro de revisões que a investigação já traz
 * (sem tipo: mostrado como "registro", sem adivinhar se foi evidência ou interpretação).
 */
function Historico() {
  const { r, selecionar } = useResultado();
  const m = r.monitoramento;
  const anteriores = m?.versoesAnteriores ?? [];
  const entradas: (
    | EntradaDoHistorico
    | {
        id: string;
        data: string;
        texto: string;
        versao?: undefined;
        tipo?: undefined;
      }
  )[] = [
    ...r.revisoes.map((v, i) => ({
      id: `rev-${i}`,
      data: v.data,
      texto: v.texto,
    })),
    ...(m?.historico ?? []),
  ];
  return (
    <div className="flex flex-col gap-4">
      <ol className="relative m-0 flex list-none flex-col gap-5 p-0 pl-6 before:absolute before:top-1 before:bottom-1 before:left-[4px] before:w-px before:bg-linha">
        {entradas.map((e) => (
          <li key={e.id} className="relative flex flex-col gap-1">
            <span
              aria-hidden="true"
              className={`absolute top-1.5 -left-6 ${e.tipo ? MARCA[e.tipo] : "size-2.5 rounded-full border border-linha-forte bg-abismo"}`}
            />
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-texto-3">
              <span className="numeros font-dados">{e.data}</span>
              {e.versao !== undefined && <span>· versão {e.versao}</span>}
              <span className="text-texto-2">· {e.tipo ? TIPO_DE_MUDANCA[e.tipo].rotulo : "Registro de revisão"}</span>
              {"cenario" in e && e.cenario && (
                <span className="inline-flex items-center gap-1">
                  · <Letra id={e.cenario} />
                </span>
              )}
              {e.tipo && <Ficticio />}
            </p>
            <p className="max-w-[72ch] text-legenda text-texto">{e.texto}</p>
            {"evidencias" in e && (e.evidencias?.length || e.acontecimentos?.length) ? (
              <p className="text-micro text-texto-3">
                Motivado por: <Citacoes ids={e.evidencias} />
                {e.acontecimentos
                  ?.map((id) => m?.acontecimentos.find((a) => a.id === id)?.titulo)
                  .filter(Boolean)
                  .join("; ")}
              </p>
            ) : null}
          </li>
        ))}
        <li className="relative flex flex-col gap-1">
          <span aria-hidden="true" className="absolute top-1.5 -left-6 size-2.5 rounded-full bg-ouro" />
          <p className="text-micro text-texto-3">Agora</p>
          <p className="text-legenda text-texto">
            Versão {r.versao} em vigor, de {r.atualizadoEm}.
          </p>
        </li>
      </ol>
      <p className="max-w-[72ch] text-legenda text-texto-2">
        {anteriores.length > 0 ? (
          <>
            Versões anteriores preservadas:{" "}
            {anteriores.map((v, i) => (
              <span key={`${v.cenario}-${v.versao}`}>
                {i > 0 && ", "}
                <button
                  type="button"
                  onClick={() => selecionar({ tipo: "cenario", id: v.cenario })}
                  className="text-ciano-texto underline-offset-4 hover:underline"
                >
                  cenário {v.cenario}, versão {v.versao}
                </button>
              </span>
            ))}
            . O detalhe de cada cenário compara a versão atual com as anteriores.
          </>
        ) : (
          <span className="text-texto-3">
            As versões anteriores dos cenários não estão disponíveis nesta investigação: preservar e servir cada versão depende do servidor.
          </span>
        )}
      </p>
    </div>
  );
}
