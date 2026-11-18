import { Easing } from "remotion";
import { Pilula } from "../camadas/rotulos";
import { BONECO_LAJE } from "../mundo/Cidade";
import { POSICAO_SOL } from "../mundo/Sol";
import { ambienteDia, CronometroSol } from "./sol";
import type { Cena, PropsCena, Vec3 } from "./tipos";
import { bonecoParado, entra, janela, lerp, lerp3, mirar, somar } from "./util";

// Sol · Q3 · Tudo apaga (Dia para Breu). De volta à laje, um pouco mais aberto: o Sol no alto à direita e a Lua
// à esquerda. Em "apaga" a última luz chega: o Sol some (24 quadros) e o céu vai do Dia ao Breu (45 quadros,
// mov/modo-cor). A Lua ainda brilha um instante e some em "Lua" (mov/lua-some): ela só reflete a luz do Sol.
const easeIn = Easing.in(Easing.cubic);
const CAMERA: Vec3 = somar(BONECO_LAJE, [0.4, 0.75, 8]);

const apagou = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) => easeIn(Math.min(1, Math.max(0, ((seg - aos("apaga")) * 30) / 24)));
const escureceu = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) => Math.min(1, Math.max(0, ((seg - aos("apaga")) * 30) / 45));
const luaSumiu = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) => easeIn(Math.min(1, Math.max(0, ((seg - aos("lua")) * 30) / 24)));

export const solApaga: Cena = {
  camera: ({ p }) => {
    const pos = lerp3(CAMERA, somar(CAMERA, [0, 0.05, -0.6]), p);
    return { pos, alvo: mirar(pos, -2.5, 12), fov: 55 };
  },
  ambiente: (props) => {
    const e = escureceu(props);
    return {
      ...ambienteDia,
      dia: 1 - e,
      breu: e,
      sol: 1 - apagou(props),
      lua: lerp(ambienteDia.lua, 1, e) * (1 - luaSumiu(props)),
      estrelas: e,
      // Sem Sol, o mar não reflete o céu da noite (o HDRI noturno tem o horizonte alaranjado), e o domo de luz da
      // cidade (feito para ser visto de longe) não entra: a câmera está dentro da cidade.
      reflexo: 1 - e,
      domo: 1 - e,
    };
  },
  boneco: ({ seg, aos }) => ({ ...bonecoParado(BONECO_LAJE, Math.PI), olharCima: 0.5 + 0.2 * entra(seg, aos("apaga"), 0.6) }),
  passagemAlvoSobe: 0,
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const sol = projetar(POSICAO_SOL);
    return (
      <>
        <Pilula texto="Sem luz" cor="vermelho" giro={-4} x={sol.x - 40} y={sol.y} seg={seg} janela={janela(props, aos("apaga"))} />
        <CronometroSol {...props} />
      </>
    );
  },
};
