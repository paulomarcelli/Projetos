import { Pilula, TextoPreso } from "../camadas/rotulos";
import { ambienteNoite } from "../mundo/ambiente";
import { CENTRO_CIDADE } from "../mundo/Cidade";
import { BONECO_MORRO } from "../mundo/Morro";
import type { Cena, Vec3 } from "./tipos";
import { bonecoParado, janela, lerp, mirar, somar } from "./util";

// Q2 · Noite preta (Breu). De lado e baixo, no alto de um morro fora da cidade; muitas estrelas.
// A cidade fica pequena no horizonte, à esquerda, com o domo de luz. Pan lento para a direita.
const paraCidade = Math.atan2(-(CENTRO_CIDADE[0] - BONECO_MORRO[0]), -(CENTRO_CIDADE[2] - BONECO_MORRO[2])) * (180 / Math.PI);
const rumo = (p: number) => paraCidade - lerp(7, 11, p);
const r0 = (rumo(0) * Math.PI) / 180;
const frente: Vec3 = [-Math.sin(r0), 0, -Math.cos(r0)];
const direita: Vec3 = [-frente[2], 0, frente[0]];
const CAMERA: Vec3 = somar(BONECO_MORRO, [-frente[0] * 6.5 - direita[0] * 1, 0.55, -frente[2] * 6.5 - direita[2] * 1]);

export const noiteEscura: Cena = {
  camera: ({ p }) => ({ pos: CAMERA, alvo: mirar(CAMERA, rumo(p), 7), fov: 50 }),
  ambiente: () => ({ ...ambienteNoite, breu: 1, lua: 0, estrelas: 1 }),
  boneco: () => ({ ...bonecoParado(BONECO_MORRO, Math.atan2(direita[0], direita[2])), olharCima: 1 }),
  contexto: () => ({ texto: "Longe da cidade" }),
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const domo = projetar([CENTRO_CIDADE[0], 26, CENTRO_CIDADE[2]]);
    return (
      <>
        <TextoPreso texto="Cidade" guia x={domo.x} y={domo.y} seg={seg} janela={janela(props, aos("cidades"))} />
        <Pilula texto="Sem luar" cor="vermelho" giro={-4} x={716} y={500} seg={seg} janela={janela(props, aos("escuro"))} />
      </>
    );
  },
};
