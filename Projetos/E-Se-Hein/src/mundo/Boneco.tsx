import { mat } from "./materiais";

// "Você": boneco de brinquedo com as medidas da Sofia (1,80 m), cores pelos tokens do modo.
// Origem nos pés, de frente para +z. Pisca a cada ~4 s e respira (tronco sobe 1%).

type Props = {
  position: [number, number, number];
  giro?: number;
  /** 0 = olha para a frente; 1 = olha para o céu. */
  olharCima?: number;
  /** Braços abertos para o lado (radianos). */
  bracoDireito?: number;
  bracoEsquerdo?: number;
  /** Braço direito apontando para a frente (0 a 1). */
  apontar?: number;
  /** Ombros encolhidos (0 a 1). */
  ombros?: number;
  pulo?: number;
  tempo?: number;
};

const ESCALA = 1.8 / 1.93;

const Braco: React.FC<{ lado: 1 | -1; abrir: number; frente: number }> = ({ lado, abrir, frente }) => (
  <group position={[0.31 * lado, 1.3, 0]} rotation={[-frente * 1.5, 0, abrir * lado]}>
    <mesh position={[0.02 * lado, -0.06, 0]} material={mat("mundo/personagem/camiseta")} castShadow>
      <boxGeometry args={[0.17, 0.24, 0.24]} />
    </mesh>
    <mesh position={[0.02 * lado, -0.36, 0]} material={mat("mundo/personagem/pele")} castShadow>
      <cylinderGeometry args={[0.055, 0.055, 0.48, 6]} />
    </mesh>
  </group>
);

export const Boneco: React.FC<Props> = ({
  position,
  giro = 0,
  olharCima = 0,
  bracoDireito = 0.08,
  bracoEsquerdo = 0.08,
  apontar = 0,
  ombros = 0,
  pulo = 0,
  tempo = 0,
}) => {
  const ciclo = (tempo % 4.1) / 4.1;
  const piscando = ciclo > 0.96;
  const respira = 1 + 0.01 * Math.sin(tempo * 2.2);
  const olho = mat("mundo/personagem/olho");
  return (
    <group position={[position[0], position[1] + pulo, position[2]]} rotation={[0, giro, 0]} scale={ESCALA}>
      {[1, -1].map((l) => (
        <group key={l} position={[0.115 * l, 0, 0]}>
          <mesh position={[0, 0.06, 0.03]} material={mat("mundo/personagem/tenis")} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.26]} />
          </mesh>
          <mesh position={[0, 0.29, 0]} material={mat("mundo/personagem/pele")} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.34, 6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.635, 0]} material={mat("mundo/personagem/bermuda")} castShadow>
        <boxGeometry args={[0.52, 0.35, 0.32]} />
      </mesh>
      <group position={[0, 0.81, 0]} scale={[1, respira, 1]}>
        <mesh position={[0, 0.28, 0]} material={mat("mundo/personagem/camiseta")} castShadow>
          <boxGeometry args={[0.56, 0.56, 0.34]} />
        </mesh>
      </group>
      <group position={[0, ombros * 0.06, 0]}>
        <Braco lado={1} abrir={bracoDireito + ombros * 0.5} frente={apontar} />
        <Braco lado={-1} abrir={bracoEsquerdo + ombros * 0.5} frente={0} />
      </group>
      <mesh position={[0, 1.405, 0]} material={mat("mundo/personagem/pele")}>
        <cylinderGeometry args={[0.06, 0.06, 0.07, 6]} />
      </mesh>
      {/* Cabeça: cilindro de 8 lados; inclina para olhar o céu */}
      <group position={[0, 1.44 - ombros * 0.03, 0]} rotation={[-olharCima * 0.6, 0, 0]}>
        <mesh position={[0, 0.245, 0]} rotation={[0, Math.PI / 8, 0]} material={mat("mundo/personagem/pele")} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.49, 8]} />
        </mesh>
        <mesh position={[0, 0.47, -0.02]} scale={[1, 0.42, 1]} material={mat("mundo/personagem/cabelo")} castShadow>
          <sphereGeometry args={[0.255, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.34, -0.17]} material={mat("mundo/personagem/cabelo")}>
          <boxGeometry args={[0.46, 0.28, 0.12]} />
        </mesh>
        <mesh position={[0.1, 0.44, 0.2]} rotation={[0.3, 0, -0.2]} material={mat("mundo/personagem/cabelo")}>
          <boxGeometry args={[0.24, 0.08, 0.1]} />
        </mesh>
        {[1, -1].map((l) => (
          <mesh key={l} position={[0.09 * l, 0.27, 0.235]} scale={[1, piscando ? 0.15 : 1, 1]} material={olho}>
            <circleGeometry args={[0.035, 10]} />
          </mesh>
        ))}
        <mesh position={[0, 0.14, 0.236]} material={olho}>
          <planeGeometry args={[0.09, 0.025]} />
        </mesh>
      </group>
    </group>
  );
};
