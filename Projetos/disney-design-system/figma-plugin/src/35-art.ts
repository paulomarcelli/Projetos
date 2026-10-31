/* =====================================================================
   Artes e motivos. Nada de personagens ou logotipos: cada franquia vira uma
   composição abstrata de cor, luz e forma (o "clima" da história).
   ===================================================================== */

/** Brilho de 4 pontas (a "faísca" da marca) como vetor preenchido. */
function sparkleNode(size: number, hex: string, opacity = 1): FrameNode {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c.9 6.6 4.6 10.6 12 12-7.4 1.4-11.1 5.4-12 12-.9-6.6-4.6-10.6-12-12 7.4-1.4 11.1-5.4 12-12z" fill="${hex}" fill-opacity="${opacity}"/></svg>`;
  const n = figma.createNodeFromSvg(svg);
  n.name = "Sparkle";
  n.fills = [];
  n.rescale(size / 24);
  return n;
}

/** Céu estrelado determinístico dentro de um frame recortado. */
function starfield(parent: FrameNode | ComponentNode, w: number, h: number, count: number, seed: number, hex = "#FBF3DC") {
  const rnd = seeded(seed);
  const g = frame("Starfield", { clipsContent: true });
  g.resize(w, h);
  for (let i = 0; i < count; i++) {
    const d = rnd() < 0.85 ? 1 + rnd() * 1.6 : 2.4 + rnd() * 1.6;
    const s = ellipse("star", d, [solid(hex, 0.25 + rnd() * 0.6)]);
    s.x = rnd() * w;
    s.y = rnd() * h;
    g.appendChild(s);
  }
  parent.appendChild(g);
  if ("layoutMode" in parent && parent.layoutMode !== "NONE") g.layoutPositioning = "ABSOLUTE";
  g.x = 0;
  g.y = 0;
  g.locked = true;
  return g;
}

/** Arco de castelo: retângulo com o topo totalmente arredondado (assinatura de forma). */
function archFrame(name: string, w: number, h: number, fills: Paint[]): FrameNode {
  const f = frame(name, { clipsContent: true });
  f.resize(w, h);
  f.fills = fills;
  f.topLeftRadius = w / 2;
  f.topRightRadius = w / 2;
  f.bottomLeftRadius = 24;
  f.bottomRightRadius = 24;
  return f;
}

