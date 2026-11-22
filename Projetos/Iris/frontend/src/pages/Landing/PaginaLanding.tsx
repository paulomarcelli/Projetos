/**
 * Landing (revisão de design de 22/11/2026, docs/design-system.md, tela "Landing"): cinco blocos, na mesma linguagem
 * da plataforma (tokens do sistema, sem paleta própria).
 *   1. Herói: "Cenários que dizem de onde vieram.", o campo de pergunta e o leque (o componente real, com um exemplo).
 *   2. Método em cinco etapas.
 *   3. Observatório: entregas da turma com a versão do cenário usada.
 *   4. IA declarada: o registro de uso de IA.
 *   5. Fechamento com o nome.
 * Sem selo em pílula, sem brilho, sem cartões com ícone. A separação entre blocos é um degrau de tom (abismo / mar),
 * nunca uma linha. Tudo o que é exemplo diz que é exemplo. A menção ao lab é só texto: sem logo nem marca de ninguém.
 */
import { ArrowUp } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { LequeDosFuturos } from "../../components/analysis/prospectiva/LequeDosFuturos";
import { LinhaDeEntrega } from "../../components/common/LinhaDeEntrega";
import { Marca } from "../../components/common/Marca";
import { RegistroDeIA } from "../../components/common/RegistroDeIA";
import { ROTAS } from "../../config/rotas";
import { WORDMARK } from "../../config/marca-geometria";
import { CENARIOS_EXEMPLO, CICLO_EXEMPLO, INCERTEZAS_EXEMPLO, REGISTROS_EXEMPLO } from "../../previa/observatorio-exemplo";

const LINKS = [
  { href: "#metodo", rotulo: "Método" },
  { href: "#observatorio", rotulo: "Observatório" },
  { href: "#exemplo", rotulo: "Exemplo" },
];

const ETAPAS = [
  { nome: "Pergunta e horizonte", texto: "O que se quer saber, até quando e em que escopo." },
  { nome: "Diagnóstico com fonte", texto: "Fatos, evidências e inferências, cada um com a sua marca." },
  { nome: "Incertezas críticas", texto: "As duas ou três escolhas que separam os futuros." },
  { nome: "Ramos e indicadores", texto: "Cada cenário com premissas e sinais para observar." },
  { nome: "Revisão com data", texto: "Toda revisão vira uma versão nova, com o que mudou." },
];

const Exemplo = () => <span className="rounded-fino bg-grafite px-2 py-1 text-micro text-texto-2">Dados de exemplo</span>;

function Bloco({ id, tom, children }: { id?: string; tom: "abismo" | "mar"; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `t-${id}` : undefined} className={`scroll-mt-16 ${tom === "mar" ? "bg-mar" : "bg-abismo"}`}>
      <div className="mx-auto w-full max-w-[67.5rem] px-4 py-16 sm:px-6 sm:py-24">{children}</div>
    </section>
  );
}

