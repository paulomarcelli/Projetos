// O Galaxy S26 Ultra em geometria feita no código, em seis camadas que se separam na vertical:
// vidro traseiro (com as câmeras), bateria, placa, moldura de alumínio, painel (a tela acesa) e vidro frontal.
// Cada camada tem um deslocamento de explosão e um "drop" (a altura de onde cai na abertura).
import * as THREE from 'three';
import { PHONE, SCREEN, PUNCH, SPEN, LENSES, FLASH, LASER, LAYERS } from './dims.js';
import { createScreen } from './screen.js';

const EXPLODE = { traseira: -62, bateria: -34, placa: -14, moldura: 0, painel: 24, vidro: 46 };

function rrShape(w, l, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -l / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + l - r); s.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
  s.lineTo(x + r, y + l); s.quadraticCurveTo(x, y + l, x, y + l - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function rrPath(w, l, r) {
  const p = new THREE.Path();
  const x = -w / 2, y = -l / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + l - r); p.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
  p.lineTo(x + r, y + l); p.quadraticCurveTo(x, y + l, x, y + l - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
/** placa plana com cantos arredondados: forma no plano xz, espessura em y (de 0 a h) */
function slab(shape, h, bevel = 0.3) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 14 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  g.computeVertexNormals();
  return g;
}
function label(text, w, h, { bg = '#22252b', fg = '#9aa0a8', size = 40, font = 'Geist Mono Variable' } = {}) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round(512 * h / w);
  const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = fg; c.font = `500 ${size}px "${font}", ui-monospace, monospace`; c.textBaseline = 'middle';
  text.split('\n').forEach((t, i, a) => c.fillText(t, 36, cv.height / 2 + (i - (a.length - 1) / 2) * size * 1.3));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function buildPhone({ quality }) {
  const low = quality === 'low';
  const root = new THREE.Group();
  const layers = {};
  const meshes = [];
  const add = (layer, m, cast = true) => { m.castShadow = cast && !low; m.receiveShadow = !low; layers[layer].add(m); meshes.push(m); return m; };
  for (const n of LAYERS) { const g = new THREE.Group(); g.name = n; g.userData = { base: 0, drop: 0 }; layers[n] = g; root.add(g); }

  // ---------- materiais (cor Sky Blue: vidro e moldura no mesmo azul-claro)
  const azul = new THREE.MeshPhysicalMaterial({ color: '#a9c6e4', roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 });
  const aluminio = new THREE.MeshStandardMaterial({ color: '#b7cbe2', roughness: 0.28, metalness: 0.9 });
  const aluminioIn = new THREE.MeshStandardMaterial({ color: '#6f7d8c', roughness: 0.55, metalness: 0.8 });
  const grafite = new THREE.MeshStandardMaterial({ color: '#25282e', roughness: 0.62, metalness: 0.2 });
  const pcb = new THREE.MeshStandardMaterial({ color: '#0f1f1a', roughness: 0.55, metalness: 0.15 });
  const chip = new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.5, metalness: 0.3 });
  const tampa = new THREE.MeshStandardMaterial({ color: '#9aa1a9', roughness: 0.35, metalness: 0.95 });
  const anel = new THREE.MeshStandardMaterial({ color: '#c9d7e6', roughness: 0.22, metalness: 1 });
  const vidroLente = new THREE.MeshPhysicalMaterial({ color: '#06080c', roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.6, iridescenceIOR: 1.6 });

  const T = PHONE.t;
  // ---------- 1. vidro traseiro + câmeras (a traseira olha para baixo, y negativo)
  const back = add('traseira', new THREE.Mesh(slab(rrShape(PHONE.w - 0.6, PHONE.l - 0.6, PHONE.r - 0.3), 0.8, 0.25), azul));
  // texto discreto gravado na traseira (vê-se com o aparelho virado)
  const grav = add('traseira', new THREE.Mesh(new THREE.PlaneGeometry(40, 8),
    new THREE.MeshStandardMaterial({ map: label('KAROL° · S26 ULTRA', 40, 8, { bg: '#a9c6e4', fg: '#7f9cbb', size: 46 }), roughness: 0.4 })), false);
  grav.rotation.x = Math.PI / 2; grav.rotation.z = Math.PI; grav.position.set(0, -0.01, PHONE.l / 2 - 22);
  const lensGroups = [];
  for (const L of LENSES) {
    const g = new THREE.Group(); g.position.set(L.x, 0, L.z);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(L.r, L.r, 1.6, 48, 1, true), anel); ring.position.y = -0.8;
    const ringCap = new THREE.Mesh(new THREE.RingGeometry(L.r * 0.82, L.r, 48), anel); ringCap.rotation.x = Math.PI / 2; ringCap.position.y = -1.6;
    const glass = new THREE.Mesh(new THREE.CircleGeometry(L.r * 0.82, 48), vidroLente); glass.rotation.x = Math.PI / 2; glass.position.y = -1.45;
    const inner = new THREE.Mesh(new THREE.RingGeometry(L.r * 0.38, L.r * 0.46, 40), new THREE.MeshStandardMaterial({ color: '#2a3a52', roughness: 0.2, metalness: 0.9 }));
    inner.rotation.x = Math.PI / 2; inner.position.y = -1.48;
    // a lente principal tem um "tubo" que sai na seção da câmera
    const barrel = new THREE.Group(); barrel.add(ring, ringCap, glass, inner);
    g.add(barrel);
    for (const m of [ring, ringCap, glass, inner]) { m.castShadow = !low; meshes.push(m); }
    layers.traseira.add(g);
    lensGroups.push({ L, g, barrel, inner });
  }
  for (const [p, mat] of [[FLASH, new THREE.MeshStandardMaterial({ color: '#f3efe2', emissive: '#4d4a40', roughness: 0.3 })], [LASER, chip]]) {
    const m = add('traseira', new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.5, 24), mat), false);
    m.position.set(p.x, -0.25, p.z);
  }

  // ---------- 2. bateria (embaixo da placa, ocupa o meio e o pé do aparelho)
  const bat = add('bateria', new THREE.Mesh(new THREE.BoxGeometry(64, 4.4, 92), grafite));
  bat.position.set(-1, 0.8 + 2.2, 22);
  const batLab = add('bateria', new THREE.Mesh(new THREE.PlaneGeometry(52, 30),
    new THREE.MeshStandardMaterial({ map: label('5.000 mAh\nLi-Ion · 60 W', 52, 30, { size: 44 }), roughness: 0.6 })), false);
  batLab.rotation.x = -Math.PI / 2; batLab.position.set(-1, 0.8 + 4.41, 22);
  // bobina de carga sem fio
  const coil = add('bateria', new THREE.Mesh(new THREE.TorusGeometry(19, 1.2, 8, 64), new THREE.MeshStandardMaterial({ color: '#b07a4a', roughness: 0.4, metalness: 0.8 })), false);
  coil.rotation.x = Math.PI / 2; coil.position.set(-1, 0.6, 22);
  coil.visible = false; // só aparece com as camadas separadas (montado, ela atravessaria o vidro traseiro)

  // ---------- 3. placa (no topo do aparelho, com o processador e componentes)
  const board = add('placa', new THREE.Mesh(new THREE.BoxGeometry(70, 1.2, 50), pcb));
  board.position.set(0, 1.4, -PHONE.l / 2 + 33);
  const soc = add('placa', new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 16), tampa));
  soc.position.set(-14, 2.7, -PHONE.l / 2 + 36);
  const socLab = add('placa', new THREE.Mesh(new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ map: label('8 ELITE\nGEN 5', 14, 14, { bg: '#9aa1a9', fg: '#3a3e44', size: 72 }), roughness: 0.4, metalness: 0.6 })), false);
  socLab.rotation.x = -Math.PI / 2; socLab.position.set(-14, 3.41, -PHONE.l / 2 + 36);
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < 16; i++) {
    const w = 3 + rnd() * 7, d = 2 + rnd() * 6, h = 0.6 + rnd() * 1.1;
    const c = add('placa', new THREE.Mesh(new THREE.BoxGeometry(w, h, d), i % 4 ? chip : tampa), false);
    c.position.set(4 + rnd() * 28, 2 + h / 2, -PHONE.l / 2 + 13 + rnd() * 38);
  }

  // ---------- 4. moldura de alumínio (anel com o vão da tela) + o slot da S Pen
  const ringShape = rrShape(PHONE.w, PHONE.l, PHONE.r);
  ringShape.holes.push(rrPath(PHONE.w - 4.2, PHONE.l - 4.2, PHONE.r - 2));
  add('moldura', new THREE.Mesh(slab(ringShape, T, 0.9), aluminio));
  // placa-meio de alumínio, entre a bateria e a tela
  const mid = add('moldura', new THREE.Mesh(slab(rrShape(PHONE.w - 4.2, PHONE.l - 4.2, PHONE.r - 2), 0.5, 0), aluminioIn), false);
  mid.position.y = 5.5;
  const pen = add('moldura', new THREE.Mesh(new THREE.CylinderGeometry(SPEN.w / 2 - 1.6, SPEN.w / 2 - 1.6, 4, 24), new THREE.MeshStandardMaterial({ color: '#8fa9c4', roughness: 0.35, metalness: 0.6 })), false);
  pen.rotation.x = Math.PI / 2; pen.position.set(SPEN.x, T / 2, PHONE.l / 2 - 1);

  // ---------- 5. painel (a tela acesa)
  const screen = createScreen();
  const panelMat = new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false });
  const panel = add('painel', new THREE.Mesh(slab(rrShape(SCREEN.w, SCREEN.l, SCREEN.r), 0.8, 0), [panelMat, new THREE.MeshStandardMaterial({ color: '#050608' })]), false);
  // o ExtrudeGeometry tem UV em mm: normaliza para 0..1 na face de cima
  {
    const g = panel.geometry, uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + SCREEN.w / 2) / SCREEN.w, 1 - (pos.getZ(i) + SCREEN.l / 2) / SCREEN.l);
    uv.needsUpdate = true;
  }
  panel.position.y = T - 1.6;
  const punch = add('painel', new THREE.Mesh(new THREE.CircleGeometry(PUNCH.r, 32), new THREE.MeshBasicMaterial({ color: '#000' })), false);
  punch.rotation.x = -Math.PI / 2; punch.position.set(PUNCH.x, T - 0.79, PUNCH.z);

  // ---------- 6. vidro frontal (reflexo por cima da tela)
  const glass = add('vidro', new THREE.Mesh(slab(rrShape(PHONE.w - 1.2, PHONE.l - 1.2, PHONE.r - 0.6), 0.7, 0.25),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false })), false);
  glass.position.y = T - 0.7;

  // ---------- brilho azul embaixo (a luz que escapa nas bordas) e sombra de contato
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
    const g = c.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, 'rgba(191,224,255,1)'); g.addColorStop(1, 'rgba(191,224,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(cv);
  })();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w * 2.2, PHONE.l * 1.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -1.9;
  root.add(glow);
  const shadowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
    const g = c.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(cv);
  })();
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w * 1.5, PHONE.l * 1.25), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = -2;

  // ---------- estado
  let ex = 0, lift = 0, dirty = true;
  function place() {
    for (const n of LAYERS) {
      const g = layers[n];
      g.position.y = EXPLODE[n] * ex + g.userData.drop;
    }
    const main = lensGroups[0];
    main.barrel.position.y = -lift * 9;
    main.inner.rotation.z = lift * 1.2;
  }
  place();

  const tmp = new THREE.Vector3();
  const anchors = {
    lente: () => tmp.set(LENSES[0].x, -1.6 - lift * 9, LENSES[0].z).applyMatrix4(layers.traseira.matrixWorld),
    bateria: () => tmp.set(30, 5.2, 40).applyMatrix4(layers.bateria.matrixWorld),
    chip: () => tmp.set(-14, 3.4, -PHONE.l / 2 + 36).applyMatrix4(layers.placa.matrixWorld),
    moldura: () => tmp.set(-PHONE.w / 2, T * 0.6, 30).applyMatrix4(layers.moldura.matrixWorld),
    tela: () => tmp.set(0, T, 10).applyMatrix4(layers.painel.matrixWorld),
  };

  return {
    root, layers, glow, contact, screen, panel, lensGroups, meshes,
    setExplode(v) { if (v !== ex) { ex = v; coil.visible = v > 0.05; dirty = true; } },
    setLift(v) { if (v !== lift) { lift = v; dirty = true; } },
    setDrop(name, v) { layers[name].userData.drop = v; dirty = true; },
    markDirty() { dirty = true; },
    tick() { if (!dirty) return false; place(); dirty = false; return true; },
    anchorWorld(name, out) { root.updateMatrixWorld(true); return out.copy(anchors[name]()); },
  };
}
