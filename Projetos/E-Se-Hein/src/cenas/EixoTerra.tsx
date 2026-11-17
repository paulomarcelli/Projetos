import * as THREE from "three";
import { Cartao, Pilula, SetaArco, TextoPreso } from "../camadas/rotulos";
import { IconeNeve, IconeSol } from "../camadas/icones";
import { ambientePadrao } from "../mundo/ambiente";
import { INCLINACAO, TERRA_POS, TERRA_RAIO } from "../mundo/Terra";
import type { Cena, PropsCena, Vec3 } from "./tipos";
import { MARE_TERCO } from "./Mares";
import { deslize, entra, lerp3 } from "./util";

// Trecho 5: "Mas o pior vem devagar. A Lua estabiliza a inclinação da Terra…"
const somar = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const balancoEixo = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) =>
  0.5 * entra(seg, aos("balançar") - 0.8, 2.5) * Math.sin(seg * 2.4);

/** Ponta do eixo (polo norte) no mundo, para prender rótulos. */
export const poloNorte = (balanco: number): Vec3 => {
  const v = new THREE.Vector3(0, TERRA_RAIO * 1.45, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), INCLINACAO + balanco);
  return somar(TERRA_POS, [v.x, v.y, v.z]);
};

export const eixoTerra: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    return { pos: lerp3(somar(TERRA_POS, [10, 8, 150]), somar(TERRA_POS, [70, 24, 128]), d), alvo: somar(TERRA_POS, [0, -6, 0]), fov: 50 };
  },
  ambiente: (props) => ({
    ...ambientePadrao,
    lua: 0,
    luar: 0,
    breu: 0.6,
    estrelas: 1,
    mare: MARE_TERCO,
    terra: 1,
    balanco: balancoEixo(props),
  }),
  boneco: () => null,
  contexto: ({ seg, aos }) => (seg < aos("milhões") - 0.2 ? "HOJE" : "MILHÕES DE ANOS"),
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const polo = projetar(poloNorte(balancoEixo(props)));
    const centro = projetar(TERRA_POS);
    const extremas = entra(seg, aos("extremas") - 0.2, 0.35);
    return (
      <>
        <TextoPreso texto="Eixo" x={polo.x + 90} y={polo.y - 40} aparece={entra(seg, aos("inclinação") - 0.2)} />
        <Pilula texto="Inclinação estável" cor="verde" x={480} y={400} aparece={entra(seg, aos("estabiliza") - 0.2, 0.35) * (1 - entra(seg, aos("sem"), 0.3))} />
        <SetaArco cx={polo.x} cy={polo.y + 30} raio={110} de={-Math.PI * 0.85} ate={-Math.PI * 0.15} cor="amarelo" aparece={entra(seg, aos("balançar") - 0.3, 0.6)} />
        <Pilula texto="Estações extremas" cor="vermelho" x={480} y={400} aparece={extremas} />
        <Cartao
          x={centro.x}
          y={Math.min(1120, centro.y + 380)}
          aparece={entra(seg, aos("estações") - 0.2)}
          separador="+"
          itens={[
            { icone: <IconeSol />, texto: "Calor" },
            { icone: <IconeNeve />, texto: "Gelo" },
          ]}
        />
      </>
    );
  },
};
