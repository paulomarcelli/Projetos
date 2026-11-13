/**
 * Leitura do mapa: o que se lê nas linhas, ao lado delas (só quando há largura; ver MapaGeopolitico, `largo`).
 *
 * - Em "Hoje": uma frase de leitura (quantas relações, entre quantos atores, quem concentra os laços), os atores mais
 *   conectados e de onde vêm as linhas (documentadas, inferidas, hipóteses).
 * - Num cenário: quantas mudanças em relação a hoje, por tipo, e a lista "O que mudou" sempre aberta (a mesma do cartão
 *   sobre o mapa em telas estreitas: ListaDeMudancas), seguida dos mais conectados naquele cenário.
 *
 * Tudo é contagem de relações registradas na investigação: nada mede força, peso ou probabilidade, e o painel diz isso.
 * Passar o cursor por um ator ou por uma mudança acende o mesmo elemento no mapa (o estado de destaque é o do mapa).
 */
import type { Bloco } from "../../types/investigacao";
import type { Cenario } from "../../types/cenario";
import { statusDaRelacao, type RelacaoNaVista } from "../analysis/investigacao/contexto";
import { Letra } from "../analysis/investigacao/pecas";
import { baseDe, curto, MUDANCA } from "./apoioDoMapa";
import type { Vista } from "../../types/cenario";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Como cada mudança se lê numa frase ("1 nova", "2 mudam de natureza"). */
const NA_FRASE: Record<string, [string, string]> = {
  nova: ["nova", "novas"],
  transformada: ["muda de natureza", "mudam de natureza"],
  reforcada: ["reforçada", "reforçadas"],
  enfraquecida: ["enfraquecida", "enfraquecidas"],
  ausente: ["deixa de existir", "deixam de existir"],
};

/** Quantas relações visíveis cada ator tem nesta vista, da maior para a menor (empate: ordem alfabética do nome). */
export function graus(visiveis: RelacaoNaVista[], nome: (id: string) => string) {
  const n = new Map<string, number>();
  for (const x of visiveis) for (const id of new Set([x.rel.de, x.rel.para])) n.set(id, (n.get(id) ?? 0) + 1);
  return [...n.entries()].map(([id, k]) => ({ id, k })).sort((a, b) => b.k - a.k || nome(a.id).localeCompare(nome(b.id), "pt-BR"));
}

