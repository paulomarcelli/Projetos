// O túnel de trabalhos em Three.js: 78 fotos nas paredes de um corredor elíptico e os destaques que saem da parede.
// Desenha só quando algo muda (scroll, cursor, textura carregada).
import * as THREE from 'three'

const COR_FUNDO = 0x0e0e0f
const COR_MOLDURA = 0xf2f0eb
const N_PLANOS = 78
export const Z_DESTAQUES = [-14, -33, -52, -71]
const ANG_DESTAQUES = [0.75, 2.35, 3.95, 5.5]

const lerp = (a, b, t) => a + (b - a) * t
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// sorteio com semente fixa: o túnel é sempre o mesmo
function semente(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// profundidade de campo barata: perto e longe ficam macios pelo viés de mipmap
const vies = (d) => (d < 6 ? (6 - d) * 0.45 : d > 22 ? Math.min(3, (d - 22) * 0.12) : 0)

export function criarCena({ canvas, pecas, destaques, base, reduzido }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(COR_FUNDO, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const cena = new THREE.Scene()
  cena.fog = new THREE.Fog(COR_FUNDO, 9, 44)
  const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 200)
  camera.position.set(0, 0, 6)

  let sujo = false
  let rodando = false
  const pedir = () => { sujo = true; if (!rodando) { rodando = true; requestAnimationFrame(laco) } }

  // uma textura por arquivo, compartilhada entre os planos
  const carregador = new THREE.TextureLoader()
  const texturas = new Map()
  const anisotropia = renderer.capabilities.getMaxAnisotropy()
  const textura = (src) => {
    if (!texturas.has(src)) {
      const t = carregador.load(base + src, pedir)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = anisotropia
      texturas.set(src, t)
    }
    return texturas.get(src)
  }

  const geometria = new THREE.PlaneGeometry(1, 1)
  function material(src) {
    const m = new THREE.MeshBasicMaterial({ map: textura(src), transparent: true, depthWrite: false, side: THREE.DoubleSide })
    m.userData.vies = { value: 0 }
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uVies = m.userData.vies
      shader.fragmentShader = 'uniform float uVies;\n' + shader.fragmentShader.replace(
        '#include <map_fragment>',
        '#ifdef USE_MAP\n  vec4 sampledDiffuseColor = texture2D( map, vMapUv, uVies );\n  diffuseColor *= sampledDiffuseColor;\n#endif',
      )
    }
    return m
  }

  // as paredes
  const sorteio = semente(20240611)
  const planos = []
  for (let i = 0; i < N_PLANOS; i++) {
    const p = pecas[i % pecas.length]
    let ang = i * 2.39996 + (sorteio() - 0.5) * 0.5
    const raio = 3.5 + sorteio() * 2.1
    const z = lerp(3.5, -96, i / (N_PLANOS - 1))
    const altura = 1.05 + sorteio() * 1.15
    // os dez primeiros fogem do canto inferior esquerdo, onde fica o wordmark
    for (let k = 0; i < 10 && k < 6 && Math.cos(ang) < 0.15 && Math.sin(ang) < 0.15; k++) ang += 1.15
    const m = new THREE.Mesh(geometria, material(p.src))
    m.userData = { ang, raio, z, w: altura * (p.w / p.h), h: altura }
    // moldura clara e fina atrás da foto: no fundo escuro, as telas escuras dos projetos não se perdem
    const moldura = new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({ color: COR_MOLDURA, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
    moldura.position.z = -0.002
    moldura.scale.set(1 + 0.03 / m.userData.w, 1 + 0.03 / altura, 1)
    moldura.renderOrder = -1
    m.add(moldura)
    m.userData.moldura = moldura
    cena.add(m)
    planos.push(m)
  }

  // os destaques: começam na parede e são puxados para o centro
  const puxar = destaques.map(() => ({ v: 0 }))
  const destaquesMesh = destaques.map((d, k) => {
    const m = new THREE.Mesh(geometria, material(d.foto))
    m.userData = { ang: ANG_DESTAQUES[k % 4], raio: 4.6, z: Z_DESTAQUES[k] }
    m.renderOrder = 2
    cena.add(m)
    return m
  })

  let retrato = false
  const elipse = () => (retrato ? [0.72, 1.55] : [1.45, 1])

  function dispor() {
    const [fx, fy] = elipse()
    for (const m of planos) {
      const u = m.userData
      m.position.set(Math.cos(u.ang) * u.raio * fx, Math.sin(u.ang) * u.raio * fy, u.z)
      m.scale.set(u.w, u.h, 1)
      // inclina para o eixo, como parede de túnel
      m.rotation.set(Math.sin(u.ang) * 0.28, -Math.cos(u.ang) * 0.32, 0)
    }
  }

  // a câmera encosta até a foto do destaque cobrir a tela (em retrato: inteira na largura, com folga)
  function distCobrir() {
    const t = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    if (retrato) return 6 / (0.9 * t * camera.aspect)
    return 0.94 * Math.min(4 / t, 6 / (t * camera.aspect))
  }

  const estado = { camZ: 6, puxar }
  const cam = { x: 0, y: 0, z: 6 }
  const mouse = { x: 0, y: 0 }

  function quadro() {
    cam.z = reduzido ? estado.camZ : lerp(cam.z, estado.camZ, 0.14)
    const maxP = Math.max(...puxar.map((p) => p.v))
    const forca = reduzido ? 0 : 1 - maxP * 0.92
    const alvoX = mouse.x * 0.55 * forca, alvoY = mouse.y * 0.35 * forca
    cam.x = reduzido ? alvoX : lerp(cam.x, alvoX, 0.06)
    cam.y = reduzido ? alvoY : lerp(cam.y, alvoY, 0.06)
    camera.position.set(cam.x, cam.y, cam.z)
    camera.lookAt(cam.x * 0.3, cam.y * 0.3, cam.z - 12)

    const resto = 1 - maxP * 0.88
    for (const m of planos) {
      const atras = m.position.z > cam.z + 0.2
      const d = camera.position.distanceTo(m.position)
      const a = atras ? 0 : suave(0.4, 2.2, d) * resto
      m.material.opacity = a
      m.userData.moldura.material.opacity = a * 0.22
      m.visible = a > 0.003
      m.material.userData.vies.value = vies(d)
    }

    const [fx, fy] = elipse()
    destaquesMesh.forEach((m, k) => {
      const u = m.userData
      const p = suave(0, 1, puxar[k].v)
      m.position.set(lerp(Math.cos(u.ang) * u.raio * fx, 0, p), lerp(Math.sin(u.ang) * u.raio * fy, 0, p), u.z)
      const s = lerp(0.36, 1, p)
      m.scale.set(6 * s, 4 * s, 1)
      m.rotation.set(lerp(Math.sin(u.ang) * 0.28, 0, p), lerp(-Math.cos(u.ang) * 0.32, 0, p), 0)
      const dz = cam.z - u.z
      const d = camera.position.distanceTo(m.position)
      // puxado, ele só some nos últimos centímetros, quando a câmera atravessa
      const a = dz <= 0 ? 0 : p > 0.01 ? suave(0.05, 0.6, dz) : suave(0.4, 2.2, d) * resto
      m.material.opacity = a
      m.visible = a > 0.003
      m.material.userData.vies.value = p > 0.5 ? 0 : vies(d)
    })

    renderer.render(cena, camera)
    return Math.abs(cam.z - estado.camZ) > 0.0005 || Math.abs(cam.x - alvoX) > 0.0005 || Math.abs(cam.y - alvoY) > 0.0005
  }

  function laco() {
    const mexendo = quadro()
    if (mexendo || sujo) { sujo = false; requestAnimationFrame(laco) } else rodando = false
  }

  function redimensionar() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    retrato = camera.aspect < 0.8
    camera.fov = retrato ? 62 : 50
    camera.updateProjectionMatrix()
    dispor()
    pedir()
  }

  if (!reduzido && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pedir()
    }, { passive: true })
  }
  new ResizeObserver(redimensionar).observe(canvas)
  redimensionar()

  return { estado, pedir, distCobrir }
}
