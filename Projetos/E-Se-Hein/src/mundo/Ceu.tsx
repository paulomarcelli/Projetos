import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { corToken } from "./materiais";

const RAIO = 4500;

type Props = {
  /** Posição da câmera: o céu acompanha a câmera e parece infinito. */
  centro: [number, number, number];
  estrelas: number;
  /** 0 = céu da Terra; 1 = fundo do espaço. */
  espaco: number;
};

/** Céu em degradê (topo para horizonte) pelas cores do modo, e estrelas. */
export const Ceu: React.FC<Props> = ({ centro, estrelas, espaco }) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { topo: { value: new THREE.Color() }, horizonte: { value: new THREE.Color() } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 topo;
          uniform vec3 horizonte;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y * 2.2 + 0.05, 0.0, 1.0);
            gl_FragColor = vec4(mix(horizonte, topo, h), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const fundo = corToken("mundo/espaco/fundo");
  material.uniforms.topo.value.copy(corToken("mundo/ceu/topo")).lerp(fundo, espaco);
  material.uniforms.horizonte.value.copy(corToken("mundo/ceu/horizonte")).lerp(fundo, espaco);

  const pontos = useMemo(() => {
    const r = sorteador(7);
    const pos: number[] = [];
    for (let i = 0; i < 2200; i++) {
      // Esfera inteira: no espaço também há estrelas embaixo.
      const y = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const raio = Math.sqrt(1 - y * y);
      pos.push(Math.cos(th) * raio * RAIO * 0.9, y * RAIO * 0.9, Math.sin(th) * raio * RAIO * 0.9);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <group position={centro}>
      <mesh material={material} renderOrder={-10}>
        <sphereGeometry args={[RAIO, 32, 16]} />
      </mesh>
      {estrelas > 0.01 ? (
        <points geometry={pontos} renderOrder={-9}>
          <pointsMaterial color={corToken("mundo/espaco/estrela")} size={2.6} sizeAttenuation={false} transparent opacity={estrelas} depthWrite={false} fog={false} />
        </points>
      ) : null}
    </group>
  );
};
