import { numero, useSaude } from "../../hooks";
import { Dica, cx } from "../ui";

/** Estado da API em uma linha discreta: motor, modelo e tamanho da base (GET /saude). */
export function IndicadorDeSaude({ className }: { className?: string }) {
  const { dados, erro, carregando } = useSaude();
  const ok = dados?.status === "ok";
  const texto = carregando
    ? "Verificando a API…"
    : erro
      ? "API fora do ar"
      : dados
        ? `${dados.motor === "modelo" ? "Motor: modelo" : "Motor: determinístico"}${dados.base ? ` · ${numero(dados.base.hybrid.chunks)} trechos · ${numero(dados.base.grafo.nos)} nós` : ""}`
        : "";
  const detalhe = dados
    ? `${dados.modelo ? `Modelo ${dados.modelo}. ` : ""}${dados.base ? `${numero(dados.base.hybrid.documentos)} documentos, ${numero(dados.base.grafo.arestas)} relações no grafo (${dados.grafo}).` : "Tamanho da base não informado pela API."}`
    : erro
      ? "A API não respondeu ao /saude."
      : "";
  return (
    <Dica texto={detalhe || texto} lado="baixo">
      <p
        tabIndex={0}
        role="status"
        className={cx("inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-vidro-borda bg-vidro px-3 text-xs text-texto-suave backdrop-blur-vidro", className)}
      >
        <span
          aria-hidden="true"
          className={cx("size-2 shrink-0 rounded-full", carregando ? "bg-texto-fraco" : erro ? "bg-perigo" : ok ? "bg-sucesso" : "bg-aviso")}
        />
        <span className="truncate fr-numeros">{texto}</span>
      </p>
    </Dica>
  );
}
