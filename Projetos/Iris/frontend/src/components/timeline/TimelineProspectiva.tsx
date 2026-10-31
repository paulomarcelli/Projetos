/**
 * Timeline prospectiva: a evolução do fenômeno no tempo, como visualização (e não como lista).
 *
 * Leitura do desenho, da esquerda para a direita:
 *   - passado: uma única linha contínua (o que já aconteceu é comum a todos os futuros);
 *   - "Hoje": o divisor no primeiro ano projetado da investigação (`r.horizonte.inicio`);
 *   - futuro: a linha se abre em três faixas tracejadas em âmbar, uma por cenário (A, B, C);
 *   - calendário comum: eventos agendados que valem para todos os futuros (eleições, posses) ficam
 *     numa faixa própria acima, para não parecerem consequência de um cenário.
 * Forma = tipo do evento: círculo cheio (observado), círculo tracejado (inferido), losango
 * (condicional), círculo vazado âmbar (projetado). Anel âmbar = ponto de inflexão.
 *
 * Datas: o eixo é o horizonte da investigação (do primeiro antecedente ao fim do horizonte).
 * Dentro de um ano, os eventos se distribuem pela ORDEM (mês, quando o rótulo traz um), não por
 * uma data inventada: "2027" sem mês não ganha posição falsa dentro do ano.
 *
 * Interação: passar o cursor ou focar um evento mostra a legenda abaixo; clicar abre o evento no
 * painel contextual (atores, relações, evidências). Clicar numa faixa escolhe o cenário (o
 * mesmo estado do mapa e da análise). "Percorrer o tempo" move uma linha do tempo pelo eixo e
 * acende os eventos à medida que ela passa.
 *
 * Movimento (Motion): na entrada, o passado se desenha, as faixas se abrem a partir do "Hoje" e os
 * eventos surgem na ordem do tempo; ao trocar de cenário, só opacidade e espessura mudam (240 ms).
 * Com "reduzir movimento", tudo nasce pronto e o percurso avança evento a evento, sem deslizar.
 * Alternativa acessível: "Ver como lista" mostra a mesma linha do tempo em texto.
 */
import { List, Pause, Play } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CURVA_MOVIMENTO, Movimento } from "../common/movimento";
import type { CenarioId } from "../../types/cenario";
import type { EventoTempo } from "../../types/evento";
import { useResultado } from "../analysis/investigacao/contexto";
import { LinhaDoTempo } from "./LinhaDoTempo";
import { CATEGORIA, Letra } from "../analysis/investigacao/pecas";

// ------------------------------------------------------------------ geometria

const L = 1000;
const ALT = 380;
const MARGEM = { esq: 24, dir: 76 };
const Y = { comum: 74, faixas: { A: 152, B: 228, C: 304 } as Record<CenarioId, number>, passado: 228, eixo: 356 };

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** Mês (0–11) quando o rótulo o traz ("jul. 2025", "1º maio 2026", "1º sem. 2027"); senão, meio do ano. */
export function mesDoRotulo(rotulo: string) {
  const t = rotulo.toLowerCase();
  if (t.includes("1º sem")) return 2.5;
  if (t.includes("2º sem")) return 8.5;
  const i = MESES.findIndex((m) => new RegExp(`\\b${m}`).test(t));
  return i >= 0 ? i : 6;
}

type Trilha = "passado" | "comum" | CenarioId;
interface Ponto {
  ev: EventoTempo;
  trilha: Trilha;
  x: number;
  y: number;
}

