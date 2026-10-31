/**
 * Landing pública da Iris (versão 5, out/2026): uma IA de relações internacionais, apresentada como as landings de
 * IA (ChatGPT, Gemini, Manus) — título curto, o campo de pergunta no centro, a interface encenada e o que ela entrega
 * — na paleta da diplomacia: azul-noite com ouro.
 *
 * Sequência: herói (globo de rotas diplomáticas + campo de pergunta) → temas → a Iris investigando (encenação) →
 * recursos → método → estado do projeto → chamada final. Movimento: Motion para entradas e encenação, CSS para os
 * laços curtos, canvas para o globo; tudo para fora da tela e respeita "reduzir movimento".
 */
import { ArrowRight } from "lucide-react";
import { m, type Variants } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { Marca } from "../../components/common/Marca";
import { Movimento } from "../../components/common/movimento";
import { ROTAS } from "../../config/rotas";
import { CampoDeConvite } from "../../components/landing/CampoDeConvite";
import { Demonstracao } from "../../components/landing/Demonstracao";
import { Camadas, EstadoDoProjeto } from "../../components/landing/Metodo";
import { Navegacao } from "../../components/landing/Navegacao";
import { Recursos } from "../../components/landing/Recursos";
import { TEMAS } from "../../components/landing/conteudo";
import { Globo } from "../../components/landing/globo/Globo";
import "../../components/landing/landing.css";

const ANO = new Date().getFullYear();
const SAIDA = [0.23, 1, 0.32, 1] as const;

const ENTRADA: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const ITEM: Variants = {
  oculto: { opacity: 0, y: 18 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.8, ease: SAIDA } },
};

/** Cabeçalho de seção que entra ao chegar na tela. */
function Secao({ id, rotulo, titulo, texto, children }: { id: string; rotulo: string; titulo: ReactNode; texto?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`t-${id}`} data-animada className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-24 sm:py-32">
      <m.header initial="oculto" whileInView="visivel" viewport={{ once: true, margin: "-15% 0px" }} variants={ENTRADA} className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center sm:mb-16">
        <m.p variants={ITEM} className="lp-chip">
          {rotulo}
        </m.p>
        <m.h2 id={`t-${id}`} variants={ITEM} className="lp-titulo lp-titulo-gradiente text-[clamp(2rem,4.4vw,3.25rem)]">
          {titulo}
        </m.h2>
        {texto && (
          <m.p variants={ITEM} className="text-[1.0625rem] leading-relaxed text-[color:var(--lp-texto-2)]">
            {texto}
          </m.p>
        )}
      </m.header>
      {children}
    </section>
  );
}

/** Pausa as animações em CSS das seções que saíram da tela (as que repintam custam mesmo invisíveis). */
function usePausarForaDaTela(raiz: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.toggleAttribute("data-fora-da-tela", !e.isIntersecting)));
    el.querySelectorAll("[data-animada]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [raiz]);
}

