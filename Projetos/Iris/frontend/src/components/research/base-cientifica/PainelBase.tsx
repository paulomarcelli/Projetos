import { Library } from "lucide-react";
import { Link } from "react-router";
import { resumoDaBase } from "../../../services/api";
import { type DocumentoResumo, type ResumoDaBase } from "../../../types/api";
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

function Bloco({ titulo, nota, origem, children }: { titulo: string; nota?: string; origem: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 border-t border-linha-forte pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-editorial text-secao text-texto">{titulo}</h3>
        {nota && <span className="text-micro text-texto-3">{nota}</span>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <Origem>{origem}</Origem>
    </section>
  );
}

function Barras({ linhas }: { linhas: { rotulo: string; valor: number; total: number; tracejado?: boolean }[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {linhas.map((l) => (
        <li key={l.rotulo} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto] items-center gap-3 text-legenda">
          <span className="truncate text-texto-2 first-letter:uppercase">{l.rotulo}</span>
          <span className="h-1.5 rounded-full bg-grafite">
            <span
              className={`block h-full rounded-full ${l.tracejado ? "border border-dashed border-texto-3" : "bg-texto-2"}`}
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
  const H = 120;
  const passo = W / faixas.length;
  const rotulo = (f: (typeof faixas)[number]) => (largura === 1 ? String(f.de) : `${f.de}–${String(f.ate).slice(2)}`);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="block h-auto w-full" role="img" aria-label={`Documentos por ano de publicação, de ${min} a ${max}.`}>
        <line x1="0" y1={H} x2={W} y2={H} stroke="var(--color-linha-forte)" />
        {faixas.map((f, i) => {
          const h = f.n ? Math.max(3, (f.n / maior) * (H - 16)) : 0;
          const x = i * passo + passo * 0.18;
          const w = passo * 0.64;
          return (
            <g key={f.de}>
              <title>{`${rotulo(f)}: ${f.n}`}</title>
              <rect x={x} y={H - h} width={w} height={h} rx="1.5" fill="var(--color-texto-2)" />
              {f.n > 0 && faixas.length <= 14 && (
                <text x={x + w / 2} y={H - h - 4} textAnchor="middle" fill="var(--color-texto)" style={{ font: "500 10px var(--font-dados)" }}>
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

function Indicadores({ dados }: { dados: ResumoDaBase }) {
  const paginas = dados.amostra.reduce((s, d) => s + (d.page_count ?? 0), 0);
  const comTexto = dados.amostra.filter((d) => d.text_extractable === true).length;
  const parcial = !dados.amostraCompleta;
  const itens = [
    { rotulo: "Documentos no acervo", valor: numero(dados.total), origem: "GET /documents → total" },
    { rotulo: "Processados", valor: numero(dados.porStatus.completed), origem: "status = completed" },
    { rotulo: "Com texto extraível", valor: numero(comTexto), origem: "text_extractable", nota: parcial ? "nos 100 mais recentes" : undefined },
    { rotulo: "Páginas lidas", valor: numero(paginas), origem: "Σ page_count", nota: parcial ? "nos 100 mais recentes" : undefined },
    { rotulo: "Com falha", valor: numero(dados.porStatus.failed), origem: "status = failed" },
  ];
  return (
    <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-painel border border-linha bg-linha sm:grid-cols-5">
      {itens.map((i) => (
        <div key={i.rotulo} className="flex min-w-0 flex-col gap-1 bg-institucional p-4 last:col-span-2 sm:p-5 sm:last:col-span-1">
          <dt className="text-legenda text-texto-2">{i.rotulo}</dt>
          <dd className="numeros m-0 font-editorial text-titulo text-texto">{i.valor}</dd>
          {i.nota && <span className="text-micro text-texto-3">{i.nota}</span>}
          <Origem>{i.origem}</Origem>
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
  const notaAmostra = dados.amostraCompleta ? "todo o acervo" : `${numero(n)} mais recentes`;
  const idiomas = new Map<string, number>();
  for (const d of a) if (d.language) idiomas.set(d.language, (idiomas.get(d.language) ?? 0) + 1);
  const semIdioma = a.filter((d) => !d.language).length;

  return (
    <div className="flex flex-col gap-10">
      <Indicadores dados={dados} />
      <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
        <Bloco titulo="Anos de publicação" nota={notaAmostra} origem="publication_year">
          <Anos amostra={a} />
        </Bloco>
        <Bloco titulo="Completude dos metadados" nota={notaAmostra} origem="title · authors · publication_year · language">
          <Barras
            linhas={[
              { rotulo: "Título", valor: a.filter((d) => d.title).length, total: n },
              { rotulo: "Autores", valor: a.filter((d) => d.authors?.length).length, total: n },
              { rotulo: "Ano", valor: a.filter((d) => d.publication_year).length, total: n },
              { rotulo: "Idioma", valor: a.filter((d) => d.language).length, total: n },
            ]}
          />
          <p className="mt-3 text-micro text-texto-3">Campos ausentes ficam vazios: nada é preenchido por suposição.</p>
        </Bloco>
        <Bloco titulo="Idiomas" nota={notaAmostra} origem="language">
          <Barras
            linhas={[
              ...[...idiomas.entries()]
                .sort((x, y) => y[1] - x[1])
                .slice(0, 5)
                .map(([cod, v]) => ({ rotulo: idioma(cod), valor: v, total: n })),
              ...(semIdioma ? [{ rotulo: "Não identificado", valor: semIdioma, total: n, tracejado: true }] : []),
            ]}
          />
          <p className="mt-3 text-micro text-texto-3">Última ingestão {quando(a[0]?.created_at)}.</p>
        </Bloco>
      </div>
    </div>
  );
}
