/**
 * O menu lateral da plataforma, sobre o SidebarNav (components/ui/dashboard-sidebar.tsx), discreto e com os itens que
 * existem de fato, na ordem de uso da conversa:
 *   Principal: Nova investigação (uma conversa nova), Histórico de análises, Base científica;
 *   Recentes: as últimas conversas, investigações e rascunhos deste navegador;
 *   Biblioteca: Fontes salvas (os favoritos da base científica);
 *   Sistema: Configurações (⌘,).
 * Não há "Análises salvas" nem "Coleções": as conversas já ficam no histórico, e coleções não existem. No pé: o tema, o
 * estado do sistema e "Voltar ao site". Cenários, mapa, timeline e fontes vivem DENTRO de cada resposta.
 *
 * No topo vai a marca Iris, no lugar da troca de workspace (a Iris não tem workspaces). As cores vêm dos tokens da Iris
 * (.iris-menu, em styles/globais.css), nos dois temas.
 */
import { Activity, FolderOpen, History, Library, LogOut, MessagesSquare, Moon, Plus, Settings, Star, Sun } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useDados } from "../../hooks/useDados";
import { useMinhasInvestigacoes } from "../research/historico/hooks/useMinhasInvestigacoes";
import { escolherTema, usePreferencias } from "../../store/preferencias";
import { ROTAS } from "../../config/rotas";
import { PREVIA } from "../../config/env";
import { prontidao } from "../../services/api";
import { Marca } from "../common/Marca";
import { SidebarNav, type NavGroupData, type NavItemData } from "../common/dashboard-sidebar";

/** Quantas investigações cabem no menu antes de "Ver todas". */
const LIMITE_NO_MENU = 6;

function useEstadoDoSistema() {
  const { tipo, dados } = useDados(prontidao, []);
  if (PREVIA) return "Prévia estática (sem servidor)";
  if (tipo === "carregando") return "Verificando…";
  if (tipo === "erro") return "API fora do ar";
  return dados.status === "ready" ? "Sistema operacional" : "Dependências pendentes";
}

/**
 * aberto=false recolhe a barra (largura zero). atalhos=false desliga o ⌘, desta instância: só uma pode
 * ouvir o teclado (a gaveta do celular monta uma segunda).
 */
export function MenuLateral({ aberto = true, atalhos = true, aoNavegar, className }: { aberto?: boolean; atalhos?: boolean; aoNavegar?: () => void; className?: string }) {
  const navegar = useNavigate();
  const local = useLocation();
  const { temaEfetivo } = usePreferencias();
  const investigacoes = useMinhasInvestigacoes();
  const estado = useEstadoDoSistema();
  const claro = temaEfetivo === "claro";

  // o destino de cada item, pelo id
  const destinos = useMemo(() => {
    const m = new Map<string, string>([
      ["nova", ROTAS.inicio],
      ["base", ROTAS.base],
      ["investigacoes", ROTAS.investigacoes],
      ["favoritos", ROTAS.favoritos],
      ["configuracoes", ROTAS.configuracoes],
      ["estado", ROTAS.configuracoes],
      ["site", ROTAS.landing],
    ]);
    for (const it of investigacoes) m.set(`inv-${it.tipo}-${it.id}`, it.para);
    return m;
  }, [investigacoes]);

  const grupos: NavGroupData[] = useMemo(
    () => [
      {
        heading: "Principal",
        items: [
          { id: "nova", title: "Nova investigação", icon: Plus },
          { id: "investigacoes", title: "Histórico de análises", icon: History, badge: investigacoes.length > LIMITE_NO_MENU ? investigacoes.length : undefined },
          { id: "base", title: "Base científica", icon: Library },
        ],
      },
      ...(investigacoes.length
        ? [
            {
              heading: "Recentes",
              items: investigacoes.slice(0, LIMITE_NO_MENU).map(
                (it): NavItemData => ({
                  id: `inv-${it.tipo}-${it.id}`,
                  title: it.titulo,
                  icon: it.tipo === "conversa" ? MessagesSquare : FolderOpen,
                  badge: it.tipo === "rascunho" ? "rascunho" : undefined,
                }),
              ),
            },
          ]
        : []),
      {
        heading: "Biblioteca",
        items: [{ id: "favoritos", title: "Fontes salvas", icon: Star }],
      },
      {
        heading: "Sistema",
        items: [{ id: "configuracoes", title: "Configurações", icon: Settings, shortcut: "⌘," }],
      },
    ],
    [investigacoes],
  );

  const rodape: NavItemData[] = [
    { id: "tema", title: claro ? "Usar tema escuro" : "Usar tema claro", icon: claro ? Sun : Moon },
    { id: "estado", title: estado, icon: Activity },
    { id: "site", title: "Voltar ao site", icon: LogOut },
  ];

  // o item ativo vem do endereço (a investigação aberta, inclusive o rascunho em ?rascunho=)
  const atual = local.pathname + local.search;
  const ativo = (() => {
    for (const it of investigacoes) if (atual.startsWith(it.para)) return `inv-${it.tipo}-${it.id}`;
    if (local.pathname === ROTAS.inicio) return "nova";
    if (local.pathname.startsWith(ROTAS.base)) return "base";
    if (local.pathname.startsWith(ROTAS.investigacoes)) return "investigacoes";
    if (local.pathname.startsWith(ROTAS.favoritos)) return "favoritos";
    if (local.pathname.startsWith(ROTAS.configuracoes)) return "configuracoes";
    return undefined;
  })();

  const escolher = (id: string) => {
    if (id === "tema") return escolherTema(claro ? "escuro" : "claro");
    const para = destinos.get(id);
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
        groups={grupos}
        footer={rodape}
        activeId={ativo}
        onSelect={escolher}
        shortcuts={atalhos}
      />
    </>
  );
}
