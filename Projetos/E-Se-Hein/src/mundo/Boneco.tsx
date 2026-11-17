import { boneco as cor } from "./paleta";

// "Você": boneco de brinquedo (cabeça redonda, camiseta amarela, bermuda e tênis azuis).
// Origem nos pés, de frente para +z. Altura ≈ 3,6.

type Props = {
  position: [number, number, number];
  /** Giro em torno do eixo vertical (radianos). */
  giro?: number;
  /** 0 = olha para a frente; 1 = olha para o céu. */
  olharCima?: number;
  /** Ângulo dos braços (radianos, 0 = para baixo). Positivo levanta para o lado. */
  bracoDireito?: number;
  bracoEsquerdo?: number;
  /** Braço direito apontando para a frente (0 a 1). */
  apontar?: number;
  /** Pulo ou balanço (altura extra). */
  pulo?: number;
  escala?: number;
};

const Braco: React.FC<{ lado: 1 | -1; abrir: number; frente: number }> = ({ lado, abrir, frente }) => (
  <group position={[0.62 * lado, 2.28, 0]} rotation={[-frente * 1.5, 0, abrir * lado]}>
    <mesh position={[0, -0.18, 0]} castShadow>
      <cylinderGeometry args={[0.22, 0.24, 0.42, 8]} />
      <meshLambertMaterial color={cor.camiseta} />
    </mesh>
    <mesh position={[0, -0.62, 0]} castShadow>
      <cylinderGeometry args={[0.14, 0.14, 0.6, 8]} />
      <meshLambertMaterial color={cor.pele} />
    </mesh>
    <mesh position={[0, -0.98, 0]} castShadow>
      <sphereGeometry args={[0.17, 10, 8]} />
      <meshLambertMaterial color={cor.pele} />
    </mesh>
  </group>
);

const Perna: React.FC<{ lado: 1 | -1 }> = ({ lado }) => (
  <group position={[0.24 * lado, 0, 0]}>
    <mesh position={[0, 0.7, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
      <meshLambertMaterial color={cor.pele} />
    </mesh>
    <mesh position={[0, 0.16, 0.1]} castShadow>
      <boxGeometry args={[0.36, 0.32, 0.62]} />
      <meshLambertMaterial color={cor.tenis} />
    </mesh>
    <mesh position={[0, 0.04, 0.12]}>
      <boxGeometry args={[0.38, 0.08, 0.66]} />
      <meshLambertMaterial color="#ffffff" />
    </mesh>
  </group>
);

export const Boneco: React.FC<Props> = ({
  position,
  giro = 0,
  olharCima = 0,
  bracoDireito = 0.12,
  bracoEsquerdo = 0.12,
  apontar = 0,
  pulo = 0,
  escala = 1,
}) => (
  <group position={[position[0], position[1] + pulo, position[2]]} rotation={[0, giro, 0]} scale={escala}>
    <Perna lado={1} />
    <Perna lado={-1} />
    {/* Bermuda */}
    <mesh position={[0, 1.28, 0]} castShadow>
      <boxGeometry args={[0.92, 0.52, 0.58]} />
      <meshLambertMaterial color={cor.bermuda} />
    </mesh>
    {/* Camiseta */}
    <mesh position={[0, 1.95, 0]} castShadow>
      <capsuleGeometry args={[0.5, 0.55, 4, 12]} />
      <meshLambertMaterial color={cor.camiseta} />
    </mesh>
    <Braco lado={1} abrir={bracoDireito} frente={apontar} />
    <Braco lado={-1} abrir={bracoEsquerdo} frente={0} />
    {/* Cabeça (inclina para olhar o céu) */}
    <group position={[0, 2.62, 0]} rotation={[-olharCima * 0.65, 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.62, 18, 14]} />
        <meshLambertMaterial color={cor.pele} />
      </mesh>
      <mesh position={[0, 0.62, -0.04]} rotation={[-0.25, 0, 0]}>
        <sphereGeometry args={[0.65, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
        <meshLambertMaterial color={cor.cabelo} />
      </mesh>
      {[1, -1].map((l) => (
        <mesh key={l} position={[0.22 * l, 0.5, 0.57]}>
          <sphereGeometry args={[0.075, 8, 6]} />
          <meshBasicMaterial color={cor.olho} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0.58]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.12, 0.03, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#8a3b2a" />
      </mesh>
    </group>
  </group>
);
