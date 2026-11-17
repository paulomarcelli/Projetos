declare module "*.woff2" {
  const url: string;
  export default url;
}

interface RequireContexto {
  keys(): string[];
  <T>(id: string): T;
}
declare const require: { context(pasta: string, recursivo: boolean, filtro: RegExp): RequireContexto };
