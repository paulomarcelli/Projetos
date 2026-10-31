/**
 * Variáveis de ambiente do build, lidas num lugar só.
 *
 * - PREVIA: build de prévia estática (`vite --mode previa`): dados de exemplo, sem servidor.
 * - API_BASE: endereço da API (VITE_API_BASE). Vazio = mesma origem (em desenvolvimento, o proxy do Vite).
 * - BASE_PUBLICA: de onde saem os arquivos de `public/` (a prévia é servida de uma subpasta qualquer).
 *
 * Não ficam aqui, de propósito: as guardas de código de desenvolvimento e de prévia que o build precisa
 * descartar (`import.meta.env.DEV` e `import.meta.env.MODE === "previa"` escritos no próprio ponto de uso).
 * Nunca ponha chave secreta em variável `VITE_*`: elas são públicas no build.
 */
export const PREVIA = import.meta.env.MODE === "previa";
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
export const BASE_PUBLICA = import.meta.env.BASE_URL;