/** Silhueta genérica de castelo (traço dourado). Não reproduz nenhum castelo real de parque. */
const CASTLE_SVG = (color: string, sw = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="260" viewBox="0 0 320 260" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">
<path d="M20 250h280"/>
<path d="M40 250V150l14-18 14 18v100"/><path d="M252 250V150l14-18 14 18v100"/>
<path d="M68 250V170h40v80"/><path d="M212 250V170h40v80"/>
<path d="M108 250V110l52-80 52 80v140"/>
<path d="M130 250v-30a30 30 0 0 1 60 0v30"/>
<path d="M150 110v20"/><path d="M170 110v20"/>
<path d="M160 30V8"/><path d="M160 8l14 6-14 6"/>
<path d="M54 132v-16"/><path d="M266 132v-16"/>
</svg>`;

function castleNode(width: number, color: string, sw = 2): FrameNode {
  const n = figma.createNodeFromSvg(CASTLE_SVG(color, sw));
  n.name = "Castle silhouette";
  n.fills = [];
  n.rescale(width / 320);
  return n;
}

/** Arte abstrata de franquia, 600×800 (3:4). */
type ArtKey = "mickey" | "frozen" | "lionking" | "toystory" | "moana" | "marvel" | "starwars" | "pixar" | "castle" | "parks" | "cruise" | "paris" | "tokyo";
const ART_SVG: Record<ArtKey, string> = {
  mickey: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E23A3A"/><stop offset="1" stop-color="#7A0E14"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><rect y="560" width="600" height="240" fill="#16150F"/><circle cx="450" cy="200" r="120" fill="none" stroke="#FFD34E" stroke-width="10"/><circle cx="450" cy="200" r="60" fill="#FFD34E" fill-opacity=".9"/><path d="M0 560c120-40 260-40 600 0" fill="none" stroke="#FFD34E" stroke-width="6"/>`,
  frozen: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9F6FF"/><stop offset=".55" stop-color="#8FC8F2"/><stop offset="1" stop-color="#2D5D9F"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><g stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"><path d="M300 180v240"/><path d="M196 240l208 120"/><path d="M196 360l208-120"/><path d="M300 210l-24-22M300 210l24-22M300 390l-24 22M300 390l24 22"/></g><path d="M0 640l120-90 90 60 110-120 120 100 160-80v290H0z" fill="#E9F6FF" fill-opacity=".85"/><path d="M0 700l160-60 120 50 140-70 180 60v120H0z" fill="#FFFFFF"/>`,
  lionking: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC86B"/><stop offset=".6" stop-color="#F07B2F"/><stop offset="1" stop-color="#8E2A0B"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="300" cy="470" r="190" fill="#FFE3A3" fill-opacity=".9"/><path d="M0 560c80-30 140-10 200-30s120-60 180-40 140 40 220 20v290H0z" fill="#3A1306"/><path d="M380 560l40-90 30 10 20 80z" fill="#3A1306"/><path d="M90 520v-80M60 470c30-20 60-20 90 0" stroke="#3A1306" stroke-width="10" fill="none"/>`,
  toystory: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA6F5"/><stop offset="1" stop-color="#A9DBFF"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><g fill="#FFFFFF"><ellipse cx="160" cy="200" rx="110" ry="46"/><ellipse cx="230" cy="170" rx="80" ry="56"/><ellipse cx="440" cy="360" rx="130" ry="50"/><ellipse cx="500" cy="330" rx="70" ry="50"/><ellipse cx="140" cy="560" rx="120" ry="48"/><ellipse cx="200" cy="530" rx="70" ry="50"/></g><rect y="700" width="600" height="100" fill="#F2C14E"/><path d="M0 700h600" stroke="#C4482B" stroke-width="12"/>`,
  moana: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB88A"/><stop offset=".45" stop-color="#2EC4B6"/><stop offset="1" stop-color="#05445E"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="420" cy="260" r="80" fill="#FFE1B5"/><g fill="none" stroke="#E6FBF8" stroke-width="8" stroke-linecap="round"><path d="M0 470c60-30 120-30 180 0s120 30 180 0 120-30 240 0"/><path d="M0 560c60-30 120-30 180 0s120 30 180 0 120-30 240 0" stroke-opacity=".7"/><path d="M0 650c60-30 120-30 180 0s120 30 180 0 120-30 240 0" stroke-opacity=".45"/></g><path d="M140 470l40-130 40 130z" fill="#05445E" fill-opacity=".8"/>`,
  marvel: `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EC1D24"/><stop offset="1" stop-color="#6B0A0E"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><g fill="#FFFFFF" fill-opacity=".14"><circle cx="60" cy="80" r="14"/><circle cx="120" cy="80" r="11"/><circle cx="180" cy="80" r="8"/><circle cx="60" cy="140" r="11"/><circle cx="120" cy="140" r="8"/><circle cx="60" cy="200" r="8"/><circle cx="540" cy="720" r="14"/><circle cx="480" cy="720" r="11"/><circle cx="540" cy="660" r="11"/></g><path d="M-50 640L650 180" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="60"/><path d="M-50 760L650 300" stroke="#16150F" stroke-opacity=".35" stroke-width="30"/>`,
  starwars: `<rect width="600" height="800" fill="#05060B"/><circle cx="470" cy="620" r="210" fill="#1B2E6B"/><circle cx="470" cy="620" r="210" fill="none" stroke="#6E91FF" stroke-opacity=".5" stroke-width="3"/><g fill="#FFFFFF"><circle cx="80" cy="90" r="2"/><circle cx="200" cy="160" r="1.5"/><circle cx="330" cy="70" r="2.5"/><circle cx="520" cy="130" r="1.5"/><circle cx="110" cy="330" r="1.5"/><circle cx="260" cy="400" r="2"/><circle cx="420" cy="280" r="1.5"/><circle cx="60" cy="540" r="2"/><circle cx="180" cy="660" r="1.5"/><circle cx="560" cy="380" r="2"/></g><path d="M60 300L420 120" stroke="#E6BE63" stroke-width="4" stroke-linecap="round"/>`,
  pixar: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2D42"/><stop offset="1" stop-color="#16150F"/></linearGradient><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE29A" stop-opacity=".95"/><stop offset="1" stop-color="#FFE29A" stop-opacity="0"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><path d="M300 140L120 720h360z" fill="url(#l)"/><ellipse cx="300" cy="720" rx="190" ry="26" fill="#FFE29A" fill-opacity=".35"/><rect x="250" y="100" width="100" height="50" rx="20" fill="#E8E8E8"/>`,
  castle: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060B1E"/><stop offset=".6" stop-color="#1B2E6B"/><stop offset="1" stop-color="#3D6BFF"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="300" cy="330" r="200" fill="#6E91FF" fill-opacity=".18"/>`,
  parks: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2E6B"/><stop offset=".7" stop-color="#7A5AE6"/><stop offset="1" stop-color="#E2557A"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><g stroke="#F4DEA6" stroke-width="5" stroke-linecap="round" fill="none"><path d="M300 200v80M300 420v80M160 340h80M360 340h80M200 240l50 50M350 390l50 50M200 440l50-50M350 290l50-50"/></g><g stroke="#FBF3DC" stroke-width="4" fill="none" stroke-opacity=".8"><circle cx="140" cy="160" r="40"/><circle cx="470" cy="190" r="56"/></g>`,
  cruise: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE7C2"/><stop offset=".5" stop-color="#5DB7DE"/><stop offset="1" stop-color="#0B3C5D"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><path d="M110 520h380l-50 90H160z" fill="#0B1434"/><rect x="170" y="440" width="260" height="80" rx="10" fill="#FBFAF6"/><rect x="270" y="380" width="60" height="60" fill="#C93B55"/><path d="M0 640c80 20 160 20 240 0s160-20 360 0v160H0z" fill="#0B3C5D"/>`,
  paris: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C6D9"/><stop offset=".6" stop-color="#7A5AE6"/><stop offset="1" stop-color="#1B2E6B"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="420" cy="230" r="70" fill="#FBF3DC" fill-opacity=".85"/><path d="M0 620c100-40 200-40 300-10s200 40 300 0v190H0z" fill="#12204D"/>`,
  tokyo: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE0E6"/><stop offset=".6" stop-color="#E2557A"/><stop offset="1" stop-color="#4A0E2E"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="300" cy="300" r="120" fill="#FFF4F6" fill-opacity=".85"/><g fill="#FFFFFF" fill-opacity=".9"><circle cx="120" cy="160" r="8"/><circle cx="160" cy="210" r="6"/><circle cx="470" cy="140" r="7"/><circle cx="520" cy="200" r="5"/></g><path d="M0 640c120-30 240-30 360 0s160 20 240 0v160H0z" fill="#2B0A1B"/>`,
};

/** Cria a arte como frame recortado que cobre w×h (escala para cobrir, centralizado). */
function art(key: ArtKey, w: number, h: number, name = `Art/${key}`): FrameNode {
  const box = frame(name, { clipsContent: true });
  box.resize(w, h);
  const svg = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">${ART_SVG[key]}</svg>`);
  svg.name = "art";
  const k = Math.max(w / 600, h / 800);
  svg.rescale(k);
  box.appendChild(svg);
  svg.x = (w - 600 * k) / 2;
  svg.y = (h - 800 * k) / 2;
  if (key === "castle") {
    starfield(box, w, h * 0.7, Math.round((w * h) / 2600), 11);
    const c = castleNode(w * 0.62, "#E6BE63", 2);
    box.appendChild(c);
    c.x = (w - c.width) / 2;
    c.y = h - c.height - h * 0.06;
  }
  return box;
}
