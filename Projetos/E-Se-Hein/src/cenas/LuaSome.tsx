import { TextoPreso, Pilula } from "../camadas/rotulos";
import { ambientePadrao } from "../mundo/ambiente";
import { ORLA_Z } from "../mundo/Cidade";
import { POSICAO_LUA } from "../mundo/Lua";
import type { Cena, Vec3 } from "./tipos";
import { bonecoParado, deslize, entra, lerp3 } from "./util";

// Trecho 1: "E se, hoje à noite, a Lua simplesmente desaparecesse?…"
// O boneco olha a Lua no céu, e ela só apaga (sem explosão).
export const BONECO_ORLA: Vec3 = [4, 0.05, ORLA_Z - 5];

const sumico = (seg: number, aos: (p: string) => number) => entra(seg, aos("estaria"), 1.4);

export const luaSome: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    const [bx, by, bz] = BONECO_ORLA;
    return {
      pos: lerp3([bx + 3, by + 2.2, bz + 15], [bx + 1.6, by + 2.4, bz + 13], d),
      alvo: lerp3([bx - 10, by + 8, bz - 100], [bx - 11, by + 10, bz - 100], d),
      fov: 52,
    };
  },
  ambiente: ({ seg, aos }) => {
    const s = sumico(seg, aos);
    return { ...ambientePadrao, lua: 1 - s, luar: 1 - s, breu: 0.35 * s, estrelas: 0.35 + 0.3 * s };
  },
  boneco: ({ seg, aos }) => {
    const ombros = entra(seg, aos("só"), 0.4) * (1 - entra(seg, aos("lá"), 0.6));
    return {
      ...bonecoParado(BONECO_ORLA, Math.PI),
      olharCima: 0.85 * entra(seg, aos("lua") - 0.6, 0.9),
      bracoDireito: 0.12 + 0.9 * ombros,
      bracoEsquerdo: 0.12 + 0.9 * ombros,
    };
  },
  contexto: () => "HOJE À NOITE",
  Rotulos: ({ seg, aos, projetar }) => {
    const lua = projetar(POSICAO_LUA);
    const s = sumico(seg, aos);
    return (
      <>
        <TextoPreso texto="Lua" x={lua.x} y={lua.y + 150} aparece={entra(seg, aos("lua") - 0.2) * (1 - s)} />
        <Pilula texto="Sem Lua" cor="vermelho" x={lua.x} y={lua.y} aparece={entra(seg, aos("lá") - 0.2, 0.35)} />
      </>
    );
  },
};
