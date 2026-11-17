import { Pilula, TextoPreso } from "../camadas/rotulos";
import { ambientePadrao } from "../mundo/ambiente";
import { posicaoLuaOrbita, TERRA_POS } from "../mundo/Terra";
import type { Cena, Vec3 } from "./tipos";
import { MARE_TERCO } from "./Mares";
import { deslize, entra, lerp3 } from "./util";

// Trecho 6: "Ou seja: a Lua não é só bonita. Ela segura o nosso mundo no lugar."
const somar = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const terraLua: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    return { pos: lerp3(somar(TERRA_POS, [70, 24, 128]), somar(TERRA_POS, [-26, 60, 190]), d), alvo: somar(TERRA_POS, [0, -8, 0]), fov: 50 };
  },
  ambiente: ({ seg }) => {
    const volta = entra(seg, 0.1, 1.4);
    return {
      ...ambientePadrao,
      lua: 0,
      luar: 0,
      breu: 0.6,
      estrelas: 1,
      mare: MARE_TERCO,
      terra: 1,
      luaOrbita: volta,
      balanco: 0.35 * (1 - entra(seg, 0.4, 2.2)) * Math.sin(seg * 2.4),
    };
  },
  boneco: () => null,
  contexto: () => "COM LUA",
  Rotulos: ({ seg, aos, projetar, tempo }) => {
    const lua = projetar(posicaoLuaOrbita(tempo));
    return (
      <>
        <TextoPreso texto="Lua" x={lua.x} y={lua.y - 80} aparece={entra(seg, aos("lua") - 0.2)} />
        <Pilula texto="Eixo no lugar" cor="verde" x={480} y={400} aparece={entra(seg, aos("segura") - 0.2, 0.35)} />
      </>
    );
  },
};