function useGeometria() {
  const { r } = useResultado();
  return useMemo(() => {
    const inicio = r.horizonte.inicio;
    const primeiroAno = Math.min(...r.linhaDoTempo.map((e) => e.ano), inicio - 1);
    const ultimoAno = r.horizonte.fim;
    const anos = Array.from({ length: ultimoAno - primeiroAno + 1 }, (_, i) => primeiroAno + i);
    const larguraAno = (L - MARGEM.esq - MARGEM.dir) / anos.length;
    const x = (ano: number, fracao = 0) => MARGEM.esq + (ano - primeiroAno + fracao) * larguraAno;
    const xHoje = x(inicio);

    // Cada evento vai para uma trilha; dentro de (trilha, ano), os eventos se espalham pela ordem.
    const trilhaDe = (e: EventoTempo): Trilha[] => (e.ano < inicio ? ["passado"] : e.cenarios?.length ? e.cenarios : ["comum"]);
    const grupos = new Map<string, EventoTempo[]>();
    for (const e of r.linhaDoTempo)
      for (const t of trilhaDe(e)) {
        const k = `${t}|${e.ano}`;
        grupos.set(k, [...(grupos.get(k) ?? []), e]);
      }
    const pontos: Ponto[] = [];
    for (const [k, lista] of grupos) {
      const [trilha, ano] = [k.split("|")[0] as Trilha, Number(k.split("|")[1])];
      const ordenados = [...lista].sort((a, b) => mesDoRotulo(a.data) - mesDoRotulo(b.data));
      ordenados.forEach((ev, i) => {
        const y = trilha === "passado" ? Y.passado : trilha === "comum" ? Y.comum : Y.faixas[trilha];
        pontos.push({ ev, trilha, x: x(ano, (i + 1) / (ordenados.length + 1)), y });
      });
    }
    pontos.sort((a, b) => a.x - b.x);
    return { anos, x, xHoje, xFim: L - MARGEM.dir, pontos, primeiroAno };
  }, [r]);
}

// ------------------------------------------------------------------ marcas

function Marca({ p, aceso, foco }: { p: Ponto; aceso: boolean; foco: boolean }) {
  const c = p.ev.categoria;
  const r = foco ? 7 : 5.5;
  const comum = { style: { transition: "opacity 240ms var(--ease-saida)" }, opacity: aceso ? 1 : 0.28 } as const;
  return (
    <g {...comum}>
      {p.ev.inflexao && <circle cx={p.x} cy={p.y} r={r + 5} fill="none" stroke="var(--color-ambar)" strokeWidth="1.2" />}
      {c === "observado" && <circle cx={p.x} cy={p.y} r={r} fill="var(--color-texto)" />}
      {c === "inferido" && <circle cx={p.x} cy={p.y} r={r} fill="var(--color-abismo)" stroke="var(--color-texto-2)" strokeWidth="1.5" strokeDasharray="2.4 2" />}
      {c === "condicional" && (
        <path d={`M${p.x} ${p.y - r - 1.5}l${r + 1.5} ${r + 1.5}-${r + 1.5} ${r + 1.5}-${r + 1.5}-${r + 1.5}z`} fill="var(--color-abismo)" stroke="var(--color-ambar)" strokeWidth="1.6" />
      )}
      {c === "projetado" && <circle cx={p.x} cy={p.y} r={r} fill="var(--color-abismo)" stroke="var(--color-ambar)" strokeWidth="1.6" />}
    </g>
  );
}

// ------------------------------------------------------------------ componente

