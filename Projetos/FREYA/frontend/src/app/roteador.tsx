import { createBrowserRouter, type RouteObject } from "react-router";
import { Estrutura } from "../components/layout/Estrutura";
import { PaginaInicio } from "../pages/PaginaInicio";

// O Início vai no pacote principal (é a primeira tela); as outras páginas carregam quando a rota abre,
// em pacotes separados (a análise e o grafo são os maiores).
const pagina = (carregar: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await carregar()).default });

/** Exportadas para os testes montarem com createMemoryRouter. */
export const definicaoDasRotas: RouteObject[] = [
  {
    element: <Estrutura />,
    children: [
      { path: "/", element: <PaginaInicio /> },
      { path: "/analises/nova", lazy: pagina(() => import("../pages/PaginaNovaAnalise").then((m) => ({ default: m.PaginaNovaAnalise }))) },
      { path: "/analises/:id", lazy: pagina(() => import("../pages/PaginaAnalise").then((m) => ({ default: m.PaginaAnalise }))) },
      { path: "/historico", lazy: pagina(() => import("../pages/PaginaHistorico").then((m) => ({ default: m.PaginaHistorico }))) },
      { path: "/guardados", lazy: pagina(() => import("../pages/PaginaGuardados").then((m) => ({ default: m.PaginaGuardados }))) },
      { path: "/configuracoes", lazy: pagina(() => import("../pages/PaginaConfiguracoes").then((m) => ({ default: m.PaginaConfiguracoes }))) },
      { path: "/perfil", lazy: pagina(() => import("../pages/PaginaPerfil").then((m) => ({ default: m.PaginaPerfil }))) },
      { path: "*", lazy: pagina(() => import("../pages/PaginaNaoEncontrada").then((m) => ({ default: m.PaginaNaoEncontrada }))) },
    ],
  },
];

export const roteador = createBrowserRouter(definicaoDasRotas);
