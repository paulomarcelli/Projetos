import { ArrowLeft, Bookmark, BookmarkCheck, FileText, Network, Plus, Trash2, WifiOff } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  AvisoDeSustentacao,
  ProgressoDaInvestigacao,
  ProvedorDeEvidencias,
  SecoesDaAnalise,
  avaliarSustentacao,
} from "../components/analysis";
import { ExploradorDoGrafo } from "../components/graph";
import { AvisoDeRetorno, DialogoDeExclusao, PilulaDeEstado, type Retorno } from "../components/history";
import { iniciais } from "../components/sidebar/itens";
import { Abas, AvisoDeErro, Botao, BotaoLink, Carregando, Esqueleto, Pilula, cx } from "../components/ui";
import { rotas } from "../config/rotas";
import { usePreferencias } from "../contexts/Preferencias";
import { comoErroDaApi, dataLonga, hora, mensagemDoErro, rotuloDoId, useGrafo, useInvestigacao } from "../hooks";
import { criarInvestigacao, desguardarInvestigacao, estaEmAndamento, excluirInvestigacao, guardarInvestigacao } from "../services";
import type { Evidencia } from "../types/api";

type IdDaAba = "analise" | "grafo";

export function PaginaAnalise() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { perfil } = usePreferencias();
  const [busca, setBusca] = useSearchParams();
  const { investigacao: inv, erro, carregando, recarregar, atualizarLocal } = useInvestigacao(id);
  const concluida = inv?.estado === "concluida";
  const grafo = useGrafo(id, concluida);
  const [cenario, setCenario] = useState<string | null>(null);
  const [retorno, setRetorno] = useState<Retorno | null>(null);
  const [excluir, setExcluir] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [repetindo, setRepetindo] = useState(false);
  const [erroAoRepetir, setErroAoRepetir] = useState<string | null>(null);

  const aba: IdDaAba = busca.get("aba") === "grafo" ? "grafo" : "analise";
  const noInicial = busca.get("no");
  const mudarAba = useCallback(
    (a: string, no?: string | null) => {
      setBusca(
        (b) => {
          const n = new URLSearchParams(b);
          if (a === "grafo") n.set("aba", "grafo");
          else n.delete("aba");
          if (no) n.set("no", no);
          else if (no === null || a !== "grafo") n.delete("no");
          return n;
        },
        { replace: true },
      );
      // quem chamou de longe (um cenário no fim da página) volta para o topo das abas
      const el = document.getElementById("partes-da-analise");
      if (el && el.getBoundingClientRect().top < 0 && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "start" });
    },
    [setBusca],
  );

  const rotulos = useMemo(() => new Map((grafo.dados?.nos ?? []).map((n) => [n.id, n.rotulo])), [grafo.dados]);
  const rotuloDaEntidade = useCallback((e: string) => rotulos.get(e) ?? rotuloDoId(e), [rotulos]);
  const registro = useMemo<Record<string, Evidencia>>(() => ({ ...(grafo.dados?.evidencias ?? {}), ...(inv?.evidencias ?? {}) }), [grafo.dados, inv?.evidencias]);
  const sustentacao = useMemo(() => (inv && concluida && inv.analise ? avaliarSustentacao(inv, grafo.dados) : null), [inv, concluida, grafo.dados]);

  const avisar = (ok: boolean, mensagem: string) => setRetorno({ ok, mensagem, chave: Date.now() });
  const fecharRetorno = useCallback(() => setRetorno(null), []);

  // ── carregando / erro sem investigação
  if (!inv) {
    if (erro && !carregando) {
      const m = mensagemDoErro(erro, "a análise");
      return (
        <div className="mx-auto max-w-2xl py-10">
          <h1 className="sr-only">{m.titulo}</h1>
          <AvisoDeErro
            titulo={m.titulo}
            texto={m.texto}
            aoTentarNovamente={m.repetivel ? recarregar : undefined}
            acoes={
              <BotaoLink to={rotas.historico} tamanho="pequeno" variante="fantasma">
                Ir para o histórico
              </BotaoLink>
            }
          />
        </div>
      );
    }
    return <EsqueletoDaAnalise />;
  }

  const andamento = estaEmAndamento(inv.estado);
  const a = inv.analise;

  const alternarGuardada = async () => {
    const guardar = !inv.guardada;
    setGuardando(true);
    atualizarLocal((x) => ({ ...x, guardada: guardar }));
    try {
      await (guardar ? guardarInvestigacao(inv.id) : desguardarInvestigacao(inv.id));
      avisar(true, guardar ? "Análise guardada. Ela fica em Guardados." : "A análise saiu dos guardados.");
    } catch (e) {
      atualizarLocal((x) => ({ ...x, guardada: !guardar }));
      const er = comoErroDaApi(e);
      avisar(false, `Não consegui ${guardar ? "guardar" : "remover dos guardados"}: ${er.tipo === "indisponivel" ? "a API não respondeu" : er.message}. Nada mudou.`);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarExclusao = async (): Promise<string | null> => {
    try {
      await excluirInvestigacao(inv.id);
      navegar(rotas.historico, { state: { retorno: { ok: true, mensagem: "Análise excluída." } } });
      return null;
    } catch (e) {
      const er = comoErroDaApi(e);
      if (er.tipo === "nao_encontrado") {
        navegar(rotas.historico);
        return null;
      }
      return er.tipo === "conflito"
        ? "A API recusou: a análise ainda está em execução. Tente depois que ela terminar."
        : er.tipo === "indisponivel"
          ? "A API não respondeu. A análise não foi excluída."
          : `A API recusou: ${er.message}`;
    }
  };

  const tentarDeNovo = async () => {
    setRepetindo(true);
    setErroAoRepetir(null);
    try {
      const nova = await criarInvestigacao(inv.questao, inv.horizonte);
      navegar(rotas.analise(nova.id));
    } catch (e) {
      setErroAoRepetir(mensagemDoErro(e, "a nova análise").texto);
    } finally {
      setRepetindo(false);
    }
  };

  const verCenario = (c: string) => {
    setCenario(c);
    mudarAba("grafo");
  };
  const verEntidade = (e: string) => mudarAba("grafo", e);
  const temGrafo = !!grafo.dados && grafo.dados.arestas.length > 0;

  const cabecalho = (
    <header className="mb-8 flex flex-col gap-5">
      <Link to={rotas.historico} className="fr-cabecalho-voltar">
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={2} />
        Histórico
      </Link>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* a questão, como a pergunta do usuário na referência */}
        <div className="flex min-w-0 items-start gap-4">
          <span className="fr-avatar hidden shrink-0 sm:grid" aria-hidden="true">
            {iniciais(perfil.nome)}
          </span>
          <div className="min-w-0 rounded-3xl rounded-tl-lg border border-vidro-borda bg-vidro px-5 py-4 shadow-baixa backdrop-blur-vidro">
            <p className="text-xs text-texto-fraco">
              {perfil.nome} perguntou · <time dateTime={inv.criada_em}>{dataLonga(inv.criada_em)}, {hora(inv.criada_em)}</time>
            </p>
            <h1 className={cx("mt-1 leading-tight font-semibold text-balance break-words", inv.questao.length > 140 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>{inv.questao}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PilulaDeEstado estado={inv.estado} />
              <span className="inline-flex max-w-full items-center rounded-full border border-borda bg-superficie-2 px-2.5 py-1 text-xs font-medium text-texto-suave" title={inv.horizonte ?? undefined}>
                <span className="truncate">{inv.horizonte ? `Horizonte: ${inv.horizonte}` : "Sem horizonte definido"}</span>
              </span>
              {inv.guardada && (
                <Pilula tamanho="pequeno" icone={<BookmarkCheck size={12} />}>
                  Guardada
                </Pilula>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Botao
            tamanho="pequeno"
            icone={inv.guardada ? <BookmarkCheck /> : <Bookmark />}
            aria-pressed={inv.guardada}
            onClick={alternarGuardada}
            disabled={guardando}
            className={cx(inv.guardada && "text-escarlate")}
          >
            {inv.guardada ? "Remover dos guardados" : "Guardar"}
          </Botao>
          <Botao tamanho="pequeno" icone={<Trash2 />} onClick={() => setExcluir(true)} disabled={andamento} title={andamento ? "Disponível quando a análise terminar" : undefined}>
            Excluir
          </Botao>
          <BotaoLink to={rotas.novaAnalise} tamanho="pequeno" variante="fantasma" icone={<Plus />}>
            Nova análise
          </BotaoLink>
        </div>
      </div>
      <AvisoDeRetorno retorno={retorno} aoFechar={fecharRetorno} />
      {erro && (
        <p role="status" className="flex items-center gap-2 text-sm text-aviso">
          <WifiOff aria-hidden="true" size={16} />
          {erro.tipo === "indisponivel" ? "Conexão com a API instável. Tentando de novo…" : erro.message}
        </p>
      )}
    </header>
  );

  return (
    <ProvedorDeEvidencias investigacaoId={inv.id} registro={registro} rotuloDaEntidade={rotuloDaEntidade}>
      {cabecalho}

      {andamento && (
        <section aria-labelledby="progresso-titulo" className="flex flex-col gap-4">
          <h2 id="progresso-titulo" className="text-xl font-semibold">
            A F.R.E.Y.A. está investigando
          </h2>
          <ProgressoDaInvestigacao investigacao={inv} rotuloDaEntidade={rotuloDaEntidade} />
          <p className="text-sm text-texto-suave">Pode sair desta página: a análise continua e aparece no histórico quando terminar.</p>
        </section>
      )}

      {inv.estado === "falhou" && (
        <section aria-labelledby="falha-titulo" className="flex flex-col gap-4">
          <h2 id="falha-titulo" className="sr-only">
            A análise falhou
          </h2>
          <AvisoDeErro
            titulo="A análise falhou"
            texto={
              <>
                <span className="[overflow-wrap:anywhere]">{inv.erro ?? "O backend não informou o motivo."}</span>
                {erroAoRepetir && <span className="mt-2 block text-perigo">Não consegui criar a nova análise: {erroAoRepetir}</span>}
              </>
            }
            aoTentarNovamente={tentarDeNovo}
            tentando={repetindo}
            rotuloDaAcao="Tentar de novo (nova análise)"
          />
          <ProgressoDaInvestigacao investigacao={inv} rotuloDaEntidade={rotuloDaEntidade} aoVivo={false} />
        </section>
      )}

      {concluida && !a && <AvisoDeErro titulo="A análise terminou sem conteúdo" texto="O backend marcou a investigação como concluída, mas não devolveu a análise." />}

      {concluida && a && (
        <div className="flex flex-col gap-6">
          {sustentacao && <AvisoDeSustentacao sustentacao={sustentacao} />}
          <div id="partes-da-analise" className="scroll-mt-20">
          <Abas
            rotulo="Partes da análise"
            ativa={aba}
            aoMudar={(x) => mudarAba(x)}
            abas={[
              {
                id: "analise",
                rotulo: "Análise estruturada",
                icone: <FileText size={16} />,
                conteudo: (
                  <div className="pt-6">
                    <SecoesDaAnalise
                      investigacao={inv}
                      analise={a}
                      rotuloDaEntidade={rotuloDaEntidade}
                      cenarioDestacado={cenario}
                      aoVerCenarioNoGrafo={verCenario}
                      aoVerEntidadeNoGrafo={verEntidade}
                      temGrafo={temGrafo}
                    />
                  </div>
                ),
              },
              {
                id: "grafo",
                rotulo: "Grafo",
                icone: <Network size={16} />,
                contagem: grafo.dados?.nos.length,
                conteudo: (
                  <div className="flex flex-col gap-4 pt-6">
                    {grafo.carregando ? (
                      <div className="relative h-[34rem] overflow-hidden rounded-3xl border border-borda bg-superficie">
                        <Esqueleto forma="bloco" largura="100%" altura="100%" className="absolute inset-0" />
                        <Carregando rotulo="Carregando o grafo…" className="absolute top-4 left-4" />
                      </div>
                    ) : grafo.erro ? (
                      <AvisoDeErro {...mensagemDoErro(grafo.erro, "o grafo")} aoTentarNovamente={grafo.recarregar} />
                    ) : grafo.dados ? (
                      <>
                        {grafo.dados.cenarios.length > 0 && grafo.dados.arestas.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Destacar um cenário no grafo">
                            <span className="text-xs text-texto-fraco">Cenários:</span>
                            {grafo.dados.cenarios.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                aria-pressed={cenario === c.id}
                                className={cx(
                                  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-[background-color,border-color,color] duration-150",
                                  cenario === c.id ? "border-escarlate bg-escarlate-tinta text-escarlate-forte" : "border-borda-forte bg-superficie text-texto-suave passar:text-texto",
                                )}
                                onClick={() => setCenario(cenario === c.id ? null : c.id)}
                              >
                                <span className="font-mono">{c.id}</span>
                                <span className="truncate">{c.nome}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <ExploradorDoGrafo
                          investigacaoId={inv.id}
                          grafo={grafo.dados}
                          modo="completo"
                          cenarioDestacado={cenario}
                          aoMudarCenario={setCenario}
                          noInicial={noInicial}
                        />
                      </>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
          </div>
        </div>
      )}

      <DialogoDeExclusao alvo={excluir ? inv : null} aoFechar={() => setExcluir(false)} aoConfirmar={confirmarExclusao} />
    </ProvedorDeEvidencias>
  );
}

function EsqueletoDaAnalise() {
  return (
    <div>
      <Carregando rotulo="Carregando a análise…" rotuloOculto />
      <div className="mb-8 flex flex-col gap-5" aria-hidden="true">
        <Esqueleto largura="6rem" altura="1rem" />
        <div className="flex items-start gap-4">
          <Esqueleto forma="circulo" largura="2.5rem" altura="2.5rem" />
          <div className="flex w-full max-w-3xl flex-col gap-3 rounded-3xl border border-borda bg-superficie px-5 py-4">
            <Esqueleto largura="12rem" altura="0.75rem" />
            <Esqueleto largura="90%" altura="2rem" />
            <Esqueleto largura="14rem" altura="1.5rem" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]" aria-hidden="true">
        <div className="hidden flex-col gap-2 lg:flex">
          {Array.from({ length: 9 }, (_, i) => (
            <Esqueleto key={i} altura="2.25rem" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <Esqueleto forma="bloco" altura="10rem" className="rounded-3xl" />
          <Esqueleto linhas={4} />
          <Esqueleto forma="bloco" altura="8rem" className="rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
