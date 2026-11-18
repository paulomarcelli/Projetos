import { Pilula } from "../camadas/rotulos";
import { BONECO_LAJE } from "../mundo/Cidade";
import { POSICAO_SOL } from "../mundo/Sol";
import { ambienteDia, CronometroSol } from "./sol";
import type { Cena, Vec3 } from "./tipos";
import { bonecoParado, janela, lerp3, mirar, somar } from "./util";

// Sol · Q1 · Agora (Dia). A laje do Q1 da Lua, atrás do "você", de costas; o Sol forte no céu, sobre o mar.
// Em "agora?" o cronômetro aparece em 8:00 e começa a contar. O Sol continua aceso: a gente não ia perceber.
const CAMERA: Vec3 = somar(BONECO_LAJE, [0.35, 0.95, 7]);

export const solAgora: Cena = {
  camera: ({ p }) => {
    // mov/camera-deriva: dolly lento para a frente (3%).
    const pos = lerp3(CAMERA, somar(CAMERA, [0, 0.05, -0.5]), p);
    return { pos, alvo: mirar(pos, -4, 8), fov: 50 };
  },
  ambiente: () => ({ ...ambienteDia, lua: 0 }),
  boneco: () => ({ ...bonecoParado(BONECO_LAJE, Math.PI), olharCima: 0.55 }),
  contexto: () => ({ texto: "Agora" }),
  origemFechamento: POSICAO_SOL,
  Rotulos: (props) => (
    <>
      <Pilula texto="8 minutos sem saber" cor="vermelho" x={540} y={690} seg={props.seg} janela={janela(props, 0.2)} />
      <CronometroSol {...props} />
    </>
  ),
};
