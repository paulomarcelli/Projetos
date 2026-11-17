import { ambientePadrao } from "../mundo/ambiente";
import type { Cena } from "./tipos";
import { BONECO_ORLA } from "./LuaSome";
import { bonecoParado, deslize, lerp3 } from "./util";

// Cena genérica para trecho sem cena escolhida ("provisoria" no JSON): vista da orla.
export const provisoria: Cena = {
  camera: ({ p }) => ({ pos: lerp3([30, 22, -10], [20, 26, -18], deslize(p)), alvo: [0, 4, -40], fov: 52 }),
  ambiente: () => ambientePadrao,
  boneco: () => bonecoParado(BONECO_ORLA, Math.PI),
};
