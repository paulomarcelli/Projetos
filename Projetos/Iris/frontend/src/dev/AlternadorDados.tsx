import { definirModoDados, modoDados, type ModoDados } from "./fixtures";

const OPCOES: { modo: ModoDados; rotulo: string }[] = [
  { modo: "api", rotulo: "API real" },
  { modo: "pior", rotulo: "Pior caso" },
  { modo: "vazio", rotulo: "Vazio" },
  { modo: "um", rotulo: "Um item" },
];

/** Só em desenvolvimento: troca a fonte dos documentos para testar a interface (break-ui). */
export function AlternadorDados() {
  const atual = modoDados();
  return (
    <div
      className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 whitespace-nowrap rounded-full border border-[#3a3f48] bg-[#23262c] p-1 font-sans text-[12px] shadow-lg"
      role="group"
      aria-label="Dados de teste (desenvolvimento)"
    >
      {OPCOES.map((o) => (
        <button
          key={o.modo}
          type="button"
          onClick={() => definirModoDados(o.modo)}
          aria-pressed={atual === o.modo}
          className={`rounded-full px-3 py-1 ${atual === o.modo ? "bg-white text-black" : "text-[#c9ccd1]"}`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
