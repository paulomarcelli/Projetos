import { ArrowRight, Library, Upload } from "lucide-react";
import { Link } from "react-router";
import { resumoDaBase, type DocumentoResumo } from "../lib/api";
import { contar, idioma, numero, quando } from "../lib/formato";
import { useDados } from "../lib/useDados";
import { Epistemico } from "./Epistemico";
import { ErroDeCarregamento, Esqueleto, EstadoVazio, Origem } from "./Estados";
import { ROTAS } from "../lib/rotas";

function Indicador({
  rotulo,
  valor,
  origem,
  nota,
}: {
  rotulo: string;
  valor: string;
  origem: string;
  nota?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-legenda text-texto-2">{rotulo}</span>
      <span className="numeros font-editorial text-titulo text-texto">{valor}</span>
      {nota && <span className="text-micro text-texto-3">{nota}</span>}
      <Origem>{origem}</Origem>
    </div>
  );
}

function Idiomas({ amostra, completa }: { amostra: DocumentoResumo[]; completa: boolean }) {
  const contagem = new Map<string, number>();
  let sem = 0;
  for (const d of amostra) {
    if (d.language) contagem.set(d.language, (contagem.get(d.language) ?? 0) + 1);
    else sem += 1;
  }
  const linhas = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maior = Math.max(1, ...linhas.map(([, n]) => n), sem);
  if (!amostra.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="rotulo">Idiomas identificados</p>
        <span className="text-micro text-texto-3">
          {completa ? "todo o acervo" : `nos ${numero(amostra.length)} documentos mais recentes`}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {linhas.map(([cod, n]) => (
          <li key={cod} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-legenda">
            <span className="truncate text-texto-2 capitalize">{idioma(cod)}</span>
            <span className="h-1.5 rounded-full bg-grafite">
              <span className="block h-full rounded-full bg-texto-2" style={{ width: `${(n / maior) * 100}%` }} />
            </span>
            <span className="numeros text-right text-texto">{numero(n)}</span>
          </li>
        ))}
        {sem > 0 && (
          <li className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-legenda">
            <span className="truncate text-texto-3">Não identificado</span>
            <span className="h-1.5 rounded-full bg-grafite">
              <span className="block h-full rounded-full border border-dashed border-texto-3" style={{ width: `${(sem / maior) * 100}%` }} />
            </span>
            <span className="numeros text-right text-texto-3">{numero(sem)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Estado REAL da base documental. Nenhum número é estimado. */
export function ResumoBase() {
  const { tipo, dados, erro, recarregar } = useDados(resumoDaBase, []);

  if (tipo === "carregando") {
    return (
      <div className="grid grid-cols-2 gap-6" role="status" aria-label="Carregando a base científica">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Esqueleto className="h-4 w-24" />
            <Esqueleto className="h-8 w-16" />
            <Esqueleto className="h-3 w-32" />
          </div>
        ))}
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
            <Upload size={14} aria-hidden="true" />
            Enviar o primeiro PDF
          </Link>
        }
      >
        Envie artigos, livros e relatórios em PDF. O texto de cada página fica disponível para
        consulta e, nas próximas fases, para a busca de evidências.
      </EstadoVazio>
    );
  }

  const comTexto = dados.amostra.filter((d) => d.text_extractable === true).length;
  const ultima = dados.amostra[0]?.created_at;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Indicador rotulo="Documentos no acervo" valor={numero(dados.total)} origem="GET /documents → total" />
        <Indicador rotulo="Processados" valor={numero(dados.porStatus.completed)} origem="status = completed" />
        <Indicador
          rotulo="Com texto extraível"
          valor={numero(comTexto)}
          nota={dados.amostraCompleta ? undefined : `nos ${numero(dados.amostra.length)} mais recentes`}
          origem="text_extractable = true"
        />
        <Indicador
          rotulo="Com falha"
          valor={numero(dados.porStatus.failed)}
          nota={
            dados.porStatus.processing + dados.porStatus.pending > 0
              ? `${contar(dados.porStatus.processing + dados.porStatus.pending, "em andamento", "em andamento")}`
              : undefined
          }
          origem="status = failed"
        />
      </div>

      <Idiomas amostra={dados.amostra} completa={dados.amostraCompleta} />

      <div className="flex flex-col gap-2 border-t border-linha pt-4">
        <p className="text-legenda text-texto-2">
          Última ingestão: <span className="text-texto">{quando(ultima)}</span>
        </p>
        <Epistemico tipo="limitacao" rotulo="Cobertura temática não calculável: ainda não há classificação temática" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={ROTAS.base} className="botao botao-secundario botao-pequeno">
          Pesquisar fontes
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Link to={ROTAS.acervo} className="botao botao-fantasma botao-pequeno">
          Gerenciar o acervo
        </Link>
      </div>
    </div>
  );
}
