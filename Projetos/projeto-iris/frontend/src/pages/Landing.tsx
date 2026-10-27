import { ArrowRight, Check } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { LegendaEpistemica } from "../components/Diagramas";
import { Epistemico, GlifoEpistemico } from "../components/Epistemico";
import { Marca } from "../components/Marca";
import { MARCA } from "../lib/marca";
import { ESTADO_ETAPA as ESTADO, METODO } from "../lib/metodo";
import { ROTAS } from "../lib/rotas";

const MapaMundo = lazy(() => import("../components/MapaMundo"));

const ANO = new Date().getFullYear();

const DIMENSOES = [
  {
    titulo: "Poder e estratégia",
    texto: "Estados, organizações multilaterais e atores não estatais; alianças, rivalidades, dependências e fluxos de comércio, energia e tecnologia.",
  },
  {
    titulo: "Ciência e evidências",
    texto: "Artigos, livros e relatórios como base. Cada afirmação aponta para o documento e a página que a sustentam.",
  },
  {
    titulo: "Futuros e incerteza",
    texto: "Cenários condicionais com premissas explícitas, variáveis críticas e sinais antecipatórios — nunca previsões.",
  },
];

const ROTEIRO: { fase: string; titulo: string; feito: boolean }[] = [
  { fase: "Fase 1", titulo: "Fundação técnica: API, banco com pgvector, migrações", feito: true },
  { fase: "Fase 2", titulo: "Base científica: ingestão de PDFs, texto por página, metadados com origem", feito: true },
  { fase: "Interface", titulo: "Identidade visual, painel e leitura das fontes", feito: true },
  { fase: "Fase 3", titulo: "RAG híbrido: busca de evidências com citação de documento e página", feito: false },
  { fase: "Fase 4", titulo: "GraphRAG: atores, relações e evidências em grafo", feito: false },
  { fase: "Fase 5", titulo: "Motor prospectivo: cenários condicionais e sinais antecipatórios", feito: false },
];

function Ilustracao() {
  // Desenhada no mesmo sistema do mapa (960×470): do presente, trajetórias se abrem para o horizonte.
  const ramos = [
    { y: 120, d: "M300 235 C 470 235, 520 120, 760 120" },
    { y: 235, d: "M300 235 C 470 235, 560 235, 760 235" },
    { y: 350, d: "M300 235 C 470 235, 520 350, 760 350" },
  ];
  return (
    <g aria-hidden="true">
      <defs>
        <clipPath id="futuros-revelados">
          <rect className="revelar-futuros" x="292" y="0" width="500" height="470" />
        </clipPath>
      </defs>
      <g clipPath="url(#futuros-revelados)">
      <path d="M300 235 L760 95 L760 375 Z" fill="rgb(233 180 91 / 0.06)" />
      <line x1="300" y1="40" x2="300" y2="430" stroke="rgb(243 246 250 / 0.35)" strokeDasharray="2 4" />
      <text x="308" y="56" fill="var(--color-texto-2)" style={{ font: "500 13px var(--font-dados)" }}>
        {ANO}
      </text>
      {ramos.map((r) => (
        <g key={r.y}>
          <path d={r.d} fill="none" stroke="rgb(233 180 91 / 0.75)" strokeWidth="1.6" strokeDasharray="5 5" />
          <path d={`M760 ${r.y - 7} 767 ${r.y} 760 ${r.y + 7} 753 ${r.y}Z`} fill="var(--color-abismo)" stroke="var(--color-ambar)" strokeWidth="1.6" />
        </g>
      ))}
      </g>
      <circle cx="300" cy="235" r="7" fill="var(--color-texto)" />
      <circle cx="300" cy="235" r="15" fill="none" stroke="var(--color-ciano)" strokeWidth="1.4" />
    </g>
  );
}

