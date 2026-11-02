// Palco: renderer transparente (o fundo é o CSS, que troca de preto para azul-claro na ficha), câmera em órbita
// por pose, estúdio do RoomEnvironment, recorte frio por trás e sombra. Só desenha quando algo mudou.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildPhone } from './phone.js';
import { PHONE, LAYERS } from './dims.js';

export const POSE_KEYS = ['az', 'el', 'dist', 'tx', 'ty', 'tz', 'fov', 'sx', 'sy', 'ex', 'lift', 'flip', 'spin', 'roll', 'focus', 'tilt', 'glow'];
export const BASE_POSE = { az: 0, el: 40, dist: 520, tx: 0, ty: 4, tz: 0, fov: 26, sx: 0, sy: 0, ex: 0, lift: 0, flip: 0, spin: 0, roll: 0, focus: 0, tilt: 0, glow: 1 };

export function createStage({ canvas, quality, hd }) {
  const low = quality === 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const dpr = hd ? Math.min(devicePixelRatio, 2) : low ? 1 : Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.environmentRotation.set(0, Math.PI * 0.85, 0);

  const camera = new THREE.PerspectiveCamera(26, 1, 2, 6000);
  const key = new THREE.DirectionalLight('#fff3e6', 1.5);
  key.position.set(-160, 380, 220);
  key.castShadow = !low;
  const sm = hd ? 4096 : 2048;
  key.shadow.mapSize.set(sm, sm);
  Object.assign(key.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 1200 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.5;
  key.shadow.radius = 4;
  const rim = new THREE.DirectionalLight('#dce7ff', 3);
  rim.position.set(60, 220, -420);
  const fill = new THREE.DirectionalLight('#9fc0ff', 0.4);
  fill.position.set(260, 40, 180);
  const under = new THREE.DirectionalLight('#cfe0ff', 0.6); // ilumina a traseira quando o aparelho vira
  under.position.set(-80, -300, 120);
  scene.add(key, key.target, rim, fill, under);

  // pivô no centro do aparelho: virada, giro e inclinação pelo cursor giram em volta dele
  const pivot = new THREE.Group();
  scene.add(pivot);
  const phone = buildPhone({ quality });
  phone.root.position.y = -PHONE.t / 2;
  pivot.add(phone.root);
  phone.root.add(phone.contact);
  key.target = pivot;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.ShadowMaterial({ opacity: 0.36 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -PHONE.t / 2 - 2.2;
  ground.receiveShadow = true;
  ground.visible = !low;
  scene.add(ground);

  const pose = { ...BASE_POSE };
  const last = {};
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 1, Hh = 1, needs = 2, scrollShift = 0;

  function resize() {
    W = canvas.clientWidth || innerWidth; Hh = canvas.clientHeight || innerHeight;
    renderer.setSize(W, Hh, false);
    camera.aspect = W / Hh;
    needs = 2;
  }
  resize();
  // celular em pé: afasta a câmera para o aparelho caber
  const fit = () => { const a = W / Hh; return a < 1 ? Math.pow(1.2 / a, 0.75) : 1; };

  const D = THREE.MathUtils.degToRad;
  function applyPose() {
    const p = pose;
    aim(camera, p, p.dist * fit(), W, Hh, scrollShift);
    pivot.rotation.set(D(p.flip) + tilt.x * p.tilt, D(p.spin) + tilt.y * p.tilt, D(p.roll), 'YXZ');
    phone.setExplode(p.ex);
    phone.setLift(p.lift);
    const up = Math.max(0, Math.cos(D(p.flip)));
    phone.contact.material.opacity = 0.85 * Math.max(0, 1 - p.ex * 4) * up;
    ground.material.opacity = 0.36 * (up * 0.8 + 0.2) * Math.max(0, 1 - p.ex * 2);
    phone.glow.material.opacity = 0.22 * p.glow;
  }
  function changed() {
    let c = false;
    for (const k of POSE_KEYS) if (last[k] !== pose[k]) { last[k] = pose[k]; c = true; }
    return c;
  }

  let visible = true;
  function frame(dt) {
    if (!visible) return;
    const dx = tilt.tx - tilt.x, dy = tilt.ty - tilt.y;
    const tiltMoving = Math.abs(dx) + Math.abs(dy) > 0.00005;
    if (tiltMoving) { const k = 1 - Math.exp(-dt * 4); tilt.x += dx * k; tilt.y += dy * k; }
    const c = changed();
    if (c || tiltMoving || needs > 0) applyPose();
    const moved = phone.tick();
    if (c || tiltMoving || moved || needs > 0) {
      renderer.render(scene, camera);
      needs = Math.max(0, needs - 1);
    }
  }

  const raycaster = new THREE.Raycaster();
  return {
    renderer, scene, camera, phone, pose, pivot,
    frame, resize,
    compile: () => (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera))),
    size: () => ({ W, H: Hh }),
    view: () => ({ ...pose, dist: pose.dist * fit() }),
    invalidate: () => { needs = 2; },
    setTilt: (x, y) => { tilt.tx = x; tilt.ty = y; },
    setScrollShift: (px) => { if (px !== scrollShift) { scrollShift = px; needs = 2; } },
    setVisible: (v) => { visible = v; if (v) needs = 2; },
    project(v3, out) {
      const v = v3.clone().project(camera);
      out.x = (v.x * 0.5 + 0.5) * W;
      out.y = (-v.y * 0.5 + 0.5) * Hh;
      out.z = v.z;
      return out;
    },
    /** o ponteiro está sobre a tela do aparelho? */
    pickScreen(nx, ny) {
      raycaster.setFromCamera({ x: nx, y: ny }, camera);
      return raycaster.intersectObject(phone.panel, false).length > 0;
    },
    layersOrder: LAYERS,
  };
}

const sph = new THREE.Spherical();
const tgt = new THREE.Vector3();
/** câmera em órbita em volta do alvo; o enquadramento desloca por setViewOffset sem mudar a perspectiva */
export function aim(camera, p, dist, W, H, shift = 0) {
  camera.fov = p.fov;
  camera.aspect = W / H;
  tgt.set(p.tx, p.ty, p.tz);
  sph.set(dist, THREE.MathUtils.degToRad(90 - p.el), THREE.MathUtils.degToRad(p.az));
  camera.position.setFromSpherical(sph).add(tgt);
  camera.lookAt(tgt);
  camera.setViewOffset(W, H, -p.sx * W, p.sy * H + shift, W, H);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
