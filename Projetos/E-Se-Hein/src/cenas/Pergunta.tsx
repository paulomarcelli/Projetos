import { Cartao } from "../camadas/rotulos";
import { IconeLua, IconeMareAlta } from "../camadas/icones";
import { ambienteNoite } from "../mundo/ambiente";
import { BONECO_LAJE } from "../mundo/Cidade";
import { POSICAO_LUA } from "../mundo/Lua";
import type { Cena, Vec3 } from "./tipos";
import { bonecoParado, entra, janela, lerp, lerp3, mirar, somar } from "./util";

// Q7 · A pergunta (Noite). De volta à laje do Q1, agora de frente para o "você", com a Lua de volta
// atrás dele, à direita. Em "comentários" a câmera vai até a Lua, que vira o círculo laranja do fechamento.
const CAMERA: Vec3 = somar(BONECO_LAJE, [1.8, 1.05, 8.8]);

export const pergunta: Cena = {
  camera: ({ p, seg, aos }) => {
    const ida = entra(seg, aos("comentários") - 0.1, 0.9);
    const pos = lerp3(CAMERA, somar(CAMERA, [-0.3, 0.05, -0.5]), p);
    const alvo = lerp3(mirar(pos, 11.4, 6.5), POSICAO_LUA, ida);
    return { pos, alvo, fov: lerp(50, 16, ida) };
  },
  ambiente: () => ambienteNoite,
  boneco: ({ seg, aos }) => {
    const abre = entra(seg, aos("ia"), 0.5);
    return { ...bonecoParado(BONECO_LAJE, 0.2), ombros: abre, bracoDireito: 0.08 + 0.5 * abre, bracoEsquerdo: 0.08 + 0.5 * abre };
  },
  contexto: () => ({ texto: "E você?" }),
  Rotulos: (props) => {
    const { seg, aos } = props;
    const mares = entra(seg, aos("marés"), 0.01) > 0.5;
    return (
      <Cartao
        tipo="dois"
        y={478}
        seg={seg}
        janela={janela(props, aos("cheia") - 0.3, aos("comentários") - 0.1)}
        itens={[
          { icone: <IconeLua />, texto: "Lua cheia" },
          { icone: <div style={{ opacity: mares ? 1 : 0.25 }}><IconeMareAlta /></div>, texto: "Marés" },
        ]}
      />
    );
  },
};
