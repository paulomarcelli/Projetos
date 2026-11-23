/**
 * Páginas de três itens do menu que ainda não têm motor no servidor: Monitoramento, Central de notícias e Ajuda e
 * metodologia. Nada aqui é simulado: Monitoramento e Notícias dizem o que falta e para onde ir; Ajuda e metodologia
 * descreve as regras que a interface já cumpre.
 */
import { BookOpen, Newspaper, Radar } from "lucide-react";
import { Link } from "react-router";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { ROTAS } from "../../config/rotas";

export function PaginaMonitoramento() {
  return (
    <>
      <CabecalhoDePagina rotulo="Inteligência" titulo="Monitoramento">
        Os sinais, as premissas revistas e as versões de cada cenário, acompanhados ao longo do tempo.
      </CabecalhoDePagina>
      <EstadoVazio
        icone={<Radar size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Nada sendo monitorado ainda"
        marcador={{ tipo: "limitacao", rotulo: "Motor de monitoramento ainda não implementado" }}
        acao={
          <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
            Ver as investigações
          </Link>
        }
      >
        Cada investigação já lista os indicadores dos seus cenários. Quando o motor existir, esta página reunirá os sinais de todas elas, com fonte e data de
        cada observação.
      </EstadoVazio>
    </>
  );
}

export function PaginaNoticias() {
  return (
    <>
      <CabecalhoDePagina rotulo="Conhecimento" titulo="Central de notícias">
        Acontecimentos recentes ligados às suas investigações, sempre com a fonte.
      </CabecalhoDePagina>
      <EstadoVazio
        icone={<Newspaper size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Nenhuma notícia coletada"
        marcador={{ tipo: "limitacao", rotulo: "Coleta de notícias ainda não implementada" }}
        acao={
          <Link to={ROTAS.base} className="botao botao-secundario botao-pequeno">
            Abrir a base de conhecimento
          </Link>
        }
      >
        A Iris ainda não varre notícias. Quando a coleta existir, cada item terá veículo, data e link, e só entrará se a fonte puder ser verificada.
      </EstadoVazio>
    </>
  );
}

const PRINCIPIOS = [
  ["Cenários, não previsões", "Cada futuro é uma trajetória condicional. Nenhuma probabilidade ou porcentagem é mostrada sem método e dados."],
  ["Tipo de cada afirmação", "Toda frase da análise diz se é fato, inferência ou hipótese, e mostra as fontes que a sustentam."],
  [
    "Aprofundar não é inventar",
    "A análise de um cenário reorganiza o raciocínio que o gerou: evidências, relações entre atores, incertezas. Onde falta base, a lacuna aparece.",
  ],
  ["O que contradiz também aparece", "Evidências contrárias e premissas frágeis ficam ao lado das que sustentam o cenário."],
  ["Marcos são hipóteses", "As datas da trajetória de um cenário são hipóteses de desenvolvimento, não eventos previstos."],
] as const;

export function PaginaAjuda() {
  return (
    <>
      <CabecalhoDePagina rotulo="Sistema" titulo="Ajuda e metodologia">
        Como a Iris monta uma investigação e as regras que ela segue.
      </CabecalhoDePagina>
      <section aria-label="Princípios" className="flex max-w-3xl flex-col gap-6">
        <h2 className="flex items-center gap-2 text-micro font-medium tracking-[0.12em] text-texto-3 uppercase">
          <BookOpen size={14} aria-hidden="true" />
          Princípios
        </h2>
        <ol className="m-0 flex list-none flex-col p-0">
          {PRINCIPIOS.map(([titulo, texto], i) => (
            <li key={titulo} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-t border-linha py-4 first:border-t-0 first:pt-0">
              <span className="numeros pt-0.5 font-dados text-micro text-ouro">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <p className="text-corpo font-medium text-texto">{titulo}</p>
                <p className="text-legenda text-texto-2">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-legenda text-texto-3">
          O método de cada investigação está nela mesma, em "Como esta análise foi feita".{" "}
          <Link to={ROTAS.investigacoes} className="text-ciano-texto hover:underline">
            Ver as investigações
          </Link>
        </p>
      </section>
    </>
  );
}
