import { RotateCw, TriangleAlert } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Botao } from "./Botao";
import { cx } from "./classes";

/* ── EstadoVazio ──────────────────────────────────────────────────── */

export interface EstadoVazioProps {
  /** Ícone (ex.: <Inbox />), 24px. */
  icone?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  /** Ação opcional (ex.: <BotaoLink to={rotas.novaAnalise}>Nova análise</BotaoLink>). */
  acao?: ReactNode;
  /** "medio" para áreas de página, "compacto" dentro de cartões. */
  tamanho?: "compacto" | "medio";
  className?: string;
}

export function EstadoVazio({ icone, titulo, texto, acao, tamanho = "medio", className }: EstadoVazioProps) {
  return (
    <div className={cx("fr-vazio", `fr-vazio--${tamanho}`, className)}>
      {icone && (
        <span className="fr-vazio-icone" aria-hidden="true">
          {icone}
        </span>
      )}
      <p className="fr-vazio-titulo">{titulo}</p>
      {texto && <p className="fr-vazio-texto">{texto}</p>}
      {acao && <div className="fr-vazio-acao">{acao}</div>}
    </div>
  );
}

/* ── Esqueleto ────────────────────────────────────────────────────── */

export interface EsqueletoProps {
  /** "linha" (texto), "bloco" (cartão/imagem) ou "circulo" (avatar). */
  forma?: "linha" | "bloco" | "circulo";
  largura?: CSSProperties["width"];
  altura?: CSSProperties["height"];
  /** Para forma "linha": quantas linhas (a última fica mais curta). */
  linhas?: number;
  className?: string;
}

/** Marcador de conteúdo carregando. Decorativo (aria-hidden): anuncie o carregamento com <Carregando>. */
export function Esqueleto({ forma = "linha", largura, altura, linhas = 1, className }: EsqueletoProps) {
  if (forma === "linha" && linhas > 1) {
    return (
      <span className={cx("fr-esqueleto-grupo", className)} aria-hidden="true">
        {Array.from({ length: linhas }, (_, i) => (
          <span key={i} className="fr-esqueleto fr-esqueleto--linha" style={{ width: i === linhas - 1 ? "62%" : largura ?? "100%", height: altura }} />
        ))}
      </span>
    );
  }
  return <span className={cx("fr-esqueleto", `fr-esqueleto--${forma}`, className)} style={{ width: largura, height: altura }} aria-hidden="true" />;
}

/* ── Carregando ───────────────────────────────────────────────────── */

export interface CarregandoProps {
  /** Texto visível e anunciado (aria-live). Padrão "Carregando…". */
  rotulo?: ReactNode;
  /** Esconde o texto visualmente (continua anunciado). */
  rotuloOculto?: boolean;
  tamanho?: "pequeno" | "medio" | "grande";
  className?: string;
}

/** Indicador de carregamento com role="status" (anunciado com educação pelos leitores de tela). */
export function Carregando({ rotulo = "Carregando…", rotuloOculto = false, tamanho = "medio", className }: CarregandoProps) {
  return (
    <div role="status" aria-live="polite" className={cx("fr-carregando", `fr-carregando--${tamanho}`, className)}>
      <span className="fr-carregando-anel" aria-hidden="true" />
      <span className={cx("fr-carregando-rotulo", rotuloOculto && "sr-only")}>{rotulo}</span>
    </div>
  );
}

/* ── AvisoDeErro ──────────────────────────────────────────────────── */

export interface AvisoDeErroProps {
  titulo?: ReactNode;
  texto?: ReactNode;
  /** Se presente, mostra o botão de tentar de novo. */
  aoTentarNovamente?: () => void;
  rotuloDaAcao?: string;
  /** true enquanto a nova tentativa roda. */
  tentando?: boolean;
  /** Ações extras ao lado (ex.: voltar ao início). */
  acoes?: ReactNode;
  className?: string;
}

/** Aviso de erro com role="alert". Escolha o texto pelo tipo do ErroDaApi (indisponivel, nao_encontrado…). */
export function AvisoDeErro({
  titulo = "Algo deu errado",
  texto,
  aoTentarNovamente,
  rotuloDaAcao = "Tentar de novo",
  tentando = false,
  acoes,
  className,
}: AvisoDeErroProps) {
  return (
    <div role="alert" className={cx("fr-erro", className)}>
      <span className="fr-erro-icone" aria-hidden="true">
        <TriangleAlert size={20} strokeWidth={1.75} />
      </span>
      <div className="fr-erro-corpo">
        <p className="fr-erro-titulo">{titulo}</p>
        {texto && <p className="fr-erro-texto">{texto}</p>}
        {(aoTentarNovamente || acoes) && (
          <div className="fr-erro-acoes">
            {aoTentarNovamente && (
              <Botao tamanho="pequeno" variante="secundario" icone={<RotateCw size={16} />} carregando={tentando} onClick={aoTentarNovamente}>
                {rotuloDaAcao}
              </Botao>
            )}
            {acoes}
          </div>
        )}
      </div>
    </div>
  );
}
