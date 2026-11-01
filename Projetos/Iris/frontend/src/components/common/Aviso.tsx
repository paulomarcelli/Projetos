import type { ReactNode } from "react";

/**
 * Aviso em linha. `tom` define o significado:
 *   - neutro: informação;
 *   - atencao: algo do SISTEMA que o usuário precisa saber (ex.: recurso ainda indisponível).
 *     Neutro reforçado, com filete à esquerda; nunca âmbar, que é a cor da incerteza ANALÍTICA;
 *   - incerteza: atenção analítica (evidências divergentes, hipótese frágil), em âmbar;
 *   - erro e sucesso.
 * Teoria das cores aplicada: cada matiz carrega um só significado na plataforma inteira.
 */
export function Aviso({
  tom = "neutro",
  titulo,
  children,
}: {
  tom?: "neutro" | "atencao" | "incerteza" | "erro" | "sucesso";
  titulo?: string;
  children: ReactNode;
}) {
  const estilo = {
    neutro: "border-linha-forte bg-grafite",
    atencao: "border-linha-forte border-l-2 border-l-texto-2 bg-grafite",
    incerteza: "border-ambar/35 bg-ambar-suave",
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
