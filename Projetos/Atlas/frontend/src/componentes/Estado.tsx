import type { ReactNode } from "react";

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-sm text-suave">
      <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-borda border-t-acento" />
      {texto}
    </div>
  );
}

export function CaixaErro({ titulo = "Algo deu errado", children, acao }: { titulo?: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <div role="alert" className="cartao border-alto/40 bg-alto/5 p-4 text-sm">
      <p className="font-medium text-alto">{titulo}</p>
      <div className="mt-1 text-texto/90 quebra">{children}</div>
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="cartao flex flex-col items-start gap-2 border-dashed p-6 text-sm">
      <p className="font-medium">{titulo}</p>
      {children && <div className="text-suave">{children}</div>}
      {acao}
    </div>
  );
}

export function Secao({ id, titulo, subtitulo, children, acao }: { id?: string; titulo: string; subtitulo?: ReactNode; children: ReactNode; acao?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-t` : undefined} className="scroll-mt-24 animate-entrar">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id={id ? `${id}-t` : undefined} className="text-lg font-semibold">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 max-w-[70ch] text-sm text-suave">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function AvisoCondicional() {
  return (
    <p className="rounded-lg border border-acento/30 bg-acento/5 px-3 py-2 text-xs leading-relaxed text-suave">
      <strong className="font-semibold text-acento">Análise condicional, não previsão.</strong> O ATLAS explora o que pode acontecer
      <em> se </em> as premissas escolhidas valerem. Não é uma ferramenta de previsão científica validada.
    </p>
  );
}
