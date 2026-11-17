import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { corToken } from "./materiais";

const RAIO = 4500;
/** Plano da Via Láctea: faixa inclinada no céu. */
const EIXO_GALAXIA = new THREE.Euler(0.95, 0.4, 0.5);

type Props = {
  /** Posição da câmera: o céu acompanha a câmera e parece infinito. */
  centro: [number, number, number];
  estrelas: number;
  /** 0 = céu da Terra; 1 = fundo do espaço. */
  espaco: number;
  /** Via Láctea (no Breu e no espaço). */
  viaLactea: number;
};

/** Estrelas com tamanho, brilho e cor variados; mais densas ao longo da Via Láctea. */
function geometriaEstrelas() {
  const r = sorteador(7);
  const pos: number[] = [];
  const tam: number[] = [];
  const cor: number[] = [];
  const giro = new THREE.Matrix4().makeRotationFromEuler(EIXO_GALAXIA);
  const v = new THREE.Vector3();
  const tons = [new THREE.Color("#ffffff"), new THREE.Color("#cfe0ff"), new THREE.Color("#fff1d6"), new THREE.Color("#ffd9b0")];
  for (let i = 0; i < 9000; i++) {
    const naFaixa = i > 3000;
    const th = r() * Math.PI * 2;
    // Na faixa: perto do "equador" da galáxia (gaussiana estreita).
    const y = naFaixa ? (r() + r() + r() - 1.5) * 0.12 : r() * 2 - 1;
    const raio = Math.sqrt(1 - y * y);
    v.set(Math.cos(th) * raio, y, Math.sin(th) * raio);
    if (naFaixa) v.applyMatrix4(giro);
    v.multiplyScalar(RAIO * 0.92);
    pos.push(v.x, v.y, v.z);
    const brilho = Math.pow(r(), naFaixa ? 6 : 3.5);
    tam.push(1.2 + brilho * (naFaixa ? 2.5 : 5.5));
    const c = tons[Math.floor(r() * tons.length)];
    const forca = naFaixa ? 0.35 + brilho * 0.6 : 0.45 + brilho * 0.55;
    cor.push(c.r * forca, c.g * forca, c.b * forca);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("tamanho", new THREE.Float32BufferAttribute(tam, 1));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cor, 3));
  return g;
}

function materialEstrelas() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    uniforms: { opacidade: { value: 1 }, escala: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float tamanho;
      varying vec3 vCor;
      uniform float escala;
      void main() {
        vCor = color;
        gl_PointSize = tamanho * escala;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vCor;
      uniform float opacidade;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        gl_FragColor = vec4(vCor * a * opacidade, a * opacidade);
      }`,
    vertexColors: true,
  });
}

/** Faixa da Via Láctea: brilho difuso com poeira escura, desenhada num canvas. */
function texturaViaLactea() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 512;
  const g = c.getContext("2d")!;
  const r = sorteador(19);
  for (let i = 0; i < 1600; i++) {
    const x = r() * 2048;
    const y = 256 + (r() + r() + r() - 1.5) * 90;
    const raio = 10 + r() * 40;
    const grad = g.createRadialGradient(x, y, 0, x, y, raio);
    const tom = r() < 0.3 ? "255,230,200" : "200,215,255";
    grad.addColorStop(0, `rgba(${tom},${0.05 + r() * 0.06})`);
    grad.addColorStop(1, `rgba(${tom},0)`);
    g.fillStyle = grad;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
  // Poeira escura no meio da faixa
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 260; i++) {
    const x = r() * 2048;
    const y = 256 + (r() - 0.5) * 50;
    const raio = 8 + r() * 26;
    const grad = g.createRadialGradient(x, y, 0, x, y, raio);
    grad.addColorStop(0, "rgba(0,0,0,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export const Ceu: React.FC<Props> = ({ centro, estrelas, espaco, viaLactea }) => {
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

  const pontos = useMemo(geometriaEstrelas, []);
  const matEstrelas = useMemo(materialEstrelas, []);
  matEstrelas.uniforms.opacidade.value = estrelas;
  const via = useMemo(texturaViaLactea, []);

  return (
    <group position={centro}>
      <mesh material={material} renderOrder={-10}>
        <sphereGeometry args={[RAIO, 32, 16]} />
      </mesh>
      {viaLactea > 0.01 ? (
        <mesh rotation={EIXO_GALAXIA} renderOrder={-9}>
          <cylinderGeometry args={[RAIO * 0.95, RAIO * 0.95, RAIO * 0.7, 64, 1, true]} />
          <meshBasicMaterial map={via} side={THREE.BackSide} transparent opacity={viaLactea} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
      {estrelas > 0.01 ? <points geometry={pontos} material={matEstrelas} renderOrder={-8} /> : null}
    </group>
  );
};
