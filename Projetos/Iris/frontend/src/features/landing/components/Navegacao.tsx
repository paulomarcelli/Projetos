/**
 * Barra do topo da landing: marca, âncoras das seções, Entrar e Começar. Fica presa ao rolar; ganha fundo só depois
 * de sair do topo (sem desfoque de fundo: desfocar o que rola por baixo custa a cada quadro).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Marca } from "../../../components/ui/Marca";
import { ROTAS } from "../../../config/rotas";

const ANCORAS = [
  { href: "#demonstracao", rotulo: "Como funciona" },
  { href: "#recursos", rotulo: "Recursos" },
  { href: "#metodo", rotulo: "Método" },
  { href: "#projeto", rotulo: "Projeto" },
];

export function Navegacao() {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 12);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color] duration-300 ${rolou ? "border-b border-[color:var(--lp-linha)] bg-[color:var(--lp-noite)]/92" : "border-b border-transparent"}`}
    >
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link to={ROTAS.landing} aria-label="Iris, início" className="shrink-0">
          <Marca altura={24} />
        </Link>
        <ul className="m-0 hidden list-none gap-6 p-0 md:flex">
          {ANCORAS.map((a) => (
            <li key={a.href}>
              <a href={a.href} className="text-[0.875rem] text-[color:var(--lp-texto-2)] transition-colors duration-150 hover:text-[color:var(--lp-texto)]">
                {a.rotulo}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <Link to={ROTAS.entrar} className="lp-botao !min-h-9 text-[color:var(--lp-texto-2)] hover:text-[color:var(--lp-texto)]">
            Entrar
          </Link>
          <Link to={ROTAS.inicio} className="lp-botao lp-botao-ouro !min-h-9 !px-4 !text-[0.875rem]">
            Começar
          </Link>
        </div>
      </nav>
    </header>
  );
}
