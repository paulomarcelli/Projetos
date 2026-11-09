import { ChevronRight, Library } from "lucide-react";
import { Link } from "react-router";
import { resumoDaBase } from "../../../services/api";
import { type DocumentoResumo } from "../../../types/api";
import { idioma, numero } from "../../../utils/formatadores";
import { quando } from "../../../utils/data";
import { ROTAS } from "../../../config/rotas";
import { useDados } from "../../../hooks/useDados";
import { Epistemico } from "../../common/Epistemico";
import { ErroDeCarregamento } from "../../common/ErroDeCarregamento";
import { Esqueleto } from "../../common/Carregando";
import { EstadoVazio } from "../../common/EstadoVazio";
import { Origem } from "../../common/Origem";

/**
 * Painel da base científica. Totais vêm do banco; distribuições usam a amostra dos 100
 * documentos mais recentes e dizem isso quando o acervo é maior.
 */

/**
 * Uma coluna da composição do acervo: título curto e conteúdo. A procedência (o campo da API) fica no bloco
 * "De onde vêm os números", no fim do painel, em vez de um rótulo técnico sob cada gráfico.
 */
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 lg:px-8 lg:first:pl-0 lg:last:pr-0">
      <h3 className="text-legenda font-medium text-texto">{titulo}</h3>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