/** Lista "O que mudou em relação a hoje", agrupada pelo tipo de mudança (o mesmo glifo do selo no mapa). */
export function ListaDeMudancas({
  mudancas,
  mudancasDeBloco,
  nome,
  relSobre,
  setRelSobre,
  selecionarRelacao,
  blocoAtivo,
  alternarBloco,
}: {
  mudancas: RelacaoNaVista[];
  mudancasDeBloco: { texto: string; bloco: string }[];
  nome: (id: string) => string;
  relSobre: string | null;
  setRelSobre: (id: string | null) => void;
  selecionarRelacao: (id: string) => void;
  blocoAtivo: string | null;
  alternarBloco: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2" onPointerLeave={() => setRelSobre(null)}>
      {MUDANCA.map((g) => {
        const itens = mudancas.filter((l) => l.estado?.mudanca === g.chave);
        if (itens.length === 0) return null;
        return (
          <section key={g.chave} aria-label={g.titulo}>
            <p className="mb-0.5 flex items-center gap-1.5 text-micro text-texto-3">
              <span aria-hidden="true" className="grid size-4 place-items-center rounded-full border border-ambar/60 text-[0.625rem] font-bold text-ambar">
                {g.glifo}
              </span>
              {g.titulo}
            </p>
            <ul className="m-0 flex list-none flex-col p-0">
              {itens.map((l) => (
                <li key={l.rel.id}>
                  <button
                    type="button"
                    onPointerEnter={() => setRelSobre(l.rel.id)}
                    onFocus={() => setRelSobre(l.rel.id)}
                    onBlur={() => setRelSobre(null)}
                    onClick={() => selecionarRelacao(l.rel.id)}
                    className={`flex w-full flex-col rounded-fino px-1.5 py-1 text-left transition-colors duration-150 ${relSobre === l.rel.id ? "bg-grafite" : "hover:bg-grafite"}`}
                  >
                    <span className="text-legenda text-texto">
                      {nome(l.rel.de)} → {nome(l.rel.para)}
                      {g.chave === "transformada" && (
                        <span className="text-texto-2">
                          {" "}
                          · {curto(l.rel.tipo)} <span className="text-ambar">→</span> {curto(l.tipo)}
                        </span>
                      )}
                    </span>
                    <span className="text-micro text-texto-3">{l.visivel ? l.texto : l.rel.presente?.texto}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {mudancasDeBloco.length > 0 && (
        <section aria-label="Blocos">
          <p className="mb-0.5 flex items-center gap-1.5 text-micro text-texto-3">
            <span aria-hidden="true" className="size-4 rounded-sm border border-ciano/60 bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--color-ciano-texto)_50%,transparent)_0_1px,transparent_1px_4px)]" />
            Blocos (no território)
          </p>
          <ul className="m-0 flex list-none flex-col p-0">
            {mudancasDeBloco.map((m) => (
              <li key={m.texto}>
                <button
                  type="button"
                  onClick={() => alternarBloco(m.bloco)}
                  aria-pressed={blocoAtivo === m.bloco}
                  className={`w-full rounded-fino px-1.5 py-1 text-left text-legenda text-texto transition-colors duration-150 ${blocoAtivo === m.bloco ? "bg-ciano-suave" : "hover:bg-grafite"}`}
                >
                  {m.texto}
                  <span className="block text-micro text-texto-3">{blocoAtivo === m.bloco ? "Destacado no mapa" : "Clique para ver no mapa"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function LeituraDoMapa({
  vista,
  cenario,
  visiveis,
  mudancas,
  mudancasDeBloco,
  blocos,
  nome,
  sobre,
  setSobre,
  relSobre,
  setRelSobre,
  selecionarAtor,
  selecionarRelacao,
  blocoAtivo,
  alternarBloco,
}: {
  vista: Vista;
  cenario: Cenario | null;
  visiveis: RelacaoNaVista[];
  mudancas: RelacaoNaVista[];
  mudancasDeBloco: { texto: string; bloco: string }[];
  blocos: Bloco[];
  nome: (id: string) => string;
  sobre: string | null;
  setSobre: (id: string | null) => void;
  relSobre: string | null;
  setRelSobre: (id: string | null) => void;
  selecionarAtor: (id: string) => void;
  selecionarRelacao: (id: string) => void;
  blocoAtivo: string | null;
  alternarBloco: (id: string) => void;
}) {
  const ranking = graus(visiveis, nome);
  const atores = ranking.length;
  const topo = ranking.slice(0, 5);
  const maximo = topo[0]?.k ?? 1;
  const origem = { documentada: 0, inferida: 0, condicional: 0 };
  for (const x of visiveis) origem[baseDe(statusDaRelacao(x.rel, vista))]++;
  const nBlocos = blocos.filter((b) => b.membros[vista].length > 0).length;

  const porTipo = MUDANCA.map((g) => ({ g, n: mudancas.filter((l) => l.estado?.mudanca === g.chave).length })).filter((x) => x.n > 0);
  const totalMudancas = mudancas.length + mudancasDeBloco.length;
  const partes = [...porTipo.map(({ g, n }) => `${n} ${NA_FRASE[g.chave][n === 1 ? 0 : 1]}`), ...(mudancasDeBloco.length ? [plural(mudancasDeBloco.length, "mudança de bloco", "mudanças de bloco")] : [])];
  const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`);

  return (
    <aside aria-label="Leitura do mapa" className="flex min-h-0 flex-col gap-5 overflow-y-auto rounded-painel border border-linha bg-institucional/60 p-4">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-legenda font-medium text-texto">
          {cenario && <Letra id={cenario.id} ativa />}
          Leitura do mapa
        </p>
        <p className="text-corpo text-pretty text-texto">
          {cenario ? (
            totalMudancas > 0 ? (
              <>
                {plural(totalMudancas, "mudança", "mudanças")} em relação a hoje: {juntar(partes)}.
              </>
            ) : (
              "Neste cenário, as relações entre os países seguem como hoje."
            )
          ) : visiveis.length > 0 ? (
            <>
              {plural(visiveis.length, "relação", "relações")} entre {plural(atores, "ator", "atores")}.
              {topo[0] && topo[0].k > 1 && (
                <>
                  {" "}
                  Mais conectado: {nome(topo[0].id)}, com {topo[0].k}.
                </>
              )}
            </>
          ) : (
            "Nenhuma relação entre países registrada para hoje."
          )}
        </p>
      </header>

      {cenario && totalMudancas > 0 && (
        <section aria-label="O que mudou em relação a hoje" className="flex flex-col gap-2">
          <h3 className="text-legenda font-medium text-ambar">O que mudou em relação a hoje</h3>
          <ListaDeMudancas
            mudancas={mudancas}
            mudancasDeBloco={mudancasDeBloco}
            nome={nome}
            relSobre={relSobre}
            setRelSobre={setRelSobre}
            selecionarRelacao={selecionarRelacao}
            blocoAtivo={blocoAtivo}
            alternarBloco={alternarBloco}
          />
        </section>
      )}

      {topo.length > 0 && (
        <section aria-label="Mais conectados" className="flex flex-col gap-2">
          <h3 className="text-legenda font-medium text-texto">Mais conectados{cenario ? " neste cenário" : ""}</h3>
          <ol className="m-0 flex list-none flex-col gap-0.5 p-0" onPointerLeave={() => setSobre(null)}>
            {topo.map(({ id, k }) => (
              <li key={id}>
                <button
                  type="button"
                  onPointerEnter={() => setSobre(id)}
                  onFocus={() => setSobre(id)}
                  onBlur={() => setSobre(null)}
                  onClick={() => selecionarAtor(id)}
                  aria-label={`${nome(id)}: ${plural(k, "relação", "relações")}. Ver o ator`}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-fino px-1.5 py-1.5 text-left transition-colors duration-150 ${
                    sobre === id ? "bg-grafite" : "hover:bg-grafite"
                  }`}
                >
                  <span className="truncate text-legenda text-texto">{nome(id)}</span>
                  <span className="numeros font-dados text-micro text-texto-2">{k}</span>
                  {/* barra fina: a contagem de relações, não a força delas */}
                  <span aria-hidden="true" className="col-span-2 h-[3px] overflow-hidden rounded-full bg-linha/60">
                    <span className={`block h-full rounded-full transition-colors duration-150 ${sobre === id ? "bg-ciano" : "bg-texto-3/70"}`} style={{ width: `${(k / maximo) * 100}%` }} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="text-micro text-texto-3">Conta as relações registradas nesta vista; não mede força nem importância.</p>
        </section>
      )}

      {visiveis.length > 0 && (
        <section aria-label="De onde vêm as linhas" className="flex flex-col gap-2">
          <h3 className="text-legenda font-medium text-texto">De onde vêm as linhas</h3>
          <dl className="m-0 flex flex-col gap-1.5 text-legenda">
            {origem.documentada > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-texto-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <line x1="1" y1="6" x2="11" y2="6" stroke="var(--color-texto-2)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Documentadas por fonte
                </dt>
                <dd className="numeros m-0 font-dados text-micro text-texto">{origem.documentada}</dd>
              </div>
            )}
            {origem.inferida > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-texto-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <circle cx="6" cy="6" r="4" fill="none" stroke="var(--color-texto-2)" strokeWidth="1.3" strokeDasharray="2 1.6" />
                  </svg>
                  Inferidas pelo analista
                </dt>
                <dd className="numeros m-0 font-dados text-micro text-texto">{origem.inferida}</dd>
              </div>
            )}
            {origem.condicional > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-texto-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M6 1.5 10.5 6 6 10.5 1.5 6Z" fill="none" stroke="var(--color-ambar)" strokeWidth="1.3" />
                  </svg>
                  {cenario ? "Hipóteses do cenário" : "Hipóteses"}
                </dt>
                <dd className="numeros m-0 font-dados text-micro text-texto">{origem.condicional}</dd>
              </div>
            )}
          </dl>
          {nBlocos > 0 && <p className="text-micro text-texto-3">{plural(nBlocos, "bloco aparece", "blocos aparecem")} no território (hachura).</p>}
        </section>
      )}
    </aside>
  );
}
