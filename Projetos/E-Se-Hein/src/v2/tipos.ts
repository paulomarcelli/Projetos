// Contrato de um vídeo no estilo realista (v2): o que fica por cima dos planos do Blender.

export type EstadoCanto = {
  /** Segundo do vídeo em que o estado entra. */
  inicio: number;
  rotulo: string;
  /** Número (ou palavra curta, até 9 letras) do contador. */
  numero?: string;
  unidade?: string;
  /** Lugar, em outra linha, abaixo de um fio (para não ler como se o número fosse do lugar). */
  lugar?: string;
  /** Contagem animada (36 quadros) do valor anterior até o novo; rótulo e lugar ficam parados. */
  contagem?: { de: number; para: number };
};

export type Fato = { inicio: number; fim: number; rotulo: string; texto: string };

export type ConfigV2 = {
  spec: { fechamento?: number; planos: { id: string; cena: string; modo: string; trechos: number[]; fim_do_video?: boolean }[] };
  /** Pasta em public/ com <plano>.mp4 (vídeo final) e quadros/<plano>/<quadro>.jpg (conferência). */
  pastaBlender: string;
  titulo: { texto: string; inicio: number; fim: number };
  canto: EstadoCanto[];
  fatos: Fato[];
  comCeu: string[];
};
