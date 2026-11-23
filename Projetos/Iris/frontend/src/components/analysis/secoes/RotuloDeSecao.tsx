/**
 * Rótulo de uma seção da análise: "01 · Diagnóstico atual", em caixa alta pequena. O número fica em ouro na seção dos
 * futuros (`nucleo`), o núcleo prospectivo da investigação; nas demais, em cinza. É a estrutura da página, não um
 * título: o título é a frase que vem logo abaixo.
 */
export function RotuloDeSecao({ numero, nome, nucleo = false }: { numero: string; nome: string; nucleo?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-micro font-medium tracking-[0.12em] text-texto-3 uppercase">
      <span className={`numeros font-dados ${nucleo ? "text-ouro" : ""}`}>{numero}</span>
      <span aria-hidden="true">·</span>
      <span>{nome}</span>
    </p>
  );
}
