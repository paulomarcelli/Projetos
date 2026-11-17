import { mat } from "./materiais";

// Caranguejo, ave da praia e coral de brinquedo, com cores pelos tokens. Movimento só pelo `tempo`.

export const Caranguejo: React.FC<{ position: [number, number, number]; tempo: number; giro?: number; agitado?: number; escala?: number }> = ({
  position,
  tempo,
  giro = 0,
  agitado = 1,
  escala = 1,
}) => {
  const passo = Math.sin(tempo * 9) * 0.25 * agitado;
  const corpo = mat("mundo/vida/caranguejo");
  const olho = mat("mundo/personagem/olho");
  return (
    <group position={[position[0] + Math.sin(tempo * 1.3) * 0.25 * agitado, position[1], position[2]]} rotation={[0, giro, 0]} scale={0.32 * escala}>
      <mesh position={[0, 0.45, 0]} scale={[1.2, 0.5, 0.85]} material={corpo} castShadow>
        <sphereGeometry args={[0.6, 10, 8]} />
      </mesh>
      {[1, -1].map((l) => (
        <group key={l}>
          <mesh position={[0.22 * l, 0.85, 0.32]} material={corpo}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 5]} />
          </mesh>
          <mesh position={[0.22 * l, 1.02, 0.32]} material={olho}>
            <sphereGeometry args={[0.09, 8, 6]} />
          </mesh>
          <group position={[0.75 * l, 0.5, 0.45]} rotation={[0, 0, (0.4 + passo) * l]}>
            <mesh position={[0.15 * l, 0.12, 0.1]} material={corpo} castShadow>
              <sphereGeometry args={[0.28, 8, 6]} />
            </mesh>
          </group>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.72 * l, 0.25, -0.2 + k * 0.22]} rotation={[0, 0, (0.9 + (k % 2 ? passo : -passo)) * l]} material={corpo}>
              <boxGeometry args={[0.55, 0.08, 0.08]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

export const Ave: React.FC<{ position: [number, number, number]; tempo: number; giro?: number; voando?: number }> = ({ position, tempo, giro = 0, voando = 0 }) => {
  const asa = voando * Math.sin(tempo * 7) * 0.6;
  const corpo = mat("mundo/vida/ave");
  const bico = mat("mundo/vida/bico");
  return (
    <group position={position} rotation={[0, giro, 0]} scale={0.3}>
      <mesh position={[0, 1.2, 0]} scale={[0.5, 0.45, 1.1]} material={corpo} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      <mesh position={[0, 1.75, 0.85]} material={corpo}>
        <sphereGeometry args={[0.4, 8, 6]} />
      </mesh>
      <mesh position={[0, 1.7, 1.35]} rotation={[Math.PI / 2, 0, 0]} material={bico}>
        <coneGeometry args={[0.12, 0.45, 5]} />
      </mesh>
      <mesh position={[0.13, 1.85, 1.15]} material={mat("mundo/personagem/olho")}>
        <sphereGeometry args={[0.06, 6, 5]} />
      </mesh>
      {[1, -1].map((l) => (
        <group key={l}>
          <mesh position={[0.15 * l, 0.4, 0]} material={bico}>
            <cylinderGeometry args={[0.05, 0.05, 0.8, 5]} />
          </mesh>
          <group position={[0.4 * l, 1.35, -0.1]} rotation={[0, 0, (0.15 + asa) * l]}>
            <mesh position={[0.25 * l, 0, -0.1]} scale={[0.25, 0.3, 0.8]} material={corpo}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

/** Coral em Y (galhos simples), na água rasa. */
export const Coral: React.FC<{ position: [number, number, number]; escala?: number; giro?: number }> = ({ position, escala = 1, giro = 0 }) => {
  const c = mat("mundo/vida/coral");
  return (
    <group position={position} scale={escala} rotation={[0, giro, 0]}>
      <mesh position={[0, 0.6, 0]} material={c} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.2, 6]} />
      </mesh>
      {[1, -1].map((l) => (
        <mesh key={l} position={[0.32 * l, 1.45, 0]} rotation={[0, 0, -0.6 * l]} material={c} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 1.0, 6]} />
        </mesh>
      ))}
    </group>
  );
};