export function PaginaLanding() {
  const raiz = useRef<HTMLDivElement>(null);
  usePausarForaDaTela(raiz);

  return (
    <Movimento>
      <div ref={raiz} className="lp">
        <a href="#conteudo" className="sr-only z-[60] rounded-full bg-[color:var(--lp-ouro)] px-4 py-2 text-[#0a1226] focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Pular para o conteúdo
        </a>
        <Navegacao />

        <main id="conteudo">
          {/* HERÓI */}
          <section aria-labelledby="t-heroi" className="relative isolate overflow-hidden pt-14 pb-10 sm:pt-20">
            <div aria-hidden="true" className="lp-ceu absolute inset-0 -z-10" />
            <div aria-hidden="true" className="lp-grade absolute inset-0 -z-10" />

            <m.div initial="oculto" animate="visivel" variants={ENTRADA} className="mx-auto flex max-w-5xl flex-col items-center gap-7 px-5 text-center">
              <m.p variants={ITEM}>
                <Link to={ROTAS.inicio} className="lp-chip group transition-colors duration-150 hover:text-[color:var(--lp-texto)]">
                  <span className="lp-pulso size-1.5 rounded-full bg-[color:var(--lp-ouro)]" />
                  <span className="sm:hidden">IA para Relações Internacionais</span>
                  <span className="hidden sm:inline">Inteligência artificial para Relações Internacionais</span>
                  <ArrowRight size={13} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </m.p>
              <m.h1 id="t-heroi" variants={ITEM} className="lp-titulo text-[clamp(2.6rem,7vw,5.25rem)]">
                <span className="lp-titulo-gradiente block">Entenda o presente.</span>{" "}
                <span className="block">
                  <span className="lp-titulo-gradiente">Explore os</span>{" "}
                  <span className="lp-ouro-texto">futuros.</span>
                </span>
              </m.h1>
              <m.p variants={ITEM} className="max-w-2xl text-[1.125rem] leading-relaxed text-[color:var(--lp-texto-2)]">
                Pergunte sobre uma questão internacional. A Iris explica o que está acontecendo, quem está envolvido e quais trajetórias são possíveis, com
                a fonte de cada afirmação.
              </m.p>
              <m.div variants={ITEM} className="w-full max-w-2xl">
                <CampoDeConvite />
              </m.div>
              <m.p variants={ITEM} className="text-[0.8125rem] text-[color:var(--lp-texto-3)]">
                Projeto em desenvolvimento: a interface está pronta; o motor de investigação é a próxima fase.
              </m.p>
            </m.div>

            {/* o planeta nascendo no horizonte, com as rotas diplomáticas acendendo */}
            <m.div
              aria-hidden="true"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.5, ease: SAIDA }}
              className="lp-horizonte relative -mt-4 h-[clamp(300px,46vw,600px)] w-[min(1240px,190vw)]"
              style={{ marginLeft: "50%", translate: "-50% 0" }}
            >
              <Globo enquadramento="horizonte" />
            </m.div>

            {/* faixa de temas */}
            <div data-animada className="lp-faixa -mt-10 overflow-hidden" aria-label="Temas que a Iris investiga">
              <ul className="lp-faixa-trilho m-0 flex w-max list-none gap-3 p-0">
                {[...TEMAS, ...TEMAS].map((t, i) => (
                  <li key={i} aria-hidden={i >= TEMAS.length || undefined} className="lp-chip whitespace-nowrap !bg-transparent !px-4 !py-1.5 !text-[0.875rem]">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Secao
            id="demonstracao"
            rotulo="Como funciona"
            titulo="Uma pergunta. Uma investigação inteira."
            texto="A Iris lê a pergunta, reúne evidências, mapeia os atores e desenha os futuros possíveis, tudo na mesma conversa."
          >
            <m.div initial={{ opacity: 0, y: 40, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-10% 0px" }} transition={{ duration: 0.9, ease: SAIDA }}>
              <Demonstracao />
            </m.div>
          </Secao>

          <Secao id="recursos" rotulo="Recursos" titulo="Análise e prospectiva na mesma resposta." texto="Logo abaixo de cada análise, os cenários; depois, o mapa, a linha do tempo e as fontes para aprofundar.">
            <Recursos />
          </Secao>

          <Secao id="metodo" rotulo="Método" titulo="Cada afirmação sabe o que é." texto="A Iris separa o que as fontes registram, o que se deduz delas e o que pode acontecer.">
            <Camadas />
          </Secao>

          <Secao id="projeto" rotulo="Estado do projeto" titulo="O que já existe e o que vem a seguir." texto="Sem promessas: cada parte da investigação com o seu estado real.">
            <EstadoDoProjeto />
          </Secao>

          {/* CHAMADA FINAL */}
          <section aria-labelledby="t-chamada" className="relative isolate overflow-hidden px-5 py-28 sm:py-36">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_100%,rgba(245,196,81,0.12),transparent_70%),radial-gradient(60%_60%_at_50%_0%,rgba(79,125,255,0.14),transparent_70%)]" />
            <m.div initial="oculto" whileInView="visivel" viewport={{ once: true, margin: "-15% 0px" }} variants={ENTRADA} className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
              <m.h2 id="t-chamada" variants={ITEM} className="lp-titulo lp-titulo-gradiente text-[clamp(2.2rem,5vw,3.75rem)]">
                Faça a primeira pergunta.
              </m.h2>
              <m.div variants={ITEM} className="w-full">
                <CampoDeConvite grande />
              </m.div>
              <m.p variants={ITEM} className="flex flex-wrap items-center justify-center gap-3">
                <Link to={ROTAS.inicio} className="lp-botao lp-botao-ouro">
                  Começar uma investigação
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to={ROTAS.entrar} className="lp-botao lp-botao-linha">
                  Entrar
                </Link>
              </m.p>
            </m.div>
          </section>
        </main>

        <footer className="border-t border-[color:var(--lp-linha)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <Marca altura={22} />
              <p className="text-[0.8125rem] text-[color:var(--lp-texto-3)]">Inteligência estratégica e prospectiva em Relações Internacionais. Projeto em desenvolvimento.</p>
            </div>
            <nav aria-label="Rodapé" className="flex flex-wrap gap-5 text-[0.875rem] text-[color:var(--lp-texto-2)]">
              <Link to={ROTAS.inicio} className="hover:text-[color:var(--lp-texto)]">
                Começar
              </Link>
              <Link to={ROTAS.entrar} className="hover:text-[color:var(--lp-texto)]">
                Entrar
              </Link>
              <Link to={ROTAS.criarConta} className="hover:text-[color:var(--lp-texto)]">
                Criar conta
              </Link>
            </nav>
            <p className="text-[0.75rem] text-[color:var(--lp-texto-3)]">© {ANO} Iris</p>
          </div>
        </footer>
      </div>
    </Movimento>
  );
}

export default PaginaLanding;
