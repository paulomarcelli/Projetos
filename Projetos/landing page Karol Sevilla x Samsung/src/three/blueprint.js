// A planta da tela de carga deitando até a pose do hero. A planta é o plano do vidro frontal visto de cima;
// uma câmera de apoio sai exatamente de cima (mesma escala e mesmo centro da planta) e orbita até a câmera do
// hero, e cada ponto da planta é projetado por ela. Em t = 1 os fios caem em cima da tela do 3D.
import * as THREE from 'three';
import { aim } from './scene.js';
import { TOP } from './dims.js';

const KEYS = ['az', 'el', 'dist', 'tx', 'ty', 'tz', 'fov', 'sx', 'sy'];

/** plan: { cx, cy, s } da planta (centro em px e px por mm). Devolve project(t, x, z, out) → out = [x, y] em px */
export function blueprint(stage, plan) {
  const { W, H } = stage.size();
  stage.scene.updateMatrixWorld(true);
  const M = stage.phone.root.matrixWorld.clone();
  const c = new THREE.Vector3(0, TOP, 0).applyMatrix4(M);
  const B = stage.view();
  const A = {
    az: 0, el: 89.98, fov: B.fov, tx: c.x, ty: c.y, tz: c.z,
    dist: H / 2 / (Math.tan(THREE.MathUtils.degToRad(B.fov / 2)) * plan.s),
    sx: (plan.cx - W / 2) / W, sy: (H / 2 - plan.cy) / H,
  };
  const cam = new THREE.PerspectiveCamera(B.fov, W / H, 2, 8000);
  const p = {};
  const v = new THREE.Vector3();
  let at = -1;
  return function project(t, x, z, out) {
    if (t !== at) {
      at = t;
      for (const k of KEYS) p[k] = A[k] + (B[k] - A[k]) * t;
      aim(cam, p, p.dist, W, H);
    }
    v.set(x, TOP, z).applyMatrix4(M).project(cam);
    out[0] = (v.x * 0.5 + 0.5) * W;
    out[1] = (-v.y * 0.5 + 0.5) * H;
    return out;
  };
}
