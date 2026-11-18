import { IconeCronometro } from "../camadas/icones";
import { Cartao } from "../camadas/rotulos";
import { BONECO_LAJE } from "../mundo/Cidade";
import { POSICAO_SOL } from "../mundo/Sol";
import { ambienteDia } from "./sol";
import type { Cena, Vec3 } from "./tipos";
import { bonecoParado, entra, janela, lerp, lerp3, mirar, somar } from "./util";

// Sol · Q5 · A pergunta (Dia). De volta à laje, de frente para o "você", com o Sol aceso atrás dele: os últimos
// oito minutos de luz. Em "comentários" a câmera vai até o Sol, que vira o círculo laranja do fechamento.
const CAMERA: Vec3 = somar(BONECO_LAJE, [-1.2, 1.05, 8.8]);

export const solPergunta: Cena = {
  camera: ({ p, seg, aos }) => {
    const ida = entra(seg, aos("comentários") - 0.1, 0.9);
    const pos = lerp3(lerp3(CAMERA, somar(CAMERA, [0.3, 0.05, -0.5]), p), somar(CAMERA, [1.2, 2.6, -9]), ida);
    const alvo = lerp3(mirar(pos, -1, 6.5), POSICAO_SOL, ida);
    return { pos, alvo, fov: lerp(50, 16, ida) };
  },
  ambiente: () => ({ ...ambienteDia, lua: 0 }),
  boneco: ({ seg, aos }) => {
    const abre = entra(seg, aos("ia"), 0.5);
    return { ...bonecoParado(BONECO_LAJE, -0.15), ombros: abre, bracoDireito: 0.08 + 0.5 * abre, bracoEsquerdo: 0.08 + 0.5 * abre };
  },
  origemFechamento: POSICAO_SOL,
  Rotulos: (props) => (
    <Cartao tipo="um" y={560} seg={props.seg} janela={janela(props, props.aos("últimos") - 0.3, props.aos("comentários") - 0.1)} itens={[{ icone: <IconeCronometro />, texto: "8 minutos" }]} />
  ),
};
