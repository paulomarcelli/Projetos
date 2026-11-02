import { createBrowserRouter, type RouteObject } from "react-router";
import { Estrutura } from "../components/layout/Estrutura";
import { PaginaInicio } from "../pages/PaginaInicio";
import { PaginaNovaAnalise } from "../pages/PaginaNovaAnalise";
import { PaginaAnalise } from "../pages/PaginaAnalise";
import { PaginaHistorico } from "../pages/PaginaHistorico";
import { PaginaGuardados } from "../pages/PaginaGuardados";
import { PaginaConfiguracoes } from "../pages/PaginaConfiguracoes";
import { PaginaPerfil } from "../pages/PaginaPerfil";
import { PaginaNaoEncontrada } from "../pages/PaginaNaoEncontrada";

/** Exportadas para os testes montarem com createMemoryRouter. */
export const definicaoDasRotas: RouteObject[] = [
  {
    element: <Estrutura />,
    children: [
      { path: "/", element: <PaginaInicio /> },
      { path: "/analises/nova", element: <PaginaNovaAnalise /> },
      { path: "/analises/:id", element: <PaginaAnalise /> },
      { path: "/historico", element: <PaginaHistorico /> },
      { path: "/guardados", element: <PaginaGuardados /> },
      { path: "/configuracoes", element: <PaginaConfiguracoes /> },
      { path: "/perfil", element: <PaginaPerfil /> },
      { path: "*", element: <PaginaNaoEncontrada /> },
    ],
  },
];

export const roteador = createBrowserRouter(definicaoDasRotas);
