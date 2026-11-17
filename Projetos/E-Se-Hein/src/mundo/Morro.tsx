import { useMemo } from "react";
import * as THREE from "three";
import { Arvore } from "./Cidade";
import { escalarUV, mat } from "./materiais";

// Morro fora da cidade (Q2): o "você" olha o céu sem Lua, com a cidade pequena no horizonte.
export const MORRO = { x: -340, z: 70, raioTopo: 18, raioBase: 80, altura: 24 };
export const BONECO_MORRO: [number, number, number] = [MORRO.x + 3, MORRO.altura, MORRO.z - 2];

export const Morro: React.FC = () => {
  const geo = useMemo(
    () => escalarUV(new THREE.CylinderGeometry(MORRO.raioTopo, MORRO.raioBase, MORRO.altura, 18, 3), 2 * Math.PI * MORRO.raioBase, 60, 14),
    [],
  );
  return (
    <group>
      <mesh geometry={geo} position={[MORRO.x, MORRO.altura / 2, MORRO.z]} rotation={[0, 0.3, 0]} material={mat("mundo/chao/grama")} receiveShadow castShadow />
      <Arvore x={MORRO.x - 6} y={MORRO.altura} z={MORRO.z + 7} tam={1.1} />
      <Arvore x={MORRO.x - 10} y={MORRO.altura} z={MORRO.z + 2} tam={0.8} />
      <Arvore x={MORRO.x + 9} y={MORRO.altura} z={MORRO.z + 10} tam={0.9} />
    </group>
  );
};
