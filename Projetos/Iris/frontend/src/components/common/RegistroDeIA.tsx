/**
 * Registro de uso de IA (docs/design-system.md): quando, o pedido, o que a IA fez, o modelo, as fontes usadas e quem
 * revisou. "Aguardando revisão" leva borda âmbar tracejada (é o que ainda não foi conferido por uma pessoa); "revisado"
 * é estado real e fica em verde. Datas e modelo em mono, porque são dado.
 */
import { AlertTriangle, Check } from "lucide-react";
import type { RegistroDeUsoDeIA } from "../../types/observatorio";
import { dataDoDia } from "./Versao";

/** "2026-11-12T14:32" vira "12/11 · 14:32". */
export function quandoCurto(quando: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(quando);
  if (!m) return quando;
  return m[4] ? `${m[3]}/${m[2]} · ${m[4]}` : `${m[3]}/${m[2]}`;
}

export function RegistroDeIA({ r }: { r: RegistroDeUsoDeIA }) {
  const aguardando = r.revisao.estado === "aguardando";
  return (
    <article
      aria-label={`Uso de IA: ${r.pedido}`}
      className={`flex flex-col gap-1.5 rounded-padrao border p-4 ${aguardando ? "border-dashed border-ambar" : "border-linha-forte"} bg-institucional`}
    >
      <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 text-corpo text-texto">
        <span className="numeros font-dados text-micro text-texto-3">{quandoCurto(r.quando)}</span>
        <span>{r.pedido}</span>
      </p>
      <p className="m-0 text-legenda text-texto-2">{r.feito}</p>
      <p className="m-0 font-dados text-micro text-texto-3">
        {r.modelo} · {r.fontes.length} {r.fontes.length === 1 ? "fonte usada" : "fontes usadas"}
      </p>
      {r.revisao.estado === "revisado" ? (
        <p className="m-0 inline-flex items-center gap-1.5 text-micro text-positivo">
          <Check size={14} aria-hidden="true" />
          Revisado por {r.revisao.por} em {dataDoDia(r.revisao.em)}
          {r.revisao.decisao && ` · ${r.revisao.decisao}`}
        </p>
      ) : (
        <p className="m-0 inline-flex items-center gap-1.5 text-micro text-ambar">
          <AlertTriangle size={14} aria-hidden="true" />
          Aguardando revisão humana
        </p>
      )}
    </article>
  );
}
