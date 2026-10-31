/**
 * Moldura das telas de conta: entrar, criar conta, recuperar e redefinir senha.
 *
 * Desktop: duas colunas. À esquerda, o painel institucional (marca, a ilustração conceitual e a
 * frase da Iris) num tom acima do fundo; à direita, o formulário. O painel fica MONTADO durante a
 * troca de tela (é a rota-pai), então a ilustração anima uma única vez e só o formulário troca.
 * Celular: só a marca e o formulário; a ilustração sai, porque não ajuda a tarefa.
 *
 * Transição entre telas: `useOutlet` captura o conteúdo da rota atual, e AnimatePresence com
 * `mode="wait"` deixa a tela anterior sair (opacidade + 8 px para cima, 160 ms) antes de a nova
 * entrar (opacidade + 8 px de baixo, 220 ms). Com "reduzir movimento", só a opacidade muda.
 * Depois da troca, o foco vai para o título da nova tela (leitores de tela anunciam a mudança).
 */
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { Suspense, useEffect, useRef } from "react";
import { Link, useLocation, useOutlet } from "react-router";
import { RedeIlustrativa } from "../../features/landing/components/RedeIlustrativa";
import { Marca } from "../../components/ui/Marca";
import { CURVA_SAIDA, Movimento } from "../../components/ui/movimento";
import { MARCA } from "../../config/marca";
import { ROTAS } from "../../config/rotas";

export function LayoutConta() {
  const local = useLocation();
  const outlet = useOutlet();
  const area = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);

  useEffect(() => {
    // Na primeira montagem o foco fica onde o navegador o pôs; nas trocas, vai para o novo título.
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const t = window.setTimeout(() => area.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }), 240);
    return () => window.clearTimeout(t);
  }, [local.pathname]);

  return (
    <Movimento>
      <div className="grid min-h-dvh bg-abismo text-texto lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <aside className="hidden flex-col justify-between gap-10 bg-mar p-12 lg:flex xl:p-16">
          <Link to={ROTAS.landing} className="w-fit rounded-fino">
            <Marca altura={28} />
          </Link>
          <div className="flex flex-col gap-8">
            <div className="max-w-[560px]">
              <RedeIlustrativa />
            </div>
            <p className="max-w-[26ch] font-editorial text-[1.75rem] leading-[1.25] text-texto">{MARCA.conceito}</p>
          </div>
          <p className="text-legenda text-texto-3">Ilustração conceitual, sem dados.</p>
        </aside>

        <main
          className="flex flex-col"
          style={{ paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}
        >
          <div className="flex h-20 items-center justify-between lg:justify-end">
            <Link to={ROTAS.landing} className="rounded-fino lg:hidden">
              <Marca altura={24} />
            </Link>
            <Link to={ROTAS.landing} className="inline-flex items-center gap-1.5 text-corpo text-texto-2 transition-colors duration-150 hover:text-texto">
              <ArrowLeft size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Voltar ao site</span>
              <span className="sm:hidden">Site</span>
            </Link>
          </div>
          <div ref={area} className="flex flex-1 items-start justify-center pt-6 pb-16 lg:items-center lg:pt-0">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={local.pathname}
                className="w-full max-w-[400px]"
                initial={{ opacity: 0, transform: "translateY(8px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.22, ease: CURVA_SAIDA } }}
                exit={{ opacity: 0, transform: "translateY(-8px)", transition: { duration: 0.16, ease: CURVA_SAIDA } }}
              >
                {/* Cada tela é carregada sob demanda: a espera fica dentro da moldura, sem piscar o painel. */}
                <Suspense fallback={null}>{outlet}</Suspense>
              </m.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </Movimento>
  );
}

export default LayoutConta;
