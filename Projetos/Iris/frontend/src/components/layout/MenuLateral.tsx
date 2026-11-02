/**
 * O menu lateral da plataforma, sobre o SidebarNav (components/common/dashboard-sidebar.tsx):
 *   Nova investigação (uma conversa nova), sem título de grupo;
 *   Inteligência: Investigações, Monitoramento, Exploração geopolítica (o mapa de relações);
 *   Conhecimento: Central de notícias, Base de conhecimento;
 *   Sistema: Configurações (⌘,), Ajuda e metodologia.
 * No pé, o usuário e o papel. O tema saiu do menu: é o ícone de sol/lua na barra do topo (layout/Cabecalho), à vista em
 * toda página. Cenários, mapa, timeline e fontes de uma investigação vivem DENTRO dela.
 *
 * No topo vai a marca Iris. As cores vêm dos tokens da Iris (.iris-menu, em styles/globais.css), nos dois temas.
 */
import { CircleHelp, Earth, FolderSearch, Library, Newspaper, Plus, Radar, Settings } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { usePreferencias } from "../../store/preferencias";
import { ROTAS } from "../../config/rotas";
import { Marca } from "../common/Marca";
import { SidebarNav, type NavGroupData } from "../common/dashboard-sidebar";

/** O destino de cada item, pelo id. */
const DESTINOS = new Map<string, string>([
  ["nova", ROTAS.inicio],
  ["investigacoes", ROTAS.investigacoes],
  ["monitoramento", ROTAS.monitoramento],
  ["exploracao", ROTAS.relacoes],
  ["noticias", ROTAS.noticias],
  ["base", ROTAS.base],
  ["configuracoes", ROTAS.configuracoes],
  ["ajuda", ROTAS.ajuda],
]);

const GRUPOS: NavGroupData[] = [
  { items: [{ id: "nova", title: "Nova investigação", icon: Plus }] },
  {
    heading: "Inteligência",
    items: [
      { id: "investigacoes", title: "Investigações", icon: FolderSearch },
      { id: "monitoramento", title: "Monitoramento", icon: Radar },
      { id: "exploracao", title: "Exploração geopolítica", icon: Earth },
    ],
  },
  {
    heading: "Conhecimento",
    items: [
      { id: "noticias", title: "Central de notícias", icon: Newspaper },
      { id: "base", title: "Base de conhecimento", icon: Library },
    ],
  },
  {
    heading: "Sistema",
    items: [
      { id: "configuracoes", title: "Configurações", icon: Settings, shortcut: "⌘," },
      { id: "ajuda", title: "Ajuda e metodologia", icon: CircleHelp },
    ],
  },
];

/** O usuário no pé do menu. Sem contas ainda: o nome e o papel são os padrões da plataforma. */
function Usuario({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <Link
      to={ROTAS.configuracoes}
      onClick={aoNavegar}
      aria-label="Usuário, Analista. Abrir configurações"
      className="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 transition-colors duration-200 hover:bg-[var(--ds-active)]"
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full border border-linha-forte bg-grafite text-legenda font-medium text-texto"
      >
        U
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[13px] font-medium text-[var(--ds-fg)]">Usuário</span>
        <span className="truncate text-[12px] text-[var(--ds-muted)]">Analista</span>
      </span>
    </Link>
  );
}

/**
 * aberto=false recolhe a barra (largura zero). atalhos=false desliga o ⌘, desta instância: só uma pode
 * ouvir o teclado (a gaveta do celular monta uma segunda).
 */
export function MenuLateral({
  aberto = true,
  atalhos = true,
  aoNavegar,
  className,
}: {
  aberto?: boolean;
  atalhos?: boolean;
  aoNavegar?: () => void;
  className?: string;
}) {
  const navegar = useNavigate();
  const local = useLocation();
  const { temaEfetivo } = usePreferencias();
  const claro = temaEfetivo === "claro";

  // o item ativo vem do endereço; a análise de uma investigação fica sob "Investigações"
  const ativo = useMemo(() => {
    const p = local.pathname;
    if (p === ROTAS.inicio || p.startsWith("/app/conversas") || p.startsWith(ROTAS.novaComParametros)) return "nova";
    for (const [id, para] of DESTINOS) if (id !== "nova" && p.startsWith(para)) return id;
    return undefined;
  }, [local.pathname]);

  const escolher = (id: string) => {
    const para = DESTINOS.get(id);
    if (!para) return;
    navegar(para);
    aoNavegar?.();
  };

  return (
    <>
      <SidebarNav
        className={"iris-menu" + (className ? " " + className : "")}
        aria-label="Menu lateral"
        theme={claro ? "light" : "dark"}
        open={aberto}
        header={
          <Link to={ROTAS.inicio} onClick={aoNavegar} className="rounded-fino" aria-label="Iris, nova investigação">
            <Marca altura={24} />
          </Link>
        }
        groups={GRUPOS}
        footerTop={<Usuario aoNavegar={aoNavegar} />}
        activeId={ativo}
        onSelect={escolher}
        shortcuts={atalhos}
      />
    </>
  );
}
