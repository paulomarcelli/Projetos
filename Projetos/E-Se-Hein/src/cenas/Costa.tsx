import { Pilula, TextoPreso } from "../camadas/rotulos";
import { ambienteNoite, MARE_AMP_SEM_LUA, MARE_CENTRO } from "../mundo/ambiente";
import { Ave, Caranguejo, Coral } from "../mundo/Bichos";
import { alturaAreia } from "../mundo/Praia";
import type { Cena, Vec3 } from "./tipos";
import { entra, janela, lerp } from "./util";

// Q4 · Costa (Dia). Rente à areia molhada, travelling lateral da direita para a esquerda,
// passando pelos caranguejos até os corais na água rasa. Os bichos param e olham em volta (perdem o ritmo).
const CARANGUEJOS: Vec3[] = [
  [-266, 0, -48.5],
  [-271.5, 0, -50],
  [-277, 0, -47.6],
];
const CORAIS: Vec3[] = [
  [-284.5, 0, -57.5],
  [-286.8, 0, -59],
  [-282.6, 0, -59.6],
];
const AVE: Vec3 = [-262.5, alturaAreia(-46.2), -46.2];
const naAreia = ([x, , z]: Vec3): Vec3 => [x, alturaAreia(z), z];

const xCamera = (p: number) => lerp(-263, -282, p);

export const costa: Cena = {
  camera: ({ p }) => {
    const x = xCamera(p);
    return { pos: [x, -0.15, -44.2], alvo: [x - 1.2, -1.9, -56], fov: 50 };
  },
  ambiente: () => ({ ...ambienteNoite, dia: 1, lua: 0, estrelas: 0, mareCentro: MARE_CENTRO, mareAmp: MARE_AMP_SEM_LUA }),
  boneco: () => null,
  contexto: () => ({ texto: "Litoral" }),
  Objetos: ({ tempo, seg, aos }) => {
    const perdeu = entra(seg, aos("ritmo"), 0.6);
    return (
      <group>
        {CARANGUEJOS.map((c, i) => (
          <Caranguejo key={i} position={naAreia(c)} tempo={tempo + i * 0.7} giro={0.3 + i * 0.5 + perdeu * Math.sin(tempo * (1.5 + i)) * 1.6} agitado={1 - perdeu * 0.8} escala={i === 1 ? 1.4 : 1} />
        ))}
        <Ave position={AVE} tempo={tempo} giro={-Math.PI / 2 + perdeu * Math.sin(tempo * 2) * 0.8} />
        {CORAIS.map((c, i) => (
          <Coral key={i} position={[c[0], alturaAreia(c[2]) - 0.1, c[2]]} escala={0.8 + i * 0.15} giro={i} />
        ))}
      </group>
    );
  },
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const car = projetar(naAreia(CARANGUEJOS[1]).map((v, i) => (i === 1 ? v + 0.45 : v)) as Vec3);
    const coral = projetar([CORAIS[0][0], alturaAreia(CORAIS[0][2]) + 1.2, CORAIS[0][2]]);
    return (
      <>
        <TextoPreso texto="Caranguejo" guia x={car.x} y={car.y} seg={seg} janela={janela(props, aos("caranguejos"))} />
        <TextoPreso texto="Corais" guia x={coral.x} y={coral.y} seg={seg} janela={janela(props, aos("corais"))} />
        <Pilula texto="Sem ritmo" cor="vermelho" giro={4} x={700} y={420} seg={seg} janela={janela(props, aos("ritmo"), aos("sinal"))} />
      </>
    );
  },
};
