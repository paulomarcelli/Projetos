/** Lista em texto das relações visíveis: alternativa acessível ao mapa (e útil no celular). */
import type { Cenario, Vista } from "../../../types/cenario";
import type { RelacaoNaVista } from "../../investigacao/contexto";
import { useResultado } from "../../investigacao/contexto";
import { ESTILO } from "../apoioDoMapa";

export function ListaDeRelacoes({
  visiveis,
  cenario,
  vista,
  nome,
  aoEscolher,
}: {
  visiveis: RelacaoNaVista[];
  cenario: Cenario | null;
  vista: Vista;
  nome: (id: string) => string;
  aoEscolher: (idRelacao: string) => void;
}) {
  const { r } = useResultado();
  const blocos = r.blocos;
  return (
          <div className="aparecer absolute bottom-2.5 left-2.5 z-30 flex max-h-[70%] w-[min(24rem,calc(100%-1.25rem))] flex-col rounded-padrao border border-linha-forte bg-abismo/95 shadow-lg sm:left-3">
            <p className="border-b border-linha px-3 py-2 text-micro text-texto-3">
              {visiveis.length} relações {cenario ? `no cenário ${cenario.id}` : "hoje"}
            </p>
            <ul className="m-0 flex list-none flex-col overflow-y-auto p-0">
              {visiveis.map((l) => (
                <li key={l.rel.id}>
                  <button
                    type="button"
                    onClick={() => aoEscolher(l.rel.id)}
                    className="w-full px-3 py-2 text-left text-legenda hover:bg-grafite"
                  >
                    <span className="text-texto">
                      {nome(l.rel.de)} → {nome(l.rel.para)}
                    </span>
                    <span className="text-texto-3"> · {ESTILO.get(l.tipo)?.rotulo.split(" / ")[0]}</span>
                    <span className="block text-micro text-texto-2">{l.texto}</span>
                  </button>
                </li>
              ))}
              {blocos.map((b) => (
                <li key={b.id} className="px-3 py-2 text-micro text-texto-2">
                  <span className="text-texto">{b.nome}:</span> {b.membros[vista].map(nome).join(", ")}
                </li>
              ))}
            </ul>
          </div>
  );
}
