import { ArrowUpRight, Bookmark, BookmarkCheck, CircleAlert, CircleCheck, LoaderCircle, Network, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { rotas } from "../../config/rotas";
import { hora, plural, quando, rotuloDoEstado } from "../../hooks";
import { estaEmAndamento } from "../../services";
import type { EstadoInvestigacao, ResumoDeInvestigacao } from "../../types/api";
import { BotaoIcone, Cartao, Pilula, cx } from "../ui";

export function PilulaDeEstado({ estado, tamanho = "pequeno" }: { estado: EstadoInvestigacao; tamanho?: "pequeno" | "medio" }) {
  if (estado === "concluida")
    return (
      <Pilula tamanho={tamanho} icone={<CircleCheck size={12} />}>
        Concluída
      </Pilula>
    );
  if (estado === "falhou")
    return (
      <Pilula tom="perigo" tamanho={tamanho} icone={<CircleAlert size={12} />}>
        Falhou
      </Pilula>
    );
  return (
    <Pilula tom="escarlate" tamanho={tamanho} icone={<LoaderCircle size={12} className="movimento:animate-spin" />}>
      {rotuloDoEstado(estado)}
    </Pilula>
  );
}

function IconeDoEstado({ estado }: { estado: EstadoInvestigacao }) {
  const andamento = estaEmAndamento(estado);
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid size-11 shrink-0 place-items-center rounded-full border",
        estado === "falhou" ? "border-perigo/30 bg-perigo-tinta text-perigo" : andamento ? "border-escarlate-brilho bg-escarlate-tinta text-escarlate" : "border-borda bg-superficie-2 text-texto-suave",
      )}
    >
      {estado === "falhou" ? <CircleAlert size={18} strokeWidth={1.75} /> : andamento ? <LoaderCircle size={18} className="movimento:animate-spin" /> : <Network size={18} strokeWidth={1.75} />}
    </span>
  );
}

export interface CartaoDeAnaliseProps {
  item: ResumoDeInvestigacao;
  /** "compacto" no dashboard; "lista" no histórico; "guardado" nos guardados (maior) */
  variante?: "compacto" | "lista" | "guardado";
  agora?: Date;
  ocupado?: boolean;
  aoAlternarGuardada?: () => void;
  aoExcluir?: () => void;
  /** dashboard: mostrar esta análise no explorador do grafo */
  aoVerNoExplorador?: () => void;
  noExplorador?: boolean;
  /** guardados: nomes dos primeiros cenários (vêm de GET /investigacoes/{id}) */
  cenarios?: string[] | null;
  extra?: ReactNode;
  comoItem?: boolean;
}

/** Cartão de uma análise do histórico, no estilo dos cartões grandes da referência Genie. */
export function CartaoDeAnalise({
  item,
  variante = "lista",
  agora,
  ocupado,
  aoAlternarGuardada,
  aoExcluir,
  aoVerNoExplorador,
  noExplorador,
  cenarios,
  extra,
  comoItem = true,
}: CartaoDeAnaliseProps) {
  const andamento = estaEmAndamento(item.estado);
  const guardado = variante === "guardado";
  const meta = (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-fraco">
      <time dateTime={item.criada_em} className="fr-numeros">
        {variante === "compacto" ? hora(item.criada_em) : quando(item.criada_em, agora)}
      </time>
      {item.horizonte && (
        <>
          <span aria-hidden="true">•</span>
          <span className="truncate">{item.horizonte}</span>
        </>
      )}
      {item.estado === "concluida" && (
        <>
          <span aria-hidden="true">•</span>
          <span className="fr-numeros">{plural(item.cenarios, "cenário")}</span>
        </>
      )}
    </p>
  );

  return (
    <Cartao
      como={comoItem ? "li" : "div"}
      variante="interativo"
      raio="grande"
      espaco={guardado ? "medio" : "pequeno"}
      className={cx("flex flex-col gap-3", guardado && "border-l-2 border-l-escarlate")}
      data-id={item.id}
    >
      <div className="flex items-start gap-3">
        <IconeDoEstado estado={item.estado} />
        <div className="min-w-0 flex-1 pt-0.5">
          <Link to={rotas.analise(item.id)} className={cx("fr-cartao-link line-clamp-2 font-medium text-texto", guardado ? "text-lg leading-snug" : "text-[0.9375rem] leading-snug")}>
            {item.questao}
          </Link>
          {meta}
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-1">
          {variante !== "compacto" && <span className="hidden sm:inline-flex">{item.estado !== "concluida" && <PilulaDeEstado estado={item.estado} />}</span>}
          {aoVerNoExplorador && item.estado === "concluida" && (
            <BotaoIcone rotulo={noExplorador ? "Já está no explorador do grafo" : "Mostrar no explorador do grafo"} tamanho="pequeno" variante="fantasma" pressionado={noExplorador} onClick={aoVerNoExplorador}>
              <Network size={16} />
            </BotaoIcone>
          )}
          {aoAlternarGuardada && (
            <BotaoIcone
              rotulo={item.guardada ? "Remover dos guardados" : "Guardar análise"}
              tamanho="pequeno"
              variante="fantasma"
              pressionado={item.guardada}
              disabled={ocupado}
              onClick={aoAlternarGuardada}
              className={cx(item.guardada && "text-escarlate")}
            >
              {item.guardada ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </BotaoIcone>
          )}
          {aoExcluir && (
            <BotaoIcone
              rotulo={andamento ? "Excluir (disponível quando terminar)" : "Excluir análise"}
              tamanho="pequeno"
              variante="fantasma"
              disabled={ocupado}
              onClick={aoExcluir}
            >
              <Trash2 size={16} />
            </BotaoIcone>
          )}
          {variante === "compacto" && (
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-vidro-borda bg-vidro-forte text-texto shadow-baixa">
              <ArrowUpRight size={16} />
            </span>
          )}
        </div>
      </div>
      {variante !== "compacto" && item.estado !== "concluida" && (
        <span className="sm:hidden">
          <PilulaDeEstado estado={item.estado} />
        </span>
      )}
      {item.estado === "falhou" && item.erro && variante !== "compacto" && <p className="line-clamp-2 pl-14 text-xs text-perigo">{item.erro}</p>}
      {guardado && cenarios !== undefined && (
        <div className="pl-14">
          {cenarios === null ? (
            <span className="block h-5 w-2/3 rounded-md bg-superficie-2" aria-hidden="true" />
          ) : cenarios.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Primeiros cenários">
              {cenarios.map((c) => (
                <li key={c} className="rounded-full border border-borda bg-superficie-2 px-2.5 py-1 text-xs text-texto-suave">
                  {c}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      {extra}
    </Cartao>
  );
}
