import dados from "../../videos/sol.json";
import { Cronometro } from "../camadas/Cronometro";
import { OITO_MINUTOS, restanteCronometro } from "../lib/sol";
import { ambienteNoite, type Ambiente } from "../mundo/ambiente";
import type { PropsCena } from "./tipos";

// Peças comuns às cenas do vídeo do Sol (Q1 a Q5).

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Segundo do áudio em que a palavra é dita no parágrafo (o vídeo começa junto com a voz: ABERTURA = 0). */
function quando(paragrafo: number, palavra: string): number {
  const p = dados.palavras.find((w) => w.paragrafo === paragrafo && normalizar(w.texto) === palavra);
  if (!p) throw new Error(`Palavra "${palavra}" não está no parágrafo ${paragrafo} de videos/sol.json`);
  return p.inicioMs / 1000;
}

/** O Sol se apaga em "agora?" (8:00) e a última luz chega em "apaga." (0:00). Tempo acelerado. */
export const T_AGORA = quando(0, "agora");
export const T_APAGA = quando(2, "apaga");

export const restanteSol = (tempo: number) => restanteCronometro(tempo, T_AGORA, T_APAGA);
/** Quanto do caminho Sol–Terra a última luz já andou (0 no Sol, 1 na Terra). */
export const caminhoDaLuz = (tempo: number) => 1 - restanteSol(tempo) / OITO_MINUTOS;

/** Dia de sol, visto da Terra: Lua clara de dia, sem estrelas. */
export const ambienteDia: Ambiente = { ...ambienteNoite, dia: 1, lua: 0.4, estrelas: 0, sol: 1 };

/**
 * Cronômetro contínuo do Q1 ao Q3: aparece em "agora?" e sai 1,6 s depois de zerar. Na passagem entre duas cenas
 * só a que pesa mais desenha, para não sair dobrado.
 */
export const CronometroSol: React.FC<PropsCena> = ({ tempo, peso }) =>
  peso > 0.5 ? <Cronometro x={72} y={304} restante={restanteSol(tempo)} seg={tempo} janela={[T_AGORA, T_APAGA + 1.6]} /> : null;