function Barras({ linhas }: { linhas: { rotulo: string; valor: number; total: number; tracejado?: boolean }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {linhas.map((l) => (
        <li key={l.rotulo} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3 text-legenda">
          <span className="truncate text-texto-2 first-letter:uppercase">{l.rotulo}</span>
          <span className="h-1 rounded-full bg-linha">
            <span
              className={`block h-full rounded-full ${l.tracejado ? "border border-dashed border-texto-3" : "bg-texto-3"}`}
              style={{ width: `${l.total ? (l.valor / l.total) * 100 : 0}%` }}
            />
          </span>
          <span className="numeros text-right whitespace-nowrap text-texto">
            {numero(l.valor)} <span className="text-texto-3">de {numero(l.total)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Anos({ amostra }: { amostra: DocumentoResumo[] }) {
  const anos = amostra.map((d) => d.publication_year).filter((a): a is number => typeof a === "number");
  const sem = amostra.length - anos.length;
  if (anos.length === 0) {
    return <Epistemico tipo="limitacao" rotulo="Nenhum ano de publicação identificado ainda" />;
  }
  const min = Math.min(...anos);
  const max = Math.max(...anos);
  const largura = max - min > 12 ? 5 : 1;
  const inicio = largura === 5 ? Math.floor(min / 5) * 5 : min;
  const faixas: { de: number; ate: number; n: number }[] = [];
  for (let a = inicio; a <= max; a += largura) faixas.push({ de: a, ate: a + largura - 1, n: 0 });
  for (const a of anos) faixas[Math.floor((a - inicio) / largura)].n += 1;
  const maior = Math.max(...faixas.map((f) => f.n));
  const W = 320;
  const H = 104;
  const passo = W / faixas.length;
  const rotulo = (f: (typeof faixas)[number]) => (largura === 1 ? String(f.de) : `${f.de}–${String(f.ate).slice(2)}`);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="block h-auto w-full" role="img" aria-label={`Documentos por ano de publicação, de ${min} a ${max}.`}>
        {/* linhas de base e de meio, finas: a escala sem eixo numérico */}
        <line x1="0" y1={H} x2={W} y2={H} stroke="var(--color-linha-forte)" />
        <line x1="0" y1={H / 2 + 8} x2={W} y2={H / 2 + 8} stroke="var(--color-linha)" strokeDasharray="2 4" />
        {faixas.map((f, i) => {
          const h = f.n ? Math.max(3, (f.n / maior) * (H - 18)) : 0;
          const w = Math.min(28, passo * 0.42);
          const x = i * passo + (passo - w) / 2;
          const topo = f.n === maior;
          return (
            <g key={f.de}>
              <title>{`${rotulo(f)}: ${f.n}`}</title>
              {f.n === 0 && <line x1={x} x2={x + w} y1={H - 0.5} y2={H - 0.5} stroke="var(--color-texto-3)" strokeOpacity="0.4" strokeDasharray="2 2" />}
              <rect x={x} y={H - h} width={w} height={h} rx="2" fill={topo ? "var(--color-texto-2)" : "var(--color-texto-3)"} fillOpacity={topo ? 0.9 : 0.55} />
              {f.n > 0 && faixas.length <= 14 && (
                <text x={x + w / 2} y={H - h - 5} textAnchor="middle" fill="var(--color-texto)" style={{ font: "500 10.5px var(--font-dados)" }}>
                  {f.n}
                </text>
              )}
              {(i === 0 || i === faixas.length - 1 || faixas.length <= 6) && (
                <text x={x + w / 2} y={H + 15} textAnchor={i === 0 && faixas.length > 6 ? "start" : i === faixas.length - 1 && faixas.length > 6 ? "end" : "middle"} fill="var(--color-texto-3)" style={{ font: "500 10px var(--font-dados)" }}>
                  {rotulo(f)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {sem > 0 && <figcaption className="text-micro text-texto-3">{sem === 1 ? "1 documento sem ano identificado" : `${numero(sem)} documentos sem ano identificado`}</figcaption>}
    </figure>
  );
}

/** Os números do acervo numa faixa só, separados por filetes (sem cartões): leitura de relance. */
function Indicadores({ itens }: { itens: { rotulo: string; valor: string; nota?: string; alerta?: boolean }[] }) {
  return (
    <dl aria-label="Números do acervo" className="m-0 grid grid-cols-2 gap-y-6 border-b border-linha pb-8 sm:grid-cols-3 lg:grid-cols-5">
      {itens.map((i) => (
        <div key={i.rotulo} className="flex min-w-0 flex-col gap-1.5 pr-4 lg:border-l lg:border-linha lg:px-6 lg:first:border-l-0 lg:first:pl-0">
          <dt className="text-legenda text-texto-2">{i.rotulo}</dt>
          <dd className={`numeros m-0 font-editorial text-[calc(2.125rem*var(--escala-titulo))] leading-none font-light tracking-[-0.02em] ${i.alerta ? "text-negativo" : "text-texto"}`}>
            {i.valor}
          </dd>
          {i.nota && <span className="text-micro text-texto-3">{i.nota}</span>}
        </div>
      ))}
    </dl>
  );
}

export function PainelBase() {
  const { tipo, dados, erro, recarregar } = useDados(resumoDaBase, []);
  if (tipo === "carregando") {
    return (
      <div className="flex flex-col gap-8" role="status" aria-label="Carregando o painel da base científica">
        <Esqueleto className="h-28 w-full rounded-painel" />
        <div className="grid gap-8 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Esqueleto key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (tipo === "erro") return <ErroDeCarregamento erro={erro} aoTentarDeNovo={recarregar} />;
  if (dados.total === 0) {
    return (
      <EstadoVazio
        icone={<Library size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="A base científica está vazia"
        acao={
          <Link to={ROTAS.acervo} className="botao botao-secundario botao-pequeno">
            Ir para a gestão do acervo
          </Link>
        }
      >
        Quando houver documentos, este painel mostra quantos são, de que anos, em que idiomas e quão
        completos estão os seus metadados.
      </EstadoVazio>
    );
  }

  const a = dados.amostra;
  const n = a.length;
  const notaAmostra = dados.amostraCompleta ? "Todo o acervo" : `Os ${numero(n)} documentos mais recentes`;
  const idiomas = new Map<string, number>();
  for (const d of a) if (d.language) idiomas.set(d.language, (idiomas.get(d.language) ?? 0) + 1);
  const semIdioma = a.filter((d) => !d.language).length;
  const paginas = a.reduce((s, d) => s + (d.page_count ?? 0), 0);
  const comTexto = a.filter((d) => d.text_extractable === true).length;
  const parcial = !dados.amostraCompleta;
  const indicadores = [
    { rotulo: "Documentos no acervo", valor: numero(dados.total), origem: "GET /documents → total" },
    { rotulo: "Processados", valor: numero(dados.porStatus.completed), origem: "status = completed" },
    { rotulo: "Com texto extraível", valor: numero(comTexto), origem: "text_extractable", nota: parcial ? "nos 100 mais recentes" : undefined },
    { rotulo: "Páginas lidas", valor: numero(paginas), origem: "Σ page_count", nota: parcial ? "nos 100 mais recentes" : undefined },
    { rotulo: "Com falha", valor: numero(dados.porStatus.failed), origem: "status = failed", alerta: dados.porStatus.failed > 0 },
  ];
  const origens = [
    ...indicadores.map((i) => ({ rotulo: i.rotulo, origem: i.origem })),
    { rotulo: "Anos de publicação", origem: "publication_year" },
    { rotulo: "Completude dos metadados", origem: "title · authors · publication_year · language" },
    { rotulo: "Idiomas", origem: "language" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <Indicadores itens={indicadores} />

      <section aria-labelledby="titulo-composicao" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-composicao" className="font-editorial text-secao text-texto">
            Composição do acervo
          </h2>
          <p className="text-micro text-texto-3">
            {notaAmostra} · última ingestão {quando(a[0]?.created_at)}
          </p>
        </div>
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-linha">
          <Bloco titulo="Anos de publicação">
            <Anos amostra={a} />
          </Bloco>
          <Bloco titulo="Completude dos metadados">
            <Barras
              linhas={[
                { rotulo: "Título", valor: a.filter((d) => d.title).length, total: n },
                { rotulo: "Autores", valor: a.filter((d) => d.authors?.length).length, total: n },
                { rotulo: "Ano", valor: a.filter((d) => d.publication_year).length, total: n },
                { rotulo: "Idioma", valor: a.filter((d) => d.language).length, total: n },
              ]}
            />
            <p className="mt-4 text-micro text-texto-3">Campos ausentes ficam vazios: nada é preenchido por suposição.</p>
          </Bloco>
          <Bloco titulo="Idiomas">
            <Barras
              linhas={[
                ...[...idiomas.entries()]
                  .sort((x, y) => y[1] - x[1])
                  .slice(0, 5)
                  .map(([cod, v]) => ({ rotulo: idioma(cod), valor: v, total: n })),
                ...(semIdioma ? [{ rotulo: "Não identificado", valor: semIdioma, total: n, tracejado: true }] : []),
              ]}
            />
          </Bloco>
        </div>
      </section>

      {/* Procedência de cada número, num só lugar: quem quiser conferir abre; a página não fica cheia de código. */}
      <details className="group rounded-padrao border border-linha px-4 py-3 text-legenda">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-texto-2 select-none hover:text-texto [&::-webkit-details-marker]:hidden">
          <ChevronRight size={14} aria-hidden="true" className="transition-transform duration-200 group-open:rotate-90" />
          De onde vêm os números
        </summary>
        <dl className="m-0 mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {origens.map((o) => (
            <div key={o.rotulo} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-micro text-texto-2">{o.rotulo}</dt>
              <dd className="m-0">
                <Origem>{o.origem}</Origem>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
