import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

// Texturas livres (fontes e licenças em public/texturas/LICENCAS.md).
// Carregadas uma vez por aba do render; o vídeo só desenha quando todas chegaram.

export type Texturas = {
  hdriNoite: THREE.DataTexture;
  hdriDia: THREE.DataTexture;
  lua: THREE.Texture;
  terra: THREE.Texture;
  agua: THREE.Texture;
  areia: Pbr;
  grama: Pbr;
  asfalto: Pbr;
};

/** Detalhe (cor em tons de cinza, média ~1), normal e rugosidade de um material PBR do Poly Haven. */
export type Pbr = { detalhe: THREE.Texture; normal: THREE.Texture; rugosidade: THREE.Texture };

const carregarImagem = (url: string) =>
  new Promise<HTMLImageElement>((ok, falha) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error(`Textura não carregou: ${url}`));
    img.src = url;
  });

const repetir = (t: THREE.Texture) => {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
};

/**
 * Converte a cor da textura em tons de cinza com média ~0,95. Multiplicada pela cor do token,
 * dá a variação da areia ou da grama sem trocar a cor do Design System.
 */
function detalhe(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const dados = g.getImageData(0, 0, c.width, c.height);
  const px = dados.data;
  let soma = 0;
  for (let i = 0; i < px.length; i += 4) soma += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
  const media = soma / (px.length / 4);
  for (let i = 0; i < px.length; i += 4) {
    const l = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    const v = Math.min(255, Math.max(0, 242 + (l - media) * 1.1));
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  g.putImageData(dados, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return repetir(t);
}

async function pbr(nome: string): Promise<Pbr> {
  const base = staticFile(`texturas/pbr/${nome}`);
  const [cor, normal, rugosidade] = await Promise.all(["diffuse", "nor_gl", "rough"].map((k) => carregarImagem(`${base}_${k}_1k.jpg`)));
  const tex = (img: HTMLImageElement) => {
    const t = new THREE.Texture(img);
    t.needsUpdate = true;
    t.colorSpace = THREE.NoColorSpace;
    return repetir(t);
  };
  return { detalhe: detalhe(cor), normal: tex(normal), rugosidade: tex(rugosidade) };
}

async function cor(url: string) {
  const t = new THREE.Texture(await carregarImagem(staticFile(url)));
  t.needsUpdate = true;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const hdr = (url: string) => new HDRLoader().loadAsync(staticFile(url));

let promessa: Promise<Texturas> | null = null;
let prontas: Texturas | null = null;

function carregar() {
  promessa ??= (async () => {
    const [hdriNoite, hdriDia, lua, terra, agua, areia, grama, asfalto] = await Promise.all([
      hdr("texturas/hdri/moonless_golf_1k.hdr"),
      hdr("texturas/hdri/kloppenheim_06_puresky_1k.hdr"),
      cor("texturas/nasa/lua_lroc_cor_1k.jpg"),
      cor("texturas/nasa/terra_blue_marble_1920.jpg"),
      cor("texturas/agua_normais.jpg").then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        return repetir(t);
      }),
      pbr("coast_sand_01"),
      pbr("aerial_grass_rock"),
      pbr("asphalt_02"),
    ]);
    prontas = { hdriNoite, hdriDia, lua, terra, agua, areia, grama, asfalto };
    return prontas;
  })();
  return promessa;
}

/** As texturas, ou null enquanto carregam (segura o render até chegarem). */
export function useTexturas(): Texturas | null {
  const [t, setT] = useState<Texturas | null>(prontas);
  const [handle] = useState(() => (prontas ? null : delayRender("Carregando texturas")));
  useEffect(() => {
    if (!handle) return;
    carregar()
      .then((r) => {
        setT(r);
        continueRender(handle);
      })
      // Sem textura o vídeo não sai certo: o render para com o erro, em vez de sair sem ela.
      .catch((e) => cancelRender(e));
  }, [handle]);
  return t;
}