/** Campo de pergunta (componente Campo de pergunta): o botão de enviar fica dentro, à direita, e leva à plataforma. */
function CampoDePergunta() {
  const id = useId();
  const [pergunta, setPergunta] = useState("");
  const destino = pergunta.trim() ? `${ROTAS.inicio}?pergunta=${encodeURIComponent(pergunta.trim())}` : ROTAS.inicio;
  return (
    <div className="flex min-h-14 w-full max-w-[37rem] items-center gap-3 rounded-painel border border-linha-forte bg-institucional py-2 pr-2 pl-4 focus-within:border-ciano focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ciano">
      <label htmlFor={id} className="sr-only">
        Escreva uma pergunta sobre Relações Internacionais
      </label>
      <input
        id={id}
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
        placeholder="Como a eleição de 2026 pode mudar a política externa brasileira até 2030?"
        className="min-w-0 flex-1 bg-transparent text-corpo text-texto outline-none placeholder:text-texto-3"
      />
      <Link
        to={destino}
        aria-label="Investigar esta pergunta na Iris"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-ciano text-abismo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ciano"
      >
        <ArrowUp size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

/** O nome, grande, no fechamento: só o wordmark (sem o símbolo), em curvas, como na marca. */
function NomeGrande() {
  return (
    <svg viewBox="41.6 10.2 48.6 13.9" role="img" aria-label="Iris" className="block h-auto w-full max-w-[22rem] fill-texto">
      <path d={WORDMARK.d} transform={WORDMARK.transform} />
    </svg>
  );
}

export function PaginaLanding() {
  return (
    <div className="min-h-dvh bg-abismo text-texto">
      <a href="#conteudo" className="sr-only z-[60] rounded-padrao bg-ciano px-4 py-2 text-abismo focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Pular para o conteúdo
      </a>
      <header className="bg-abismo">
        <nav aria-label="Principal" className="mx-auto flex h-16 w-full max-w-[67.5rem] items-center gap-6 px-4 sm:px-6">
          <Link to={ROTAS.landing} aria-label="Iris, início" className="shrink-0 rounded-fino">
            <Marca altura={26} />
          </Link>
          <ul className="m-0 hidden list-none gap-6 p-0 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-legenda text-texto-2 hover:text-texto">
                  {l.rotulo}
                </a>
              </li>
            ))}
            <li>
              <Link to={ROTAS.ajuda} className="text-legenda text-texto-2 hover:text-texto">
                Ajuda
              </Link>
            </li>
          </ul>
          <div className="ml-auto flex items-center gap-2">
            <Link to={ROTAS.entrar} className="inline-flex min-h-11 items-center rounded-padrao px-3 text-legenda text-ciano-texto hover:underline">
              Entrar
            </Link>
            <Link to={ROTAS.inicio} className="botao botao-primario botao-pequeno">
              Começar
            </Link>
          </div>
        </nav>
      </header>

      <main id="conteudo">
        {/* 1. Herói */}
        <section aria-labelledby="t-heroi" className="bg-abismo">
          <div className="mx-auto flex w-full max-w-[67.5rem] flex-col gap-6 px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
            <h1 id="t-heroi" className="m-0 max-w-[17ch] text-[2.5rem] leading-[1.04] font-normal tracking-[-0.025em] text-texto sm:text-[4rem]">
              Cenários que dizem de onde vieram.
            </h1>
            <p className="m-0 max-w-[37rem] text-corpo text-texto-2">
              A Iris monta futuros possíveis para questões de Relações Internacionais, com a fonte de cada afirmação, a data de cada revisão e o
              registro do que a IA fez.
            </p>
            <CampoDePergunta />
            <p className="m-0 text-micro text-texto-3">
              Pensado para laboratórios de prospectiva como o FutuRI Lab: ciclos, turmas e entregas com fonte rastreada.
            </p>
            <figure id="exemplo" aria-label="Exemplo de leque dos futuros" className="painel-leque m-0 mt-6 flex scroll-mt-16 flex-col gap-4 p-4 sm:p-6">
              <div className="hidden md:block">
                <LequeDosFuturos cenarios={CENARIOS_EXEMPLO} incertezas={INCERTEZAS_EXEMPLO} realce="B" rotuloDoFim="2030" sinaisNovos={["B"]} />
              </div>
              <div className="mx-auto w-full max-w-[22rem] md:hidden">
                <LequeDosFuturos cenarios={CENARIOS_EXEMPLO} incertezas={INCERTEZAS_EXEMPLO} realce="B" rotuloDoFim="2030" sinaisNovos={["B"]} vertical />
              </div>
              <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-micro text-texto-2">
                <span>Exemplo ilustrativo: a disputa EUA–China e o comércio do Brasil até 2030.</span>
                <span className="text-texto-3 md:ml-auto">Nenhum ramo tem peso ou chance.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 2. Método */}
        <Bloco id="metodo" tom="mar">
          <h2 id="t-metodo" className="m-0 text-[1.75rem] leading-[1.15] font-normal text-texto sm:text-manchete">
            Como um cenário é construído
          </h2>
          <p className="mt-3 mb-0 max-w-[37rem] text-corpo text-texto-2">
            O método fica à vista em toda investigação. Nada de probabilidade sem método, nada de afirmação sem fonte.
          </p>
          <ol className="m-0 mt-10 grid list-none gap-0 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {ETAPAS.map((e, i) => (
              <li key={e.nome} className={`flex flex-col gap-2 border-t pt-5 pr-6 pb-6 ${i === ETAPAS.length - 1 ? "border-ouro" : "border-linha-forte"}`}>
                <h3 className="m-0 text-secao font-normal text-texto">{e.nome}</h3>
                <p className="m-0 text-legenda text-texto-2">{e.texto}</p>
              </li>
            ))}
          </ol>
        </Bloco>

        {/* 3. Observatório */}
        <Bloco id="observatorio" tom="abismo">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div className="flex flex-col gap-4">
              <h2 id="t-observatorio" className="m-0 text-[1.75rem] leading-[1.15] font-normal text-texto sm:text-manchete">
                Um observatório por turma
              </h2>
              <p className="m-0 text-corpo text-texto-2">
                O ciclo do semestre, as equipes e as entregas num lugar só. Policy brief, dossiê e boletim partem da mesma investigação e citam a
                versão do cenário que usaram.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-end">
                <Exemplo />
              </div>
              <ul className="m-0 list-none rounded-painel border border-linha bg-institucional p-0">
                {CICLO_EXEMPLO.entregas
                  .filter((e) => e.id !== "e2")
                  .map((e) => (
                    <LinhaDeEntrega key={e.id} e={e} />
                  ))}
              </ul>
            </div>
          </div>
        </Bloco>

        {/* 4. IA declarada */}
        <Bloco id="ia" tom="mar">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="order-2 flex flex-col gap-3 lg:order-1">
              <div className="flex justify-end">
                <Exemplo />
              </div>
              {[...REGISTROS_EXEMPLO].reverse().map((r) => (
                <RegistroDeIA key={r.id} r={r} />
              ))}
            </div>
            <div className="order-1 flex flex-col gap-4 lg:order-2">
              <h2 id="t-ia" className="m-0 text-[1.75rem] leading-[1.15] font-normal text-texto sm:text-manchete">
                IA declarada, não escondida
              </h2>
              <p className="m-0 text-corpo text-texto-2">
                A Iris ajuda a escrever o policy brief e o boletim. Tudo o que ela sugere fica marcado até alguém revisar, e o registro de uso de IA e
                de fontes sai junto com o PDF, pronto para anexar.
              </p>
            </div>
          </div>
        </Bloco>

        {/* 5. Fechamento */}
        <section aria-label="Começar" className="bg-abismo">
          <div className="mx-auto flex w-full max-w-[67.5rem] flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-24">
            <NomeGrande />
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Link to={ROTAS.inicio} className="botao botao-primario">
                Começar uma investigação
              </Link>
              <p className="m-0 text-micro text-texto-3">Projeto em desenvolvimento · ferramenta independente, sem vínculo institucional</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PaginaLanding;
