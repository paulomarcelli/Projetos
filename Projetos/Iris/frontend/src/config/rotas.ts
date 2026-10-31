/**
 * Todos os endereços da interface. A landing e as telas de conta (entrar, criar conta, recuperar
 * e redefinir senha) ficam na raiz; a plataforma, em /app.
 * Trocar um caminho aqui troca em todos os links.
 */
export const ROTAS = {
  landing: "/",
  entrar: "/entrar",
  criarConta: "/criar-conta",
  recuperarSenha: "/recuperar-senha",
  redefinirSenha: "/redefinir-senha",
  inicio: "/app",
  conversa: (id: string) => `/app/conversas/${encodeURIComponent(id)}`,
  /** O formulário com horizonte, regiões e dimensões (o ponto de entrada anterior à conversa). */
  novaComParametros: "/app/nova",
  investigacoes: "/app/investigacoes",
  investigacao: (id: string) => `/app/investigacoes/${encodeURIComponent(id)}`,
  relacoes: "/app/relacoes",
  relacoesDe: (id: string) => `/app/relacoes/${encodeURIComponent(id)}`,
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
