import { CircleAlert, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import type { ErroApi } from "../lib/api";
import { Epistemico, type TipoEpistemico } from "./Epistemico";

/** Origem de um número ou de um conjunto de dados: todo indicador diz de onde veio. */
export function Origem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-1.5 text-micro text-texto-3">
      <span className="shrink-0">fonte</span>
      <code className="min-w-0 truncate font-dados text-[0.6875rem] text-texto-3">{children}</code>
    </span>
  );
}

export function Esqueleto({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`esqueleto block ${className}`} />;
}

export function LinhasEsqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} className={`h-4 ${i === linhas - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/**
 * Estado vazio útil: diz o que vai aparecer aqui, por que ainda não há nada e o que fazer.
 * Nunca mostra dados simulados.
 */
export function EstadoVazio({
  titulo,
  children,
  acao,
  marcador,
  icone,
}: {
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
  marcador?: { tipo: TipoEpistemico; rotulo?: string };
  icone?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      {icone && <span className="text-texto-3">{icone}</span>}
      {marcador && <Epistemico tipo={marcador.tipo} rotulo={marcador.rotulo} />}
      <p className="font-editorial text-secao text-texto">{titulo}</p>
      {children && <div className="max-w-[60ch] text-corpo text-texto-2">{children}</div>}
      {acao && <div className="pt-1">{acao}</div>}
    </div>
  );
}

export function ErroDeCarregamento({ erro, aoTentarDeNovo }: { erro: ErroApi; aoTentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-padrao border border-negativo/30 bg-negativo-suave p-4">
      <p className="flex items-center gap-2 text-corpo text-texto">
        <CircleAlert size={16} className="shrink-0 text-negativo" aria-hidden="true" />
        {erro.status === 0 ? "API indisponível" : "Não foi possível carregar"}
      </p>
      <p className="max-w-[60ch] text-legenda text-texto-2">{erro.message}</p>
      {aoTentarDeNovo && (
        <button type="button" className="botao botao-secundario botao-pequeno" onClick={aoTentarDeNovo}>
          <RotateCw size={14} aria-hidden="true" />
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Aviso em linha. `tom` define o significado: neutro, atenção (âmbar), erro, sucesso. */
export function Aviso({
  tom = "neutro",
  titulo,
  children,
}: {
  tom?: "neutro" | "atencao" | "erro" | "sucesso";
  titulo?: string;
  children: ReactNode;
}) {
  const estilo = {
    neutro: "border-linha-forte bg-grafite",
    atencao: "border-ambar/35 bg-ambar-suave",
    erro: "border-negativo/35 bg-negativo-suave",
    sucesso: "border-positivo/35 bg-positivo-suave",
  }[tom];
  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={`rounded-padrao border p-3 text-legenda text-texto-2 ${estilo}`}
    >
      {titulo && <p className="mb-1 text-corpo font-medium text-texto">{titulo}</p>}
      {children}
    </div>
  );
}
