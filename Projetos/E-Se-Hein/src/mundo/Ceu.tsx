import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { mundo } from "./paleta";

const RAIO = 1800;

const misturar = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

/** Nuvem fofa "pintada": manchas redondas sobrepostas num canvas, com borda suave. */
function texturaNuvem(semente: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  const r = sorteador(semente);
  for (let i = 0; i < 14; i++) {
    const x = 90 + r() * 330;
    const y = 120 + (r() - 0.5) * 60 - Math.sin(((x - 90) / 330) * Math.PI) * 40;
    const raio = 45 + r() * 55;
    const grad = g.createRadialGradient(x, y, raio * 0.2, x, y, raio);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.6, "rgba(255,255,255,0.75)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, raio, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Props = {
  /** Posição da câmera: o céu acompanha a câmera e parece infinito. */
  centro: [number, number, number];
  breu: number;
  estrelas: number;
};

export const Ceu: React.FC<Props> = ({ centro, breu, estrelas }) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          topo: { value: new THREE.Color() },
          horizonte: { value: new THREE.Color() },
        },
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
            float h = clamp(vDir.y * 1.6 + 0.08, 0.0, 1.0);
            gl_FragColor = vec4(mix(horizonte, topo, pow(h, 0.7)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  material.uniforms.topo.value.copy(misturar(mundo.ceuTopoNoite, mundo.ceuTopoBreu, breu));
  material.uniforms.horizonte.value.copy(misturar(mundo.ceuHorizonteNoite, mundo.ceuHorizonteBreu, breu));

  const pontos = useMemo(() => {
    const r = sorteador(7);
    const pos: number[] = [];
    for (let i = 0; i < 900; i++) {
      const th = r() * Math.PI * 2;
      const y = 0.08 + r() * 0.92;
      const raio = Math.sqrt(1 - y * y);
      pos.push(Math.cos(th) * raio * RAIO * 0.9, y * RAIO * 0.9, Math.sin(th) * raio * RAIO * 0.9);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  const nuvens = useMemo(() => {
    const r = sorteador(21);
    const texturas = [texturaNuvem(1), texturaNuvem(2), texturaNuvem(3)];
    return Array.from({ length: 16 }, (_, i) => {
      const ang = (i / 16) * Math.PI * 2 + r() * 0.3;
      const dist = 900 + r() * 400;
      return {
        pos: [Math.cos(ang) * dist, 160 + r() * 260, Math.sin(ang) * dist] as [number, number, number],
        escala: 380 + r() * 260,
        textura: texturas[i % 3],
      };
    });
  }, []);

  const corNuvem = misturar(mundo.nuvem, "#3c4a6e", breu * 0.8);

  return (
    <group position={centro}>
      <mesh material={material} renderOrder={-10}>
        <sphereGeometry args={[RAIO, 32, 16]} />
      </mesh>
      <points geometry={pontos} renderOrder={-9}>
        <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} transparent opacity={estrelas} depthWrite={false} fog={false} />
      </points>
      {nuvens.map((n, i) => (
        <sprite key={i} position={n.pos} scale={[n.escala, n.escala / 2, 1]} renderOrder={-8}>
          <spriteMaterial map={n.textura} color={corNuvem} transparent opacity={0.55 - breu * 0.3} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
};
