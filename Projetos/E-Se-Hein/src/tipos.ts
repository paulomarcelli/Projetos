// Contrato de um vídeo: o que fica em videos/<tema>.json.

export type Palavra = {
  /** Grafia exata do roteiro (com pontuação). */
  texto: string;
  /** Tempo dentro do áudio, em milissegundos. */
  inicioMs: number;
  fimMs: number;
  /** true se o tempo veio direto da transcrição; false se foi interpolado. */
  casou: boolean;
  paragrafo: number;
};

export type Trecho = {
  texto: string;
  /** Segundos dentro do áudio (sem contar a abertura). */
  inicio: number;
  fim: number;
  /** Nome da cena em src/cenas/index.ts. */
  cena: string;
  /** Palavra da legenda em destaque amarelo neste trecho (no máximo uma). */
  destaque?: string;
};

export type DadosVideo = {
  titulo: string;
  /** Caminho dentro de public/, por exemplo "audio/lua.wav". */
  audio: string;
  duracaoAudio: number;
  roteiro: string;
  /** Pergunta curta que fica na tela no fechamento (ex.: "Lua cheia ou marés?"). */
  pergunta: string;
  trechos: Trecho[];
  palavras: Palavra[];
};
