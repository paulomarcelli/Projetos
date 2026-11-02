import { ArrowUpRight, Waypoints } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { rotas } from "../../config/rotas";
import { mensagemDoErro, plural, quando, useGrafo } from "../../hooks";
import type { ResumoDeInvestigacao } from "../../types/api";
import { ExploradorDoGrafo, estiloDoTipo } from "../graph";
import { AvisoDeErro, BotaoLink, Cartao, Carregando, EstadoVazio, Esqueleto, cx } from "../ui";

export interface ExploradorDoDashboardProps {
  /** análises concluídas, das mais recentes às mais antigas */
  concluidas: ResumoDeInvestigacao[];
  /** escolhida pelo usuário na lista (sem pulo automático) */
  escolhida: string | null;
  /** o histórico ainda está carregando */
  carregandoLista: boolean;
  /** avisa qual análise está no explorador (para marcar o cartão na lista) */
  aoMostrar?: (id: string | null) => void;
  className?: string;
}

/** O cartão grande do lugar do papagaio: o grafo real da análise escolhida, compacto. */
const MAX_PULOS = 3;

export function ExploradorDoDashboard({ concluidas, escolhida, carregandoLista, aoMostrar, className }: ExploradorDoDashboardProps) {
  const navegar = useNavigate();
  const [indice, setIndice] = useState(0);
  const [puladas, setPuladas] = useState<ResumoDeInvestigacao[]>([]);
  const escolhidaItem = escolhida ? concluidas.find((c) => c.id === escolhida) : undefined;
  const analise = escolhidaItem ?? concluidas[indice] ?? concluidas[0] ?? null;
  const grafo = useGrafo(analise?.id, analise?.estado === "concluida");

  useEffect(() => aoMostrar?.(analise?.id ?? null), [analise?.id, aoMostrar]);

  // sem escolha do usuário, a mais recente sem relações (ex.: fora do MCU) cede o lugar à seguinte — e o cartão diz isso
  useEffect(() => {
    if (escolhidaItem || !grafo.dados || grafo.dados.arestas.length > 0 || !analise) return;
    if (indice + 1 < concluidas.length && indice < MAX_PULOS) {
      setPuladas((p) => (p.some((x) => x.id === analise.id) ? p : [...p, analise]));
      setIndice((i) => i + 1);
    }
  }, [grafo.dados, escolhidaItem, analise, indice, concluidas.length]);
  const focais = grafo.dados?.nos.filter((n) => n.papel === "focal") ?? [];
  const tipos = grafo.dados ? Object.entries(grafo.dados.legenda.tipos_de_no).sort((a, b) => b[1].quantidade - a[1].quantidade) : [];
  const linkCompleto = analise ? `${rotas.analise(analise.id)}?aba=grafo` : rotas.novaAnalise;

  return (
    <Cartao variante="vidro" raio="grande" espaco="nenhum" como="section" aria-labelledby="explorador-titulo" className={cx("flex flex-col overflow-hidden", className)}>
      <header className="flex items-start gap-3 p-4 sm:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-vidro-borda bg-vidro-forte text-escarlate shadow-baixa" aria-hidden="true">
          <Waypoints size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="explorador-titulo" className="text-base font-semibold">
            Explorador do grafo
          </h2>
          {analise ? (
            <p className="mt-0.5 truncate text-xs text-texto-fraco">
              <span className="text-texto-suave">{analise.questao}</span> · <time dateTime={analise.criada_em}>{quando(analise.criada_em)}</time>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-texto-fraco">{carregandoLista ? "Procurando a análise mais recente…" : "Nenhuma análise concluída ainda"}</p>
          )}
        </div>
        {analise && (
          <BotaoLink to={linkCompleto} tamanho="pequeno" variante="secundario" iconeDireita={<ArrowUpRight />} className="shrink-0 rounded-full!">
            <span className="hidden sm:inline">Abrir completo</span>
            <span className="sm:hidden">Abrir</span>
          </BotaoLink>
        )}
      </header>

      <div className="relative mx-2 h-[19rem] overflow-hidden rounded-[1.375rem] border border-borda bg-superficie/70 sm:mx-3 sm:h-[21rem]">
        {carregandoLista || (analise && grafo.carregando) ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Esqueleto forma="bloco" largura="100%" altura="100%" className="absolute inset-0 rounded-none!" />
            <Carregando rotulo="Carregando o grafo…" className="relative" />
          </div>
        ) : grafo.erro ? (
          <div className="grid h-full place-items-center p-4">
            <AvisoDeErro {...mensagemDoErro(grafo.erro, "o grafo")} aoTentarNovamente={grafo.recarregar} />
          </div>
        ) : !analise ? (
          <div className="grid h-full place-items-center p-4">
            <EstadoVazio
              tamanho="compacto"
              icone={<Waypoints />}
              titulo="O grafo aparece aqui quando a primeira análise terminar"
              texto="Cada análise monta um subgrafo da base do MCU em torno das entidades da questão."
            />
          </div>
        ) : grafo.dados ? (
          <ExploradorDoGrafo
            investigacaoId={analise.id}
            grafo={grafo.dados}
            modo="compacto"
            aoEscolherNo={(id) => navegar(`${rotas.analise(analise.id)}?aba=grafo&no=${encodeURIComponent(id)}`)}
          />
        ) : null}
      </div>

      {!escolhidaItem && puladas.length > 0 && analise && (
        <p className="mx-4 mt-3 text-xs text-texto-fraco sm:mx-5">
          {puladas.length === 1 ? "A análise mais recente" : `As ${puladas.length} análises mais recentes`} ({puladas.map((p) => `“${p.questao.length > 48 ? `${p.questao.slice(0, 46)}…` : p.questao}”`).join(", ")}) não
          {puladas.length === 1 ? " tem" : " têm"} relações no grafo; mostrando a anterior.
        </p>
      )}
      <footer className="m-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[1.375rem] border border-vidro-borda bg-vidro-forte px-4 py-3 sm:m-3">
        {grafo.dados ? (
          <>
            <p className="text-sm font-medium fr-numeros">
              {plural(grafo.dados.nos.length, "entidade")} · {plural(grafo.dados.arestas.length, "relação", "relações")}
            </p>
            {focais.length > 0 && (
              <p className="min-w-0 truncate text-xs text-texto-suave">
                Focais: <span className="font-medium text-escarlate">{focais.map((n) => n.rotulo).join(", ")}</span>
              </p>
            )}
            <ul className="flex w-full flex-wrap gap-x-3 gap-y-1" aria-label="Tipos de entidade">
              {tipos.slice(0, 5).map(([tipo, info]) => (
                <li key={tipo} className="flex items-center gap-1.5 text-2xs text-texto-suave">
                  <span className={cx("size-2 rounded-full border", estiloDoTipo(tipo).amostra)} aria-hidden="true" />
                  {info.rotulo} <span className="text-texto-fraco fr-numeros">{info.quantidade}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xs text-texto-fraco">Clique num nó para abrir a análise com ele selecionado.</p>
        )}
      </footer>
    </Cartao>
  );
}