export function TimelineProspectiva() {
  const { r, vista, setVista, selecionar } = useResultado();
  const g = useGeometria();
  const reduzir = useReducedMotion();
  const [comoLista, setComoLista] = useState(false);
  const [foco, setFoco] = useState<Ponto | null>(null);
  // Percurso: posição da linha do tempo de 0 (início do eixo) a 1 (fim); null = parado.
  const [percurso, setPercurso] = useState<number | null>(null);
  const quadro = useRef<number | undefined>(undefined);
  const ativo: CenarioId | null = vista === "presente" ? null : vista;
  const inicial = <T,>(v: T) => (reduzir ? false : v);

  const parar = useCallback(() => {
    if (quadro.current) {
      cancelAnimationFrame(quadro.current);
      window.clearTimeout(quadro.current);
    }
    quadro.current = undefined;
    setPercurso(null);
  }, []);
  useEffect(() => parar, [parar]);

  const visiveis = useMemo(() => g.pontos.filter((p) => p.trilha === "passado" || p.trilha === "comum" || !ativo || p.trilha === ativo), [g.pontos, ativo]);

  const percorrer = () => {
    if (percurso !== null) return parar();
    const x0 = g.x(g.primeiroAno);
    if (reduzir) {
      // Sem deslizar: avança de evento em evento (mudança discreta, não movimento).
      let i = 0;
      const passo = () => {
        if (i >= visiveis.length) return parar();
        const p = visiveis[i++];
        setFoco(p);
        setPercurso((p.x - x0) / (g.xFim - x0));
        quadro.current = window.setTimeout(passo, 1400);
      };
      passo();
      return;
    }
    const duracao = 1600 * g.anos.length; // ~1,6 s por ano: tempo de ler a legenda de cada evento
    const t0 = performance.now();
    const quadroDe = (agora: number) => {
      const t = Math.min(1, (agora - t0) / duracao);
      setPercurso(t);
      const xAtual = x0 + t * (g.xFim - x0);
      const ultimo = [...visiveis].reverse().find((p) => p.x <= xAtual);
      if (ultimo) setFoco(ultimo);
      if (t < 1) quadro.current = requestAnimationFrame(quadroDe);
      else quadro.current = undefined;
    };
    quadro.current = requestAnimationFrame(quadroDe);
  };

  const xPercurso = percurso === null ? null : g.x(g.primeiroAno) + percurso * (g.xFim - g.x(g.primeiroAno));
  const aceso = (p: Ponto) => {
    if (xPercurso !== null && p.x > xPercurso + 0.5) return false;
    return p.trilha === "passado" || p.trilha === "comum" || !ativo || p.trilha === ativo;
  };

  const legenda = foco ?? null;
  const cenarioDaLegenda = legenda && legenda.trilha !== "passado" && legenda.trilha !== "comum" ? r.cenarios.find((c) => c.id === legenda.trilha) : null;

  return (
    <Movimento>
      <section aria-labelledby="t-timeline" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="t-timeline" className="font-editorial text-secao text-texto">
            {r.horizonte.inicio}–{r.horizonte.fim}: três trajetórias possíveis
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {!comoLista && (
              <button type="button" className="botao botao-secundario botao-pequeno" onClick={percorrer} aria-pressed={percurso !== null}>
                {percurso !== null ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                {percurso !== null ? "Parar" : "Percorrer o tempo"}
              </button>
            )}
            <button type="button" className="ficha min-h-8" aria-pressed={comoLista} onClick={() => (parar(), setComoLista((x) => !x))}>
              <List size={14} aria-hidden="true" />
              Ver como lista
            </button>
          </div>
        </div>

        {comoLista ? (
          <LinhaDoTempo />
        ) : (
          <>
            {/* Rola na horizontal em telas estreitas: o eixo do tempo não é comprimido a ponto de
                sobrepor os eventos. */}
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <svg viewBox={`0 0 ${L} ${ALT}`} className="block h-auto w-full min-w-[760px]" role="group" aria-label={`Timeline de ${g.anos[0]} a ${r.horizonte.fim}. Use Tab para percorrer os eventos.`}>
                {/* Anos (eixo) e períodos do horizonte */}
                <g aria-hidden="true">
                  {g.anos.map((a) => (
                    <g key={a}>
                      <line x1={g.x(a)} y1={44} x2={g.x(a)} y2={Y.eixo - 14} stroke="var(--color-linha)" />
                      <text x={g.x(a, 0.5)} y={Y.eixo + 4} textAnchor="middle" fill="var(--color-texto-3)" style={{ font: "500 12px var(--font-dados)" }}>
                        {a}
                      </text>
                    </g>
                  ))}
                  {r.horizontes
                    .filter((h) => h.inicio >= r.horizonte.inicio)
                    .map((h) => (
                      <text key={h.id} x={(g.x(h.inicio) + g.x(h.fim + 1)) / 2} y={28} textAnchor="middle" fill="var(--color-texto-2)" style={{ font: "500 12px var(--font-interface)" }}>
                        {h.nome}
                      </text>
                    ))}
                  <text x={(g.x(g.primeiroAno) + g.xHoje) / 2} y={28} textAnchor="middle" fill="var(--color-texto-2)" style={{ font: "500 12px var(--font-interface)" }}>
                    Antecedentes
                  </text>
                </g>

                {/* Hoje: daqui em diante, tudo é hipótese condicional. */}
                <g aria-hidden="true">
                  <line x1={g.xHoje} y1={40} x2={g.xHoje} y2={Y.eixo - 14} stroke="var(--color-ambar)" strokeDasharray="2 4" />
                  <text x={g.xHoje + 6} y={Y.comum - 22} fill="var(--color-ambar)" style={{ font: "600 12px var(--font-interface)", letterSpacing: "0.06em" }}>
                    HOJE
                  </text>
                  <text x={g.xHoje + 6} y={Y.comum + 26} fill="var(--color-texto-3)" style={{ font: "500 11.5px var(--font-interface)" }}>
                    calendário comum
                  </text>
                </g>

                {/* Passado: uma linha contínua, desenhada da esquerda para a direita. */}
                <m.path
                  d={`M${g.x(g.primeiroAno)} ${Y.passado}H${g.xHoje}`}
                  stroke="var(--color-texto-2)"
                  strokeWidth="1.6"
                  fill="none"
                  initial={inicial({ pathLength: 0 })}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: CURVA_MOVIMENTO }}
                />
                {/* Calendário comum */}
                <m.path
                  d={`M${g.xHoje} ${Y.comum}H${g.xFim}`}
                  stroke="var(--color-linha-forte)"
                  strokeWidth="1.2"
                  strokeDasharray="1 5"
                  strokeLinecap="round"
                  fill="none"
                  initial={inicial({ opacity: 0 })}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                />

                {/* Faixas dos cenários: abrem-se do "Hoje" e seguem até o horizonte.
                    Reveladas por uma máscara que cresce para a direita (e não por pathLength): o
                    pathLength do Motion usa o stroke-dasharray e apagaria o tracejado, e o futuro
                    precisa continuar tracejado para nunca parecer fato. */}
                <defs>
                  <clipPath id="revelar-futuro">
                    <m.rect
                      x={g.xHoje - 2}
                      y={0}
                      height={ALT}
                      initial={inicial({ width: 0 })}
                      animate={{ width: L - g.xHoje + 2 }}
                      transition={{ duration: 1.3, delay: 0.75, ease: CURVA_MOVIMENTO }}
                    />
                  </clipPath>
                </defs>
                {r.cenarios.map((c) => {
                  const y = Y.faixas[c.id];
                  const destacada = !ativo || ativo === c.id;
                  return (
                    <g key={c.id}>
                      <path
                        d={`M${g.xHoje} ${Y.passado}C${g.xHoje + 40} ${Y.passado} ${g.xHoje + 30} ${y} ${g.xHoje + 70} ${y}H${g.xFim}`}
                        fill="none"
                        stroke="var(--color-ambar)"
                        strokeDasharray="5 6"
                        strokeLinecap="round"
                        clipPath="url(#revelar-futuro)"
                        style={{ transition: "opacity 240ms var(--ease-saida), stroke-width 240ms var(--ease-saida)" }}
                        strokeWidth={ativo === c.id ? 2.4 : 1.5}
                        opacity={destacada ? 0.9 : 0.25}
                      />
                      {/* Alvo de clique largo e invisível sobre a faixa: escolher o cenário. */}
                      <path
                        d={`M${g.xHoje + 70} ${y}H${g.xFim}`}
                        stroke="transparent"
                        strokeWidth="22"
                        className="cursor-pointer"
                        onClick={() => setVista(c.id)}
                      />
                      <foreignObject x={g.xFim + 8} y={y - 14} width={MARGEM.dir - 10} height={28}>
                        <button
                          type="button"
                          onClick={() => setVista(c.id)}
                          aria-pressed={ativo === c.id}
                          aria-label={`Cenário ${c.id}: ${c.nome}`}
                          title={c.nome}
                          className="flex h-7 items-center rounded-fino"
                        >
                          <Letra id={c.id} ativa={ativo === c.id} />
                        </button>
                      </foreignObject>
                    </g>
                  );
                })}

                {/* Eventos: surgem na ordem do tempo; cada um é focável e abre no painel. */}
                {g.pontos.map((p, i) => {
                  const emFoco = foco?.ev.id === p.ev.id && foco.trilha === p.trilha;
                  return (
                    <m.g
                      key={`${p.trilha}-${p.ev.id}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${p.ev.data}, ${CATEGORIA[p.ev.categoria].rotulo}${p.trilha.length === 1 ? `, cenário ${p.trilha}` : ""}: ${p.ev.texto}`}
                      className="cursor-pointer outline-none"
                      initial={inicial({ opacity: 0 })}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 + (p.x / L) * 1.4 + (i % 3) * 0.02 }}
                      onMouseEnter={() => percurso === null && setFoco(p)}
                      onFocus={() => setFoco(p)}
                      onClick={() => selecionar({ tipo: "evento", id: p.ev.id })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selecionar({ tipo: "evento", id: p.ev.id });
                        }
                      }}
                    >
                      {/* Área de toque maior que a marca. */}
                      <circle cx={p.x} cy={p.y} r={13} fill="transparent" />
                      {emFoco && <circle cx={p.x} cy={p.y} r={12} fill="none" stroke="var(--color-ciano)" strokeWidth="1.6" />}
                      <Marca p={p} aceso={aceso(p)} foco={emFoco} />
                    </m.g>
                  );
                })}

                {/* Linha do percurso */}
                {xPercurso !== null && <line x1={xPercurso} y1={40} x2={xPercurso} y2={Y.eixo - 14} stroke="var(--color-ciano)" strokeWidth="1.5" aria-hidden="true" />}
              </svg>
            </div>

            {/* Legenda do evento em foco: altura fixa, para nada pular quando o texto muda. */}
            <div className="min-h-[3.75rem] rounded-padrao bg-grafite/40 px-4 py-3" aria-live="polite">
              {legenda ? (
                <p className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-x-2 text-micro text-texto-3">
                    <span className="font-dados text-texto-2">{legenda.ev.data}</span>
                    <span>· {CATEGORIA[legenda.ev.categoria].rotulo}</span>
                    {cenarioDaLegenda && (
                      <span className="inline-flex items-center gap-1">
                        · cenário <Letra id={cenarioDaLegenda.id} />
                      </span>
                    )}
                    {legenda.trilha === "comum" && <span>· vale para todos os cenários</span>}
                    {legenda.ev.inflexao && <span className="text-ambar">· ponto de inflexão</span>}
                  </span>
                  <span className={`text-corpo ${legenda.trilha === "passado" ? "text-texto" : "text-texto-2 italic"}`}>{legenda.ev.texto}</span>
                </p>
              ) : (
                <p className="text-legenda text-texto-3">Passe o cursor ou toque num evento para lê-lo; clique para ver atores e evidências. Clique numa faixa para escolher o cenário.</p>
              )}
            </div>

            <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-micro text-texto-2" aria-label="Legenda das formas">
              <li className="flex items-center gap-1.5">
                <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="var(--color-texto)" /></svg> Observado
              </li>
              <li className="flex items-center gap-1.5">
                <svg width="12" height="12" aria-hidden="true"><path d="M6 1l5 5-5 5-5-5z" fill="none" stroke="var(--color-ambar)" strokeWidth="1.4" /></svg> Condicional
              </li>
              <li className="flex items-center gap-1.5">
                <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--color-ambar)" strokeWidth="1.4" /></svg> Projetado no cenário
              </li>
              <li className="flex items-center gap-1.5">
                <svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="var(--color-ambar)" strokeWidth="1.2" /><circle cx="7" cy="7" r="3" fill="var(--color-texto)" /></svg> Ponto de inflexão
              </li>
            </ul>
          </>
        )}
      </section>
    </Movimento>
  );
}
