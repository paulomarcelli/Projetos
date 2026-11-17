import { Pilula, Seta, TextoPreso } from "../camadas/rotulos";
import { ambientePadrao } from "../mundo/ambiente";
import { alturaAreia, nivelAgua, REGUA } from "../mundo/Praia";
import type { Cena } from "./tipos";
import { bonecoParado, deslize, entra, lerp, lerp3 } from "./util";

// Trecho 3: "Depois, o mar… as marés ficariam com mais ou menos um terço do tamanho."
// Régua da maré na água; o nível desce até 1/3.
export const MARE_CHEIA = 1.9;
export const MARE_TERCO = MARE_CHEIA / 3;

const descida = (seg: number, aos: (p: string) => number) => entra(seg, aos("ficariam"), 2.4);

export const mares: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    return { pos: lerp3([22.5, 0.9, -54], [21, 1.3, -53], d), alvo: lerp3([14, -0.6, -66], [13.5, -0.4, -66], d), fov: 50 };
  },
  ambiente: ({ seg, aos }) => ({
    ...ambientePadrao,
    lua: 0,
    luar: 0,
    breu: 0.5,
    estrelas: 0.9,
    mare: lerp(MARE_CHEIA, MARE_TERCO, descida(seg, aos)),
  }),
  boneco: ({ seg, aos }) => ({
    ...bonecoParado([11.5, alturaAreia(-53), -53], Math.PI * 0.8),
    apontar: entra(seg, aos("marés"), 0.4) * (1 - entra(seg, aos("tamanho"), 0.6)),
  }),
  contexto: () => "SEM LUA",
  Rotulos: ({ seg, aos, projetar }) => {
    const alto = projetar([REGUA[0] - 2.5, nivelAgua(MARE_CHEIA), REGUA[2]]);
    const baixo = projetar([REGUA[0] - 2.5, nivelAgua(MARE_TERCO), REGUA[2]]);
    const topo = projetar([REGUA[0], 3, REGUA[2]]);
    const terco = entra(seg, aos("terço") - 0.2, 0.35);
    return (
      <>
        <TextoPreso texto="Maré" x={topo.x} y={topo.y - 60} aparece={entra(seg, aos("marés") - 0.2)} />
        <Pilula texto="Com Lua" cor="verde" x={alto.x - 190} y={alto.y} aparece={entra(seg, aos("marés")) * (1 - terco)} />
        <Seta de={[alto.x - 40, alto.y]} para={[baixo.x - 40, baixo.y]} cor="vermelho" aparece={entra(seg, aos("ficariam"), 2.4)} />
        <Pilula texto="Maré 1/3" cor="vermelho" x={baixo.x - 210} y={baixo.y + 10} aparece={terco} />
      </>
    );
  },
};
