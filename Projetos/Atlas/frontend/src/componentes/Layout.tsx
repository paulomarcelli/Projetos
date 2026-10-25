import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api/cliente";
import type { Saude } from "../api/tipos";
import { NOME_BUSCA, NOME_IA } from "../lib/rotulos";
import { useTema, type Tema } from "../lib/tema";
import { SeloDemo } from "./Selos";

const ITENS = [
  { para: "/", rotulo: "Painel", icone: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { para: "/nova", rotulo: "Nova simulação", icone: "M12 5v14M5 12h14" },
  { para: "/historico", rotulo: "Histórico", icone: "M12 8v4l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" },
  { para: "/comparar", rotulo: "Comparar", icone: "M8 3v18M16 3v18M3 8h5M16 16h5" },
  { para: "/configuracoes", rotulo: "Configurações", icone: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" },
];

function Icone({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <svg aria-hidden viewBox="0 0 32 32" className="h-8 w-8">
        <rect width="32" height="32" rx="7" fill="rgb(var(--painel-2))" />
        <circle cx="16" cy="16" r="9.5" fill="none" stroke="rgb(var(--acento))" strokeWidth="2" />
        <ellipse cx="16" cy="16" rx="4" ry="9.5" fill="none" stroke="rgb(var(--acento))" strokeWidth="1.4" />
        <path d="M6.5 16h19" stroke="rgb(var(--acento))" strokeWidth="1.4" />
      </svg>
      <div className="leading-tight">
        <p className="font-mono text-sm font-medium tracking-[0.2em]">ATLAS</p>
        <p className="text-2xs text-suave">Geopolitical Simulation Engine</p>
      </div>
    </div>
  );
}

const OPCOES_TEMA: { valor: Tema; rotulo: string; icone: string }[] = [
  { valor: "sistema", rotulo: "Sistema", icone: "M4 5h16v11H4zM8 20h8M12 16v4" },
  { valor: "claro", rotulo: "Claro", icone: "M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { valor: "escuro", rotulo: "Escuro", icone: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" },
];

export function SeletorTema({ compacto }: { compacto?: boolean }) {
  const [tema, setTema] = useTema();
  return (
    <div role="radiogroup" aria-label="Tema" className={`${compacto ? "inline-flex" : "grid w-full grid-cols-3"} rounded-lg border border-borda bg-painel p-0.5`}>
      {OPCOES_TEMA.map((o) => (
        <button key={o.valor} type="button" role="radio" aria-checked={tema === o.valor} title={o.rotulo} onClick={() => setTema(o.valor)}
          className={`inline-flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-md px-1.5 text-xs transition-colors duration-150 ${tema === o.valor ? "bg-painel2 text-texto" : "text-suave hover:text-texto"}`}>
          <Icone d={o.icone} />
          {!compacto && <span>{o.rotulo}</span>}
          {compacto && <span className="sr-only">{o.rotulo}</span>}
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const [saude, setSaude] = useState<Saude | null>(null);
  const local = useLocation();
  useEffect(() => { api.saude().then(setSaude).catch(() => setSaude(null)); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [local.pathname]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm transition-colors ${isActive ? "bg-painel2 text-texto" : "text-suave hover:text-texto"}`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-acento focus:px-3 focus:py-2 focus:text-sobreAcento">Pular para o conteúdo</a>
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-borda bg-painel/60 px-4 py-6 lg:flex">
        <Marca />
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {ITENS.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.para === "/"} className={link}>
              <Icone d={i.icone} /> {i.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 text-xs text-suave">
          <SeletorTema />
          {saude?.modo.demonstrativo && <SeloDemo />}
          {saude && !saude.modo.demonstrativo && <p className="quebra">IA: {NOME_IA[saude.modo.ia]}{saude.modelo ? ` (${saude.modelo})` : ""} · Busca: {NOME_BUSCA[saude.modo.busca]}</p>}
          {!saude && <p className="text-alto">Servidor indisponível</p>}
          <p>Demonstração acadêmica — FECAP</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-borda bg-fundo/90 px-4 py-3 backdrop-blur lg:hidden">
        <Marca />
        <div className="flex items-center gap-2">
          {saude?.modo.demonstrativo && <SeloDemo compacto />}
          <SeletorTema compacto />
        </div>
      </header>

      <main id="conteudo" className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <Outlet context={saude} />
        </div>
      </main>

      <nav aria-label="Principal (móvel)" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borda bg-painel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {ITENS.map((i) => (
          <NavLink key={i.para} to={i.para} end={i.para === "/"} className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-2xs ${isActive ? "text-acento" : "text-suave"}`}>
            <Icone d={i.icone} />
            <span className="max-w-full truncate px-1">{i.rotulo.replace(" simulação", "")}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
