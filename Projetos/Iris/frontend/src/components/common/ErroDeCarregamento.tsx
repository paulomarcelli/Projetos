import { CircleAlert, RotateCw } from "lucide-react";
import type { ErroApi } from "../../services/api";

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
