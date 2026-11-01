/** Validação compartilhada pelas telas de conta (e-mail e senha). */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validarEmail = (v: string) => (EMAIL.test(v.trim()) ? undefined : "Digite um e-mail válido, como nome@instituicao.org.");

/**
 * Regras de senha mostradas ao lado do campo (e lidas pelo leitor de tela via
 * aria-describedby). Comprimento acima de complexidade, como recomenda o NIST SP 800-63B.
 */
export const REGRAS_SENHA: { id: string; texto: string; ok: (s: string) => boolean }[] = [
  { id: "tamanho", texto: "Pelo menos 10 caracteres", ok: (s) => s.length >= 10 },
  { id: "letra-numero", texto: "Letras e pelo menos um número", ok: (s) => /[A-Za-zÀ-ÿ]/.test(s) && /\d/.test(s) },
];

export const validarSenhaNova = (s: string) =>
  REGRAS_SENHA.every((r) => r.ok(s)) ? undefined : "A senha ainda não atende às regras indicadas.";
