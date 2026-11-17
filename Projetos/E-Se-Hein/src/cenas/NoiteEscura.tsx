import { Pilula, TextoPreso } from "../camadas/rotulos";
import { ambientePadrao } from "../mundo/ambiente";
import type { Cena } from "./tipos";
import { BONECO_ORLA } from "./LuaSome";
import { bonecoParado, deslize, entra, lerp, lerp3 } from "./util";

// Trecho 2: "A primeira coisa que você ia notar é o escuro…"
// A câmera sobe e sai para o mar; o céu escurece, as estrelas aparecem; a cidade fica acesa.
export const noiteEscura: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    return { pos: lerp3([8, 5, -20], [72, 58, -125], d), alvo: lerp3([-8, 12, -135], [0, 4, 20], d), fov: lerp(52, 56, d) };
  },
  ambiente: ({ seg, aos }) => {
    const preto = entra(seg, aos("pretas") - 1, 1.5);
    return { ...ambientePadrao, lua: 0, luar: 0, breu: lerp(0.35, 1, preto), estrelas: lerp(0.65, 1, preto) };
  },
  boneco: () => ({ ...bonecoParado(BONECO_ORLA, Math.PI), olharCima: 0.6, bracoDireito: 0.4, bracoEsquerdo: 0.4 }),
  contexto: () => "1ª NOITE",
  Rotulos: ({ seg, aos, projetar }) => {
    const cidade = projetar([0, 26, 50]);
    return (
      <>
        <Pilula texto="Sem luar" cor="vermelho" x={480} y={420} aparece={entra(seg, aos("escuro") - 0.2, 0.35)} />
        <TextoPreso texto="Cidade acesa" x={cidade.x} y={cidade.y} aparece={entra(seg, aos("cidades") - 0.2)} />
        <TextoPreso texto="Breu" tamanho={64} x={300} y={330} aparece={entra(seg, aos("pretas") - 0.1)} />
      </>
    );
  },
};
