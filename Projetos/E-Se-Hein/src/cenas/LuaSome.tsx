import { Easing } from "remotion";
import { Pilula } from "../camadas/rotulos";
import { ambienteNoite } from "../mundo/ambiente";
import { BONECO_LAJE } from "../mundo/Cidade";
import { POSICAO_LUA } from "../mundo/Lua";
import type { Cena, PropsCena, Vec3 } from "./tipos";
import { bonecoParado, janela, lerp3, mirar, somar } from "./util";

// Q1 · A Lua some (Noite). Atrás do "você", numa laje alta; a Lua cheia grande no centro.
// Em "desaparecesse" a Lua encolhe 4% e apaga em 24 quadros (mov/lua-some). Sem explosão.
const easeIn = Easing.in(Easing.cubic);
export const sumicoLua = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) => easeIn(Math.min(1, Math.max(0, ((seg - aos("desaparecesse")) * 30) / 24)));

const CAMERA: Vec3 = somar(BONECO_LAJE, [0.35, 0.95, 7]);

export const luaSome: Cena = {
  camera: ({ p }) => {
    // mov/camera-deriva: dolly lento para a frente (3%).
    const pos = lerp3(CAMERA, somar(CAMERA, [0, 0.05, -0.6]), p);
    return { pos, alvo: mirar(pos, 4.5, 3), fov: 50 };
  },
  ambiente: (props) => ({ ...ambienteNoite, lua: 1 - sumicoLua(props) }),
  boneco: () => ({ ...bonecoParado(BONECO_LAJE, Math.PI), olharCima: 0.45 }),
  contexto: () => ({ texto: "Hoje à noite" }),
  passagemAlvoSobe: 70,
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const lua = projetar(POSICAO_LUA);
    return <Pilula texto="Sem explosão" cor="vermelho" giro={-4} x={lua.x + 90} y={lua.y + 250} seg={seg} janela={janela(props, aos("sem"), aos("estaria"))} />;
  },
};
