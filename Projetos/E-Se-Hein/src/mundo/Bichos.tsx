import { sorteador } from "./aleatorio";

// Caranguejo, gaivota e coral de brinquedo. Todo movimento vem do `tempo` do vídeo.

export const Caranguejo: React.FC<{ position: [number, number, number]; tempo: number; giro?: number; agitado?: number }> = ({
  position,
  tempo,
  giro = 0,
  agitado = 1,
}) => {
  const passo = Math.sin(tempo * 9) * 0.25 * agitado;
  return (
    <group position={[position[0] + Math.sin(tempo * 1.3) * 0.8 * agitado, position[1], position[2]]} rotation={[0, giro, 0]} scale={0.75}>
      <mesh position={[0, 0.45, 0]} scale={[1.2, 0.5, 0.85]} castShadow>
        <sphereGeometry args={[0.6, 10, 8]} />
        <meshLambertMaterial color="#ee5a36" flatShading />
      </mesh>
      {[1, -1].map((l) => (
        <group key={l}>
          {/* Olhos */}
          <mesh position={[0.22 * l, 0.85, 0.32]}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 5]} />
            <meshLambertMaterial color="#ee5a36" />
          </mesh>
          <mesh position={[0.22 * l, 1.02, 0.32]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshBasicMaterial color="#111" />
          </mesh>
          {/* Garras */}
          <group position={[0.75 * l, 0.5, 0.45]} rotation={[0, 0, (0.4 + passo) * l]}>
            <mesh position={[0.15 * l, 0.12, 0.1]} castShadow>
              <sphereGeometry args={[0.26, 8, 6]} />
              <meshLambertMaterial color="#f06a3c" flatShading />
            </mesh>
          </group>
          {/* Pernas */}
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.72 * l, 0.25, -0.2 + k * 0.22]} rotation={[0, 0, (0.9 + (k % 2 ? passo : -passo)) * l]}>
              <boxGeometry args={[0.55, 0.08, 0.08]} />
              <meshLambertMaterial color="#d94a2a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

export const Gaivota: React.FC<{ position: [number, number, number]; tempo: number; giro?: number }> = ({ position, tempo, giro = 0 }) => {
  const asa = Math.sin(tempo * 7) * 0.6;
  return (
    <group position={[position[0], position[1] + Math.sin(tempo * 2) * 0.5, position[2]]} rotation={[0, giro, 0]}>
      <mesh scale={[0.45, 0.4, 1.2]} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
        <meshLambertMaterial color="#f6f7fb" flatShading />
      </mesh>
      <mesh position={[0, 0.25, 1.05]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshLambertMaterial color="#f6f7fb" />
      </mesh>
      <mesh position={[0, 0.2, 1.45]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 5]} />
        <meshLambertMaterial color="#ffb000" />
      </mesh>
      {[1, -1].map((l) => (
        <group key={l} position={[0.35 * l, 0.15, 0]} rotation={[0, 0, asa * l]}>
          <mesh position={[1.1 * l, 0, 0]}>
            <boxGeometry args={[2.2, 0.08, 0.8]} />
            <meshLambertMaterial color="#dfe3ee" />
          </mesh>
          <mesh position={[2.1 * l, 0, -0.1]}>
            <boxGeometry args={[0.5, 0.09, 0.6]} />
            <meshLambertMaterial color="#3b3f4a" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Coral com ovos subindo. `desova` 0..1 controla quantos ovos sobem. */
export const Coral: React.FC<{ position: [number, number, number]; tempo: number; desova: number }> = ({ position, tempo, desova }) => {
  const r = sorteador(77);
  const galhos = Array.from({ length: 9 }, () => ({
    x: (r() - 0.5) * 3,
    z: (r() - 0.5) * 2,
    h: 1 + r() * 1.6,
    cor: r() < 0.5 ? "#ff7aa8" : "#ff9a4a",
    inc: (r() - 0.5) * 0.6,
  }));
  const ovos = Array.from({ length: 26 }, () => ({ x: (r() - 0.5) * 3, z: (r() - 0.5) * 2, fase: r(), vel: 0.35 + r() * 0.3 }));
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} scale={[2.2, 0.6, 1.6]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#8d8a84" flatShading />
      </mesh>
      {galhos.map((g, i) => (
        <mesh key={i} position={[g.x, 0.4 + g.h / 2, g.z]} rotation={[g.inc, 0, -g.inc]} castShadow>
          <cylinderGeometry args={[0.12, 0.28, g.h, 6]} />
          <meshLambertMaterial color={g.cor} flatShading />
        </mesh>
      ))}
      {desova > 0.01
        ? ovos.map((o, i) => {
            const ciclo = (tempo * o.vel + o.fase) % 1;
            return (
              <mesh key={`o${i}`} position={[o.x + Math.sin(ciclo * 6 + i) * 0.3, 1 + ciclo * 6, o.z]} scale={desova * (1 - ciclo * 0.5)}>
                <sphereGeometry args={[0.13, 6, 5]} />
                <meshBasicMaterial color="#ffd0e4" transparent opacity={0.9 * (1 - ciclo)} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};
