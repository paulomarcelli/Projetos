import { Easing, interpolate, spring } from "remotion";
import { LOCKUP_PONTO, LOCKUP_PONTO_CENTRO, LOCKUP_SEM_PONTO, LOCKUP_VIEWBOX, SIMBOLO, SIMBOLO_VIEWBOX } from "../camadas/marca";
import { estadoNoTempo, FPS, formatarContagem, type Frase, valorDaContagem } from "../lib/v2";
import { marca } from "../mundo/paleta";
import { SEM_SERIFA, SERIFA } from "./fontes";
import type { EstadoCanto, Fato as FatoT } from "./tipos";

// Camadas 2D do Design System v2 ("Realismo documental"), por cima do vídeo do Blender.

const CLARO = "#F7F5F0"; // v2/texto/claro
const SOMBRA_LEITURA = "0 2px 6px rgba(0,0,0,.5), 0 0 28px rgba(0,0,0,.35)";
const entrada = Easing.bezier(0.22, 1, 0.36, 1); // texto entra: 12 quadros, sobe 12 px
const saida = Easing.bezier(0.4, 0, 1, 1); // texto sai: 10 quadros, só opacidade
const contagem = Easing.bezier(0.65, 0, 0.35, 1); // número conta: 36 quadros
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 a 1: entra em `ini` (12 quadros) e sai antes de `fim` (10 quadros). */
export function presenca(t: number, ini: number, fim = Infinity) {
  const e = interpolate((t - ini) * FPS, [0, 12], [0, 1], { ...clamp, easing: entrada });
  const s = fim === Infinity ? 1 : interpolate((fim - t) * FPS, [0, 10], [0, 1], { ...clamp, easing: saida });
  return Math.min(e, s);
}

/** Véu de leitura: preto 0% em 48% da altura, 28% em 68% e 60% na base. */
export const Veu: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 48%, rgba(0,0,0,.28) 68%, rgba(0,0,0,.6) 100%)" }} />
);

