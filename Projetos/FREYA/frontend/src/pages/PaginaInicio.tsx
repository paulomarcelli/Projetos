import { ArrowRight, History } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { ComposicaoDaAnalise } from "../components/chat";
import { ExploradorDoDashboard, IndicadorDeSaude } from "../components/dashboard";
import { CartaoDeAnalise, EsqueletoDaLista } from "../components/history";
import { AvisoDeErro, Carregando, EstadoVazio } from "../components/ui";
import { rotas } from "../config/rotas";
import { agruparPorDia, mensagemDoErro, useHistorico } from "../hooks";

const RECENTES = 6;

/**
 * Dashboard (referência Genie): à esquerda, o explorador do grafo no lugar do papagaio e as análises
 * recentes por dia; à direita, o painel de vidro "Nova análise".
 */
export function PaginaInicio() {
  const historico = useHistorico({ limite: 50 });
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const itens = historico.itens ?? [];
  const concluidas = itens.filter((i) => i.estado === "concluida");
  const [noExplorador, setNoExplorador] = useState<string | null>(null);
  const grupos = agruparPorDia(itens.slice(0, RECENTES));
  const msg = historico.erro ? mensagemDoErro(historico.erro, "o histórico") : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8">
      <header className="flex flex-wrap items-end justify-between gap-3 lg:col-start-1">
        <div>
          <h1 className="text-3xl font-normal tracking-tight">Análises</h1>
          <p className="mt-1 text-sm text-texto-suave">O grafo da última investigação e o que você investigou por dia.</p>
        </div>
        <IndicadorDeSaude />
      </header>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ComposicaoDaAnalise variante="painel" className="lg:sticky lg:top-20 lg:h-[calc(100dvh-6.5rem)] lg:min-h-[36rem]" />
      </div>

      <div className="flex min-w-0 flex-col gap-8 lg:col-start-1">
        {msg ? (
          <AvisoDeErro titulo={msg.titulo} texto={msg.texto} aoTentarNovamente={historico.recarregar} tentando={historico.carregando} />
        ) : (
          <ExploradorDoDashboard concluidas={concluidas} escolhida={escolhida} carregandoLista={historico.carregando} aoMostrar={setNoExplorador} />
        )}

        <section aria-labelledby="recentes-titulo" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="recentes-titulo" className="text-xl font-medium">
              Recentes
            </h2>
            {itens.length > 0 && (
              <Link to={rotas.historico} className="inline-flex items-center gap-1 text-sm font-medium text-texto-suave passar:text-escarlate">
                Todo o histórico <ArrowRight aria-hidden="true" size={14} />
              </Link>
            )}
          </div>
          {historico.carregando ? (
            <>
              <Carregando rotulo="Carregando as análises…" rotuloOculto />
              <EsqueletoDaLista quantos={3} />
            </>
          ) : msg ? null : itens.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-borda-forte p-6">
              <EstadoVazio
                tamanho="compacto"
                icone={<History />}
                titulo="Nenhuma análise ainda"
                texto="Escreva uma questão no painel Nova análise. Ela aparece aqui, agrupada pelo dia."
              />
            </div>
          ) : (
            grupos.map((g) => (
              <div key={g.chave} className="flex flex-col gap-3">
                <h3 className="text-lg font-normal">
                  {g.titulo} <span className="text-sm text-texto-fraco">{g.subtitulo}</span>
                </h3>
                <ul className="flex flex-col gap-3">
                  {g.itens.map((item) => (
                    <CartaoDeAnalise
                      key={item.id}
                      item={item}
                      variante="compacto"
                      aoVerNoExplorador={() => setEscolhida(item.id)}
                      noExplorador={noExplorador === item.id}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
