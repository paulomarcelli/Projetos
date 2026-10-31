/* =====================================================================
   Disney · Where Magic Becomes Reality — Design System Builder
   Utilitários compartilhados (cores, fontes, texto, auto layout, erros).
   Projeto acadêmico conceitual, sem afiliação com The Walt Disney Company.
   ===================================================================== */

const MARK = "dds"; // chave de pluginData que marca o que este plugin criou
const ERRORS: string[] = [];

function logError(where: string, e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  ERRORS.push(`${where}: ${msg}`);
}

/** Executa um bloco e registra o erro sem interromper a construção inteira. */
async function step(where: string, fn: () => Promise<void> | void) {
  try {
    await fn();
  } catch (e) {
    logError(where, e);
  }
}

function progress(msg: string) {
  figma.notify(msg, { timeout: 1500 });
}

// ---------------------------------------------------------------- cores
function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function rgba(hex: string, a = 1): RGBA {
  const c = hexToRgb(hex);
  return { r: c.r, g: c.g, b: c.b, a };
}
function rgbString(hex: string): string {
  const c = hexToRgb(hex);
  return `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
}
function solid(hex: string, opacity = 1): SolidPaint {
  return { type: "SOLID", color: hexToRgb(hex), opacity };
}

/** Gradiente linear por ângulo (0° = esquerda→direita, 90° = cima→baixo). */
function linear(angleDeg: number, stops: [string, number, number?][]): GradientPaint {
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  // Matriz que leva o eixo do gradiente para a direção pedida, centrada no meio da caixa.
  const t: Transform = [
    [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],
    [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos],
  ];
  return {
    type: "GRADIENT_LINEAR",
    gradientTransform: t,
    gradientStops: stops.map(([hex, position, alpha]) => ({ position, color: rgba(hex, alpha === undefined ? 1 : alpha) })),
  };
}
function radial(stops: [string, number, number?][], cx = 0.5, cy = 0.5, scale = 1): GradientPaint {
  const t: Transform = [
    [scale, 0, cx - scale / 2],
    [0, scale, cy - scale / 2],
  ];
  return {
    type: "GRADIENT_RADIAL",
    gradientTransform: t,
    gradientStops: stops.map(([hex, position, alpha]) => ({ position, color: rgba(hex, alpha === undefined ? 1 : alpha) })),
  };
}

/** Gerador pseudoaleatório com semente: o céu estrelado sai igual a cada execução. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------- fontes
type Weight = "Light" | "Regular" | "Medium" | "SemiBold" | "Bold" | "ExtraBold" | "Italic" | "LightItalic" | "MediumItalic" | "SemiBoldItalic";
const FAMILY = { display: "Fraunces", ui: "Manrope" };
const FALLBACK = { display: ["Playfair Display", "Inter"], ui: ["Inter"] };
let AVAILABLE: Font[] = [];
const FONT_CACHE: Record<string, FontName> = {};

const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");

async function initFonts() {
  AVAILABLE = await figma.listAvailableFontsAsync();
}
function familyExists(f: string) {
  return AVAILABLE.some((x) => x.fontName.family === f);
}
function resolveFamily(kind: "display" | "ui"): string {
  const list = [FAMILY[kind], ...FALLBACK[kind]];
  for (const f of list) if (familyExists(f)) return f;
  return "Inter";
}
/** Acha o nome exato do estilo ("Semi Bold" x "SemiBold") na família disponível. */
async function font(kind: "display" | "ui", weight: Weight): Promise<FontName> {
  const key = `${kind}:${weight}`;
  if (FONT_CACHE[key]) return FONT_CACHE[key];
  const family = resolveFamily(kind);
  const styles = AVAILABLE.filter((x) => x.fontName.family === family).map((x) => x.fontName.style);
  const order: Record<Weight, string[]> = {
    Light: ["Light", "Regular"],
    Regular: ["Regular"],
    Medium: ["Medium", "Regular"],
    SemiBold: ["SemiBold", "Semi Bold", "Medium", "Bold"],
    Bold: ["Bold", "SemiBold"],
    ExtraBold: ["ExtraBold", "Extra Bold", "Bold"],
    Italic: ["Italic", "Regular Italic", "Regular"],
    LightItalic: ["Light Italic", "Italic", "Light"],
    MediumItalic: ["Medium Italic", "Italic", "Medium"],
    SemiBoldItalic: ["SemiBold Italic", "Semi Bold Italic", "Bold Italic", "Italic"],
  };
  let style = styles[0] || "Regular";
  for (const want of order[weight]) {
    const hit = styles.find((s) => norm(s) === norm(want));
    if (hit) {
      style = hit;
      break;
    }
  }
  const fn: FontName = { family, style };
  await figma.loadFontAsync(fn);
  FONT_CACHE[key] = fn;
  return fn;
}

// ---------------------------------------------------------------- nós
function mark<T extends BaseNode>(n: T): T {
  n.setPluginData(MARK, "1");
  return n;
}

function frame(name: string, props: Partial<FrameNode> = {}): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  Object.assign(f, props);
  return f;
}

/** Auto layout com os dois eixos abraçando o conteúdo. */
function stack(name: string, dir: "VERTICAL" | "HORIZONTAL", gap = 0, pad: number | [number, number] | [number, number, number, number] = 0): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  f.layoutMode = dir;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = gap;
  const p = typeof pad === "number" ? [pad, pad, pad, pad] : pad.length === 2 ? [pad[0], pad[1], pad[0], pad[1]] : pad;
  f.paddingTop = p[0];
  f.paddingRight = p[1];
  f.paddingBottom = p[2];
  f.paddingLeft = p[3];
  f.clipsContent = false;
  return f;
}

/** Acrescenta e, se pedido, faz o filho preencher a largura do pai (precisa vir depois do append). */
function add(parent: FrameNode | ComponentNode | PageNode | GroupNode, child: SceneNode, fill: "H" | "V" | "HV" | null = null): SceneNode {
  parent.appendChild(child);
  if (fill && "layoutSizingHorizontal" in child && parent.type !== "PAGE" && "layoutMode" in parent && parent.layoutMode !== "NONE") {
    if (fill.includes("H")) child.layoutSizingHorizontal = "FILL";
    if (fill.includes("V")) child.layoutSizingVertical = "FILL";
  }
  return child;
}

function fixedWidth(n: FrameNode, w: number) {
  n.resize(w, Math.max(1, n.height));
  n.primaryAxisSizingMode = n.layoutMode === "VERTICAL" ? "AUTO" : "FIXED";
  if (n.layoutMode === "VERTICAL") n.counterAxisSizingMode = "FIXED";
  else n.primaryAxisSizingMode = "FIXED";
}

function rect(name: string, w: number, h: number, fill?: Paint[], radius = 0): RectangleNode {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = fill || [];
  r.cornerRadius = radius;
  return r;
}

function ellipse(name: string, d: number, fill?: Paint[]): EllipseNode {
  const e = figma.createEllipse();
  e.name = name;
  e.resize(d, d);
  e.fills = fill || [];
  return e;
}

/** Posiciona nós de topo da página em coluna, sem sobrepor. */
function placeOnPage(page: PageNode, node: SceneNode, x: number, y: number) {
  page.appendChild(node);
  node.x = x;
  node.y = y;
}
