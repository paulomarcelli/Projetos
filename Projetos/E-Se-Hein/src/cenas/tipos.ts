import type { Ambiente } from "../mundo/ambiente";

export type Vec3 = [number, number, number];

export type Pose = { pos: Vec3; alvo: Vec3; fov: number };

export type PoseBoneco = {
  position: Vec3;
  giro: number;
  olharCima: number;
  bracoDireito: number;
  bracoEsquerdo: number;
  apontar: number;
  pulo: number;
};

/** O que toda cena recebe a cada quadro. */
export type PropsCena = {
  /** Progresso dentro da cena (0 a 1). */
  p: number;
  /** Segundos desde o começo da cena. */
  seg: number;
  /** Duração da cena em segundos. */
  dur: number;
  /** Tempo do vídeo em segundos (para ondas, passos, giros). */
  tempo: number;
  /** Quanto a cena está na tela (0 a 1), para entrar e sair na passagem. */
  peso: number;
  /** Segundo (desde o começo da cena) em que a palavra é dita no trecho. `vez` = 1ª, 2ª ocorrência… */
  aos: (palavra: string, vez?: number) => number;
};

export type Projetar = (v: Vec3) => { x: number; y: number; visivel: boolean };

/**
 * Uma cena 3D provisória. Para trocar o visual de um trecho, troque o arquivo da cena
 * (ou aponte o trecho para outra cena em videos/<tema>.json).
 */
export type Cena = {
  /** Câmera no começo e ao longo da cena. A passagem entre cenas é feita pelo mundo. */
  camera: (props: PropsCena) => Pose;
  ambiente: (props: PropsCena) => Ambiente;
  /** Pose do boneco "você", ou null quando ele não aparece. */
  boneco?: (props: PropsCena) => PoseBoneco | null;
  /** Rótulo pequeno do canto de cima ("1ª NOITE"). */
  contexto?: (props: PropsCena) => string;
  /** Objetos 3D só desta cena (dentro do canvas). */
  Objetos?: React.FC<PropsCena>;
  /** Rótulos 2D presos aos objetos (pílulas, setas, textos, cartões). */
  Rotulos?: React.FC<PropsCena & { projetar: Projetar }>;
};
