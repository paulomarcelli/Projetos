import { Cartao } from "../camadas/rotulos";
import { IconeLua, IconeOnda } from "../camadas/icones";
import { ambientePadrao } from "../mundo/ambiente";
import type { Cena } from "./tipos";
import { BONECO_ORLA } from "./LuaSome";
import { MARE_CHEIA } from "./Mares";
import { bonecoParado, deslize, entra, lerp3 } from "./util";

// Trecho 7: "E você? Ia sentir mais falta da lua cheia ou das marés?…"
// De volta à orla, com a Lua cheia; o boneco se vira para quem assiste e acena.
export const pergunta: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    const [bx, by, bz] = BONECO_ORLA;
    return {
      pos: lerp3([bx + 2.4, by + 2.3, bz + 14], [bx + 1.6, by + 2.3, bz + 12.5], d),
      alvo: lerp3([bx - 9, by + 8, bz - 100], [bx - 10, by + 9, bz - 100], d),
      fov: 52,
    };
  },
  ambiente: () => ({ ...ambientePadrao, mare: MARE_CHEIA }),
  boneco: ({ tempo }) => ({
    ...bonecoParado(BONECO_ORLA, 0.35),
    bracoDireito: 2.5 + 0.35 * Math.sin(tempo * 9),
  }),
  contexto: () => "E VOCÊ?",
  Rotulos: ({ seg, aos }) => (
    <Cartao
      x={480}
      y={470}
      aparece={entra(seg, aos("cheia") - 0.3)}
      separador="ou"
      itens={[
        { icone: <IconeLua />, texto: "Lua cheia" },
        { icone: <IconeOnda />, texto: entra(seg, aos("marés") - 0.2) > 0.5 ? "Marés" : "…" },
      ]}
    />
  ),
};
