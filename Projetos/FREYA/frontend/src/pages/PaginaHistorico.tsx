import { History, Plus, Search, SearchX } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { AvisoDeRetorno, CartaoDeAnalise, DialogoDeExclusao, EsqueletoDaLista, type Retorno } from "../components/history";
import { CabecalhoDaPagina } from "../components/layout";
import { AvisoDeErro, Botao, BotaoLink, CampoTexto, Carregando, EstadoVazio, GrupoSegmentado, Interruptor } from "../components/ui";
import { rotas } from "../config/rotas";
import { agruparPorDia, mensagemDoErro, numero, plural, useHistorico } from "../hooks";
import { estaEmAndamento } from "../services";
import type { ResumoDeInvestigacao } from "../types/api";

type FiltroDeEstado = "todas" | "concluidas" | "andamento" | "falharam";

function normalizar(t: string) {
  return t
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function PaginaHistorico() {
  const historico = useHistorico({ limite: 1000 });
  const local = useLocation();
  const vindo = (local.state as { retorno?: { ok: boolean; mensagem: string } } | null)?.retorno;
  const [retorno, setRetorno] = useState<Retorno | null>(vindo ? { ...vindo, chave: 1 } : null);
  const [termo, setTermo] = useState("");
  const [estado, setEstado] = useState<FiltroDeEstado>("todas");
  const [soGuardadas, setSoGuardadas] = useState(false);
  const [alvo, setAlvo] = useState<ResumoDeInvestigacao | null>(null);
  const fecharRetorno = useCallback(() => setRetorno(null), []);

  const itens = historico.itens ?? [];
  const contagem = useMemo(
    () => ({
      todas: itens.length,
      concluidas: itens.filter((i) => i.estado === "concluida").length,
      andamento: itens.filter((i) => estaEmAndamento(i.estado)).length,
      falharam: itens.filter((i) => i.estado === "falhou").length,
      guardadas: itens.filter((i) => i.guardada).length,
    }),
    [itens],
  );
  const filtrados = useMemo(() => {
    const t = normalizar(termo.trim());
    return itens.filter(
      (i) =>
        (estado === "todas" ||
          (estado === "concluidas" && i.estado === "concluida") ||
          (estado === "andamento" && estaEmAndamento(i.estado)) ||
          (estado === "falharam" && i.estado === "falhou")) &&
        (!soGuardadas || i.guardada) &&
        (!t || normalizar(`${i.questao} ${i.horizonte ?? ""}`).includes(t)),
    );
  }, [itens, termo, estado, soGuardadas]);
  const grupos = useMemo(() => agruparPorDia(filtrados), [filtrados]);
  const filtrando = termo.trim() !== "" || estado !== "todas" || soGuardadas;

  const avisar = (ok: boolean, mensagem: string) => setRetorno({ ok, mensagem, chave: Date.now() });

  const guardar = async (item: ResumoDeInvestigacao) => {
    const r = await historico.alternarGuardada(item);
    avisar(r.ok, r.mensagem);
  };

  const msg = historico.erro ? mensagemDoErro(historico.erro, "o histórico") : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <CabecalhoDaPagina
        titulo="Histórico de análises"
        subtitulo={
          historico.itens
            ? `${plural(contagem.todas, "análise")} · ${plural(contagem.guardadas, "guardada")} — reabra, guarde ou exclua.`
            : "Todas as investigações feitas nesta F.R.E.Y.A., das mais recentes às mais antigas."
        }
        acoes={
          <BotaoLink to={rotas.novaAnalise} variante="primario" icone={<Plus />}>
            Nova análise
          </BotaoLink>
        }
      />

      {msg ? (
        <AvisoDeErro titulo={msg.titulo} texto={msg.texto} aoTentarNovamente={historico.recarregar} tentando={historico.atualizando} />
      ) : historico.carregando ? (
        <>
          <Carregando rotulo="Carregando o histórico…" rotuloOculto />
          <EsqueletoDaLista quantos={4} grupos={2} />
        </>
      ) : itens.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-borda-forte py-10">
          <EstadoVazio
            icone={<History />}
            titulo="Nenhuma análise no histórico"
            texto="Cada questão investigada vira uma análise e aparece aqui, agrupada pelo dia."
            acao={
              <BotaoLink to={rotas.novaAnalise} variante="primario" icone={<Plus />}>
                Fazer a primeira análise
              </BotaoLink>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-borda bg-superficie p-4 md:flex-row md:flex-wrap md:items-center">
            <CampoTexto
              rotulo="Buscar no histórico"
              rotuloOculto
              type="search"
              prefixo={<Search size={16} />}
              placeholder="Buscar por questão"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              classeDoGrupo="md:flex-1 md:min-w-64"
            />
            <div className="-mx-1 overflow-x-auto px-1">
              <GrupoSegmentado<FiltroDeEstado>
                rotulo="Filtrar por estado"
                tamanho="pequeno"
                valor={estado}
                aoMudar={setEstado}
                className="min-w-[26rem]"
                opcoes={[
                  { valor: "todas", rotulo: `Todas ${contagem.todas}` },
                  { valor: "concluidas", rotulo: `Concluídas ${contagem.concluidas}` },
                  { valor: "andamento", rotulo: `Em curso ${contagem.andamento}` },
                  { valor: "falharam", rotulo: `Falharam ${contagem.falharam}` },
                ]}
              />
            </div>
            <Interruptor marcado={soGuardadas} aoMudar={setSoGuardadas} rotulo="Só guardadas" className="md:w-auto" />
          </div>

          <AvisoDeRetorno retorno={retorno} aoFechar={fecharRetorno} />

          <p className="text-xs text-texto-fraco" aria-live="polite">
            {filtrando ? `${numero(filtrados.length)} de ${plural(itens.length, "análise")}` : plural(itens.length, "análise")}
          </p>

          {filtrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-borda-forte py-8">
              <EstadoVazio
                tamanho="compacto"
                icone={<SearchX />}
                titulo="Nenhuma análise com esses filtros"
                acao={
                  <Botao
                    tamanho="pequeno"
                    onClick={() => {
                      setTermo("");
                      setEstado("todas");
                      setSoGuardadas(false);
                    }}
                  >
                    Limpar filtros
                  </Botao>
                }
              />
            </div>
          ) : (
            grupos.map((g) => (
              <section key={g.chave} aria-labelledby={`grupo-${g.chave}`} className="flex flex-col gap-3">
                <h2 id={`grupo-${g.chave}`} className="flex items-baseline gap-2 text-xl font-normal">
                  {g.titulo}{" "}
                  <span className="text-sm text-texto-fraco">
                    {g.subtitulo} · {numero(g.itens.length)}
                  </span>
                </h2>
                <ul className="flex flex-col gap-3">
                  {g.itens.map((item) => (
                    <CartaoDeAnalise
                      key={item.id}
                      item={item}
                      variante="lista"
                      ocupado={historico.pendentes.has(item.id)}
                      aoAlternarGuardada={() => guardar(item)}
                      aoExcluir={() => setAlvo(item)}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      <DialogoDeExclusao
        alvo={alvo}
        aoFechar={() => setAlvo(null)}
        aoConfirmar={async () => {
          const item = alvo;
          if (!item) return null;
          // otimista: o cartão sai na hora; se a API recusar, ele volta e o aviso explica
          void historico.excluir(item).then((r) => avisar(r.ok, r.mensagem));
          return null;
        }}
      />
    </div>
  );
}
