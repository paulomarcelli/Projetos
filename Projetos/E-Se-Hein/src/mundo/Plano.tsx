import { useMemo } from "react";
import * as THREE from "three";
import { escalarUV } from "./materiais";

/** Geometria de plano com a textura repetindo a cada `metros` (use dentro de um <mesh>). */
export const Plano: React.FC<{ w: number; h: number; metros?: number }> = ({ w, h, metros = 6 }) => {
  const g = useMemo(() => escalarUV(new THREE.PlaneGeometry(w, h), w, h, metros), [w, h, metros]);
  return <primitive object={g} attach="geometry" />;
};
