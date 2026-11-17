import { Cartao, Pilula, TextoPreso } from "../camadas/rotulos";
import { IconeLua, IconeOvo } from "../camadas/icones";
import { ambientePadrao } from "../mundo/ambiente";
import { Caranguejo, Coral, Gaivota } from "../mundo/Bichos";
import { alturaAreia } from "../mundo/Praia";
import type { Cena, PropsCena, Vec3 } from "./tipos";
import { MARE_TERCO } from "./Mares";
import { deslize, entra, lerp3 } from "./util";

// Trecho 4: "E isso muda a vida na costa. Caranguejos e aves… corais… perderiam o sinal."
const CARANGUEJOS: Vec3[] = [
  [-3, 0, -45],
  [-7, 0, -47.5],
  [-1.5, 0, -49],
  [-9.5, 0, -44.5],
];
const CORAL: Vec3 = [-15, alturaAreia(-57) - 0.2, -57];
const gaivota = (tempo: number): Vec3 => [-30 + ((tempo * 5) % 60), 11, -54];

const fora = (seg: number, aos: PropsCena["aos"], palavra: string) => 1 - entra(seg, aos(palavra) - 0.3, 0.3);

export const costa: Cena = {
  camera: ({ p }) => {
    const d = deslize(p);
    return { pos: lerp3([5, 2.8, -38], [-5, 3.4, -46], d), alvo: lerp3([-5, -0.4, -50], [-15, -0.8, -57], d), fov: 50 };
  },
  ambiente: () => ({ ...ambientePadrao, lua: 0, luar: 0, breu: 0.5, estrelas: 0.9, mare: MARE_TERCO }),
  contexto: () => "MARÉ BAIXA",
  boneco: () => null,
  Objetos: ({ tempo, seg, aos, peso }) => {
    const perdeu = entra(seg, aos("ritmo"), 0.6);
    const desova = entra(seg, aos("soltam"), 0.5) * (1 - entra(seg, aos("sinal"), 0.8));
    return (
      <group scale={[1, Math.max(0.001, peso), 1]}>
        {CARANGUEJOS.map((c, i) => (
          <Caranguejo
            key={i}
            position={[c[0], alturaAreia(c[2]), c[2]]}
            tempo={tempo + i * 0.7}
            giro={0.4 + i + perdeu * Math.sin(tempo * (2 + i)) * 2}
            agitado={1 - perdeu * 0.7}
          />
        ))}
        <Gaivota position={gaivota(tempo)} tempo={tempo} giro={Math.PI / 2} />
        <Coral position={CORAL} tempo={tempo} desova={desova} />
      </group>
    );
  },
  Rotulos: ({ seg, aos, projetar, tempo }) => {
    const car = projetar([CARANGUEJOS[0][0], alturaAreia(CARANGUEJOS[0][2]) + 2.2, CARANGUEJOS[0][2]]);
    const ave = projetar([gaivota(tempo)[0], gaivota(tempo)[1] + 2.5, gaivota(tempo)[2]]);
    const coral = projetar([CORAL[0], CORAL[1] + 4, CORAL[2]]);
    return (
      <>
        <TextoPreso texto="Caranguejos" x={car.x} y={car.y} aparece={entra(seg, aos("caranguejos") - 0.2) * fora(seg, aos, "corais")} />
        <TextoPreso texto="Aves" x={ave.x} y={ave.y} aparece={entra(seg, aos("aves") - 0.2) * fora(seg, aos, "corais")} />
        <Pilula texto="Sem ritmo" cor="vermelho" x={480} y={430} aparece={entra(seg, aos("ritmo") - 0.2, 0.35) * fora(seg, aos, "corais")} />
        <TextoPreso texto="Corais" x={coral.x} y={coral.y} aparece={entra(seg, aos("corais") - 0.2)} />
        <Cartao
          x={480}
          y={430}
          aparece={entra(seg, aos("ovos") - 0.2)}
          itens={[
            { icone: <IconeOvo />, texto: "Ovos" },
            { icone: <IconeLua riscado={entra(seg, aos("sinal") - 0.2) > 0.5} />, texto: entra(seg, aos("sinal") - 0.2) > 0.5 ? "Sem sinal" : "Luz da Lua" },
          ]}
        />
      </>
    );
  },
};