export function Landing() {
  const lateral = {
    paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
    paddingRight: "max(1.25rem, env(safe-area-inset-right))",
  };
  return (
    <div className="min-h-dvh bg-abismo text-texto">
      <header className="sticky top-0 z-30 border-b border-linha bg-abismo/90 backdrop-blur-md" style={lateral}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4">
          <Link to={ROTAS.landing} aria-label={MARCA.nome}>
            <Marca />
          </Link>
          <nav aria-label="Seções" className="hidden items-center gap-7 text-legenda text-texto-2 md:flex">
            <a href="#metodo" className="hover:text-texto">Método</a>
            <a href="#linguagem" className="hover:text-texto">Linguagem</a>
            <a href="#projeto" className="hover:text-texto">Estado do projeto</a>
          </nav>
          <Link to={ROTAS.entrar} className="botao botao-secundario botao-pequeno">
            Entrar
          </Link>
        </div>
      </header>

      <main>
        {/* Missão */}
        <section className="fundo-cartografico border-b border-linha" style={lateral}>
          <div className="mx-auto grid max-w-[1200px] items-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-24">
            <div className="flex flex-col gap-6">
              <p className="rotulo entrada">{MARCA.descritor}</p>
              <h1 className="entrada font-editorial text-[2.25rem] leading-[2.625rem] font-medium tracking-[-0.015em] sm:text-[3rem] sm:leading-[3.375rem]" style={{ "--atraso": "60ms" } as React.CSSProperties}>
                Compreender o poder no presente.{" "}
                <span className="text-texto-2">Investigar os futuros da ordem internacional.</span>
              </h1>
              <p className="entrada max-w-[56ch] text-leitura text-texto-2" style={{ "--atraso": "120ms" } as React.CSSProperties}>
                O Iris reúne evidências científicas rastreáveis, mapeia as relações entre os atores e
                constrói cenários condicionais — com premissas, incertezas e limitações à vista.
              </p>
              <div className="entrada flex flex-wrap gap-3" style={{ "--atraso": "180ms" } as React.CSSProperties}>
                <Link to={ROTAS.entrar} className="botao botao-primario">
                  Entrar na plataforma
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="#metodo" className="botao botao-secundario">
                  Conhecer o método
                </a>
              </div>
            </div>
            <figure className="entrada m-0" style={{ "--atraso": "240ms" } as React.CSSProperties}>
              <div className="overflow-hidden rounded-painel border border-linha bg-abismo">
                <Suspense fallback={<div className="esqueleto aspect-[960/470] w-full" />}>
                  <MapaMundo rotulo="Ilustração: do presente, trajetórias alternativas se abrem para o horizonte." intensidade="minima">
                    <Ilustracao />
                  </MapaMundo>
                </Suspense>
              </div>
              <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-micro text-texto-3">
                <span className="inline-flex items-center gap-1.5">
                  <GlifoEpistemico tipo="fato" tamanho={12} /> presente
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GlifoEpistemico tipo="cenario" tamanho={12} /> trajetórias condicionais
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GlifoEpistemico tipo="incerteza" tamanho={12} /> incerteza crescente
                </span>
                <span>Ilustração, sem dados.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Três dimensões */}
        <section aria-labelledby="dimensoes" style={lateral}>
          <div className="mx-auto max-w-[1200px] py-16">
            <h2 id="dimensoes" className="sr-only">
              Três dimensões
            </h2>
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {DIMENSOES.map((d) => (
                <div key={d.titulo} className="border-t border-linha-forte pt-5">
                  <h3 className="font-editorial text-secao text-texto">{d.titulo}</h3>
                  <p className="mt-2 text-corpo text-texto-2">{d.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Método */}
        <section id="metodo" aria-labelledby="titulo-metodo" className="scroll-mt-20 border-y border-linha bg-institucional/40" style={lateral}>
          <div className="mx-auto max-w-[1200px] py-16">
            <p className="rotulo mb-2">Método</p>
            <h2 id="titulo-metodo" className="max-w-[34ch] font-editorial text-titulo font-medium">
              Da pergunta aos sinais, cada etapa apoiada na anterior.
            </h2>
            <ol className="mt-10 grid list-none gap-0 p-0 lg:grid-cols-5">
              {METODO.map((m, i) => (
                <li key={m.titulo} className="relative flex flex-col border-t border-linha py-6 lg:border-t-0 lg:border-l lg:px-5 lg:py-0">
                  <span className="numeros font-dados text-micro text-texto-3">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 font-editorial text-secao text-texto">{m.titulo}</h3>
                  <p className="mt-2 text-legenda text-texto-2">{m.texto}</p>
                  <p
                    className={`mt-auto inline-flex items-center gap-1.5 pt-3 text-micro ${
                      m.estado === "disponivel" ? "text-ciano-texto" : m.estado === "proxima" ? "text-ambar" : "text-texto-3"
                    }`}
                  >
                    <span aria-hidden="true" className={`size-1.5 rounded-full ${m.estado === "disponivel" ? "bg-ciano" : m.estado === "proxima" ? "bg-ambar" : "border border-texto-3"}`} />
                    {ESTADO[m.estado]}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Linguagem epistêmica + rastreabilidade */}
        <section id="linguagem" aria-labelledby="titulo-linguagem" className="scroll-mt-20" style={lateral}>
          <div className="mx-auto grid max-w-[1200px] gap-12 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <p className="rotulo mb-2">Linguagem</p>
              <h2 id="titulo-linguagem" className="font-editorial text-titulo font-medium">
                Cada afirmação diz o que ela é.
              </h2>
              <p className="mt-3 max-w-[52ch] text-corpo text-texto-2">
                Fato, evidência, inferência, hipótese ou cenário: a interface marca o tipo de cada
                afirmação com uma forma própria. Nenhuma projeção aparece como fato estabelecido, e
                nenhuma probabilidade é exibida sem método declarado.
              </p>
              <div className="mt-8 rounded-painel border border-linha bg-institucional p-5">
                <p className="rotulo mb-3">Anatomia de uma afirmação rastreável</p>
                <div className="flex flex-col gap-3 text-legenda">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">
                      <GlifoEpistemico tipo="inferencia" />
                    </span>
                    <span className="text-texto">Afirmação analítica</span>
                  </div>
                  <div className="ml-2 flex items-start gap-2 border-l border-linha-forte pl-4">
                    <span className="mt-0.5">
                      <GlifoEpistemico tipo="evidencia" />
                    </span>
                    <span className="text-texto-2">
                      sustentada por <code className="font-dados text-ciano-texto">documento · p. 12</code>
                    </span>
                  </div>
                  <div className="ml-2 flex items-start gap-2 border-l border-linha-forte pl-4">
                    <span className="mt-0.5">
                      <GlifoEpistemico tipo="limitacao" />
                    </span>
                    <span className="text-texto-2">com as limitações do método declaradas</span>
                  </div>
                </div>
              </div>
            </div>
            <LegendaEpistemica />
          </div>
        </section>

        {/* Estado do projeto */}
        <section id="projeto" aria-labelledby="titulo-projeto" className="scroll-mt-20 border-t border-linha" style={lateral}>
          <div className="mx-auto grid max-w-[1200px] gap-10 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <p className="rotulo mb-2">Estado do projeto</p>
              <h2 id="titulo-projeto" className="font-editorial text-titulo font-medium">
                Em desenvolvimento, por etapas.
              </h2>
              <p className="mt-3 max-w-[48ch] text-corpo text-texto-2">
                Hoje o Iris recebe e organiza a base científica. A busca de evidências, o grafo de
                relações e os cenários chegam nas próximas fases.
              </p>
              <div className="mt-5">
                <Epistemico tipo="limitacao" rotulo="Versão de desenvolvimento: uso restrito a ambiente controlado" />
              </div>
            </div>
            <ol className="list-none p-0">
              {ROTEIRO.map((r) => (
                <li key={r.fase} className="grid grid-cols-[24px_88px_minmax(0,1fr)] items-start gap-3 border-b border-linha py-4">
                  <span className="mt-0.5" aria-hidden="true">
                    {r.feito ? (
                      <Check size={16} className="text-ciano" />
                    ) : (
                      <span className="mt-1 block size-3 rounded-full border border-texto-3" />
                    )}
                  </span>
                  <span className="font-dados text-legenda text-texto-3">{r.fase}</span>
                  <span className={r.feito ? "text-corpo text-texto" : "text-corpo text-texto-2"}>
                    {r.titulo}
                    <span className="sr-only">{r.feito ? " (concluída)" : " (a fazer)"}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Chamada */}
        <section className="border-t border-linha bg-institucional/40" style={lateral}>
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
            <p className="max-w-[30ch] font-editorial text-titulo">Toda investigação começa por uma pergunta.</p>
            <Link to={ROTAS.entrar} className="botao botao-primario">
              Entrar na plataforma
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-linha" style={lateral}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 py-8 text-micro text-texto-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-3">
            <Marca compacta />
            {MARCA.nome} · {MARCA.descritor}
          </span>
          <span>Versão em desenvolvimento · sem autenticação</span>
        </div>
      </footer>
    </div>
  );
}
