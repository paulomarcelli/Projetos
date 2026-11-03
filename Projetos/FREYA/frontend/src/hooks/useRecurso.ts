import { useCallback, useEffect, useRef, useState } from "react";
import { foiCancelado, type ErroDaApi } from "../services";
import { comoErroDaApi } from "./erros";

export interface EstadoDoRecurso<T> {
  dados: T | null;
  erro: ErroDaApi | null;
  /** primeira carga desta chave (sem dados ainda) */
  carregando: boolean;
  /** nova tentativa com dados (ou erro) da mesma chave já na tela */
  atualizando: boolean;
  recarregar: () => void;
  /** troca os dados localmente (atualização otimista) */
  definirDados: (f: (atual: T | null) => T | null) => void;
}

interface Interno<T> {
  chave: string | null;
  dados: T | null;
  erro: ErroDaApi | null;
  pendente: boolean;
}

/**
 * Carrega um recurso com cancelamento: troca de chave ou desmontagem abortam a requisição em curso,
 * e respostas atrasadas nunca sobrescrevem as novas. Os dados devolvidos são sempre da chave atual
 * (nunca os da chave anterior, nem por um quadro). `chave` nula = não carrega (ex.: grafo antes de concluir).
 */
export function useRecurso<T>(chave: string | null, carregar: (sinal: AbortSignal) => Promise<T>): EstadoDoRecurso<T> {
  const [estado, setEstado] = useState<Interno<T>>({ chave: null, dados: null, erro: null, pendente: false });
  const [versao, setVersao] = useState(0);
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;
  const chaveRef = useRef(chave);
  chaveRef.current = chave;

  useEffect(() => {
    if (chave === null) return;
    const controle = new AbortController();
    setEstado((e) => (e.chave === chave ? { ...e, erro: null, pendente: true } : { chave, dados: null, erro: null, pendente: true }));
    carregarRef.current(controle.signal).then(
      (d) => {
        if (!controle.signal.aborted) setEstado({ chave, dados: d, erro: null, pendente: false });
      },
      (e: unknown) => {
        if (controle.signal.aborted || foiCancelado(e)) return;
        setEstado((x) => ({ chave, dados: x.chave === chave ? x.dados : null, erro: comoErroDaApi(e), pendente: false }));
      },
    );
    return () => controle.abort();
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  const definirDados = useCallback(
    (f: (atual: T | null) => T | null) => setEstado((e) => (e.chave === chaveRef.current ? { ...e, dados: f(e.dados) } : e)),
    [],
  );

  const minha = chave !== null && estado.chave === chave;
  const dados = minha ? estado.dados : null;
  const erro = minha ? estado.erro : null;
  return {
    dados,
    erro,
    carregando: chave !== null && (!minha || (estado.pendente && dados === null)),
    atualizando: minha && estado.pendente && (dados !== null || erro !== null),
    recarregar,
    definirDados,
  };
}
