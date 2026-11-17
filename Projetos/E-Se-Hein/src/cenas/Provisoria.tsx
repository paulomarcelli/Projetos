import { ambienteNoite } from "../mundo/ambiente";
import { BONECO_LAJE } from "../mundo/Cidade";
import type { Cena } from "./tipos";
import { bonecoParado, lerp3 } from "./util";

// Cena genérica para trecho sem cena escolhida ("provisoria" no JSON): vista da cidade.
export const provisoria: Cena = {
  camera: ({ p }) => ({ pos: lerp3([60, 60, -40], [52, 64, -46], p), alvo: [0, 10, 60], fov: 50 }),
  ambiente: () => ambienteNoite,
  boneco: () => bonecoParado(BONECO_LAJE, Math.PI),
};
