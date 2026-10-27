import { useCallback, useEffect, useRef, useState } from "react";
import { ErroApi } from "./api";

export type Estado<T> =
  | { tipo: "carregando"; dados?: undefined; erro?: undefined }
  | { tipo: "ok"; dados: T; erro?: undefined }
  | { tipo: "erro"; dados?: undefined; erro: ErroApi };

/**
 * Carrega dados de uma função assíncrona e devolve estado + `recarregar`.
 * Ignora respostas atrasadas (ex.: o usuário trocou de página antes da anterior chegar).
 */
export function useDados<T>(carregar: () => Promise<T>, dependencias: unknown[]) {
  const [estado, setEstado] = useState<Estado<T>>({ tipo: "carregando" });
  const geracao = useRef(0);

  const executar = useCallback(() => {
    const minha = ++geracao.current;
    setEstado((atual) => (atual.tipo === "ok" ? atual : { tipo: "carregando" }));
    carregar().then(
      (dados) => {
        if (minha === geracao.current) setEstado({ tipo: "ok", dados });
      },
      (erro: unknown) => {
        if (minha !== geracao.current) return;
        setEstado({
          tipo: "erro",
          erro:
            erro instanceof ErroApi
              ? erro
              : new ErroApi(0, "desconhecido", "Algo deu errado ao carregar os dados."),
        });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    setEstado({ tipo: "carregando" });
    executar();
    return () => {
      geracao.current += 1;
    };
  }, [executar]);

  return { ...estado, estado, recarregar: executar } as const;
}
