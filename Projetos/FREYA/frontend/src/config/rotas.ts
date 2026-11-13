/** Mapa único de rotas. Componentes montam links só a partir daqui. */
export const rotas = {
  inicio: "/",
  novaAnalise: "/analises/nova",
  analise: (id: string) => `/analises/${id}`,
  historico: "/historico",
  guardados: "/guardados",
  configuracoes: "/configuracoes",
  perfil: "/perfil",
} as const;
