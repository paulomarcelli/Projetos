import { Bookmark, BookmarkCheck, History } from "lucide-react";
import { useCallback, useState } from "react";
import { AvisoDeRetorno, CartaoDeAnalise, EsqueletoDaLista, type Retorno } from "../components/history";
import { CabecalhoDaPagina } from "../components/layout";
import { AvisoDeErro, BotaoLink, Carregando, EstadoVazio } from "../components/ui";
import { rotas } from "../config/rotas";
import { mensagemDoErro, plural, useHistorico, useNomesDosCenarios } from "../hooks";
import { guardarInvestigacao } from "../services";
import type { ResumoDeInvestigacao } from "../types/api";

export function PaginaGuardados() {
  const guardados = useHistorico({ guardadas: true, limite: 1000 });
  const [retorno, setRetorno] = useState<Retorno | null>(null);
  const fecharRetorno = useCallback(() => setRetorno(null), []);
  const itens = guardados.itens ?? [];
  const cenarios = useNomesDosCenarios(itens.filter((i) => i.estado === "concluida" && i.cenarios > 0).map((i) => i.id));
  const msg = guardados.erro ? mensagemDoErro(guardados.erro, "os guardados") : null;

  const remover = async (item: ResumoDeInvestigacao) => {
    const r = await guardados.alternarGuardada(item);
    setRetorno({
      ok: r.ok,
      mensagem: r.mensagem,
      chave: Date.now(),
      acao: r.ok
        ? {
            rotulo: "Desfazer",
            aoClicar: () => {
              setRetorno(null);
              guardarInvestigacao(item.id).then(guardados.recarregar, () =>
                setRetorno({ ok: false, mensagem: "Não consegui guardar de novo: a API recusou. Guarde pelo histórico.", chave: Date.now() }),
              );
            },
          }
        : undefined,
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <CabecalhoDaPagina
        titulo="Guardados"
        subtitulo={
          <>
            As análises que você marcou para voltar. Guarda-se a análise inteira: cenários e afirmações soltas ainda não podem ser guardados à parte.
            {guardados.itens && itens.length > 0 && <span className="text-texto-fraco"> · {plural(itens.length, "análise guardada", "análises guardadas")}</span>}
          </>
        }
        acoes={
          <BotaoLink to={rotas.historico} variante="secundario" icone={<History />}>
            Histórico completo
          </BotaoLink>
        }
      />

      <AvisoDeRetorno retorno={retorno} aoFechar={fecharRetorno} className="mb-4" />

      {msg ? (
        <AvisoDeErro titulo={msg.titulo} texto={msg.texto} aoTentarNovamente={guardados.recarregar} tentando={guardados.atualizando} />
      ) : guardados.carregando ? (
        <>
          <Carregando rotulo="Carregando os guardados…" rotuloOculto />
          <EsqueletoDaLista quantos={3} />
        </>
      ) : itens.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-borda-forte py-10">
          <EstadoVazio
            icone={<Bookmark />}
            titulo="Nada guardado ainda"
            texto={
              <>
                Para guardar, abra uma análise e use <strong className="font-medium">Guardar</strong>, ou toque no marcador{" "}
                <BookmarkCheck aria-label="de guardar" size={14} className="inline align-[-2px]" /> de um cartão no histórico.
              </>
            }
            acao={
              <BotaoLink to={rotas.historico} variante="primario" icone={<History />}>
                Ir para o histórico
              </BotaoLink>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4">
          {itens.map((item) => (
            <CartaoDeAnalise
              key={item.id}
              item={item}
              variante="guardado"
              ocupado={guardados.pendentes.has(item.id)}
              aoAlternarGuardada={() => remover(item)}
              cenarios={item.estado === "concluida" && item.cenarios > 0 ? (cenarios[item.id] ?? null) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
