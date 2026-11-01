import { PREVIA } from "../config/env";
import { AlternadorDados } from "../dev/AlternadorDados";
import { Rotas } from "./roteador";

export function App() {
  return (
    <>
      {/* Selo da prévia no fluxo da página (e não fixo): nunca cobre conteúdo, links ou fontes. */}
      {PREVIA && (
        <p role="note" className="print:hidden border-b border-linha bg-grafite px-4 py-1.5 text-center text-micro text-texto-2">
          Prévia estática · dados de exemplo · envio e remoção desativados
        </p>
      )}
      <Rotas />
      {import.meta.env.DEV && !PREVIA && <AlternadorDados />}
    </>
  );
}
