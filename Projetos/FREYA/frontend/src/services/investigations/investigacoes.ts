import type { EstadoInvestigacao, Investigacao, InvestigacaoCriada } from "../../types/api";
import { foiCancelado, requisitar, segmento } from "../api/cliente";
import { ErroDaApi } from "../api/erros";

/** POST /investigacoes — cria e dispara a investigação (202). Lança `invalido` com a mensagem do backend. */
export async function criarInvestigacao(questao: string, horizonte?: string | null): Promise<InvestigacaoCriada> {
  const h = horizonte?.trim();
  return requisitar<InvestigacaoCriada>("/investigacoes", { metodo: "POST", corpo: { questao, horizonte: h ? h : null } });
}

/** GET /investigacoes/{id} */
export async function obterInvestigacao(id: string, sinal?: AbortSignal): Promise<Investigacao> {
  return requisitar<Investigacao>(`/investigacoes/${segmento(id)}`, { sinal });
}

export interface Acompanhamento {
  /** para de consultar */
  cancelar(): void;
}

export const ESTADOS_FINAIS: readonly EstadoInvestigacao[] = ["concluida", "falhou"];

export function estaEmAndamento(estado: EstadoInvestigacao): boolean {
  return !ESTADOS_FINAIS.includes(estado);
}

export interface OpcoesDoAcompanhamento {
  /** ms entre consultas (padrão 1500) */
  intervalo?: number;
  /** teto do intervalo depois de erros seguidos (padrão 5000) */
  intervaloMaximo?: number;
}

/** O que, mudando, merece um `aoAtualizar` (o resto da investigação só muda junto com isto). */
function assinatura(inv: Investigacao): string {
  return `${inv.estado}|${inv.atualizada_em}|${JSON.stringify(inv.etapas)}`;
}

/**
 * Consulta GET /investigacoes/{id} em intervalos até `concluida` ou `falhou`,
 * chamando `aoAtualizar` a cada mudança e `aoErro` se a API cair (sem parar sozinho por um erro só).
 *
 * - a primeira consulta sai na hora; depois, a cada `intervalo`;
 * - depois de erro, o intervalo dobra até `intervaloMaximo`, e volta ao normal na primeira resposta boa;
 * - erros passageiros (`indisponivel`, `servidor`, `conflito`) seguem tentando; `nao_encontrado` e `invalido`
 *   são definitivos (a investigação foi excluída ou o id não existe) e encerram o acompanhamento;
 * - com a aba escondida (`document.hidden`), pausa; ao voltar, consulta na hora;
 * - `cancelar()` para os relógios e aborta a requisição em andamento, e nenhum retorno é chamado depois dele.
 */
export function acompanharInvestigacao(
  id: string,
  aoAtualizar: (inv: Investigacao) => void,
  aoErro?: (e: ErroDaApi) => void,
  opcoes: OpcoesDoAcompanhamento = {},
): Acompanhamento {
  const intervalo = opcoes.intervalo ?? 1500;
  const intervaloMaximo = opcoes.intervaloMaximo ?? 5000;
  const temDocumento = typeof document !== "undefined";

  let ativo = true;
  let relogio: ReturnType<typeof setTimeout> | null = null;
  let controle: AbortController | null = null;
  let pausado = false;
  let errosSeguidos = 0;
  let ultima: string | null = null;

  function encerrar() {
    ativo = false;
    if (relogio !== null) clearTimeout(relogio);
    relogio = null;
    controle?.abort();
    controle = null;
    if (temDocumento) document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }

  function agendar() {
    if (!ativo) return;
    const espera = errosSeguidos === 0 ? intervalo : Math.min(intervaloMaximo, intervalo * 2 ** errosSeguidos);
    relogio = setTimeout(consultar, espera);
  }

  function consultar() {
    relogio = null;
    if (!ativo) return;
    if (temDocumento && document.hidden) {
      pausado = true;
      return;
    }
    const meu = new AbortController();
    controle = meu;
    obterInvestigacao(id, meu.signal).then(
      (inv) => {
        if (!ativo || controle !== meu) return;
        controle = null;
        errosSeguidos = 0;
        const a = assinatura(inv);
        const mudou = a !== ultima;
        ultima = a;
        const final = ESTADOS_FINAIS.includes(inv.estado);
        if (final) encerrar();
        if (mudou) aoAtualizar(inv);
        if (!final) agendar();
      },
      (e: unknown) => {
        if (!ativo || controle !== meu || foiCancelado(e)) return;
        controle = null;
        const erro = e instanceof ErroDaApi ? e : new ErroDaApi("servidor", e instanceof Error ? e.message : String(e));
        const definitivo = erro.tipo === "nao_encontrado" || erro.tipo === "invalido";
        errosSeguidos += 1;
        if (definitivo) encerrar();
        aoErro?.(erro);
        if (!definitivo) agendar();
      },
    );
  }

  function aoMudarVisibilidade() {
    if (!ativo || document.hidden || !pausado) return;
    pausado = false;
    consultar();
  }

  if (temDocumento) document.addEventListener("visibilitychange", aoMudarVisibilidade);
  consultar();
  return { cancelar: encerrar };
}
