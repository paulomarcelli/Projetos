declare module "*.woff2" {
  const url: string;
  export default url;
}

interface RequireContexto {
  keys(): string[];
  <T>(id: string): T;
}
declare const require: { context(pasta: string, recursivo: boolean, filtro: RegExp): RequireContexto };

// O Remotion copia para o bundle as variáveis de ambiente que começam com REMOTION_.
declare const process: { env: Record<string, string | undefined> };
