/**
 * Todos os endereços da interface. A landing e o login ficam na raiz; a plataforma, em /app.
 * Trocar um caminho aqui troca em todos os links.
 */
export const ROTAS = {
  landing: "/",
  entrar: "/entrar",
  inicio: "/app",
  investigacoes: "/app/investigacoes",
  rascunho: (id: string) => `/app/investigacoes?rascunho=${encodeURIComponent(id)}`,
  base: "/app/base-cientifica",
  fonte: (id: string) => `/app/base-cientifica/${encodeURIComponent(id)}`,
  mapas: "/app/mapas",
  cenarios: "/app/cenarios",
  sinais: "/app/sinais",
  favoritos: "/app/favoritos",
  configuracoes: "/app/configuracoes",
  acervo: "/app/configuracoes/acervo",
  acervoDocumento: (id: string) => `/app/configuracoes/acervo/${encodeURIComponent(id)}`,
  designSystem: "/app/design-system",
} as const;
