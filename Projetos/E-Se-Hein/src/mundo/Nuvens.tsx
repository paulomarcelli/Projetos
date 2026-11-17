import { useMemo } from "react";
import { sorteador } from "./aleatorio";
import { mat } from "./materiais";

// Nuvens fofas: 3 ou 4 esferas achatadas, com a barriga mais escura (Design System, regra 3).
type Nuvem = { pos: [number, number, number]; escala: number; bolas: [number, number, number, number][] };

function planejar(): Nuvem[] {
  const r = sorteador(31);
  const nuvens: Nuvem[] = [];
  for (let i = 0; i < 46; i++) {
    const ang = r() * Math.PI * 2;
    const dist = 180 + r() * 900;
    const n = 3 + Math.round(r());
    nuvens.push({
      pos: [-150 + Math.cos(ang) * dist, 70 + r() * 110, Math.sin(ang) * dist - 150],
      escala: 6 + r() * 7,
      bolas: Array.from({ length: n }, (_, k) => [(k - (n - 1) / 2) * 1.5 + (r() - 0.5) * 0.4, (k % 2) * 0.5 + r() * 0.4, (r() - 0.5) * 0.8, 1 + r() * 0.5]),
    });
  }
  // Uma camada alta, que a câmera atravessa quando sobe para o espaço.
  for (let i = 0; i < 14; i++) {
    nuvens.push({
      pos: [-300 + (r() - 0.5) * 240, 500 + r() * 300, -60 + (r() - 0.5) * 240],
      escala: 18 + r() * 14,
      bolas: Array.from({ length: 4 }, (_, k) => [(k - 1.5) * 1.5, (k % 2) * 0.5, (r() - 0.5) * 0.8, 1 + r() * 0.5]),
    });
  }
  return nuvens;
}

export const Nuvens: React.FC<{ tempo: number }> = ({ tempo }) => {
  const nuvens = useMemo(planejar, []);
  const luz = mat("mundo/nuvem/luz", { lisa: true });
  const sombra = mat("mundo/nuvem/sombra", { lisa: true });
  return (
    <group>
      {nuvens.map((n, i) => (
        <group key={i} position={[n.pos[0] + tempo * 0.8, n.pos[1], n.pos[2]]} scale={n.escala}>
          {n.bolas.map(([x, y, z, s], k) => (
            <mesh key={k} position={[x, y + 0.25, z]} scale={[s, s * 0.72, s * 0.85]} material={luz}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          ))}
          <mesh position={[0, -0.05, 0]} scale={[n.bolas.length * 0.95, 0.42, 1.1]} material={sombra}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
