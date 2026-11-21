import dados from "../../videos/ultima-pessoa.json";
import spec from "../../blender/ultima-pessoa.spec.json";
import type { ConfigV2 } from "./tipos";

// "E se você fosse a última pessoa do mundo?" (19/11/2026). Só os dados conferidos pela Sabrina em 18/11
// (agentes/relatorios/sabrina/2026-11-18-dados-ultima-pessoa.md) vão para a tela.

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Segundo em que a palavra é dita no trecho (1 a 9). */
function aos(palavra: string, trecho: number, n = 1): number {
  const achadas = dados.palavras.filter((p) => p.paragrafo === trecho - 1 && normalizar(p.texto) === normalizar(palavra));
  if (achadas.length < n) throw new Error(`"${palavra}" não está no trecho ${trecho} de videos/ultima-pessoa.json`);
  return achadas[n - 1].inicioMs / 1000;
}
const inicioDoTrecho = (trecho: number) => dados.trechos[trecho - 1].inicio;
const corte = (trecho: number) => (dados.trechos[trecho - 2].fim + dados.trechos[trecho - 1].inicio) / 2;

const PAULISTA = "Avenida Paulista, São Paulo";

export const ultimaPessoa: ConfigV2 = {
  spec,
  pastaBlender: "blender/ultima-pessoa",
  titulo: { texto: dados.titulo, inicio: 0, fim: aos("última", 1) - 0.4 },
  canto: [
    { inicio: 0, rotulo: "População do mundo", numero: "8,3", unidade: "bilhões", lugar: PAULISTA },
    { inicio: aos("última", 1), rotulo: "População do mundo", contagem: { de: 8.3e9, para: 1 }, lugar: PAULISTA },
    { inicio: inicioDoTrecho(3), rotulo: "Sozinho", numero: "primeiras", unidade: "horas", lugar: PAULISTA },
    { inicio: corte(4), rotulo: "Sozinho há", numero: "poucas", unidade: "horas" },
    { inicio: corte(5), rotulo: "Sozinho há", numero: "poucos", unidade: "dias", lugar: "Metrô" },
    { inicio: corte(6), rotulo: "Sozinho há", numero: "poucos", unidade: "dias" },
    { inicio: corte(7), rotulo: "Sozinho há", numero: "anos", lugar: PAULISTA },
    { inicio: corte(8), rotulo: "Moradores", numero: "49 mil", lugar: "Pripyat, Ucrânia · esvaziada em 27/04/1986" },
    { inicio: aos("está", 8), rotulo: "Sem moradores há", numero: "40", unidade: "anos", lugar: "Pripyat, Ucrânia" },
    { inicio: corte(9), rotulo: "População do mundo", numero: "1", lugar: PAULISTA },
  ],
  fatos: [{ inicio: corte(6) + 0.3, fim: corte(7) - 0.2, rotulo: "Geladeira sem energia", texto: "Comida segura por ~4 horas" }],
  // Planos com céu no topo levam o filtro degradê do céu (v2/grade/ceu-nd).
  comCeu: ["P1", "P2", "P3", "P5", "P6", "P7"],
};
