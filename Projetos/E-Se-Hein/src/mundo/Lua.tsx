import { useMemo } from "react";
import * as THREE from "three";
import { corMundo } from "./paleta";

// Lua redonda e lisa, com crateras simples e um halo escuro, como no storyboard.
// É um disco que sempre olha para a câmera (de longe, uma esfera emissiva é um disco).
function texturaLua() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const modo = { dia: 0, noite: 1, breu: 0 };
  // Halo
  g.fillStyle = "rgba(170,185,230,0.16)";
  g.beginPath();
  g.arc(256, 256, 250, 0, Math.PI * 2);
  g.fill();
  // Disco
  g.fillStyle = corMundo("mundo/lua/superficie", modo);
  g.beginPath();
  g.arc(256, 256, 165, 0, Math.PI * 2);
  g.fill();
  // Crateras
  g.fillStyle = corMundo("mundo/lua/cratera", modo);
  for (const [x, y, r] of [
    [205, 205, 30],
    [300, 290, 40],
    [215, 318, 18],
    [312, 196, 14],
  ]) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let textura: THREE.CanvasTexture | null = null;
const pegarTextura = () => (textura ??= texturaLua());

/** Disco da Lua de diâmetro `diametro` (o halo ocupa 1,5×). */
export const DiscoLua: React.FC<{ position: [number, number, number]; diametro: number; opacidade?: number; escala?: number }> = ({
  position,
  diametro,
  opacidade = 1,
  escala = 1,
}) => {
  const mapa = useMemo(pegarTextura, []);
  if (opacidade <= 0.001) return null;
  const lado = diametro * (512 / 330) * escala;
  return (
    <sprite position={position} scale={[lado, lado, 1]}>
      <spriteMaterial map={mapa} transparent opacity={opacidade} depthWrite={false} fog={false} toneMapped={false} />
    </sprite>
  );
};

export const POSICAO_LUA: [number, number, number] = [-90, 300, -1100];
export const DIAMETRO_LUA = 230;

/** A Lua do céu. Some com `mov/lua-some`: escala 100% para 96% e opacidade para 0. */
export const LuaNoCeu: React.FC<{ visivel: number }> = ({ visivel }) => (
  <DiscoLua position={POSICAO_LUA} diametro={DIAMETRO_LUA} opacidade={visivel} escala={0.96 + 0.04 * visivel} />
);
