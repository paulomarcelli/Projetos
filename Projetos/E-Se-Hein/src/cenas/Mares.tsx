import { Cartao, Pilula } from "../camadas/rotulos";
import { IconeMareAlta, IconeMareBaixa } from "../camadas/icones";
import { ambienteNoite, MARE_AMP_COM_LUA, MARE_AMP_SEM_LUA, MARE_CENTRO } from "../mundo/ambiente";
import { alturaAreia, REGUA } from "../mundo/Praia";
import type { Cena, PropsCena, Vec3 } from "./tipos";
import { bonecoParado, entra, janela, lerp, lerp3 } from "./util";

// Q3 · Marés (Dia). Corte lateral da praia: mar à esquerda, areia subindo à direita, régua na água.
// Primeiro a água varia a faixa verde (com Lua); em "Sem ela", só a vermelha (~46%, conferido pela Sabrina).
export const semLua = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) => entra(seg, aos("sem"), 1.2);

const CAMERA: Vec3 = [REGUA[0] - 26, 0.9, REGUA[2] + 11];
const ALVO: Vec3 = [REGUA[0] + 6, -1.6, REGUA[2] + 7];
export const BONECO_PRAIA: Vec3 = [REGUA[0] + 3, alturaAreia(REGUA[2] + 19), REGUA[2] + 19];

export const mares: Cena = {
  camera: ({ p }) => ({ pos: lerp3(CAMERA, [CAMERA[0] + 1.2, CAMERA[1], CAMERA[2]], p), alvo: ALVO, fov: 40 }),
  ambiente: (props) => ({
    ...ambienteNoite,
    dia: 1,
    lua: 0,
    estrelas: 0,
    mareCentro: MARE_CENTRO,
    mareAmp: lerp(MARE_AMP_COM_LUA, MARE_AMP_SEM_LUA, semLua(props)),
  }),
  boneco: () => bonecoParado(BONECO_PRAIA, Math.PI),
  contexto: () => ({ texto: "Marés" }),
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const verde = projetar([REGUA[0], MARE_CENTRO + MARE_AMP_COM_LUA, REGUA[2]]);
    const vermelha = projetar([REGUA[0], MARE_CENTRO + MARE_AMP_SEM_LUA * 0.3, REGUA[2]]);
    return (
      <>
        <Cartao
          tipo="antes-depois"
          y={470}
          seg={seg}
          janela={janela(props, aos("marés"))}
          itens={[
            { icone: <IconeMareAlta />, texto: "Com Lua" },
            { icone: <IconeMareBaixa />, texto: "Sem Lua" },
          ]}
        />
        <Pilula texto="Com Lua" cor="verde" tamanho="P" x={verde.x + 150} y={verde.y - 10} seg={seg} janela={janela(props, aos("marés"))} />
        <Pilula texto="Sem Lua: ~metade" cor="vermelho" tamanho="P" x={vermelha.x + 220} y={vermelha.y + 50} seg={seg} janela={janela(props, aos("sem"))} />
      </>
    );
  },
};
