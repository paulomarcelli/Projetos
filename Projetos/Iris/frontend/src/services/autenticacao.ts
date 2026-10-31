/**
 * Ponto ÚNICO de integração das telas de autenticação (entrar, criar conta, recuperar e
 * redefinir senha) com o servidor.
 *
 * Situação real: a API do Projeto Iris (app/api) ainda não tem usuários, sessão, envio de
 * e-mail nem rotas de autenticação. Por isso cada função abaixo devolve `indisponivel` sem fazer
 * chamada de rede: as telas mostram isso com clareza e NUNCA exibem "conta criada", "e-mail
 * enviado" ou "senha alterada" sem confirmação do servidor.
 *
 * Quando a autenticação existir na API, só este arquivo muda: as telas já tratam os três
 * resultados (`ok`, `erro` com mensagem por campo, `indisponivel`). Regras para essa integração:
 * - a senha vai só no corpo da requisição HTTPS; nada de guardá-la no navegador;
 * - a sessão deve ser um cookie httpOnly emitido pelo servidor (não um token em localStorage);
 * - nenhuma chave secreta em variáveis `VITE_*`, que são públicas no build.
 */

export type CampoAuth = "nome" | "email" | "senha" | "confirmacao" | "token";

export type ResultadoAuth =
  /** `confirmarEmail`: o servidor exige confirmar o e-mail antes do primeiro acesso (cadastro). */
  | { tipo: "ok"; confirmarEmail?: boolean }
  | { tipo: "erro"; mensagem: string; campo?: CampoAuth }
  | { tipo: "indisponivel" };

const indisponivel = async (): Promise<ResultadoAuth> => ({ tipo: "indisponivel" });

export const autenticacao = {
  entrar: (_dados: { email: string; senha: string }) => indisponivel(),
  criarConta: (_dados: { nome: string; email: string; senha: string }) => indisponivel(),
  /** A resposta deve ser a mesma exista ou não a conta (não revela quem está cadastrado). */
  solicitarRecuperacao: (_dados: { email: string }) => indisponivel(),
  redefinirSenha: (_dados: { token: string; senha: string }) => indisponivel(),
};
