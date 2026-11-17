import { LinhaPontilhada, Pilula, SetaCurva, TextoPreso } from "../camadas/rotulos";
import { ambienteNoite, MARE_AMP_SEM_LUA } from "../mundo/ambiente";
import { LUA_ESPACO_OFFSET, poloNorte, TERRA_POS, TERRA_RAIO } from "../mundo/Terra";
import type { Cena, Vec3 } from "./tipos";
import { entra, janela, lerp3, somar } from "./util";

// Q6 · Terra e Lua (espaço). Câmera recuada: Terra embaixo à esquerda, Lua no alto à direita
// (27% do diâmetro da Terra; distância fora de escala). O eixo para de balançar e fica firme.
const LUA: Vec3 = somar(TERRA_POS, LUA_ESPACO_OFFSET);
const ALVO: Vec3 = somar(TERRA_POS, [LUA_ESPACO_OFFSET[0] * 0.5, LUA_ESPACO_OFFSET[1] * 0.45, LUA_ESPACO_OFFSET[2] * 0.5]);

const balanco = (seg: number) => 0.25 * (1 - entra(seg, 0.2, 2.4)) * Math.sin(seg * 3);

export const terraLua: Cena = {
  camera: ({ p }) => {
    const pos = lerp3(somar(ALVO, [-6, 4, 300]), somar(ALVO, [-8, 6, 312]), p);
    return { pos, alvo: ALVO, fov: 50 };
  },
  ambiente: ({ seg }) => ({ ...ambienteNoite, lua: 0, estrelas: 1, espaco: 1, terra: 1, mareAmp: MARE_AMP_SEM_LUA, luaEspaco: 1, balanco: balanco(seg) }),
  boneco: () => null,
  contexto: () => ({ texto: "Terra e Lua" }),
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const lua = projetar(LUA);
    const terra = projetar(TERRA_POS);
    const borda = projetar(somar(TERRA_POS, [TERRA_RAIO * 0.75, -TERRA_RAIO * 1.1, 0]));
    const polo = projetar(poloNorte(balanco(seg)));
    const segura = janela(props, aos("ajuda"));
    return (
      <>
        <LinhaPontilhada de={[lua.x, lua.y]} para={[terra.x, terra.y]} seg={seg} janela={janela(props, 0.2)} />
        <TextoPreso texto="Lua" guia x={lua.x} y={lua.y - 30} seg={seg} janela={janela(props, aos("lua"))} />
        <TextoPreso texto="Terra" x={borda.x + 60} y={borda.y} seg={seg} janela={janela(props, aos("lua"))} />
        <SetaCurva cx={polo.x} cy={polo.y} raio={52} de={-Math.PI * 0.95} ate={-Math.PI * 0.1} cor="verde" seg={seg} janela={segura} />
        <Pilula texto="Estabiliza o eixo" cor="verde" x={350} y={330} seg={seg} janela={segura} />
      </>
    );
  },
};