/** Filtro degradê do céu: escurece o topo (v2/grade/ceu-nd) e vai a zero na metade do quadro. */
export const CeuND: React.FC<{ forca: number }> = ({ forca }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,${forca}) 0%, rgba(0,0,0,${forca * 0.45}) 25%, rgba(0,0,0,0) 50%)` }} />
);

const estiloTexto: React.CSSProperties = { color: CLARO, textShadow: SOMBRA_LEITURA };

const BlocoCanto: React.FC<{ e: EstadoCanto; numero: string; unidade?: string; opacidade: number; sobe: number }> = ({ e, numero, unidade, opacidade, sobe }) => (
  <div style={{ position: "absolute", left: 72, top: 236, opacity: opacidade, translate: `0 ${sobe}px`, ...estiloTexto }}>
    <div style={{ fontFamily: SEM_SERIFA, fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: "0.14em", textTransform: "uppercase" }}>{e.rotulo}</div>
    <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: SEM_SERIFA, fontWeight: 400, fontSize: 132, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{numero}</span>
      {unidade ? <span style={{ fontFamily: SEM_SERIFA, fontWeight: 400, fontSize: 48, lineHeight: 1 }}>{unidade}</span> : null}
    </div>
    {e.lugar ? (
      <>
        <div style={{ marginTop: 14, width: 56, height: 2, background: CLARO, boxShadow: "0 1px 4px rgba(0,0,0,.5)" }} />
        <div style={{ marginTop: 10, fontFamily: SEM_SERIFA, fontWeight: 500, fontSize: 26, lineHeight: 1.2, letterSpacing: "0.12em", textTransform: "uppercase" }}>{e.lugar}</div>
      </>
    ) : null}
  </div>
);

const mesmoTexto = (a?: EstadoCanto, b?: EstadoCanto) => !!a && !!b && a.rotulo === b.rotulo && a.lugar === b.lugar;

const numeroDe = (e: EstadoCanto) => (e.contagem ? formatarContagem(e.contagem.para) : { numero: e.numero ?? "", unidade: e.unidade ?? "" });

/** v2 / Dado no canto: rótulo, número grande (com unidade) e o lugar em outra linha. Troca em fusão; conta em 36 quadros. */
export const DadoNoCanto: React.FC<{ estados: EstadoCanto[]; t: number; visivel: number }> = ({ estados, t, visivel }) => {
  const { atual, anterior } = estadoNoTempo(estados, t);
  const dq = (t - atual.inicio) * FPS;
  if (atual.contagem) {
    const p = interpolate(dq, [0, 36], [0, 1], { ...clamp, easing: contagem });
    const { numero, unidade } = formatarContagem(valorDaContagem(atual.contagem.de, atual.contagem.para, p));
    return <BlocoCanto e={atual} numero={numero} unidade={unidade} opacidade={visivel} sobe={0} />;
  }
  const novo = numeroDe(atual);
  const entra = interpolate(dq, [0, 12], [0, 1], { ...clamp, easing: entrada });
  if (anterior && !mesmoTexto(anterior, atual) && dq < 12) {
    const velho = numeroDe(anterior);
    const sai = interpolate(dq, [0, 8], [1, 0], { ...clamp, easing: saida });
    return (
      <>
        <BlocoCanto e={anterior} numero={velho.numero} unidade={velho.unidade} opacidade={sai * visivel} sobe={0} />
        <BlocoCanto e={atual} numero={novo.numero} unidade={novo.unidade} opacidade={entra * visivel} sobe={(1 - entra) * 12} />
      </>
    );
  }
  const primeira = !anterior ? entra : 1;
  return <BlocoCanto e={atual} numero={novo.numero} unidade={novo.unidade} opacidade={primeira * visivel} sobe={(1 - primeira) * 12} />;
};

/** v2 / Fato: fio vertical de 4 px, rótulo em caixa alta e a frase. Base em y 1180. */
export const Fato: React.FC<{ fatos: FatoT[]; t: number }> = ({ fatos, t }) => (
  <>
    {fatos.map((f) => {
      const o = presenca(t, f.inicio, f.fim);
      if (o <= 0) return null;
      return (
        <div key={f.inicio} style={{ position: "absolute", left: 72, bottom: 1920 - 1180, maxWidth: 760, opacity: o, translate: `0 ${(1 - o) * 12}px`, display: "flex", gap: 18, ...estiloTexto }}>
          <div style={{ width: 4, background: CLARO, boxShadow: "0 1px 4px rgba(0,0,0,.5)" }} />
          <div>
            <div style={{ fontFamily: SEM_SERIFA, fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: "0.14em", textTransform: "uppercase" }}>{f.rotulo}</div>
            <div style={{ marginTop: 6, fontFamily: SEM_SERIFA, fontWeight: 500, fontSize: 44, lineHeight: 1.15 }}>{f.texto}</div>
          </div>
        </div>
      );
    })}
  </>
);

/** v2 / Título: Newsreader 80, x 72, topo em y 540, só no primeiro plano. */
export const Titulo: React.FC<{ texto: string; t: number; ini: number; fim: number }> = ({ texto, t, ini, fim }) => {
  const o = presenca(t, ini, fim);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 72, top: 540, width: 816, opacity: o, translate: `0 ${(1 - Math.min(1, (t - ini) * FPS / 12)) * 12}px`, fontFamily: SERIFA, fontWeight: 500, fontSize: 80, lineHeight: 1.04, letterSpacing: "-0.01em", textWrap: "balance", ...estiloTexto }}>
      {texto}
    </div>
  );
};

/** v2 / Legenda: frase inteira em itálico, centro em x 540, base em y 1380, troca com 6 quadros de fusão. */
export const LegendaV2: React.FC<{ frases: Frase[]; t: number }> = ({ frases, t }) => (
  <>
    {frases.map((f, i) => {
      const ent = interpolate((t - f.inicio) * FPS, [-3, 3], [0, 1], clamp);
      const sai = interpolate((f.fim - t) * FPS, [-3, 3], [0, 1], clamp);
      const o = Math.min(ent, sai);
      if (o <= 0) return null;
      return (
        <div key={i} style={{ position: "absolute", left: 180, width: 720, bottom: 1920 - 1380, textAlign: "center", opacity: o, fontFamily: SERIFA, fontStyle: "italic", fontWeight: 500, fontSize: 50, lineHeight: 1.2, textWrap: "balance", ...estiloTexto }}>
          {f.texto}
        </div>
      );
    })}
  </>
);

/** v2 / Fechamento: o do v1 (laranja, assinatura, chamada, pílula) com a pergunta em Newsreader e a chamada em IBM Plex. */
export const FechamentoV2: React.FC<{ pergunta: string; origem: { x: number; y: number }; f: number }> = ({ pergunta, origem, f }) => {
  const ent = (ini: number, dur = 12) => interpolate(f, [ini, ini + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const raioMax = Math.hypot(Math.max(origem.x, 1080 - origem.x), Math.max(origem.y, 1920 - origem.y));
  const raio = interpolate(f, [0, 12], [6, raioMax + 20], { ...clamp, easing: contagem });
  const assinatura = spring({ frame: f - 8, fps: FPS, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const quique = f >= 70 && f < 86 ? -Math.sin(((f - 70) / 16) * Math.PI) * 26 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: origem.x - raio, top: origem.y - raio, width: raio * 2, height: raio * 2, borderRadius: "50%", background: marca.laranja }} />
      <div style={{ position: "absolute", left: 100, width: 800, top: 210, height: 1210, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", color: marca.tinta }}>
        <svg viewBox={LOCKUP_VIEWBOX} width={560} style={{ marginLeft: -12, scale: String(assinatura), transformOrigin: "left center", overflow: "visible" }}>
          <path d={LOCKUP_SEM_PONTO} fill={marca.tinta} />
          <path d={LOCKUP_PONTO} fill={marca.tinta} style={{ translate: `0 ${quique}px`, transformOrigin: `${LOCKUP_PONTO_CENTRO.x}px ${LOCKUP_PONTO_CENTRO.y}px` }} />
        </svg>
        <div style={{ marginTop: 48, fontFamily: SERIFA, fontWeight: 500, fontSize: 104, lineHeight: 1, letterSpacing: "-0.015em", textWrap: "balance", opacity: ent(14), translate: `0 ${(1 - ent(14)) * 40}px` }}>
          {pergunta}
        </div>
        <div style={{ marginTop: 40, fontFamily: SEM_SERIFA, fontWeight: 600, fontSize: 34, lineHeight: 1.2, letterSpacing: "0.06em", textTransform: "uppercase", opacity: ent(30, 8) }}>
          Responde aqui nos comentários
        </div>
        <div
          style={{
            marginTop: 64,
            display: "flex",
            alignItems: "center",
            gap: 18,
            background: marca.tinta,
            color: marca.branco,
            borderRadius: 999,
            padding: "24px 40px",
            fontFamily: SEM_SERIFA,
            fontWeight: 600,
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            scale: String(spring({ frame: f - 40, fps: FPS, config: { damping: 12, mass: 0.6, stiffness: 180 } })),
            transformOrigin: "left center",
          }}
        >
          <span>Segue para mais “E se”</span>
          <svg viewBox={SIMBOLO_VIEWBOX} width={48} height={48}>
            <path d={SIMBOLO} fill={marca.laranja} />
          </svg>
        </div>
      </div>
    </div>
  );
};
