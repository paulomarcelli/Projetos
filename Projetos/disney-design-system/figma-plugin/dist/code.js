"use strict";
/* =====================================================================
   Disney · Where Magic Becomes Reality — Design System Builder
   Utilitários compartilhados (cores, fontes, texto, auto layout, erros).
   Projeto acadêmico conceitual, sem afiliação com The Walt Disney Company.
   ===================================================================== */
const MARK = "dds"; // chave de pluginData que marca o que este plugin criou
const ERRORS = [];
function logError(where, e) {
    const msg = e instanceof Error ? e.message : String(e);
    ERRORS.push(`${where}: ${msg}`);
}
/** Executa um bloco e registra o erro sem interromper a construção inteira. */
async function step(where, fn) {
    try {
        await fn();
    }
    catch (e) {
        logError(where, e);
    }
}
function progress(msg) {
    figma.notify(msg, { timeout: 1500 });
}
// ---------------------------------------------------------------- cores
function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function rgba(hex, a = 1) {
    const c = hexToRgb(hex);
    return { r: c.r, g: c.g, b: c.b, a };
}
function rgbString(hex) {
    const c = hexToRgb(hex);
    return `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
}
function solid(hex, opacity = 1) {
    return { type: "SOLID", color: hexToRgb(hex), opacity };
}
/** Gradiente linear por ângulo (0° = esquerda→direita, 90° = cima→baixo). */
function linear(angleDeg, stops) {
    const a = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // Matriz que leva o eixo do gradiente para a direção pedida, centrada no meio da caixa.
    const t = [
        [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],
        [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos],
    ];
    return {
        type: "GRADIENT_LINEAR",
        gradientTransform: t,
        gradientStops: stops.map(([hex, position, alpha]) => ({ position, color: rgba(hex, alpha === undefined ? 1 : alpha) })),
    };
}
function radial(stops, cx = 0.5, cy = 0.5, scale = 1) {
    const t = [
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
function seeded(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}
const FAMILY = { display: "Fraunces", ui: "Manrope" };
const FALLBACK = { display: ["Playfair Display", "Inter"], ui: ["Inter"] };
let AVAILABLE = [];
const FONT_CACHE = {};
const norm = (s) => s.toLowerCase().replace(/[\s_-]/g, "");
async function initFonts() {
    AVAILABLE = await figma.listAvailableFontsAsync();
}
function familyExists(f) {
    return AVAILABLE.some((x) => x.fontName.family === f);
}
function resolveFamily(kind) {
    const list = [FAMILY[kind], ...FALLBACK[kind]];
    for (const f of list)
        if (familyExists(f))
            return f;
    return "Inter";
}
/** Acha o nome exato do estilo ("Semi Bold" x "SemiBold") na família disponível. */
async function font(kind, weight) {
    const key = `${kind}:${weight}`;
    if (FONT_CACHE[key])
        return FONT_CACHE[key];
    const family = resolveFamily(kind);
    const styles = AVAILABLE.filter((x) => x.fontName.family === family).map((x) => x.fontName.style);
    const order = {
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
    const fn = { family, style };
    await figma.loadFontAsync(fn);
    FONT_CACHE[key] = fn;
    return fn;
}
// ---------------------------------------------------------------- nós
function mark(n) {
    n.setPluginData(MARK, "1");
    return n;
}
function frame(name, props = {}) {
    const f = figma.createFrame();
    f.name = name;
    f.fills = [];
    Object.assign(f, props);
    return f;
}
/** Auto layout com os dois eixos abraçando o conteúdo. */
function stack(name, dir, gap = 0, pad = 0) {
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
function add(parent, child, fill = null) {
    parent.appendChild(child);
    if (fill && "layoutSizingHorizontal" in child && parent.type !== "PAGE" && "layoutMode" in parent && parent.layoutMode !== "NONE") {
        if (fill.includes("H"))
            child.layoutSizingHorizontal = "FILL";
        if (fill.includes("V"))
            child.layoutSizingVertical = "FILL";
    }
    return child;
}
function fixedWidth(n, w) {
    n.resize(w, Math.max(1, n.height));
    n.primaryAxisSizingMode = n.layoutMode === "VERTICAL" ? "AUTO" : "FIXED";
    if (n.layoutMode === "VERTICAL")
        n.counterAxisSizingMode = "FIXED";
    else
        n.primaryAxisSizingMode = "FIXED";
}
function rect(name, w, h, fill, radius = 0) {
    const r = figma.createRectangle();
    r.name = name;
    r.resize(w, h);
    r.fills = fill || [];
    r.cornerRadius = radius;
    return r;
}
function ellipse(name, d, fill) {
    const e = figma.createEllipse();
    e.name = name;
    e.resize(d, d);
    e.fills = fill || [];
    return e;
}
/** Posiciona nós de topo da página em coluna, sem sobrepor. */
function placeOnPage(page, node, x, y) {
    page.appendChild(node);
    node.x = x;
    node.y = y;
}
/* =====================================================================
   Tokens: Variables (Primitives, Color Light/Dark, Spacing, Radius, Motion),
   Text Styles e Effect Styles. Fonte única da verdade do sistema.
   ===================================================================== */
// ---------------------------------------------------------------- primitivas
// Azul da meia-noite (céu sobre o castelo), Azul Real (ação), Ouro (brilho/magia),
// Marfim (papel, pergaminho, luz quente) e Tinta (texto). Três acentos de história.
const PRIMITIVES = {
    "midnight/950": "#060B1E",
    "midnight/900": "#0B1434",
    "midnight/800": "#12204D",
    "midnight/700": "#1B2E6B",
    "royal/700": "#1A3FB0",
    "royal/600": "#2350E0",
    "royal/500": "#3D6BFF",
    "royal/400": "#6E91FF",
    "royal/200": "#C4D3FF",
    "royal/100": "#E6EDFF",
    "gold/700": "#8A6418",
    "gold/600": "#B8862B",
    "gold/500": "#D4A23F",
    "gold/400": "#E6BE63",
    "gold/200": "#F4DEA6",
    "gold/100": "#FBF3DC",
    "ivory/0": "#FFFFFF",
    "ivory/50": "#FBFAF6",
    "ivory/100": "#F4F1E8",
    "ivory/200": "#E6E1D3",
    "ivory/300": "#CFC8B6",
    "ink/400": "#8B8778",
    "ink/500": "#6A6659",
    "ink/600": "#4D4A40",
    "ink/800": "#26241F",
    "ink/900": "#16150F",
    "rose/500": "#E2557A",
    "teal/500": "#14A898",
    "violet/500": "#7A5AE6",
    "success/600": "#1C8A5B",
    "warning/600": "#B87503",
    "error/600": "#C93B55",
};
const PRIMITIVE_GROUPS = [
    { title: "Midnight", role: "Primária institucional · céu, fundos de marca, títulos", keys: ["midnight/950", "midnight/900", "midnight/800", "midnight/700"] },
    { title: "Royal Blue", role: "Ação e navegação · botões, links, foco de interface", keys: ["royal/700", "royal/600", "royal/500", "royal/400", "royal/200", "royal/100"] },
    { title: "Enchanted Gold", role: "Destaque e magia · brilho, prêmios, CTA especial", keys: ["gold/700", "gold/600", "gold/500", "gold/400", "gold/200", "gold/100"] },
    { title: "Ivory", role: "Fundos e superfícies · papel, luz quente", keys: ["ivory/0", "ivory/50", "ivory/100", "ivory/200", "ivory/300"] },
    { title: "Ink", role: "Texto e neutros · leitura longa, metadados", keys: ["ink/400", "ink/500", "ink/600", "ink/800", "ink/900"] },
    { title: "Story Accents", role: "Cores complementares · categorias e ilustração", keys: ["rose/500", "teal/500", "violet/500"] },
    { title: "Feedback", role: "Estados do sistema · sucesso, atenção, erro", keys: ["success/600", "warning/600", "error/600"] },
];
const SEMANTIC = {
    "color/bg/canvas": { light: "ivory/50", dark: "midnight/950", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Fundo da página" },
    "color/bg/surface": { light: "ivory/0", dark: "midnight/900", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Cartões e painéis" },
    "color/bg/elevated": { light: "ivory/100", dark: "midnight/800", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Áreas destacadas e campos" },
    "color/bg/inverse": { light: "midnight/900", dark: "ivory/50", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Faixas de marca invertidas" },
    "color/bg/brand": { light: "midnight/900", dark: "midnight/800", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Cabeçalho e hero" },
    "color/text/primary": { light: "midnight/900", dark: "ivory/50", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Títulos e texto principal" },
    "color/text/secondary": { light: "ink/600", dark: "royal/200", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Corpo e apoio" },
    "color/text/muted": { light: "ink/500", dark: "ink/400", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Metadados e legendas" },
    "color/text/inverse": { light: "ivory/50", dark: "midnight/900", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Texto sobre fundo invertido" },
    "color/text/brand": { light: "royal/600", dark: "royal/400", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Links e destaques de navegação" },
    "color/text/gold": { light: "gold/700", dark: "gold/400", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Destaque mágico em texto" },
    "color/text/on-action": { light: "ivory/0", dark: "ivory/0", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Texto sobre botão primário" },
    "color/text/on-magic": { light: "midnight/900", dark: "midnight/900", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Texto sobre botão dourado" },
    "color/text/disabled": { light: "ink/400", dark: "ink/500", scopes: ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Texto desabilitado" },
    "color/border/subtle": { light: "ivory/200", dark: "midnight/800", scopes: ["STROKE_COLOR"], desc: "Divisórias e contornos leves" },
    "color/border/strong": { light: "ivory/300", dark: "midnight/700", scopes: ["STROKE_COLOR"], desc: "Contornos de campos e botões secundários" },
    "color/action/primary": { light: "royal/600", dark: "royal/600", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Botão primário" },
    "color/action/primary-hover": { light: "royal/700", dark: "royal/700", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Botão primário · hover" },
    "color/action/primary-pressed": { light: "midnight/800", dark: "midnight/700", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Botão primário · pressionado" },
    "color/action/magic": { light: "gold/500", dark: "gold/500", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "CTA especial (compra, reserva)" },
    "color/action/magic-hover": { light: "gold/400", dark: "gold/400", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "CTA especial · hover" },
    "color/action/magic-pressed": { light: "gold/600", dark: "gold/600", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "CTA especial · pressionado" },
    "color/action/subtle-hover": { light: "royal/100", dark: "midnight/700", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Fundo de hover em botões fantasma e chips" },
    "color/action/disabled": { light: "ivory/200", dark: "midnight/800", scopes: ["FRAME_FILL", "SHAPE_FILL"], desc: "Fundo desabilitado" },
    "color/focus/ring": { light: "gold/500", dark: "gold/400", scopes: ["STROKE_COLOR"], desc: "Anel de foco (teclado)" },
    "color/feedback/success": { light: "success/600", dark: "success/600", scopes: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"], desc: "Sucesso" },
    "color/feedback/warning": { light: "warning/600", dark: "warning/600", scopes: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"], desc: "Atenção" },
    "color/feedback/error": { light: "error/600", dark: "error/600", scopes: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"], desc: "Erro" },
    "color/accent/rose": { light: "rose/500", dark: "rose/500", scopes: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Acento · romance, emoção" },
    "color/accent/teal": { light: "teal/500", dark: "teal/500", scopes: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Acento · aventura, natureza" },
    "color/accent/violet": { light: "violet/500", dark: "violet/500", scopes: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"], desc: "Acento · fantasia, encantamento" },
};
// ---------------------------------------------------------------- espaço, raio, motion
const SPACING = [
    ["space/0", 0, "Sem espaço"],
    ["space/8", 8, "Ícone ↔ texto, chips"],
    ["space/16", 16, "Padding interno pequeno, gap de lista"],
    ["space/24", 24, "Padding de cartão, gutter"],
    ["space/32", 32, "Entre grupos de conteúdo"],
    ["space/40", 40, "Margem tablet"],
    ["space/48", 48, "Entre blocos de um módulo"],
    ["space/64", 64, "Entre seções (mobile)"],
    ["space/80", 80, "Margem desktop"],
    ["space/96", 96, "Entre seções (tablet)"],
    ["space/128", 128, "Entre seções (desktop)"],
    ["space/160", 160, "Respiro de hero"],
];
const RADIUS = [
    ["radius/0", 0, "Mídia sangrada, faixas"],
    ["radius/8", 8, "Tags, campos pequenos"],
    ["radius/16", 16, "Campos, cartões compactos"],
    ["radius/24", 24, "Cartões de conteúdo"],
    ["radius/32", 32, "Painéis, banners"],
    ["radius/full", 999, "Botões, chips, avatares"],
];
const MOTION = [
    ["duration/instant", 100, "Pressionar, toggles"],
    ["duration/quick", 200, "Hover, foco, tooltips"],
    ["duration/standard", 300, "Menus, cartões, abas"],
    ["duration/expressive", 500, "Modais, entradas de seção"],
    ["duration/cinematic", 800, "Hero, abertura, celebração"],
];
const TYPE = [
    { name: "Display/XL", kind: "display", weight: "Light", size: 96, lh: 100, ls: -2.5, use: "Hero de abertura" },
    { name: "Display/L", kind: "display", weight: "Light", size: 72, lh: 80, ls: -2, use: "Hero de seção, capas" },
    { name: "Heading/H1", kind: "display", weight: "Regular", size: 56, lh: 64, ls: -1.5, use: "Título de página" },
    { name: "Heading/H2", kind: "display", weight: "Regular", size: 40, lh: 48, ls: -1, use: "Título de seção" },
    { name: "Heading/H3", kind: "display", weight: "Medium", size: 32, lh: 40, ls: -0.5, use: "Subseções, cartões grandes" },
    { name: "Heading/H4", kind: "display", weight: "Medium", size: 24, lh: 32, ls: 0, use: "Títulos de cartão" },
    { name: "Subtitle/L", kind: "ui", weight: "SemiBold", size: 20, lh: 28, ls: 0, use: "Linha fina, destaque" },
    { name: "Subtitle/M", kind: "ui", weight: "SemiBold", size: 18, lh: 26, ls: 0, use: "Títulos compactos" },
    { name: "Body/L", kind: "ui", weight: "Regular", size: 18, lh: 30, ls: 0, use: "Texto de abertura (lead)" },
    { name: "Body/M", kind: "ui", weight: "Regular", size: 16, lh: 26, ls: 0, use: "Texto corrido" },
    { name: "Body/S", kind: "ui", weight: "Regular", size: 14, lh: 22, ls: 0, use: "Apoio, descrições de cartão" },
    { name: "Caption", kind: "ui", weight: "Medium", size: 12, lh: 18, ls: 1, use: "Legendas, metadados" },
    { name: "Overline", kind: "ui", weight: "Bold", size: 12, lh: 16, ls: 14, upper: true, use: "Rótulos de categoria" },
    { name: "Label", kind: "ui", weight: "SemiBold", size: 14, lh: 20, ls: 0, use: "Rótulos de campo, navegação" },
    { name: "Button/L", kind: "ui", weight: "Bold", size: 16, lh: 24, ls: 1, use: "Botões grandes" },
    { name: "Button/M", kind: "ui", weight: "Bold", size: 14, lh: 20, ls: 1, use: "Botões, chips" },
];
// ---------------------------------------------------------------- registros
const VAR = {};
const TSTYLE = {};
const ESTYLE = {};
let COLOR_COLLECTION = null;
let COLOR_MODES = { light: "", dark: "" };
async function getOrCreateCollection(name) {
    const all = await figma.variables.getLocalVariableCollectionsAsync();
    return all.find((c) => c.name === name) || figma.variables.createVariableCollection(name);
}
async function getOrCreateVariable(name, coll, type) {
    const all = await figma.variables.getLocalVariablesAsync(type);
    const hit = all.find((v) => v.name === name && v.variableCollectionId === coll.id);
    return hit || figma.variables.createVariable(name, coll, type);
}
const cssName = (n) => `var(--${n.replace(/\//g, "-")})`;
async function buildVariables() {
    // Primitivas: escondidas dos seletores (escopo vazio); a interface usa as semânticas.
    const prim = await getOrCreateCollection("DS · Primitives");
    prim.renameMode(prim.modes[0].modeId, "Value");
    for (const [name, hex] of Object.entries(PRIMITIVES)) {
        const v = await getOrCreateVariable(name, prim, "COLOR");
        v.setValueForMode(prim.modes[0].modeId, rgba(hex));
        v.scopes = [];
        v.setVariableCodeSyntax("WEB", cssName(`color-${name}`));
        v.description = `${hex} · RGB ${rgbString(hex)}`;
        VAR[name] = v;
    }
    // Cores semânticas com modos Light e Dark, sempre apontando (alias) para as primitivas.
    const col = await getOrCreateCollection("DS · Color");
    COLOR_COLLECTION = col;
    const light = col.modes[0].modeId;
    col.renameMode(light, "Light");
    let dark = (col.modes.find((m) => m.name === "Dark") || { modeId: "" }).modeId;
    if (!dark)
        dark = col.addMode("Dark");
    COLOR_MODES = { light, dark };
    for (const [name, s] of Object.entries(SEMANTIC)) {
        const v = await getOrCreateVariable(name, col, "COLOR");
        v.setValueForMode(light, { type: "VARIABLE_ALIAS", id: VAR[s.light].id });
        v.setValueForMode(dark, { type: "VARIABLE_ALIAS", id: VAR[s.dark].id });
        v.scopes = s.scopes;
        v.setVariableCodeSyntax("WEB", cssName(name));
        v.description = `${s.desc} · Light: ${s.light} · Dark: ${s.dark}`;
        VAR[name] = v;
    }
    const sp = await getOrCreateCollection("DS · Spacing");
    sp.renameMode(sp.modes[0].modeId, "Value");
    for (const [name, val, desc] of SPACING) {
        const v = await getOrCreateVariable(name, sp, "FLOAT");
        v.setValueForMode(sp.modes[0].modeId, val);
        v.scopes = ["GAP", "WIDTH_HEIGHT"];
        v.setVariableCodeSyntax("WEB", cssName(name));
        v.description = `${val}px · ${desc}`;
        VAR[name] = v;
    }
    const rd = await getOrCreateCollection("DS · Radius");
    rd.renameMode(rd.modes[0].modeId, "Value");
    for (const [name, val, desc] of RADIUS) {
        const v = await getOrCreateVariable(name, rd, "FLOAT");
        v.setValueForMode(rd.modes[0].modeId, val);
        v.scopes = ["CORNER_RADIUS"];
        v.setVariableCodeSyntax("WEB", cssName(name));
        v.description = `${val === 999 ? "pill" : val + "px"} · ${desc}`;
        VAR[name] = v;
    }
    const mo = await getOrCreateCollection("DS · Motion");
    mo.renameMode(mo.modes[0].modeId, "Value");
    for (const [name, val, desc] of MOTION) {
        const v = await getOrCreateVariable(name, mo, "FLOAT");
        v.setValueForMode(mo.modes[0].modeId, val);
        v.scopes = []; // documentação de motion: não aparece em seletores de propriedade
        v.setVariableCodeSyntax("WEB", cssName(name));
        v.description = `${val}ms · ${desc}`;
        VAR[name] = v;
    }
}
async function buildTextStyles() {
    const existing = await figma.getLocalTextStylesAsync();
    for (const t of TYPE) {
        const fn = await font(t.kind, t.weight);
        const s = existing.find((x) => x.name === t.name) || figma.createTextStyle();
        s.name = t.name;
        s.fontName = fn;
        s.fontSize = t.size;
        s.lineHeight = { unit: "PIXELS", value: t.lh };
        s.letterSpacing = { unit: "PERCENT", value: t.ls };
        s.textCase = t.upper ? "UPPER" : "ORIGINAL";
        s.description = `${fn.family} ${fn.style} · ${t.size}/${t.lh} · ${t.ls}% · ${t.use}`;
        TSTYLE[t.name] = s;
    }
}
async function buildEffectStyles() {
    const existing = await figma.getLocalEffectStylesAsync();
    const defs = [
        ["Elevation/1", [{ type: "DROP_SHADOW", color: rgba("#0B1434", 0.08), offset: { x: 0, y: 2 }, radius: 8, spread: 0, visible: true, blendMode: "NORMAL" }], "Cartões em repouso"],
        ["Elevation/2", [{ type: "DROP_SHADOW", color: rgba("#0B1434", 0.12), offset: { x: 0, y: 12 }, radius: 32, spread: -8, visible: true, blendMode: "NORMAL" }], "Cartões em hover, menus"],
        ["Elevation/3", [{ type: "DROP_SHADOW", color: rgba("#060B1E", 0.28), offset: { x: 0, y: 24 }, radius: 64, spread: -12, visible: true, blendMode: "NORMAL" }], "Modais, banners flutuantes"],
        ["Glow/Gold", [{ type: "DROP_SHADOW", color: rgba("#D4A23F", 0.45), offset: { x: 0, y: 0 }, radius: 24, spread: 0, visible: true, blendMode: "NORMAL" }], "Brilho mágico: CTA especial, celebração"],
        ["Glow/Royal", [{ type: "DROP_SHADOW", color: rgba("#3D6BFF", 0.4), offset: { x: 0, y: 8 }, radius: 24, spread: -4, visible: true, blendMode: "NORMAL" }], "Botão primário em foco/hover"],
    ];
    for (const [name, effects, desc] of defs) {
        const s = existing.find((x) => x.name === name) || figma.createEffectStyle();
        s.name = name;
        s.effects = effects;
        s.description = desc;
        ESTYLE[name] = s;
    }
}
// ---------------------------------------------------------------- binding helpers
function bindFill(node, varName) {
    const v = VAR[varName];
    if (!v)
        throw new Error(`variável ausente: ${varName}`);
    node.fills = [figma.variables.setBoundVariableForPaint(solid("#000000"), "color", v)];
}
function bindStroke(node, varName, weight = 1) {
    const v = VAR[varName];
    if (!v)
        throw new Error(`variável ausente: ${varName}`);
    node.strokes = [figma.variables.setBoundVariableForPaint(solid("#000000"), "color", v)];
    node.strokeWeight = weight;
}
function bindRadius(node, varName) {
    const v = VAR[varName];
    for (const f of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"])
        node.setBoundVariable(f, v);
}
function bindPadding(node, x, y) {
    if (x) {
        node.setBoundVariable("paddingLeft", VAR[x]);
        node.setBoundVariable("paddingRight", VAR[x]);
    }
    if (y) {
        node.setBoundVariable("paddingTop", VAR[y]);
        node.setBoundVariable("paddingBottom", VAR[y]);
    }
}
function bindGap(node, varName) {
    node.setBoundVariable("itemSpacing", VAR[varName]);
}
/** Texto com text style e cor por variável. width => quebra de linha com largura fixa. */
async function text(content, style, color, width, align = "LEFT") {
    const def = TYPE.find((t) => t.name === style);
    if (!def)
        throw new Error(`text style ausente: ${style}`);
    const t = figma.createText();
    t.fontName = await font(def.kind, def.weight);
    t.characters = content;
    await t.setTextStyleIdAsync(TSTYLE[style].id);
    bindFill(t, color);
    t.textAlignHorizontal = align;
    t.name = content.length > 40 ? content.slice(0, 40) + "…" : content;
    if (width) {
        t.resize(width, t.height);
        t.textAutoResize = "HEIGHT";
    }
    return t;
}
/** Texto com cor literal (para artes e sobre imagens), ainda com text style. */
async function textRaw(content, style, hex, width, opacity = 1) {
    const def = TYPE.find((t) => t.name === style);
    if (!def)
        throw new Error(`text style ausente: ${style}`);
    const t = figma.createText();
    t.fontName = await font(def.kind, def.weight);
    t.characters = content;
    await t.setTextStyleIdAsync(TSTYLE[style].id);
    t.fills = [solid(hex, opacity)];
    t.name = content.length > 40 ? content.slice(0, 40) + "…" : content;
    if (width) {
        t.resize(width, t.height);
        t.textAutoResize = "HEIGHT";
    }
    return t;
}
/* =====================================================================
   Conteúdo estratégico (PT-BR). Fatos históricos conferidos nas fontes
   listadas em SOURCES; números financeiros citam o relatório anual (10-K).
   ===================================================================== */
const PROJECT = {
    name: "Disney — Where Magic Becomes Reality",
    subtitle: "Design System · The Walt Disney Company",
    version: "v1.0 · 2026",
    author: "Paulo Marcelli",
    disclaimer: "Projeto acadêmico conceitual, sem afiliação, patrocínio ou endosso da The Walt Disney Company. Disney, nomes de filmes, franquias e personagens são marcas de seus titulares. A assinatura oficial (logotipo) e os personagens não foram reproduzidos: o wordmark e as artes são conceituais.",
};
const SOURCES = [
    "The Walt Disney Company — About / Our Businesses (thewaltdisneycompany.com/about)",
    "D23, The Official Disney Fan Club — Disney History (d23.com/disney-history)",
    "The Walt Disney Company — Form 10-K, ano fiscal de 2024 (SEC, sec.gov)",
    "Walt Disney Archives — linha do tempo institucional",
];
const TIMELINE = [
    ["1923", "A fundação", "Em 16 de outubro, Walt e Roy O. Disney abrem o Disney Brothers Cartoon Studio, em Los Angeles."],
    ["1928", "Nasce um ícone", "Mickey Mouse estreia em “Steamboat Willie”, um dos primeiros desenhos animados com som sincronizado."],
    ["1937", "O primeiro longa", "“Branca de Neve e os Sete Anões”, primeiro longa-metragem de animação do estúdio, muda o cinema."],
    ["1955", "A magia ganha endereço", "A Disneyland abre em Anaheim, Califórnia: as histórias passam a ser lugares."],
    ["1971", "Walt Disney World", "O resort da Flórida inaugura o modelo de destino completo de férias."],
    ["1983–2016", "Parques pelo mundo", "Tóquio (1983), Paris (1992), Hong Kong (2005) e Xangai (2016)."],
    ["1995–1996", "Mídia e esportes", "A aquisição da Capital Cities/ABC traz a ABC e a ESPN."],
    ["2006–2012", "Grandes estúdios", "Chegam Pixar (2006), Marvel (2009) e Lucasfilm (2012)."],
    ["2019", "Era do streaming", "Aquisição da 21st Century Fox e lançamento do Disney+, em 12 de novembro."],
    ["Hoje", "Uma empresa, três segmentos", "Entertainment, Sports e Experiences; sede em Burbank, Califórnia."],
];
const SEGMENTS = [
    ["Entertainment", "Criação e distribuição de histórias", ["Walt Disney Animation Studios, Pixar, Marvel Studios, Lucasfilm, 20th Century Studios", "Disney+, Hulu e redes de TV (ABC, Disney Channel, National Geographic)", "Música, teatro (Disney Theatrical) e publicações"]],
    ["Sports", "Esporte ao vivo e jornalismo esportivo", ["ESPN e seus canais", "ESPN+ e transmissões digitais", "Direitos de eventos e ligas"]],
    ["Experiences", "Histórias que se vivem em pessoa", ["12 parques temáticos em 6 resorts pelo mundo", "Disney Cruise Line, Aulani e Disney Vacation Club", "Produtos de consumo, licenciamento, games e shopDisney"]],
];
const FACTS = [
    ["1923", "Ano de fundação"],
    ["3", "Segmentos de negócio"],
    ["12", "Parques temáticos em 6 resorts"],
    ["US$ 91,4 bi", "Receita no ano fiscal de 2024 (10-K)"],
];
const DIFFERENTIATORS = [
    ["Narrativa como motor", "Toda linha de negócio nasce de uma história: o filme vira parque, música, produto e memória."],
    ["Portfólio de franquias", "Disney, Pixar, Marvel, Star Wars e National Geographic sob o mesmo teto criativo."],
    ["Ecossistema integrado", "Tela, parque, cruzeiro e loja conectados: cada ponto de contato alimenta o outro."],
    ["Excelência de experiência", "Padrão reconhecido de hospitalidade, cuidado com o detalhe e encantamento."],
    ["Inovação técnica", "Do som sincronizado (1928) à animação digital e à imersão nos parques."],
    ["Relevância multigeracional", "Avós, pais e filhos compartilham as mesmas histórias, em tempos diferentes."],
];
const PERSONALITY = [
    ["Arquétipo · O Mago", "Transforma o comum em extraordinário e faz sonhos parecerem possíveis."],
    ["Calorosa", "Acolhe todas as idades e todas as famílias, com gentileza e cuidado."],
    ["Imaginativa", "Convida a pensar além do possível, com curiosidade e humor."],
    ["Otimista", "Acredita no final feliz conquistado com coragem e bondade."],
    ["Atemporal", "Honra o legado clássico enquanto inventa o futuro do entretenimento."],
];
const POSITIONING = {
    statement: "Para famílias e fãs de todas as idades que buscam viver emoções verdadeiras juntos, a Disney é a marca de entretenimento que transforma histórias em experiências, da tela ao parque, porque une mais de cem anos de narrativa, franquias amadas e um padrão incomparável de encantamento.",
    value: "Experiências de entretenimento que criam memórias compartilhadas: histórias que você assiste, visita, coleciona e passa adiante.",
    mission: "“Entreter, informar e inspirar pessoas ao redor do mundo por meio do poder de uma narrativa incomparável, refletindo as marcas icônicas, as mentes criativas e as tecnologias inovadoras que fazem da nossa a principal empresa de entretenimento do mundo.” — missão declarada pela empresa",
    purpose: "Fazer a magia virar realidade: aproximar pessoas por meio de histórias que despertam imaginação, coragem e esperança.",
    audiences: [
        ["Famílias com crianças", "Buscam entretenimento seguro, emocionante e compartilhável."],
        ["Jovens adultos e fãs", "Marvel, Star Wars e Pixar: comunidade, colecionáveis e lançamentos."],
        ["Adultos nostálgicos", "Revivem a infância e a apresentam a uma nova geração."],
        ["Viajantes de experiência", "Parques, cruzeiros e resorts como destino de vida."],
    ],
    competitive: [
        ["Propriedade intelectual", "Biblioteca e franquias que nenhum concorrente replica."],
        ["Efeito volante", "Um sucesso de bilheteria alimenta streaming, parques e produtos."],
        ["Confiança da marca", "Sinônimo de qualidade e segurança para famílias."],
    ],
    perception: ["Mágica, sem ser infantil", "Sofisticada, sem ser distante", "Nostálgica, sem ser antiquada", "Global, sem perder o calor humano"],
    market: "Líder global em entretenimento de marca: compete com estúdios e plataformas (Netflix, Warner Bros. Discovery, Universal/Comcast) em conteúdo, e com destinos de lazer em experiências, mas é a única com um ecossistema completo de histórias.",
};
const PERSONA = {
    name: "Mariana Albuquerque",
    age: 36,
    quote: "“Quero que meus filhos sintam o que eu senti na primeira vez que vi O Rei Leão.”",
    demographic: [
        ["Idade", "36 anos"],
        ["Cidade", "Campinas, SP"],
        ["Ocupação", "Gerente de marketing em uma empresa de tecnologia"],
        ["Família", "Casada; mãe de Theo (7) e Lia (4)"],
        ["Renda", "Classe A/B, renda familiar ~R$ 25 mil/mês"],
        ["Escolaridade", "Pós-graduada em Comunicação"],
    ],
    interests: ["Cinema de animação", "Viagens em família", "Musicais da Broadway", "Decoração temática", "Séries da Marvel com o marido"],
    habits: [
        "Assina Disney+ e assiste a um filme em família toda sexta-feira",
        "Compra presentes e fantasias na shopDisney e em lojas licenciadas",
        "Ouve trilhas sonoras Disney com as crianças no carro",
        "Planeja a primeira viagem ao Walt Disney World há um ano",
    ],
    relation: "Cresceu com os clássicos dos anos 1990. Hoje revive a marca como mãe: filmes, músicas, produtos e, em breve, o parque. Para ela, a Disney é um ritual de família, não só um catálogo.",
    needs: ["Planejar a viagem com clareza de custos", "Encontrar conteúdo certo para cada idade", "Experiências que adultos também curtam", "Um lugar só para descobrir tudo da marca"],
    pains: ["Planejar parques parece complexo e caro (ingressos, câmbio, filas)", "Excesso de opções no streaming", "Informações espalhadas entre apps e sites de cada marca", "Medo de a viagem não corresponder à expectativa"],
    motivations: ["Criar memórias que os filhos levem para a vida", "Reviver a própria infância", "Ver o encantamento no rosto das crianças", "Sentir-se uma boa organizadora da família"],
    channels: ["Disney+", "Instagram (@disneyparks)", "YouTube", "App My Disney Experience", "shopDisney", "Spotify", "Grupos de WhatsApp de viagem"],
    journey: [
        ["Descobre", "Trailer de um novo filme no Instagram"],
        ["Assiste", "Sessão em família no Disney+"],
        ["Coleciona", "Pelúcia e livro na shopDisney"],
        ["Planeja", "Pesquisa ingressos e resorts"],
        ["Vive", "Primeira visita ao Magic Kingdom"],
        ["Compartilha", "Fotos e vídeos com a família"],
    ],
};
const VOICE = {
    intro: "A Disney fala como um bom contador de histórias: com calor, imaginação e clareza. Encanta sem exagerar, acolhe sem infantilizar e inspira sem prometer o impossível.",
    traits: [
        ["Inspiradora", "Desperta vontade de sonhar e agir."],
        ["Mágica", "Encontra o extraordinário no simples."],
        ["Emocional", "Fala de sentimentos, não de funcionalidades."],
        ["Acolhedora", "Todas as idades e todas as famílias se sentem convidadas."],
        ["Imaginativa", "Usa imagens e metáforas com leveza."],
        ["Otimista", "Olha para o final feliz, com honestidade."],
        ["Atemporal", "Evita gírias passageiras; soa bem em qualquer década."],
    ],
    principles: [
        ["Conte, não anuncie", "Comece pela emoção da história antes do produto."],
        ["Encante com clareza", "A magia está no tom; a informação precisa ser direta."],
        ["Fale com todas as gerações", "Simples para a criança, rico para o adulto."],
        ["Prometa o que entrega", "Otimismo sem exagero: nada de “o melhor dia da sua vida, garantido”."],
        ["Respeite o momento", "Mais leveza no marketing; mais precisão em erros e pagamentos."],
    ],
    vocabularyUse: ["imaginar", "descobrir", "juntos", "memória", "história", "encantar", "aventura", "sonho", "família", "brilho"],
    vocabularyAvoid: ["imperdível!!!", "garantido", "barato", "promoção relâmpago", "usuário", "erro fatal", "clique aqui", "gírias da moda"],
    tone: [
        ["Campanhas e marketing", 90, "Mais mágico e emocional"],
        ["Navegação e produto", 55, "Caloroso e objetivo"],
        ["Compras e reservas", 35, "Claro, confiável, sem pressão"],
        ["Erros e suporte", 20, "Empático, direto, com saída"],
    ],
    examples: [
        ["Boas-vindas", "Que bom ter você aqui. Vamos começar uma nova história?", "Bem-vindo ao portal. Faça login para continuar."],
        ["Chamada de parque", "Onde os sonhos ganham endereço. Planeje sua visita ao Walt Disney World.", "IMPERDÍVEL!!! Garanta já o melhor dia da sua vida!!!"],
        ["Erro de pagamento", "Não conseguimos confirmar o pagamento. Confira os dados do cartão e tente de novo; seus ingressos continuam reservados por 15 minutos.", "Erro fatal 402. Transação recusada."],
        ["Estado vazio", "Sua lista de desejos está esperando a primeira história.", "Nenhum item encontrado."],
    ],
    ui: [
        ["Botão primário", "Planejar minha visita", "Enviar"],
        ["Botão de compra", "Garantir ingressos", "Comprar agora!!!"],
        ["Sucesso", "Tudo pronto! Sua aventura começa em 12 de março.", "Operação concluída com sucesso."],
        ["Busca vazia", "Nenhuma história com esse nome ainda. Que tal “Moana”?", "0 resultados."],
        ["Carregamento", "Preparando a magia…", "Carregando…"],
    ],
};
/* =====================================================================
   Iconografia: grade 24×24, área viva 20×20 (2px de respiro), traço 1,5px,
   pontas e junções arredondadas. Cada ícone vira um Component "Icon/<nome>",
   com o traço ligado à variável color/text/primary (troca no tema e na instância).
   ===================================================================== */
const ICONS = [
    // Marca e magia
    { name: "castle", cat: "Marca & magia", body: '<path d="M3 21h18"/><path d="M5 21v-9l1.5-2L8 12v9"/><path d="M16 21v-9l1.5-2 1.5 2v9"/><path d="M8 21V9l4-6 4 6v12"/><path d="M10.5 21v-2.5a1.5 1.5 0 0 1 3 0V21"/><path d="M12 10v1.5"/>' },
    { name: "sparkle", cat: "Marca & magia", body: '<path d="M12 3c.7 4.6 3.4 7.3 9 9-5.6 1.7-8.3 4.4-9 9-.7-4.6-3.4-7.3-9-9 5.6-1.7 8.3-4.4 9-9z"/>' },
    { name: "sparkles", cat: "Marca & magia", body: '<path d="M10 5c.5 3.3 2.4 5.2 6 6-3.6.8-5.5 2.7-6 6-.5-3.3-2.4-5.2-6-6 3.6-.8 5.5-2.7 6-6z"/><path d="M18 3v4"/><path d="M16 5h4"/><path d="M18 16v4"/><path d="M16 18h4"/>' },
    { name: "star", cat: "Marca & magia", body: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>' },
    { name: "wand", cat: "Marca & magia", body: '<path d="M4 20 14.5 9.5"/><path d="M17 3l.8 2.2L20 6l-2.2.8L17 9l-.8-2.2L14 6l2.2-.8z"/><path d="M20 12h.01"/><path d="M11 4h.01"/>' },
    { name: "crown", cat: "Marca & magia", body: '<path d="M4 17 3 8l5 4 4-6 4 6 5-4-1 9z"/><path d="M4 21h16"/>' },
    { name: "fireworks", cat: "Marca & magia", body: '<path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2"/>' },
    // Cinema e entretenimento
    { name: "clapper", cat: "Cinema & entretenimento", body: '<rect x="3" y="10" width="18" height="10" rx="1.5"/><path d="M3.5 10 19.6 5.5l.9 3.1L4.4 13"/><path d="M8.5 8.6l1.6 2.6"/><path d="M13.5 7.2l1.6 2.6"/>' },
    { name: "film", cat: "Cinema & entretenimento", body: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18"/><path d="M16 3v18"/><path d="M4 8h4"/><path d="M4 16h4"/><path d="M16 8h4"/><path d="M16 16h4"/>' },
    { name: "play", cat: "Cinema & entretenimento", body: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>' },
    { name: "ticket", cat: "Cinema & entretenimento", body: '<path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4z"/><path d="M14 6v2"/><path d="M14 11v2"/><path d="M14 16v2"/>' },
    { name: "popcorn", cat: "Cinema & entretenimento", body: '<path d="M6 10h12l-1.5 10h-9z"/><path d="M10 10l.5 10"/><path d="M14 10l-.5 10"/><path d="M6 10a2 2 0 0 1 1-3.7A2.5 2.5 0 0 1 11.5 5a2.5 2.5 0 0 1 4.4 1.3A2 2 0 0 1 18 10"/>' },
    { name: "music", cat: "Cinema & entretenimento", body: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>' },
    { name: "tv", cat: "Cinema & entretenimento", body: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>' },
    // Viagens e experiências
    { name: "globe", cat: "Viagens & experiências", body: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>' },
    { name: "map-pin", cat: "Viagens & experiências", body: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>' },
    { name: "ferris-wheel", cat: "Viagens & experiências", body: '<circle cx="12" cy="10" r="7"/><path d="M12 3v14"/><path d="M5 10h14"/><path d="M7 5l10 10"/><path d="M17 5 7 15"/><path d="M9 21l3-4 3 4"/><path d="M7 21h10"/>' },
    { name: "ship", cat: "Viagens & experiências", body: '<path d="M3 15h18l-2.5 5h-13z"/><path d="M6 15v-4h12v4"/><path d="M10 11V7h4v4"/>' },
    { name: "suitcase", cat: "Viagens & experiências", body: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M9 11v5"/><path d="M15 11v5"/>' },
    { name: "calendar", cat: "Viagens & experiências", body: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16"/><path d="M9 3v4"/><path d="M15 3v4"/>' },
    // Navegação digital
    { name: "home", cat: "Navegação digital", body: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>' },
    { name: "search", cat: "Navegação digital", body: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>' },
    { name: "user", cat: "Navegação digital", body: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>' },
    { name: "heart", cat: "Navegação digital", body: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>' },
    { name: "bell", cat: "Navegação digital", body: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>' },
    { name: "menu", cat: "Navegação digital", body: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>' },
    { name: "close", cat: "Navegação digital", body: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>' },
    { name: "arrow-right", cat: "Navegação digital", body: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>' },
    { name: "chevron-down", cat: "Navegação digital", body: '<path d="M6 9l6 6 6-6"/>' },
    { name: "chevron-right", cat: "Navegação digital", body: '<path d="M9 6l6 6-6 6"/>' },
];
const ICON = {};
function svgFor(body, color = "#0B1434", stroke = 1.5) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
/** Cria os componentes de ícone. Ficam na página Iconography (biblioteca). */
function buildIconComponents() {
    const out = [];
    for (const def of ICONS) {
        const node = figma.createNodeFromSvg(svgFor(def.body));
        const comp = figma.createComponent();
        comp.name = `Icon/${def.name}`;
        comp.resize(24, 24);
        comp.fills = [];
        comp.clipsContent = false;
        for (const child of [...node.children])
            comp.appendChild(child);
        node.remove();
        // Traço por variável: herda o tema e pode ser trocado na instância.
        for (const v of comp.findAll((n) => "strokes" in n)) {
            if (v.strokes.length)
                bindStroke(v, "color/text/primary", 1.5);
            v.constraints = { horizontal: "SCALE", vertical: "SCALE" };
        }
        comp.description = `Ícone ${def.name} · categoria: ${def.cat} · grade 24, traço 1,5px. Use em 16, 20, 24 ou 32px; troque a cor pela variável de texto do contexto.`;
        mark(comp);
        ICON[def.name] = comp;
        out.push(comp);
    }
    return out;
}
/** Instância de ícone com cor e tamanho opcionais. */
function icon(name, size = 24, colorVar) {
    const inst = ICON[name].createInstance();
    if (size !== 24)
        inst.rescale(size / 24);
    if (colorVar) {
        for (const v of inst.findAll((n) => "strokes" in n)) {
            if (v.strokes.length)
                bindStroke(v, colorVar, v.strokeWeight);
        }
    }
    return inst;
}
/* =====================================================================
   Artes e motivos. Nada de personagens ou logotipos: cada franquia vira uma
   composição abstrata de cor, luz e forma (o "clima" da história).
   ===================================================================== */
/** Brilho de 4 pontas (a "faísca" da marca) como vetor preenchido. */
function sparkleNode(size, hex, opacity = 1) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c.9 6.6 4.6 10.6 12 12-7.4 1.4-11.1 5.4-12 12-.9-6.6-4.6-10.6-12-12 7.4-1.4 11.1-5.4 12-12z" fill="${hex}" fill-opacity="${opacity}"/></svg>`;
    const n = figma.createNodeFromSvg(svg);
    n.name = "Sparkle";
    n.fills = [];
    n.rescale(size / 24);
    return n;
}
/** Céu estrelado determinístico dentro de um frame recortado. */
function starfield(parent, w, h, count, seed, hex = "#FBF3DC") {
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
    if ("layoutMode" in parent && parent.layoutMode !== "NONE")
        g.layoutPositioning = "ABSOLUTE";
    g.x = 0;
    g.y = 0;
    g.locked = true;
    return g;
}
/** Arco de castelo: retângulo com o topo totalmente arredondado (assinatura de forma). */
function archFrame(name, w, h, fills) {
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
const CASTLE_SVG = (color, sw = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="260" viewBox="0 0 320 260" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">
<path d="M20 250h280"/>
<path d="M40 250V150l14-18 14 18v100"/><path d="M252 250V150l14-18 14 18v100"/>
<path d="M68 250V170h40v80"/><path d="M212 250V170h40v80"/>
<path d="M108 250V110l52-80 52 80v140"/>
<path d="M130 250v-30a30 30 0 0 1 60 0v30"/>
<path d="M150 110v20"/><path d="M170 110v20"/>
<path d="M160 30V8"/><path d="M160 8l14 6-14 6"/>
<path d="M54 132v-16"/><path d="M266 132v-16"/>
</svg>`;
function castleNode(width, color, sw = 2) {
    const n = figma.createNodeFromSvg(CASTLE_SVG(color, sw));
    n.name = "Castle silhouette";
    n.fills = [];
    n.rescale(width / 320);
    return n;
}
const ART_SVG = {
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
function art(key, w, h, name = `Art/${key}`) {
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
/* =====================================================================
   Componentes reutilizáveis. Tudo ligado às variáveis (cor, espaço, raio),
   com propriedades (TEXT, BOOLEAN, INSTANCE_SWAP), variantes e protótipo
   (hover/pressionar com Smart Animate nas curvas do sistema de movimento).
   ===================================================================== */
const EASE_OUT = { type: "CUSTOM_CUBIC_BEZIER", easingFunctionCubicBezier: { x1: 0.23, y1: 1, x2: 0.32, y2: 1 } };
const EASE_IN_OUT = { type: "CUSTOM_CUBIC_BEZIER", easingFunctionCubicBezier: { x1: 0.77, y1: 0, x2: 0.175, y2: 1 } };
const SPRING = { type: "GENTLE" };
const C = {};
const ART = {};
function changeTo(trigger, dest, ms, easing = EASE_OUT) {
    return { trigger, actions: [{ type: "NODE", destinationId: dest.id, navigation: "CHANGE_TO", transition: { type: "SMART_ANIMATE", easing, duration: ms / 1000 }, preserveScrollPosition: false }] };
}
/** Distribui as variantes em grade (linhas × colunas) depois do combineAsVariants. */
function gridVariants(set, cols, gapX = 32, gapY = 32, pad = 32) {
    const kids = set.children;
    const colW = [];
    const rowH = [];
    kids.forEach((k, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        colW[c] = Math.max(colW[c] || 0, k.width);
        rowH[r] = Math.max(rowH[r] || 0, k.height);
    });
    kids.forEach((k, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        k.x = pad + colW.slice(0, c).reduce((a, b) => a + b + gapX, 0);
        k.y = pad + rowH.slice(0, r).reduce((a, b) => a + b + gapY, 0);
    });
    const w = pad * 2 + colW.reduce((a, b) => a + b, 0) + gapX * (colW.length - 1);
    const h = pad * 2 + rowH.reduce((a, b) => a + b, 0) + gapY * (rowH.length - 1);
    set.resize(w, h);
    bindFill(set, "color/bg/surface");
    set.cornerRadius = 24;
    bindStroke(set, "color/border/subtle", 1);
    set.dashPattern = [6, 6];
}
function refText(comp, layerName, key) {
    const t = comp.findOne((n) => n.type === "TEXT" && n.name === layerName);
    if (t)
        t.componentPropertyReferences = { characters: key };
}
function refNode(comp, layerName, refs) {
    const n = comp.findOne((x) => x.name === layerName);
    if (n)
        n.componentPropertyReferences = refs;
}
// ---------------------------------------------------------------- arte como componentes (para INSTANCE_SWAP)
function buildArtComponents(holder) {
    const keys = ["castle", "mickey", "frozen", "lionking", "toystory", "moana", "marvel", "starwars", "pixar", "parks", "cruise", "paris", "tokyo"];
    const out = [];
    for (const k of keys) {
        const a = art(k, 300, 400);
        const comp = figma.createComponent();
        comp.name = `Art/${k}`;
        comp.resize(300, 400);
        comp.clipsContent = true;
        comp.fills = [];
        for (const ch of [...a.children])
            comp.appendChild(ch);
        a.remove();
        // Escala junto com a instância: todos os descendentes acompanham o redimensionamento.
        for (const n of comp.findAll(() => true))
            if ("constraints" in n)
                n.constraints = { horizontal: "SCALE", vertical: "SCALE" };
        for (const n of comp.findAll((x) => x.type === "FRAME"))
            n.locked = false;
        comp.description = "Arte conceitual abstrata (cor, luz e forma da história). Não reproduz personagens nem logotipos. Troque pela propriedade Art dos cartões.";
        holder.appendChild(comp);
        mark(comp);
        ART[k] = comp;
        out.push(comp);
    }
    return out;
}
/** Instância de arte cobrindo w×h, recortada por um frame. */
function artSlot(name, w, h, key = "castle") {
    const slot = frame(name, { clipsContent: true });
    slot.resize(w, h);
    const inst = ART[key].createInstance();
    inst.name = "Art";
    const k = Math.max(w / 300, h / 400);
    inst.resize(300 * k, 400 * k);
    slot.appendChild(inst);
    inst.x = (w - inst.width) / 2;
    inst.y = (h - inst.height) / 2;
    inst.constraints = { horizontal: "CENTER", vertical: "CENTER" };
    return { slot, inst };
}
async function makeButton(style, state) {
    const b = figma.createComponent();
    b.name = `Style=${style}, State=${state}`;
    b.layoutMode = "HORIZONTAL";
    b.primaryAxisSizingMode = "AUTO";
    b.counterAxisSizingMode = "AUTO";
    b.counterAxisAlignItems = "CENTER";
    b.itemSpacing = 8;
    bindGap(b, "space/8");
    b.paddingLeft = b.paddingRight = 24;
    b.paddingTop = b.paddingBottom = 16;
    bindPadding(b, "space/24", "space/16");
    bindRadius(b, "radius/full");
    b.fills = [];
    const bg = {
        Primary: { Default: "color/action/primary", Hover: "color/action/primary-hover", Pressed: "color/action/primary-pressed", Focus: "color/action/primary", Disabled: "color/action/disabled" },
        Secondary: { Hover: "color/action/subtle-hover", Pressed: "color/bg/elevated" },
        Ghost: { Hover: "color/action/subtle-hover", Pressed: "color/bg/elevated" },
        Magic: { Default: "color/action/magic", Hover: "color/action/magic-hover", Pressed: "color/action/magic-pressed", Focus: "color/action/magic", Disabled: "color/action/disabled" },
    };
    const fg = { Primary: "color/text/on-action", Secondary: "color/text/primary", Ghost: "color/text/brand", Magic: "color/text/on-magic" };
    const bgVar = bg[style][state];
    if (bgVar)
        bindFill(b, bgVar);
    if (style === "Secondary")
        bindStroke(b, state === "Hover" ? "color/text/brand" : "color/border/strong", 1.5);
    if (state === "Focus") {
        bindStroke(b, "color/focus/ring", 3);
        b.strokeAlign = "OUTSIDE";
    }
    if (state === "Hover" && style === "Primary")
        await b.setEffectStyleIdAsync(ESTYLE["Glow/Royal"].id);
    if (state === "Hover" && style === "Magic")
        await b.setEffectStyleIdAsync(ESTYLE["Glow/Gold"].id);
    const color = state === "Disabled" ? "color/text/disabled" : fg[style];
    const label = await text("Planejar visita", "Button/L", color);
    label.name = "Label";
    b.appendChild(label);
    const ic = icon("arrow-right", 20, color);
    ic.name = "Icon";
    b.appendChild(ic);
    return b;
}
async function buildButton(parent) {
    const styles = ["Primary", "Secondary", "Ghost", "Magic"];
    const states = ["Default", "Hover", "Pressed", "Focus", "Disabled"];
    const comps = [];
    for (const s of styles)
        for (const st of states) {
            const c = await makeButton(s, st);
            parent.appendChild(c);
            comps.push(c);
        }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Button";
    gridVariants(set, states.length);
    const kLabel = set.addComponentProperty("Label", "TEXT", "Planejar visita");
    const kShow = set.addComponentProperty("Show icon", "BOOLEAN", true);
    const kIcon = set.addComponentProperty("Icon", "INSTANCE_SWAP", ICON["arrow-right"].id, {
        preferredValues: ["arrow-right", "ticket", "calendar", "play", "sparkle", "map-pin"].map((n) => ({ type: "COMPONENT", key: ICON[n].key })),
    });
    for (const c of set.children) {
        refText(c, "Label", kLabel);
        refNode(c, "Icon", { visible: kShow, mainComponent: kIcon });
    }
    // Protótipo: Default → Hover (200ms) e → Pressed (100ms); Hover → Pressed.
    for (const s of styles) {
        const find = (st) => set.findChild((n) => n.name === `Style=${s}, State=${st}`);
        await find("Default").setReactionsAsync([changeTo({ type: "ON_HOVER" }, find("Hover"), 200), changeTo({ type: "ON_PRESS" }, find("Pressed"), 100)]);
        await find("Hover").setReactionsAsync([changeTo({ type: "ON_PRESS" }, find("Pressed"), 100)]);
    }
    set.description =
        "Ação principal. Primary: ação padrão (Royal Blue). Secondary: alternativa. Ghost: ações de baixa ênfase e links de seção. Magic: um único CTA especial por tela (compra, reserva). Altura 56, padding 24/16, pílula. Estados: Hover 200ms ease-out, Pressed 100ms, Focus com anel dourado de 3px (teclado). Rótulos com verbo e emoção: “Planejar minha visita”, “Garantir ingressos”.";
    mark(set);
    C.Button = set;
    return set;
}
// ---------------------------------------------------------------- Icon Button
async function buildIconButton(parent) {
    const comps = [];
    for (const style of ["Solid", "Outline", "Glass"])
        for (const state of ["Default", "Hover"]) {
            const c = figma.createComponent();
            c.name = `Style=${style}, State=${state}`;
            c.resize(48, 48);
            c.layoutMode = "HORIZONTAL";
            c.primaryAxisAlignItems = "CENTER";
            c.counterAxisAlignItems = "CENTER";
            c.primaryAxisSizingMode = "FIXED";
            c.counterAxisSizingMode = "FIXED";
            bindRadius(c, "radius/full");
            let color = "color/text/primary";
            if (style === "Solid") {
                bindFill(c, state === "Hover" ? "color/action/primary-hover" : "color/action/primary");
                color = "color/text/on-action";
            }
            else if (style === "Outline") {
                c.fills = state === "Hover" ? [] : [];
                if (state === "Hover")
                    bindFill(c, "color/action/subtle-hover");
                bindStroke(c, "color/border/strong", 1.5);
            }
            else {
                // Glass: para uso sobre o fundo de marca (hero, cabeçalho)
                c.fills = [solid("#FFFFFF", state === "Hover" ? 0.2 : 0.1)];
                c.strokes = [solid("#FFFFFF", 0.24)];
                c.strokeWeight = 1;
            }
            const ic = style === "Glass" ? icon("search", 20) : icon("search", 20, color);
            if (style === "Glass")
                for (const v of ic.findAll((n) => "strokes" in n))
                    if (v.strokes.length)
                        v.strokes = [solid("#FBFAF6")];
            ic.name = "Icon";
            c.appendChild(ic);
            parent.appendChild(c);
            comps.push(c);
        }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Icon Button";
    gridVariants(set, 2, 24, 24, 24);
    const kIcon = set.addComponentProperty("Icon", "INSTANCE_SWAP", ICON["search"].id);
    for (const c of set.children)
        refNode(c, "Icon", { mainComponent: kIcon });
    for (const style of ["Solid", "Outline", "Glass"]) {
        const d = set.findChild((n) => n.name === `Style=${style}, State=Default`);
        const h = set.findChild((n) => n.name === `Style=${style}, State=Hover`);
        await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, h, 200)]);
    }
    set.description = "Botão só com ícone, 48×48 (alvo de toque ≥ 44). Sempre com nome acessível (ex.: “Buscar”). Glass é para uso sobre o fundo de marca.";
    mark(set);
    C.IconButton = set;
    return set;
}
// ---------------------------------------------------------------- Chip
async function buildChip(parent) {
    const comps = [];
    for (const state of ["Default", "Hover", "Selected"]) {
        const c = figma.createComponent();
        c.name = `State=${state}`;
        c.layoutMode = "HORIZONTAL";
        c.primaryAxisSizingMode = "AUTO";
        c.counterAxisSizingMode = "AUTO";
        c.counterAxisAlignItems = "CENTER";
        c.itemSpacing = 8;
        c.paddingLeft = c.paddingRight = 16;
        c.paddingTop = c.paddingBottom = 8;
        bindPadding(c, "space/16", "space/8");
        bindRadius(c, "radius/full");
        let color = "color/text/secondary";
        if (state === "Selected") {
            bindFill(c, "color/bg/inverse");
            color = "color/text/inverse";
        }
        else {
            if (state === "Hover")
                bindFill(c, "color/action/subtle-hover");
            else
                c.fills = [];
            bindStroke(c, "color/border/strong", 1);
        }
        const ic = icon("sparkle", 16, state === "Selected" ? "color/text/gold" : color);
        ic.name = "Icon";
        c.appendChild(ic);
        const t = await text("Aventura", "Button/M", color);
        t.name = "Label";
        c.appendChild(t);
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Chip";
    gridVariants(set, 3, 24, 24, 24);
    const k = set.addComponentProperty("Label", "TEXT", "Aventura");
    const kShow = set.addComponentProperty("Show icon", "BOOLEAN", false);
    for (const c of set.children) {
        refText(c, "Label", k);
        refNode(c, "Icon", { visible: kShow });
    }
    const d = set.findChild((n) => n.name === "State=Default");
    await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover"), 200), changeTo({ type: "ON_CLICK" }, set.findChild((n) => n.name === "State=Selected"), 300, EASE_IN_OUT)]);
    set.description = "Filtros de categoria (Aventura, Musical, Família…). Selecionado inverte a superfície; o brilho dourado aparece só no estado selecionado.";
    mark(set);
    C.Chip = set;
    return set;
}
// ---------------------------------------------------------------- Badge
async function buildBadge(parent) {
    const tones = [
        ["Gold", "#FBF3DC", "#8A6418", "Novo"],
        ["Royal", "#E6EDFF", "#1A3FB0", "Em cartaz"],
        ["Neutral", "#F4F1E8", "#4D4A40", "Em breve"],
        ["Rose", "#FCE4EB", "#9E2449", "Ao vivo"],
    ];
    const comps = [];
    for (const [tone, bg, fgHex, label] of tones) {
        const c = figma.createComponent();
        c.name = `Tone=${tone}`;
        c.layoutMode = "HORIZONTAL";
        c.primaryAxisSizingMode = "AUTO";
        c.counterAxisSizingMode = "AUTO";
        c.counterAxisAlignItems = "CENTER";
        c.itemSpacing = 4;
        c.paddingLeft = c.paddingRight = 8;
        c.paddingTop = c.paddingBottom = 4; // meio passo (4px): permitido só em componentes compactos
        c.fills = [solid(bg)];
        c.cornerRadius = 8;
        const t = await textRaw(label, "Overline", fgHex);
        t.name = "Label";
        c.appendChild(t);
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Badge";
    gridVariants(set, 4, 16, 16, 24);
    const k = set.addComponentProperty("Label", "TEXT", "Novo");
    for (const c of set.children)
        refText(c, "Label", k);
    set.description = "Rótulo curto de status do conteúdo (máx. 2 palavras). Cores com contraste ≥ 4,5:1 nos dois temas (tons fixos, legíveis sobre arte).";
    mark(set);
    C.Badge = set;
    return set;
}
// ---------------------------------------------------------------- Input
async function buildInput(parent) {
    const comps = [];
    for (const state of ["Default", "Focus", "Filled", "Error"]) {
        const c = figma.createComponent();
        c.name = `State=${state}`;
        c.layoutMode = "VERTICAL";
        c.primaryAxisSizingMode = "AUTO";
        c.counterAxisSizingMode = "FIXED";
        c.resize(360, 100);
        c.itemSpacing = 8;
        bindGap(c, "space/8");
        c.fills = [];
        const lbl = await text("Para onde vamos?", "Label", "color/text/primary");
        lbl.name = "Label";
        c.appendChild(lbl);
        const field = stack("Field", "HORIZONTAL", 8, [16, 16]);
        field.counterAxisAlignItems = "CENTER";
        bindPadding(field, "space/16", "space/16");
        bindRadius(field, "radius/16");
        bindFill(field, "color/bg/surface");
        bindStroke(field, state === "Error" ? "color/feedback/error" : state === "Focus" ? "color/action/primary" : "color/border/strong", state === "Focus" || state === "Error" ? 2 : 1);
        if (state === "Focus")
            field.effects = [{ type: "DROP_SHADOW", color: rgba("#D4A23F", 0.35), offset: { x: 0, y: 0 }, radius: 0, spread: 4, visible: true, blendMode: "NORMAL" }];
        field.appendChild(icon("search", 20, "color/text/muted"));
        const val = await text(state === "Default" || state === "Focus" ? "Busque filmes, parques ou experiências" : "Walt Disney World", "Body/M", state === "Default" || state === "Focus" ? "color/text/muted" : "color/text/primary");
        val.name = "Value";
        field.appendChild(val);
        c.appendChild(field);
        field.layoutSizingHorizontal = "FILL";
        val.layoutSizingHorizontal = "FILL";
        const help = await text(state === "Error" ? "Não encontramos esse destino. Que tal “Disneyland Paris”?" : "Digite pelo menos 3 letras.", "Caption", state === "Error" ? "color/feedback/error" : "color/text/muted");
        help.name = "Helper";
        c.appendChild(help);
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Input";
    gridVariants(set, 2, 32, 32, 32);
    const kL = set.addComponentProperty("Label", "TEXT", "Para onde vamos?");
    const kV = set.addComponentProperty("Value", "TEXT", "Busque filmes, parques ou experiências");
    const kH = set.addComponentProperty("Helper", "TEXT", "Digite pelo menos 3 letras.");
    for (const c of set.children) {
        refText(c, "Label", kL);
        refText(c, "Value", kV);
        refText(c, "Helper", kH);
    }
    set.description = "Campo de texto com rótulo visível (nunca só placeholder). Foco: borda Royal 2px + halo dourado. Erro: mensagem perto do campo, com saída sugerida, no tom da marca.";
    mark(set);
    C.Input = set;
    return set;
}
// ---------------------------------------------------------------- Nav Link (sobre o fundo de marca)
async function buildNavLink(parent) {
    const comps = [];
    for (const state of ["Default", "Hover", "Active"]) {
        const c = figma.createComponent();
        c.name = `State=${state}`;
        c.layoutMode = "VERTICAL";
        c.primaryAxisSizingMode = "AUTO";
        c.counterAxisSizingMode = "AUTO";
        c.counterAxisAlignItems = "CENTER";
        c.itemSpacing = 4;
        c.paddingTop = c.paddingBottom = 8;
        c.fills = [];
        const t = await textRaw("Parques", "Label", state === "Active" ? "#E6BE63" : "#FBFAF6", undefined, state === "Default" ? 0.78 : 1);
        t.name = "Label";
        c.appendChild(t);
        const bar = rect("Indicator", 16, 2, [solid("#E6BE63", state === "Active" ? 1 : 0)], 1);
        c.appendChild(bar);
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Nav Link";
    set.fills = [solid("#0B1434")];
    gridVariants(set, 3, 32, 24, 24);
    set.fills = [solid("#0B1434")];
    const k = set.addComponentProperty("Label", "TEXT", "Parques");
    for (const c of set.children)
        refText(c, "Label", k);
    const d = set.findChild((n) => n.name === "State=Default");
    await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover"), 200)]);
    set.description = "Item da navegação global, sobre o fundo de marca. Ativo: texto dourado + indicador de 16×2.";
    mark(set);
    C.NavLink = set;
    return set;
}
// ---------------------------------------------------------------- Wordmark conceitual
async function wordmark(scale = 1, hex = "#FBFAF6") {
    const w = stack("Wordmark (conceitual)", "HORIZONTAL", 10 * scale);
    w.counterAxisAlignItems = "CENTER";
    w.appendChild(sparkleNode(22 * scale, "#E6BE63"));
    const col = stack("Lockup", "VERTICAL", 0);
    const t = figma.createText();
    t.fontName = await font("display", "SemiBoldItalic");
    t.characters = "Disney";
    t.fontSize = 28 * scale;
    t.letterSpacing = { unit: "PERCENT", value: -1 };
    t.lineHeight = { unit: "PIXELS", value: 30 * scale };
    t.fills = [solid(hex)];
    col.appendChild(t);
    const s = figma.createText();
    s.fontName = await font("ui", "Bold");
    s.characters = "THE WALT DISNEY COMPANY";
    s.fontSize = 8 * scale;
    s.letterSpacing = { unit: "PERCENT", value: 22 };
    s.fills = [solid(hex, 0.7)];
    col.appendChild(s);
    w.appendChild(col);
    return w;
}
// ---------------------------------------------------------------- Header
async function buildHeader(parent) {
    const btnSet = C.Button;
    const navSet = C.NavLink;
    const ibSet = C.IconButton;
    const variant = (set, name) => set.findChild((n) => n.name === name);
    const desk = figma.createComponent();
    desk.name = "Size=Desktop";
    desk.resize(1440, 88);
    desk.layoutMode = "HORIZONTAL";
    desk.primaryAxisSizingMode = "FIXED";
    desk.counterAxisSizingMode = "AUTO";
    desk.counterAxisAlignItems = "CENTER";
    desk.primaryAxisAlignItems = "SPACE_BETWEEN";
    desk.paddingLeft = desk.paddingRight = 80;
    desk.paddingTop = desk.paddingBottom = 16;
    bindPadding(desk, "space/80", "space/16");
    bindFill(desk, "color/bg/brand");
    desk.appendChild(await wordmark());
    const nav = stack("Nav", "HORIZONTAL", 32);
    bindGap(nav, "space/32");
    for (const [i, label] of ["Filmes", "Séries", "Parques", "Experiências", "Produtos", "Nossa história"].entries()) {
        const inst = variant(navSet, i === 2 ? "State=Active" : "State=Default").createInstance();
        inst.setProperties({ [Object.keys(navSet.componentPropertyDefinitions).find((k) => k.startsWith("Label"))]: label });
        nav.appendChild(inst);
    }
    desk.appendChild(nav);
    const right = stack("Actions", "HORIZONTAL", 16);
    right.counterAxisAlignItems = "CENTER";
    bindGap(right, "space/16");
    for (const ic of ["search", "user"]) {
        const ib = variant(ibSet, "Style=Glass, State=Default").createInstance();
        const key = Object.keys(ibSet.componentPropertyDefinitions).find((k) => k.startsWith("Icon"));
        ib.setProperties({ [key]: ICON[ic].id });
        right.appendChild(ib);
    }
    const cta = variant(btnSet, "Style=Magic, State=Default").createInstance();
    const defs = btnSet.componentPropertyDefinitions;
    cta.setProperties({ [Object.keys(defs).find((k) => k.startsWith("Label"))]: "Planejar visita", [Object.keys(defs).find((k) => k.startsWith("Show icon"))]: false });
    right.appendChild(cta);
    desk.appendChild(right);
    const mob = figma.createComponent();
    mob.name = "Size=Mobile";
    mob.resize(390, 72);
    mob.layoutMode = "HORIZONTAL";
    mob.primaryAxisSizingMode = "FIXED";
    mob.counterAxisSizingMode = "AUTO";
    mob.counterAxisAlignItems = "CENTER";
    mob.primaryAxisAlignItems = "SPACE_BETWEEN";
    mob.paddingLeft = mob.paddingRight = 24;
    mob.paddingTop = mob.paddingBottom = 12;
    bindPadding(mob, "space/24", null);
    bindFill(mob, "color/bg/brand");
    mob.appendChild(await wordmark(0.85));
    const mr = stack("Actions", "HORIZONTAL", 8);
    for (const ic of ["search", "menu"]) {
        const ib = variant(ibSet, "Style=Glass, State=Default").createInstance();
        const key = Object.keys(ibSet.componentPropertyDefinitions).find((k) => k.startsWith("Icon"));
        ib.setProperties({ [key]: ICON[ic].id });
        mr.appendChild(ib);
    }
    mob.appendChild(mr);
    parent.appendChild(desk);
    parent.appendChild(mob);
    const set = figma.combineAsVariants([desk, mob], parent);
    set.name = "Header";
    gridVariants(set, 1, 32, 48, 0);
    set.description = "Navegação global. Sempre sobre color/bg/brand (azul da meia-noite nos dois temas). Um único CTA Magic. Wordmark conceitual: a assinatura oficial da Disney não é reproduzida.";
    mark(set);
    C.Header = set;
    return set;
}
// ---------------------------------------------------------------- Media Card (filmes e animações)
async function buildMediaCard(parent) {
    const comps = [];
    for (const state of ["Default", "Hover"]) {
        const c = figma.createComponent();
        c.name = `State=${state}`;
        c.layoutMode = "VERTICAL";
        c.primaryAxisSizingMode = "AUTO";
        c.counterAxisSizingMode = "FIXED";
        c.resize(264, 480);
        c.itemSpacing = 16;
        bindGap(c, "space/16");
        c.paddingTop = state === "Hover" ? 0 : 8; // sobe 8px no hover (Smart Animate)
        c.paddingBottom = state === "Hover" ? 8 : 0;
        c.fills = [];
        const { slot } = artSlot("Poster", 264, 352, "frozen");
        bindRadius(slot, "radius/24");
        if (state === "Hover")
            await slot.setEffectStyleIdAsync(ESTYLE["Elevation/2"].id);
        const badge = C.Badge.findChild((n) => n.name === "Tone=Royal");
        const bi = badge.createInstance();
        bi.name = "Badge";
        slot.appendChild(bi);
        bi.x = 16;
        bi.y = 16;
        const play = rect("Play scrim", 264, 352, [linear(90, [["#060B1E", 0, 0], ["#060B1E", 1, state === "Hover" ? 0.55 : 0]])]);
        slot.appendChild(play);
        play.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
        const pi = icon("play", 48);
        for (const v of pi.findAll((n) => "strokes" in n))
            if (v.strokes.length)
                v.strokes = [solid("#FBFAF6")];
        pi.name = "Play";
        pi.opacity = state === "Hover" ? 1 : 0;
        slot.appendChild(pi);
        pi.x = 20;
        pi.y = 352 - 68;
        c.appendChild(slot);
        const info = stack("Info", "VERTICAL", 4);
        const t = await text("Frozen II", "Subtitle/M", "color/text/primary");
        t.name = "Title";
        info.appendChild(t);
        const m = await text("Walt Disney Animation Studios · 2019", "Caption", "color/text/muted");
        m.name = "Meta";
        info.appendChild(m);
        c.appendChild(info);
        info.layoutSizingHorizontal = "FILL";
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Media Card";
    gridVariants(set, 2, 32, 32, 32);
    const kT = set.addComponentProperty("Title", "TEXT", "Frozen II");
    const kM = set.addComponentProperty("Meta", "TEXT", "Walt Disney Animation Studios · 2019");
    const kB = set.addComponentProperty("Show badge", "BOOLEAN", true);
    const kA = set.addComponentProperty("Art", "INSTANCE_SWAP", ART.frozen.id);
    for (const c of set.children) {
        refText(c, "Title", kT);
        refText(c, "Meta", kM);
        refNode(c, "Badge", { visible: kB });
        refNode(c, "Art", { mainComponent: kA });
    }
    const d = set.findChild((n) => n.name === "State=Default");
    await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover"), 300)]);
    set.description = "Cartão de filme/animação, pôster 3:4 com raio 24. Hover: sobe 8px, sombra Elevation/2 e o botão de play aparece (300ms ease-out). Arte trocável pela propriedade Art.";
    mark(set);
    C.MediaCard = set;
    return set;
}
// ---------------------------------------------------------------- Experience Card (parques e experiências)
async function buildExperienceCard(parent) {
    const c = figma.createComponent();
    c.name = "Experience Card";
    c.layoutMode = "VERTICAL";
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "FIXED";
    c.resize(384, 560);
    c.itemSpacing = 16;
    bindGap(c, "space/16");
    c.paddingLeft = c.paddingRight = c.paddingTop = 16;
    c.paddingBottom = 24;
    bindFill(c, "color/bg/surface");
    bindRadius(c, "radius/32");
    bindStroke(c, "color/border/subtle", 1);
    await c.setEffectStyleIdAsync(ESTYLE["Elevation/1"].id);
    const { slot } = artSlot("Image", 352, 300, "parks");
    slot.topLeftRadius = slot.topRightRadius = 176;
    slot.bottomLeftRadius = slot.bottomRightRadius = 16;
    c.appendChild(slot);
    slot.layoutSizingHorizontal = "FILL"; // responsivo: o arco acompanha a largura do cartão
    const body = stack("Body", "VERTICAL", 8, [0, 8]);
    const loc = stack("Location", "HORIZONTAL", 8);
    loc.counterAxisAlignItems = "CENTER";
    loc.appendChild(icon("map-pin", 16, "color/text/gold"));
    const lt = await text("Orlando, Flórida · EUA", "Caption", "color/text/gold");
    lt.name = "Location text";
    loc.appendChild(lt);
    body.appendChild(loc);
    const t = await text("Walt Disney World Resort", "Heading/H4", "color/text/primary", 336);
    t.name = "Title";
    body.appendChild(t);
    const d = await text("Quatro parques, noites de fogos e histórias que você atravessa a pé.", "Body/S", "color/text/secondary", 336);
    d.name = "Description";
    body.appendChild(d);
    c.appendChild(body);
    body.layoutSizingHorizontal = "FILL";
    t.layoutSizingHorizontal = "FILL";
    d.layoutSizingHorizontal = "FILL";
    const btn = C.Button.findChild((n) => n.name === "Style=Ghost, State=Default").createInstance();
    const defs = C.Button.componentPropertyDefinitions;
    btn.setProperties({ [Object.keys(defs).find((k) => k.startsWith("Label"))]: "Explorar destino" });
    btn.name = "CTA";
    c.appendChild(btn);
    parent.appendChild(c);
    const kT = c.addComponentProperty("Title", "TEXT", "Walt Disney World Resort");
    const kL = c.addComponentProperty("Location", "TEXT", "Orlando, Flórida · EUA");
    const kD = c.addComponentProperty("Description", "TEXT", "Quatro parques, noites de fogos e histórias que você atravessa a pé.");
    const kA = c.addComponentProperty("Art", "INSTANCE_SWAP", ART.parks.id);
    t.componentPropertyReferences = { characters: kT };
    lt.componentPropertyReferences = { characters: kL };
    d.componentPropertyReferences = { characters: kD };
    refNode(c, "Art", { mainComponent: kA });
    c.description = "Cartão de parque/experiência com a imagem em ARCO DE CASTELO (forma-assinatura do sistema). Raio 32, padding 16/24, Elevation/1.";
    mark(c);
    C.ExperienceCard = c;
    return c;
}
// ---------------------------------------------------------------- Franchise Tile
async function buildFranchiseTile(parent) {
    const comps = [];
    for (const state of ["Default", "Hover"]) {
        const c = figma.createComponent();
        c.name = `State=${state}`;
        c.resize(296, 400);
        c.clipsContent = true;
        bindRadius(c, "radius/32");
        c.fills = [];
        if (state === "Hover")
            await c.setEffectStyleIdAsync(ESTYLE["Glow/Gold"].id);
        const { slot } = artSlot("Art slot", 296, 400, "lionking");
        c.appendChild(slot);
        slot.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
        const scrim = rect("Scrim", 296, 400, [linear(90, [["#060B1E", 0.35, 0], ["#060B1E", 1, 0.85]])]);
        c.appendChild(scrim);
        scrim.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
        const sp = sparkleNode(20, "#E6BE63", state === "Hover" ? 1 : 0);
        sp.name = "Sparkle";
        c.appendChild(sp);
        sp.x = 296 - 44;
        sp.y = 24;
        const txt = stack("Text", "VERTICAL", 4);
        const n = await textRaw("O Rei Leão", "Heading/H4", "#FBFAF6", 248);
        n.name = "Name";
        txt.appendChild(n);
        const cap = await textRaw("Walt Disney Animation Studios · 1994", "Caption", "#FBFAF6", 248, 0.78);
        cap.name = "Caption";
        txt.appendChild(cap);
        c.appendChild(txt);
        txt.x = 24;
        txt.y = 400 - 24 - txt.height;
        txt.constraints = { horizontal: "MIN", vertical: "MAX" };
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Franchise Tile";
    gridVariants(set, 2, 32, 32, 32);
    const kN = set.addComponentProperty("Name", "TEXT", "O Rei Leão");
    const kC = set.addComponentProperty("Caption", "TEXT", "Walt Disney Animation Studios · 1994");
    const kA = set.addComponentProperty("Art", "INSTANCE_SWAP", ART.lionking.id);
    for (const c of set.children) {
        refText(c, "Name", kN);
        refText(c, "Caption", kC);
        refNode(c, "Art", { mainComponent: kA });
    }
    const d = set.findChild((n) => n.name === "State=Default");
    await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover"), 300)]);
    set.description = "Destaque de franquia. A Disney é protagonista: a franquia entra só como clima de cor (arte abstrata) + nome. Hover: brilho dourado e faísca.";
    mark(set);
    C.FranchiseTile = set;
    return set;
}
// ---------------------------------------------------------------- Section Header
async function buildSectionHeader(parent) {
    const c = figma.createComponent();
    c.name = "Section Header";
    c.layoutMode = "HORIZONTAL";
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "AUTO";
    c.resize(1280, 100);
    c.primaryAxisAlignItems = "SPACE_BETWEEN";
    c.counterAxisAlignItems = "MAX";
    c.fills = [];
    const left = stack("Text", "VERTICAL", 8);
    const t = await text("Em cartaz no universo Disney", "Heading/H2", "color/text/primary");
    t.name = "Title";
    left.appendChild(t);
    const l = await text("Histórias novas e clássicos para assistir juntos.", "Body/L", "color/text/secondary", 640);
    l.name = "Lead";
    left.appendChild(l);
    c.appendChild(left);
    const btn = C.Button.findChild((n) => n.name === "Style=Ghost, State=Default").createInstance();
    const defs = C.Button.componentPropertyDefinitions;
    btn.setProperties({ [Object.keys(defs).find((k) => k.startsWith("Label"))]: "Ver tudo" });
    btn.name = "Link";
    c.appendChild(btn);
    parent.appendChild(c);
    const kT = c.addComponentProperty("Title", "TEXT", "Em cartaz no universo Disney");
    const kL = c.addComponentProperty("Lead", "TEXT", "Histórias novas e clássicos para assistir juntos.");
    const kS = c.addComponentProperty("Show link", "BOOLEAN", true);
    t.componentPropertyReferences = { characters: kT };
    l.componentPropertyReferences = { characters: kL };
    btn.componentPropertyReferences = { visible: kS };
    c.description = "Abertura de seção: título H2 (Fraunces) + linha fina + link opcional. Largura de conteúdo 1280.";
    mark(c);
    C.SectionHeader = c;
    return c;
}
// ---------------------------------------------------------------- Footer
async function buildFooter(parent) {
    const c = figma.createComponent();
    c.name = "Footer";
    c.layoutMode = "VERTICAL";
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "FIXED";
    c.resize(1440, 300);
    c.itemSpacing = 48;
    c.paddingLeft = c.paddingRight = 80;
    c.paddingTop = 80;
    c.paddingBottom = 48;
    bindPadding(c, "space/80", null);
    bindFill(c, "color/bg/brand");
    const top = stack("Top", "HORIZONTAL", 80);
    const brand = stack("Brand", "VERTICAL", 16);
    brand.appendChild(await wordmark(1.1));
    brand.appendChild(await textRaw("Onde a magia vira realidade, desde 1923.", "Body/S", "#FBFAF6", 280, 0.7));
    top.appendChild(brand);
    const cols = [
        ["Assistir", ["Filmes", "Séries", "Disney+", "Música"]],
        ["Viver", ["Parques", "Cruzeiros", "Resorts", "Eventos"]],
        ["Levar para casa", ["Produtos", "Livros", "Games", "Colecionáveis"]],
        ["A empresa", ["Nossa história", "Imprensa", "Carreiras", "Investidores"]],
    ];
    for (const [h, items] of cols) {
        const col = stack(h, "VERTICAL", 12);
        col.appendChild(await textRaw(h, "Overline", "#E6BE63"));
        for (const it of items)
            col.appendChild(await textRaw(it, "Body/S", "#FBFAF6", undefined, 0.8));
        top.appendChild(col);
    }
    c.appendChild(top);
    const line = rect("Divider", 1280, 1, [solid("#FBFAF6", 0.12)]);
    c.appendChild(line);
    line.layoutSizingHorizontal = "FILL";
    const legal = await textRaw("Conceito acadêmico · sem afiliação com The Walt Disney Company · marcas pertencem aos seus titulares.", "Caption", "#FBFAF6", 1280, 0.55);
    legal.name = "Legal";
    c.appendChild(legal);
    parent.appendChild(c);
    c.description = "Rodapé institucional sobre o fundo de marca. Quatro grupos (assistir, viver, levar para casa, a empresa) que espelham o ecossistema Disney.";
    mark(c);
    C.Footer = c;
    return c;
}
// ---------------------------------------------------------------- Motion: Toast e Sparkle Loader
async function buildToast(parent) {
    const comps = [];
    for (const state of ["Hidden", "Visible"]) {
        const c = figma.createComponent();
        c.name = `State=${state}`;
        c.resize(400, 140);
        c.fills = [];
        c.clipsContent = false;
        const card = stack("Toast", "HORIZONTAL", 16, [16, 24]);
        card.counterAxisAlignItems = "CENTER";
        card.cornerRadius = 20;
        card.fills = [solid("#0B1434")];
        await card.setEffectStyleIdAsync(ESTYLE["Elevation/3"].id);
        card.appendChild(sparkleNode(24, "#E6BE63"));
        const col = stack("Text", "VERTICAL", 2);
        col.appendChild(await textRaw("Desejo realizado!", "Subtitle/M", "#FBFAF6"));
        col.appendChild(await textRaw("Ingressos guardados na sua lista.", "Body/S", "#FBFAF6", undefined, 0.75));
        card.appendChild(col);
        c.appendChild(card);
        card.x = 20;
        card.y = state === "Visible" ? 24 : 72; // entra subindo 48px
        card.opacity = state === "Visible" ? 1 : 0;
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Toast";
    gridVariants(set, 2, 32, 32, 24);
    const hidden = set.findChild((n) => n.name === "State=Hidden");
    const visible = set.findChild((n) => n.name === "State=Visible");
    await hidden.setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.8 }, visible, 500)]);
    await visible.setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 2.4 }, hidden, 200)]);
    set.description = "Feedback de sucesso. Entrada 500ms ease-out subindo 48px; saída 200ms (mais rápida que a entrada). No protótipo, repete em loop para demonstração.";
    mark(set);
    C.Toast = set;
    return set;
}
async function buildSparkleLoader(parent) {
    const comps = [];
    for (let f = 1; f <= 3; f++) {
        const c = figma.createComponent();
        c.name = `Frame=${f}`;
        c.resize(120, 48);
        c.fills = [];
        for (let i = 0; i < 3; i++) {
            const on = i === f - 1;
            const s = sparkleNode(on ? 24 : 14, "#D4A23F", on ? 1 : 0.35);
            s.name = `Dot ${i + 1}`;
            c.appendChild(s);
            s.x = 12 + i * 36 + (on ? 0 : 5);
            s.y = on ? 12 : 17;
        }
        parent.appendChild(c);
        comps.push(c);
    }
    const set = figma.combineAsVariants(comps, parent);
    set.name = "Sparkle Loader";
    gridVariants(set, 3, 24, 24, 24);
    const fr = (i) => set.findChild((n) => n.name === `Frame=${i}`);
    await fr(1).setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.25 }, fr(2), 300, EASE_IN_OUT)]);
    await fr(2).setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.25 }, fr(3), 300, EASE_IN_OUT)]);
    await fr(3).setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.25 }, fr(1), 300, EASE_IN_OUT)]);
    set.description = "Carregamento decorativo: a faísca percorre três posições em loop (300ms ease-in-out). Com “reduzir movimento”, mostrar só o texto “Preparando a magia…”.";
    mark(set);
    C.SparkleLoader = set;
    return set;
}
/* =====================================================================
   Peças de documentação: o mesmo cabeçalho de capítulo (componente com
   propriedades) e a mesma grade de seções em todas as páginas.
   Quadro: 1600 de largura, conteúdo de 1440 (margem 80).
   ===================================================================== */
const BOARD_W = 1600;
const CONTENT_W = 1440;
async function buildChapterHeader(parent) {
    const c = figma.createComponent();
    c.name = "Doc/Chapter Header";
    c.resize(BOARD_W, 420);
    c.clipsContent = true;
    c.fills = [linear(90, [["#060B1E", 0], ["#0B1434", 0.6], ["#12204D", 1]])];
    starfield(c, BOARD_W, 420, 140, 7);
    // Arco de castelo em traço dourado, à direita: a "janela" do capítulo.
    const arch = frame("Arch outline", {});
    arch.resize(360, 520);
    arch.topLeftRadius = arch.topRightRadius = 180;
    arch.strokes = [solid("#D4A23F", 0.55)];
    arch.strokeWeight = 1.5;
    arch.fills = [linear(90, [["#3D6BFF", 0, 0.18], ["#3D6BFF", 1, 0]])];
    c.appendChild(arch);
    arch.x = BOARD_W - 80 - 360;
    arch.y = 72;
    const sp = sparkleNode(28, "#E6BE63");
    c.appendChild(sp);
    sp.x = BOARD_W - 80 - 180 - 14;
    sp.y = 150;
    const col = stack("Text", "VERTICAL", 16);
    const tag = await textRaw("BRAND STRATEGY", "Overline", "#E6BE63");
    tag.name = "Tag";
    col.appendChild(tag);
    const row = stack("Title row", "HORIZONTAL", 24);
    row.counterAxisAlignItems = "BASELINE";
    const num = await textRaw("01", "Display/L", "#E6BE63", undefined, 0.9);
    num.name = "Number";
    row.appendChild(num);
    const title = await textRaw("Brand Strategy", "Display/L", "#FBFAF6");
    title.name = "Title";
    row.appendChild(title);
    col.appendChild(row);
    const lead = await textRaw("A empresa, sua história e o lugar que ela ocupa no mundo.", "Body/L", "#FBFAF6", 760, 0.78);
    lead.name = "Lead";
    col.appendChild(lead);
    c.appendChild(col);
    col.x = 80;
    col.y = 420 - 80 - col.height;
    col.constraints = { horizontal: "MIN", vertical: "MAX" };
    parent.appendChild(c);
    const kTag = c.addComponentProperty("Tag", "TEXT", "BRAND STRATEGY");
    const kNum = c.addComponentProperty("Number", "TEXT", "01");
    const kTitle = c.addComponentProperty("Title", "TEXT", "Brand Strategy");
    const kLead = c.addComponentProperty("Lead", "TEXT", "A empresa, sua história e o lugar que ela ocupa no mundo.");
    tag.componentPropertyReferences = { characters: kTag };
    num.componentPropertyReferences = { characters: kNum };
    title.componentPropertyReferences = { characters: kTitle };
    lead.componentPropertyReferences = { characters: kLead };
    c.description = "Cabeçalho de capítulo da documentação, igual em todas as páginas (céu estrelado + arco de castelo dourado).";
    mark(c);
    C.ChapterHeader = c;
    return c;
}
/** Quadro de página: cabeçalho de capítulo + coluna de conteúdo. */
async function board(page, num, tag, title, lead) {
    const root = stack(`${num} · ${title}`, "VERTICAL", 0);
    root.resize(BOARD_W, 100);
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    bindFill(root, "color/bg/canvas");
    root.clipsContent = true;
    const h = C.ChapterHeader.createInstance();
    const defs = C.ChapterHeader.componentPropertyDefinitions;
    const key = (p) => Object.keys(defs).find((k) => k.startsWith(p));
    h.setProperties({ [key("Tag")]: tag.toUpperCase(), [key("Number")]: num, [key("Title")]: title, [key("Lead")]: lead });
    root.appendChild(h);
    h.layoutSizingHorizontal = "FILL";
    const content = stack("Content", "VERTICAL", 128, [96, 80, 128, 80]);
    bindGap(content, "space/128");
    root.appendChild(content);
    content.layoutSizingHorizontal = "FILL";
    placeOnPage(page, root, 0, 0);
    return { root, content };
}
/** Seção: coluna de título (320) + corpo que preenche o resto. */
async function section(parent, index, title, note) {
    const sec = stack(`${index} ${title}`, "VERTICAL", 40);
    bindGap(sec, "space/40");
    parent.appendChild(sec);
    sec.layoutSizingHorizontal = "FILL";
    const head = stack("Section head", "HORIZONTAL", 24);
    head.counterAxisAlignItems = "BASELINE";
    head.appendChild(await text(index, "Subtitle/L", "color/text/gold"));
    head.appendChild(await text(title, "Heading/H2", "color/text/primary"));
    sec.appendChild(head);
    if (note)
        sec.appendChild(await text(note, "Body/L", "color/text/secondary", 860));
    const rule = rect("Rule", CONTENT_W, 1, []);
    bindFill(rule, "color/border/subtle");
    sec.appendChild(rule);
    rule.layoutSizingHorizontal = "FILL";
    const body = stack("Body", "VERTICAL", 32);
    bindGap(body, "space/32");
    sec.appendChild(body);
    body.layoutSizingHorizontal = "FILL";
    return body;
}
/** Linha que quebra em várias colunas de cartões com largura fixa. */
function grid(parent, gap = 24) {
    const g = stack("Grid", "HORIZONTAL", gap);
    g.layoutWrap = "WRAP";
    g.counterAxisSpacing = gap;
    parent.appendChild(g);
    g.layoutSizingHorizontal = "FILL";
    return g;
}
function colWidth(cols, gap = 24) {
    return Math.floor((CONTENT_W - gap * (cols - 1)) / cols);
}
/** Cartão de documentação (superfície, borda sutil, raio 24, padding 32). */
async function card(parent, w, title, body, opts = {}) {
    const c = stack(title || "Card", "VERTICAL", 12, 32);
    bindPadding(c, "space/32", "space/32");
    bindFill(c, "color/bg/surface");
    bindStroke(c, "color/border/subtle", 1);
    bindRadius(c, "radius/24");
    c.resize(w, 100);
    c.counterAxisSizingMode = "FIXED";
    c.primaryAxisSizingMode = "AUTO";
    parent.appendChild(c);
    if (opts.accent)
        c.appendChild(await text(opts.accent, "Overline", "color/text/gold"));
    if (title)
        c.appendChild(await text(title, opts.titleStyle || "Heading/H4", "color/text/primary", w - 64));
    if (body)
        c.appendChild(await text(body, "Body/M", "color/text/secondary", w - 64));
    return c;
}
/** Lista com marcador de faísca. */
async function bullets(parent, items, w, color = "color/text/secondary") {
    const l = stack("List", "VERTICAL", 12);
    for (const it of items) {
        const row = stack("Item", "HORIZONTAL", 12);
        const dot = sparkleNode(12, "#D4A23F");
        row.appendChild(dot);
        row.appendChild(await text(it, "Body/M", color, w - 24));
        l.appendChild(row);
    }
    parent.appendChild(l);
    return l;
}
/** Instância de chip com rótulo. */
function chip(label, selected = false) {
    const set = C.Chip;
    const inst = set.findChild((n) => n.name === (selected ? "State=Selected" : "State=Default")).createInstance();
    const k = Object.keys(set.componentPropertyDefinitions).find((x) => x.startsWith("Label"));
    inst.setProperties({ [k]: label });
    return inst;
}
function buttonInst(style, label, state = "Default", showIcon = true, iconName = "arrow-right") {
    const set = C.Button;
    const inst = set.findChild((n) => n.name === `Style=${style}, State=${state}`).createInstance();
    const defs = set.componentPropertyDefinitions;
    const k = (p) => Object.keys(defs).find((x) => x.startsWith(p));
    inst.setProperties({ [k("Label")]: label, [k("Show icon")]: showIcon, [k("Icon")]: ICON[iconName].id });
    return inst;
}
function setProps(inst, owner, values) {
    const defs = owner.componentPropertyDefinitions;
    const out = {};
    for (const [p, v] of Object.entries(values)) {
        const k = Object.keys(defs).find((x) => x === p || x.startsWith(p + "#"));
        if (k)
            out[k] = v;
    }
    inst.setProperties(out);
}
/* =====================================================================
   Páginas 1–4: Cover, Brand Strategy, Persona, Voice & Tone.
   ===================================================================== */
async function pageCover(page) {
    const W = 1920;
    const H = 1080;
    const f = frame("Cover", { clipsContent: true });
    f.resize(W, H);
    f.fills = [linear(90, [["#060B1E", 0], ["#0B1434", 0.55], ["#1B2E6B", 1]])];
    starfield(f, W, H, 420, 23);
    const glow = ellipse("Glow", 1100, [radial([["#3D6BFF", 0, 0.35], ["#3D6BFF", 1, 0]])]);
    f.appendChild(glow);
    glow.x = W - 980;
    glow.y = 80;
    // Janela em arco com o castelo genérico e o céu: o conceito "Where Magic Becomes Reality".
    const win = archFrame("Arch window", 560, 760, [linear(90, [["#12204D", 0], ["#3D6BFF", 1]])]);
    win.strokes = [solid("#D4A23F", 0.7)];
    win.strokeWeight = 2;
    starfield(win, 560, 520, 120, 31);
    const castle = castleNode(420, "#E6BE63", 2.2);
    win.appendChild(castle);
    castle.x = 70;
    castle.y = 760 - castle.height - 40;
    f.appendChild(win);
    win.x = W - 160 - 560;
    win.y = 160;
    for (const [x, y, s] of [[W - 160 - 600, 230, 34], [W - 140, 420, 22], [W - 760, 820, 18]]) {
        const sp = sparkleNode(s, "#E6BE63");
        f.appendChild(sp);
        sp.x = x;
        sp.y = y;
    }
    const col = stack("Title block", "VERTICAL", 32);
    const wm = await wordmark(1.6);
    col.appendChild(wm);
    const title = await textRaw("Where Magic\nBecomes Reality", "Display/XL", "#FBFAF6", 980);
    title.fontSize = 132;
    title.lineHeight = { unit: "PIXELS", value: 136 };
    col.appendChild(title);
    col.appendChild(await textRaw(PROJECT.subtitle, "Subtitle/L", "#E6BE63"));
    col.appendChild(await textRaw("Um sistema visual contemporâneo para a maior empresa de histórias do mundo: tradição centenária, imaginação e experiências digitais, do filme ao parque.", "Body/L", "#FBFAF6", 760, 0.8));
    f.appendChild(col);
    col.x = 160;
    col.y = 200;
    const meta = stack("Meta", "HORIZONTAL", 64);
    for (const [k, v] of [["Versão", PROJECT.version], ["Autor", PROJECT.author], ["Natureza", "Projeto acadêmico"], ["Páginas", "9"]]) {
        const m = stack(k, "VERTICAL", 4);
        m.appendChild(await textRaw(k.toUpperCase(), "Overline", "#E6BE63"));
        m.appendChild(await textRaw(v, "Body/M", "#FBFAF6"));
        meta.appendChild(m);
    }
    f.appendChild(meta);
    meta.x = 160;
    meta.y = H - 230;
    const disc = await textRaw(PROJECT.disclaimer, "Caption", "#FBFAF6", 980, 0.55);
    f.appendChild(disc);
    disc.x = 160;
    disc.y = H - 110;
    placeOnPage(page, f, 0, 0);
    // A capa do arquivo no navegador do Figma usa esta moldura como miniatura.
    try {
        await figma.setFileThumbnailNodeAsync(f);
    }
    catch (e) {
        logError("Cover thumbnail", e);
    }
    // Índice de páginas ao lado da capa.
    const idx = stack("Index", "VERTICAL", 16, 64);
    idx.resize(640, 100);
    idx.counterAxisSizingMode = "FIXED";
    bindFill(idx, "color/bg/surface");
    idx.cornerRadius = 32;
    idx.appendChild(await text("Índice", "Heading/H2", "color/text/primary"));
    const pages = ["Cover — apresentação", "Brand Strategy — empresa e posicionamento", "Persona — perfil do público", "Voice & Tone — tom de voz", "Foundations — cores, tipografia, espaço, grid, formas", "Iconography — biblioteca de ícones", "Components — componentes reutilizáveis", "Motion — animações e protótipos", "Application — home desktop e mobile"];
    for (const [i, p] of pages.entries()) {
        const row = stack("Row", "HORIZONTAL", 16);
        row.appendChild(await text(String(i + 1).padStart(2, "0"), "Subtitle/M", "color/text/gold"));
        row.appendChild(await text(p, "Body/M", "color/text/secondary"));
        idx.appendChild(row);
    }
    placeOnPage(page, idx, W + 120, 0);
}
async function pageStrategy(page) {
    const { content } = await board(page, "01", "Brand Strategy", "Brand Strategy", "Quem é a The Walt Disney Company, de onde veio e onde quer estar na mente das pessoas.");
    // 1.1 A empresa
    let b = await section(content, "1.1", "A empresa", "Fundada em 1923 por Walt e Roy O. Disney, a The Walt Disney Company é um conglomerado global de entretenimento e mídia com sede em Burbank, Califórnia. Atua no segmento de entretenimento e lazer: cria histórias e as transforma em filmes, séries, parques, cruzeiros, produtos e experiências.");
    let g = grid(b);
    for (const [v, l] of FACTS) {
        const c = await card(g, colWidth(4));
        const big = await text(v, "Heading/H1", "color/text/brand");
        c.insertChild(0, big);
        c.appendChild(await text(l, "Body/S", "color/text/muted", colWidth(4) - 64));
    }
    // 1.2 História
    b = await section(content, "1.2", "Fundação e evolução", "Cem anos em dez marcos: da prancheta de animação ao ecossistema global de histórias.");
    g = grid(b);
    for (const [year, t, d] of TIMELINE) {
        const c = await card(g, colWidth(5), undefined, undefined);
        c.appendChild(await text(year, "Heading/H3", "color/text/gold"));
        c.appendChild(await text(t, "Subtitle/M", "color/text/primary", colWidth(5) - 64));
        c.appendChild(await text(d, "Body/S", "color/text/secondary", colWidth(5) - 64));
    }
    // 1.3 Áreas de negócio
    b = await section(content, "1.3", "Áreas de negócio, produtos e serviços", "Desde 2023 a empresa se organiza em três segmentos. Cada um é uma porta de entrada para o mesmo universo de histórias.");
    g = grid(b);
    const segIcon = ["clapper", "play", "castle"];
    for (const [i, [name, sub, items]] of SEGMENTS.entries()) {
        const c = await card(g, colWidth(3));
        c.insertChild(0, icon(segIcon[i], 32, "color/text/brand"));
        c.appendChild(await text(name, "Heading/H3", "color/text/primary"));
        c.appendChild(await text(sub, "Subtitle/M", "color/text/gold", colWidth(3) - 64));
        await bullets(c, items, colWidth(3) - 64);
    }
    const chips = grid(b, 12);
    for (const p of ["Filmes", "Séries", "Streaming", "Parques temáticos", "Cruzeiros", "Resorts", "Produtos de consumo", "Música", "Teatro", "Games", "Publicações", "Esportes ao vivo"])
        chips.appendChild(chip(p));
    // 1.4 Diferenciais
    b = await section(content, "1.4", "Diferenciais da marca");
    g = grid(b);
    for (const [t, d] of DIFFERENTIATORS)
        await card(g, colWidth(3), t, d);
    // 1.5 Identidade e personalidade
    b = await section(content, "1.5", "Identidade e personalidade empresarial", "A Disney se comporta como o arquétipo do Mago: torna possível o que parecia sonho, sempre com calor humano.");
    g = grid(b);
    for (const [i, [t, d]] of PERSONALITY.entries()) {
        const c = await card(g, colWidth(5), t, d);
        if (i === 0) {
            bindFill(c, "color/bg/inverse");
            for (const n of c.findAll((x) => x.type === "TEXT"))
                bindFill(n, "color/text/inverse");
        }
    }
    // 2 Posicionamento
    b = await section(content, "2", "Posicionamento", "Onde a Disney quer estar na mente do público, e por que só ela pode ocupar esse lugar.");
    const stmt = stack("Positioning statement", "VERTICAL", 24, [64, 80]);
    bindFill(stmt, "color/bg/brand");
    stmt.cornerRadius = 32;
    stmt.clipsContent = true;
    b.appendChild(stmt);
    stmt.layoutSizingHorizontal = "FILL";
    starfield(stmt, CONTENT_W, 360, 60, 41);
    stmt.appendChild(await textRaw("DECLARAÇÃO DE POSICIONAMENTO", "Overline", "#E6BE63"));
    const q = await textRaw(POSITIONING.statement, "Heading/H2", "#FBFAF6", 1180);
    q.fontName = await font("display", "LightItalic");
    stmt.appendChild(q);
    g = grid(b);
    await card(g, colWidth(2), "Proposta de valor", POSITIONING.value, { accent: "VALOR" });
    await card(g, colWidth(2), "Propósito", POSITIONING.purpose, { accent: "POR QUE EXISTIMOS" });
    const mission = await card(g, CONTENT_W, "Missão", POSITIONING.mission, { accent: "MISSÃO OFICIAL" });
    mission.name = "Missão";
    const aud = grid(b);
    for (const [t, d] of POSITIONING.audiences)
        await card(aud, colWidth(4), t, d, { accent: "PÚBLICO-ALVO", titleStyle: "Subtitle/L" });
    const comp = grid(b);
    for (const [t, d] of POSITIONING.competitive)
        await card(comp, colWidth(3), t, d, { accent: "DIFERENCIAL COMPETITIVO", titleStyle: "Subtitle/L" });
    const perc = await card(b, CONTENT_W, "Percepção desejada", undefined, { accent: "COMO QUEREMOS SER LEMBRADOS" });
    const pr = grid(perc, 12);
    for (const p of POSITIONING.perception)
        pr.appendChild(chip(p, true));
    await card(b, CONTENT_W, "Posicionamento no mercado global", POSITIONING.market, { accent: "MERCADO" });
    // Fontes
    b = await section(content, "Fontes", "Referências", "Fatos históricos e números verificados nas fontes oficiais abaixo.");
    await bullets(b, SOURCES, CONTENT_W);
}
async function pagePersona(page) {
    const { content } = await board(page, "02", "Persona", "Persona", "Uma pessoa fictícia, mas realista, que vive a Disney em várias telas e lugares.");
    const P = PERSONA;
    let b = await section(content, "3.1", P.name, "Representa as famílias que encontram a Disney no streaming, nos produtos, na música e, um dia, no parque.");
    // Cartão principal
    const hero = stack("Persona hero", "HORIZONTAL", 48, 48);
    bindFill(hero, "color/bg/surface");
    bindStroke(hero, "color/border/subtle", 1);
    hero.cornerRadius = 32;
    b.appendChild(hero);
    hero.layoutSizingHorizontal = "FILL";
    const portrait = archFrame("Portrait (ilustração abstrata)", 280, 360, [linear(90, [["#F4DEA6", 0], ["#E2557A", 0.55], ["#7A5AE6", 1]])]);
    const ini = await textRaw("MA", "Display/L", "#FBFAF6");
    portrait.appendChild(ini);
    ini.x = (280 - ini.width) / 2;
    ini.y = 180;
    hero.appendChild(portrait);
    const info = stack("Info", "VERTICAL", 16);
    info.appendChild(await text(`${P.name}, ${P.age}`, "Heading/H1", "color/text/primary"));
    info.appendChild(await text(P.quote, "Heading/H4", "color/text/gold", 900));
    const demo = grid(info, 16);
    for (const [k, v] of P.demographic) {
        const d = stack(k, "VERTICAL", 4);
        d.resize(280, 10);
        d.counterAxisSizingMode = "FIXED";
        d.appendChild(await text(k.toUpperCase(), "Overline", "color/text/muted"));
        d.appendChild(await text(v, "Body/M", "color/text/primary", 280));
        demo.appendChild(d);
    }
    info.appendChild(await text(P.relation, "Body/L", "color/text/secondary", 900));
    hero.appendChild(info);
    info.layoutSizingHorizontal = "FILL";
    // Interesses e hábitos
    let g = grid(b);
    const ints = await card(g, colWidth(2), "Interesses", undefined, { accent: "O QUE A MOVE" });
    const ig = grid(ints, 12);
    for (const i of P.interests)
        ig.appendChild(chip(i));
    const hab = await card(g, colWidth(2), "Hábitos de consumo", undefined, { accent: "COMO CONSOME" });
    await bullets(hab, P.habits, colWidth(2) - 64);
    // Necessidades, dores, motivações
    g = grid(b);
    const n = await card(g, colWidth(3), "Necessidades e expectativas", undefined, { accent: "PRECISA" });
    await bullets(n, P.needs, colWidth(3) - 64);
    const p = await card(g, colWidth(3), "Dores e frustrações", undefined, { accent: "INCOMODA" });
    await bullets(p, P.pains, colWidth(3) - 64);
    const m = await card(g, colWidth(3), "Motivações emocionais", undefined, { accent: "EMOCIONA" });
    await bullets(m, P.motivations, colWidth(3) - 64);
    // Canais
    const ch = await card(b, CONTENT_W, "Plataformas e canais", undefined, { accent: "ONDE ESTÁ" });
    const cg = grid(ch, 12);
    for (const c of P.channels)
        cg.appendChild(chip(c));
    // Jornada pelo ecossistema
    b = await section(content, "3.2", "Jornada pelo ecossistema", "A persona não vive um produto: atravessa a marca. O sistema visual precisa ser o mesmo em cada parada.");
    const j = stack("Journey", "HORIZONTAL", 16);
    b.appendChild(j);
    j.layoutSizingHorizontal = "FILL";
    const jIcons = ["sparkles", "play", "heart", "calendar", "castle", "user"];
    for (const [i, [stage, desc]] of P.journey.entries()) {
        const c = stack(stage, "VERTICAL", 12, 24);
        bindFill(c, i === 4 ? "color/bg/inverse" : "color/bg/surface");
        bindStroke(c, "color/border/subtle", 1);
        c.cornerRadius = 24;
        c.resize(colWidth(6, 16), 10);
        c.counterAxisSizingMode = "FIXED";
        const tc = i === 4 ? "color/text/inverse" : "color/text/primary";
        c.appendChild(icon(jIcons[i], 28, i === 4 ? "color/text/gold" : "color/text/brand"));
        c.appendChild(await text(`${i + 1}. ${stage}`, "Subtitle/M", tc));
        c.appendChild(await text(desc, "Body/S", i === 4 ? "color/text/inverse" : "color/text/secondary", colWidth(6, 16) - 48));
        j.appendChild(c);
    }
}
async function pageVoice(page) {
    const { content } = await board(page, "03", "Voice & Tone", "Voice & Tone", "Como a Disney fala: a mesma voz em todo lugar, com o tom certo para cada momento.");
    const V = VOICE;
    let b = await section(content, "4.1", "A voz da marca", V.intro);
    let g = grid(b);
    for (const [t, d] of V.traits)
        await card(g, colWidth(4), t, d, { titleStyle: "Heading/H4" });
    b = await section(content, "4.2", "Princípios de comunicação");
    g = grid(b);
    for (const [i, [t, d]] of V.principles.entries())
        await card(g, colWidth(5), t, d, { accent: `PRINCÍPIO ${i + 1}`, titleStyle: "Subtitle/L" });
    b = await section(content, "4.3", "Vocabulário");
    g = grid(b);
    const use = await card(g, colWidth(2), "Palavras que usamos", undefined, { accent: "USE" });
    const ug = grid(use, 12);
    for (const w of V.vocabularyUse)
        ug.appendChild(chip(w, true));
    const avoid = await card(g, colWidth(2), "Palavras que evitamos", undefined, { accent: "EVITE" });
    const ag = grid(avoid, 12);
    for (const w of V.vocabularyAvoid)
        ag.appendChild(chip(w));
    b = await section(content, "4.4", "Tom por contexto", "A voz não muda; o tom se ajusta. Quanto mais sério o momento, mais clara e menos ornamentada a mensagem.");
    for (const [ctx, level, desc] of V.tone) {
        const row = stack(ctx, "HORIZONTAL", 32);
        row.counterAxisAlignItems = "CENTER";
        b.appendChild(row);
        row.layoutSizingHorizontal = "FILL";
        const lbl = stack("Label", "VERTICAL", 2);
        lbl.resize(320, 10);
        lbl.counterAxisSizingMode = "FIXED";
        lbl.appendChild(await text(ctx, "Subtitle/M", "color/text/primary"));
        lbl.appendChild(await text(desc, "Body/S", "color/text/muted"));
        row.appendChild(lbl);
        const track = frame("Track", {});
        track.resize(900, 12);
        bindFill(track, "color/bg/elevated");
        track.cornerRadius = 6;
        const fill = rect("Level", (900 * level) / 100, 12, [linear(0, [["#2350E0", 0], ["#D4A23F", 1]])], 6);
        track.appendChild(fill);
        row.appendChild(track);
        row.appendChild(await text(level >= 70 ? "Mágico" : level >= 45 ? "Caloroso" : level >= 30 ? "Claro" : "Empático", "Label", "color/text/gold"));
    }
    b = await section(content, "4.5", "Exemplos: adequado e inadequado");
    for (const [ctx, good, bad] of V.examples) {
        const row = grid(b);
        const head = await card(row, 320, ctx, undefined, { titleStyle: "Subtitle/L" });
        head.fills = [];
        head.strokes = [];
        const ok = await card(row, 536, undefined, good, { accent: "ADEQUADO" });
        bindStroke(ok, "color/feedback/success", 1.5);
        const no = await card(row, 536, undefined, bad, { accent: "INADEQUADO" });
        bindStroke(no, "color/feedback/error", 1.5);
        for (const t of no.findAll((x) => x.type === "TEXT"))
            if (t.characters === bad)
                t.textDecoration = "STRIKETHROUGH";
    }
    b = await section(content, "4.6", "Aplicações em interfaces digitais", "Os mesmos princípios nos menores textos da interface: botões, confirmações, buscas vazias e carregamentos.");
    for (const [ctx, good, bad] of V.ui) {
        const row = stack(ctx, "HORIZONTAL", 32);
        row.counterAxisAlignItems = "CENTER";
        b.appendChild(row);
        row.layoutSizingHorizontal = "FILL";
        const l = await text(ctx, "Subtitle/M", "color/text/primary", 280);
        row.appendChild(l);
        if (ctx.startsWith("Botão")) {
            row.appendChild(buttonInst(ctx.includes("compra") ? "Magic" : "Primary", good, "Default", true, ctx.includes("compra") ? "ticket" : "calendar"));
            const badBtn = buttonInst("Secondary", bad, "Default", false);
            badBtn.opacity = 0.55;
            row.appendChild(badBtn);
        }
        else {
            const okc = await card(row, 520, undefined, good, { accent: "USE" });
            bindStroke(okc, "color/feedback/success", 1.5);
            const noc = await card(row, 520, undefined, bad, { accent: "EVITE" });
            bindStroke(noc, "color/feedback/error", 1.5);
        }
    }
}
/* =====================================================================
   Páginas 5–8: Foundations, Iconography, Components, Motion.
   ===================================================================== */
async function swatch(parent, key, w = 200) {
    const hex = PRIMITIVES[key];
    const s = stack(key, "VERTICAL", 0);
    s.resize(w, 10);
    s.counterAxisSizingMode = "FIXED";
    bindFill(s, "color/bg/surface");
    bindStroke(s, "color/border/subtle", 1);
    s.cornerRadius = 20;
    s.clipsContent = true;
    const chipR = rect("Color", w, 120, []);
    bindFill(chipR, key); // amostra ligada à variável primitiva
    s.appendChild(chipR);
    const info = stack("Info", "VERTICAL", 2, [16, 16]);
    info.appendChild(await text(key, "Label", "color/text/primary"));
    info.appendChild(await text(hex, "Caption", "color/text/secondary"));
    info.appendChild(await text(`RGB ${rgbString(hex)}`, "Caption", "color/text/muted"));
    s.appendChild(info);
    parent.appendChild(s);
}
/** Mini interface usada para comparar Light × Dark (mesmos componentes, modo da variável diferente). */
async function themePreview(mode) {
    const f = stack(`Preview · ${mode}`, "VERTICAL", 24, 40);
    f.resize(colWidth(2), 10);
    f.counterAxisSizingMode = "FIXED";
    bindFill(f, "color/bg/canvas");
    bindStroke(f, "color/border/subtle", 1);
    f.cornerRadius = 32;
    if (COLOR_COLLECTION)
        f.setExplicitVariableModeForCollection(COLOR_COLLECTION, mode === "Light" ? COLOR_MODES.light : COLOR_MODES.dark);
    f.appendChild(await text(`Modo ${mode === "Light" ? "claro" : "escuro"}`, "Overline", "color/text/gold"));
    f.appendChild(await text("Histórias para viver juntos", "Heading/H3", "color/text/primary"));
    f.appendChild(await text("As mesmas variáveis semânticas trocam de valor; os componentes não mudam.", "Body/M", "color/text/secondary", colWidth(2) - 80));
    const row = stack("Row", "HORIZONTAL", 24);
    const mc = C.MediaCard.findChild((n) => n.name === "State=Default").createInstance();
    setProps(mc, C.MediaCard, { Title: "Moana", Meta: "Walt Disney Animation Studios · 2016", Art: ART.moana.id });
    row.appendChild(mc);
    const right = stack("Actions", "VERTICAL", 16);
    right.appendChild(buttonInst("Primary", "Assistir agora", "Default", true, "play"));
    right.appendChild(buttonInst("Secondary", "Minha lista", "Default", true, "heart"));
    right.appendChild(chip("Aventura", true));
    right.appendChild(chip("Musical"));
    const inp = C.Input.findChild((n) => n.name === "State=Focus").createInstance();
    right.appendChild(inp);
    row.appendChild(right);
    f.appendChild(row);
    return f;
}
async function pageFoundations(page) {
    const { content } = await board(page, "04", "Foundations", "Foundations", "Cor, tipografia, espaço, grid, forma e profundidade: as decisões que todo componente herda.");
    // ------------------------------------------------ Cores
    let b = await section(content, "5.1", "Cores", "Azul da meia-noite para o céu e a marca, Azul Real para a ação, Ouro Encantado para o brilho e Marfim para a luz quente. Todas as cores existem como variáveis (DS · Primitives) e são usadas pela camada semântica (DS · Color, modos Light e Dark).");
    for (const g of PRIMITIVE_GROUPS) {
        const row = stack(g.title, "VERTICAL", 16);
        b.appendChild(row);
        row.layoutSizingHorizontal = "FILL";
        const head = stack("Head", "HORIZONTAL", 16);
        head.counterAxisAlignItems = "BASELINE";
        head.appendChild(await text(g.title, "Heading/H4", "color/text/primary"));
        head.appendChild(await text(g.role, "Body/S", "color/text/muted"));
        row.appendChild(head);
        const sw = grid(row, 16);
        for (const k of g.keys)
            await swatch(sw, k, 216);
    }
    const roles = await card(b, CONTENT_W, "Papéis da paleta", undefined, { accent: "COMO USAR" });
    await bullets(roles, [
        "Primária: Midnight 900 (#0B1434), em cabeçalhos, hero e textos de título",
        "Secundárias: Royal Blue 600 (#2350E0) para ação e navegação; Ivory para superfícies",
        "Destaque: Enchanted Gold 500 (#D4A23F), no máximo um elemento dourado dominante por tela",
        "Neutros e texto: escala Ink; texto corrido em Ink 600 sobre Ivory (contraste 8,1:1)",
        "Acentos de história (rose, teal, violet): só para categorias e ilustração, nunca para ação",
        "Contraste: todo par texto/fundo do sistema atinge WCAG AA (4,5:1); ouro sobre marfim só em tamanhos grandes",
    ], CONTENT_W - 64);
    // tabela semântica
    const table = stack("Semantic tokens", "VERTICAL", 0);
    bindFill(table, "color/bg/surface");
    bindStroke(table, "color/border/subtle", 1);
    table.cornerRadius = 24;
    table.clipsContent = true;
    b.appendChild(table);
    table.layoutSizingHorizontal = "FILL";
    const headRow = stack("Header", "HORIZONTAL", 24, [16, 32]);
    bindFill(headRow, "color/bg/elevated");
    for (const [t, w] of [["Token", 360], ["Light", 240], ["Dark", 240], ["Uso", 440]])
        headRow.appendChild(await text(t, "Overline", "color/text/muted", w));
    table.appendChild(headRow);
    headRow.layoutSizingHorizontal = "FILL";
    for (const [name, s] of Object.entries(SEMANTIC)) {
        const r = stack(name, "HORIZONTAL", 24, [12, 32]);
        r.counterAxisAlignItems = "CENTER";
        bindStroke(r, "color/border/subtle", 1);
        r.strokeTopWeight = 1;
        r.strokeBottomWeight = 0;
        r.strokeLeftWeight = 0;
        r.strokeRightWeight = 0;
        r.appendChild(await text(name, "Label", "color/text/primary", 360));
        for (const ref of [s.light, s.dark]) {
            const cell = stack("Cell", "HORIZONTAL", 12);
            cell.counterAxisAlignItems = "CENTER";
            cell.resize(240, 10);
            cell.primaryAxisSizingMode = "FIXED";
            const dot = rect("Swatch", 28, 28, [], 8);
            bindFill(dot, ref);
            dot.strokes = [solid("#0B1434", 0.12)];
            cell.appendChild(dot);
            cell.appendChild(await text(`${ref} · ${PRIMITIVES[ref]}`, "Caption", "color/text/secondary"));
            r.appendChild(cell);
        }
        r.appendChild(await text(s.desc, "Body/S", "color/text/secondary", 440));
        table.appendChild(r);
        r.layoutSizingHorizontal = "FILL";
    }
    // estados de interação
    const st = await card(b, CONTENT_W, "Estados de interação", "Cada estado tem um token: hover escurece a ação (Royal 700), pressionado vai para Midnight, foco ganha anel dourado de 3px e desabilitado perde cor e contraste.", { accent: "ESTADOS" });
    for (const style of ["Primary", "Magic", "Secondary"]) {
        const row = stack(style, "HORIZONTAL", 24);
        row.counterAxisAlignItems = "CENTER";
        for (const state of ["Default", "Hover", "Pressed", "Focus", "Disabled"]) {
            const col = stack(state, "VERTICAL", 8);
            col.counterAxisAlignItems = "CENTER";
            col.appendChild(buttonInst(style, state === "Default" ? "Planejar visita" : state, state, false));
            col.appendChild(await text(state, "Caption", "color/text/muted"));
            row.appendChild(col);
        }
        st.appendChild(row);
    }
    // light x dark
    const ld = grid(b, 24);
    ld.appendChild(await themePreview("Light"));
    ld.appendChild(await themePreview("Dark"));
    // ------------------------------------------------ Tipografia
    b = await section(content, "5.2", "Tipografia", "Fraunces dá a voz de conto de fadas: uma serifa com curvas suaves e eixo óptico, elegante nos títulos grandes. Manrope dá clareza à interface e à leitura. As duas são livres (Google Fonts) e estão no Figma.");
    let g = grid(b);
    for (const [fam, kind, role, sample] of [
        ["Fraunces", "display", "Fonte principal · display e títulos", "Era uma vez, e ainda é."],
        ["Manrope", "ui", "Fonte secundária · interface, leitura e botões", "Planeje, assista, viva."],
    ]) {
        const c = await card(g, colWidth(2), undefined, undefined, { accent: role.toUpperCase() });
        const aa = figma.createText();
        aa.fontName = await font(kind, kind === "display" ? "Light" : "SemiBold");
        aa.characters = "Aa";
        aa.fontSize = 160;
        aa.lineHeight = { unit: "PIXELS", value: 168 };
        bindFill(aa, "color/text/primary");
        c.appendChild(aa);
        c.appendChild(await text(resolveFamily(kind) === fam ? fam : `${fam} (substituída por ${resolveFamily(kind)})`, "Heading/H3", "color/text/primary"));
        c.appendChild(await text(sample, kind === "display" ? "Heading/H4" : "Subtitle/L", "color/text/secondary"));
        c.appendChild(await text(kind === "display" ? "Light 300 · Regular 400 · Medium 500 · SemiBold Italic (wordmark)" : "Regular 400 · Medium 500 · SemiBold 600 · Bold 700", "Caption", "color/text/muted"));
    }
    const ramp = stack("Type ramp", "VERTICAL", 0);
    bindFill(ramp, "color/bg/surface");
    bindStroke(ramp, "color/border/subtle", 1);
    ramp.cornerRadius = 24;
    ramp.clipsContent = true;
    b.appendChild(ramp);
    ramp.layoutSizingHorizontal = "FILL";
    for (const t of TYPE) {
        const r = stack(t.name, "HORIZONTAL", 32, [24, 32]);
        r.counterAxisAlignItems = "CENTER";
        bindStroke(r, "color/border/subtle", 1);
        r.strokeTopWeight = 0;
        r.strokeLeftWeight = 0;
        r.strokeRightWeight = 0;
        r.strokeBottomWeight = 1;
        const meta = stack("Meta", "VERTICAL", 4);
        meta.resize(240, 10);
        meta.counterAxisSizingMode = "FIXED";
        meta.appendChild(await text(t.name, "Label", "color/text/primary"));
        meta.appendChild(await text(t.use, "Caption", "color/text/muted", 240));
        r.appendChild(meta);
        const sample = t.size >= 56 ? "Onde a magia vira realidade" : t.name.startsWith("Button") ? "Planejar minha visita" : t.name === "Overline" ? "Experiências e parques" : "Histórias que atravessam gerações e viram lugares.";
        r.appendChild(await text(sample, t.name, "color/text/primary", 820));
        const def = TYPE.find((x) => x.name === t.name);
        const fn = await font(def.kind, def.weight);
        r.appendChild(await text(`${fn.family} ${fn.style}\n${t.size}/${t.lh} · ${t.ls}%${t.upper ? " · CAIXA-ALTA" : ""}`, "Caption", "color/text/secondary", 220));
        ramp.appendChild(r);
        r.layoutSizingHorizontal = "FILL";
    }
    // ------------------------------------------------ Espaçamento
    b = await section(content, "5.3", "Espaçamentos", "Sistema modular de 8 px. Todo padding, margem e distância usa um token da coleção DS · Spacing. O meio passo de 4 px só aparece dentro de componentes compactos (badges e o espaço entre ícone e rótulo de 12 px).");
    const sp = stack("Scale", "VERTICAL", 12);
    b.appendChild(sp);
    sp.layoutSizingHorizontal = "FILL";
    for (const [name, val, use] of SPACING) {
        if (val === 0)
            continue;
        const r = stack(name, "HORIZONTAL", 24);
        r.counterAxisAlignItems = "CENTER";
        r.appendChild(await text(name, "Label", "color/text/primary", 140));
        r.appendChild(await text(`${val}px`, "Body/S", "color/text/muted", 64));
        const bar = rect("Bar", val * 4, 16, [linear(0, [["#2350E0", 0], ["#6E91FF", 1]])], 4);
        r.appendChild(bar);
        r.appendChild(await text(use, "Body/S", "color/text/secondary", 480));
        sp.appendChild(r);
    }
    g = grid(b);
    const rules = [
        ["Padding", "Botões 24/16 · campos 16 · chips 16/8 · cartões 24 (padrão), 32 (destaque), 16 (compacto)"],
        ["Margens", "Desktop 80 · tablet 40 · mobile 24, sempre a partir da borda da tela"],
        ["Entre componentes", "8 entre itens relacionados · 16 dentro de um grupo · 24 a 32 entre grupos"],
        ["Entre seções", "128 no desktop · 96 no tablet · 64 no mobile"],
        ["Interno dos cartões", "Entre imagem e texto 16 · entre título e descrição 8 · antes da ação 16 a 24"],
    ];
    for (const [t, d] of rules)
        await card(g, colWidth(5), t, d, { titleStyle: "Subtitle/L" });
    // ------------------------------------------------ Grid
    b = await section(content, "5.4", "Grid", "Colunas, margens e gutters por breakpoint. Largura máxima de conteúdo: 1280 px, centralizada no desktop.");
    const specs = [
        ["Desktop", 1440, 12, 80, 24, 1280, "a partir de 1280 px"],
        ["Tablet", 768, 8, 40, 24, 688, "768 a 1279 px"],
        ["Mobile", 390, 4, 24, 16, 342, "até 767 px"],
    ];
    const gridRow1 = stack("Desktop row", "VERTICAL", 16);
    const gridRow2 = stack("Tablet + mobile", "HORIZONTAL", 24);
    for (const [name, w, cols, margin, gutter, max, range] of specs) {
        const holder = stack(name, "VERTICAL", 12);
        holder.appendChild(await text(`${name} · ${w} px · ${cols} colunas · margem ${margin} · gutter ${gutter} · conteúdo ${max}`, "Label", "color/text/primary"));
        holder.appendChild(await text(range, "Caption", "color/text/muted"));
        const f = frame(`Grid ${name}`, { clipsContent: true });
        f.resize(w, name === "Desktop" ? 560 : 640);
        bindFill(f, "color/bg/surface");
        bindStroke(f, "color/border/subtle", 1);
        f.cornerRadius = 16;
        f.layoutGrids = [
            { pattern: "COLUMNS", alignment: "STRETCH", count: cols, gutterSize: gutter, offset: margin, visible: true, color: rgba("#E2557A", 0.1) },
        ];
        // blocos de exemplo seguindo as colunas
        const colW = (w - margin * 2 - gutter * (cols - 1)) / cols;
        const header = rect("Header", w, 56, [solid("#0B1434")]);
        f.appendChild(header);
        const hero = rect("Hero", w - margin * 2, name === "Mobile" ? 200 : 220, [linear(90, [["#12204D", 0], ["#3D6BFF", 1]])], 24);
        f.appendChild(hero);
        hero.x = margin;
        hero.y = 88;
        const perRow = name === "Desktop" ? 4 : name === "Tablet" ? 2 : 1;
        const span = cols / perRow;
        for (let i = 0; i < perRow * (name === "Mobile" ? 2 : 1); i++) {
            const cw = colW * span + gutter * (span - 1);
            const cr = rect("Card", cw, name === "Mobile" ? 140 : 200, [solid("#E6EDFF")], 16);
            f.appendChild(cr);
            cr.x = margin + (i % perRow) * (cw + gutter);
            cr.y = 88 + hero.height + 32 + Math.floor(i / perRow) * (140 + 16);
        }
        holder.appendChild(f);
        (name === "Desktop" ? gridRow1 : gridRow2).appendChild(holder);
    }
    b.appendChild(gridRow1);
    b.appendChild(gridRow2);
    // ------------------------------------------------ Formas
    b = await section(content, "5.5", "Formas", "Uma linguagem de curvas: cantos generosos, o arco do castelo como moldura-assinatura, a faísca de quatro pontas como brilho e o círculo como luz. Geometria sóbria; a magia aparece em poucos e bons detalhes.");
    const radii = stack("Radius scale", "HORIZONTAL", 24);
    b.appendChild(radii);
    for (const [name, val, use] of RADIUS) {
        const col = stack(name, "VERTICAL", 8);
        const sq = rect("Shape", 200, 140, [], 0);
        bindFill(sq, "color/bg/elevated");
        bindStroke(sq, "color/border/strong", 1);
        bindRadius(sq, name);
        col.appendChild(sq);
        col.appendChild(await text(name, "Label", "color/text/primary"));
        col.appendChild(await text(`${val === 999 ? "pílula" : val + " px"} · ${use}`, "Caption", "color/text/muted", 200));
        radii.appendChild(col);
    }
    g = grid(b);
    const shapeCard = async (title, desc, build) => {
        const c = await card(g, colWidth(3), title, desc, { titleStyle: "Heading/H4" });
        const holder = frame("Shape stage", { clipsContent: true });
        holder.resize(colWidth(3) - 64, 260);
        holder.fills = [linear(90, [["#0B1434", 0], ["#12204D", 1]])];
        holder.cornerRadius = 20;
        await build(holder);
        c.insertChild(0, holder);
    };
    const stageW = colWidth(3) - 64;
    await shapeCard("Arco de castelo", "Moldura de imagens de parques e destinos. Topo com raio = largura/2; proporção entre 3:4 e 4:5.", (h) => {
        const a = archFrame("Arch", 150, 200, [linear(90, [["#3D6BFF", 0], ["#E2557A", 1]])]);
        h.appendChild(a);
        a.x = (stageW - 150) / 2;
        a.y = 40;
    });
    await shapeCard("Faísca de quatro pontas", "O brilho da marca. Dourada ou marfim; no máximo três por composição; nunca como bullet decorativo em texto longo.", (h) => {
        for (const [s, x, y, o] of [[72, stageW / 2 - 36, 90, 1], [32, stageW / 2 + 60, 60, 0.8], [20, stageW / 2 - 90, 170, 0.6]]) {
            const sp = sparkleNode(s, "#E6BE63", o);
            h.appendChild(sp);
            sp.x = x;
            sp.y = y;
        }
    });
    await shapeCard("Círculo de luz", "Orbes e halos suaves: a luz do projetor, a lua sobre o castelo. Sempre em gradiente radial, nunca chapado.", (h) => {
        const o = ellipse("Orb", 200, [radial([["#E6BE63", 0, 0.9], ["#E6BE63", 0.45, 0.25], ["#E6BE63", 1, 0]])]);
        h.appendChild(o);
        o.x = (stageW - 200) / 2;
        o.y = 30;
    });
    await shapeCard("Curvas e trajetórias", "O caminho de uma varinha ou de um fogo de artifício: arcos finos (1,5 a 2 px) que conduzem o olhar.", (h) => {
        const v = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${stageW}" height="260" fill="none"><path d="M24 220C ${stageW * 0.3} 40 ${stageW * 0.6} 40 ${stageW - 40} 120" stroke="#D4A23F" stroke-width="2" stroke-linecap="round"/><path d="M24 240C ${stageW * 0.35} 90 ${stageW * 0.65} 90 ${stageW - 24} 180" stroke="#6E91FF" stroke-width="1.5" stroke-linecap="round" stroke-opacity=".7"/></svg>`);
        v.fills = [];
        h.appendChild(v);
        const sp = sparkleNode(24, "#E6BE63");
        h.appendChild(sp);
        sp.x = stageW - 52;
        sp.y = 106;
    });
    await shapeCard("Silhuetas", "O castelo e as torres aparecem só em traço dourado ou como recorte em contraluz, nunca preenchidos com detalhe.", (h) => {
        const cs = castleNode(220, "#E6BE63", 2);
        h.appendChild(cs);
        cs.x = (stageW - cs.width) / 2;
        cs.y = 260 - cs.height - 24;
    });
    await shapeCard("Formas orgânicas", "Ondas e colinas suaves no rodapé das artes (mar de Moana, savana, neve) para dar profundidade sem ilustrar personagens.", (h) => {
        const v = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${stageW}" height="260"><path d="M0 170c60-30 120-30 180 0s120 30 ${stageW - 180} 0V260H0z" fill="#3D6BFF" fill-opacity=".55"/><path d="M0 200c80-24 160-24 240 0s120 20 ${stageW - 240} 0V260H0z" fill="#6E91FF" fill-opacity=".5"/></svg>`);
        v.fills = [];
        h.appendChild(v);
    });
    // ------------------------------------------------ Elevação
    b = await section(content, "5.6", "Profundidade e brilho", "Sombras frias e suaves (Midnight) para hierarquia; brilhos dourado e azul só para momentos de magia e foco.");
    g = grid(b, 32);
    for (const name of Object.keys(ESTYLE)) {
        const c = await card(g, colWidth(5, 32), name, ESTYLE[name].description, { titleStyle: "Subtitle/L" });
        await c.setEffectStyleIdAsync(ESTYLE[name].id);
    }
}
// ---------------------------------------------------------------- Iconography
async function pageIconography(page, iconComps) {
    const { content } = await board(page, "05", "Iconography", "Iconography", "Trinta ícones desenhados para o universo Disney: magia, cinema, viagens e navegação, com a mesma geometria.");
    let b = await section(content, "6.1", "Construção", "Grade de 24 px com área viva de 20 px, traço de 1,5 px, pontas e junções arredondadas. Formas abertas e curvas suaves conversam com a Fraunces; nada de preenchimento chapado.");
    const row = stack("Construction", "HORIZONTAL", 48);
    b.appendChild(row);
    const stage = frame("Keyline grid (10×)", { clipsContent: true });
    stage.resize(240, 240);
    bindFill(stage, "color/bg/surface");
    bindStroke(stage, "color/border/strong", 1);
    stage.cornerRadius = 16;
    for (let i = 1; i < 24; i++) {
        const v = rect("v", 1, 240, [solid("#2350E0", i === 2 || i === 22 ? 0.4 : 0.08)]);
        stage.appendChild(v);
        v.x = i * 10;
        const h = rect("h", 240, 1, [solid("#2350E0", i === 2 || i === 22 ? 0.4 : 0.08)]);
        stage.appendChild(h);
        h.y = i * 10;
    }
    const kc = ellipse("Keyline circle", 200, []);
    kc.strokes = [solid("#E2557A", 0.5)];
    kc.strokeWeight = 1;
    stage.appendChild(kc);
    kc.x = 20;
    kc.y = 20;
    const big = icon("castle", 240, "color/text/primary");
    stage.appendChild(big);
    row.appendChild(stage);
    const specs = stack("Specs", "VERTICAL", 16);
    await bullets(specs, [
        "Grade 24 × 24 px; área viva 20 × 20 (2 px de respiro em cada lado)",
        "Traço 1,5 px em 24 px; escala proporcional nos outros tamanhos",
        "Pontas e junções arredondadas; raio interno mínimo de 1 px",
        "Tamanhos: 16 (inline), 20 (botões), 24 (padrão), 32 (destaques)",
        "Cor sempre por variável de texto do contexto (primária, marca, dourado ou marfim sobre fundo de marca)",
        "Ícone sozinho precisa de nome acessível; ícone com rótulo é decorativo",
    ], 760);
    const sizes = stack("Sizes", "HORIZONTAL", 32);
    sizes.counterAxisAlignItems = "MAX";
    for (const s of [16, 20, 24, 32]) {
        const col = stack(`${s}px`, "VERTICAL", 8);
        col.counterAxisAlignItems = "CENTER";
        col.appendChild(icon("sparkle", s, "color/text/brand"));
        col.appendChild(await text(`${s}`, "Caption", "color/text/muted"));
        sizes.appendChild(col);
    }
    specs.appendChild(sizes);
    const colors = stack("Colors", "HORIZONTAL", 16);
    for (const cv of ["color/text/primary", "color/text/brand", "color/text/gold", "color/text/muted"])
        colors.appendChild(icon("star", 32, cv));
    specs.appendChild(colors);
    row.appendChild(specs);
    b = await section(content, "6.2", "Regras de uso");
    let g = grid(b);
    const dos = [
        ["Use com rótulo na navegação", "Ícone + texto em menus e botões; o rótulo carrega o significado.", true],
        ["Mantenha um peso só", "Nunca misture traço 1,5 com ícones preenchidos ou de outra biblioteca.", true],
        ["Não use emoji como ícone", "Emojis mudam por sistema e quebram a consistência da marca.", false],
        ["Não recrie personagens ou logotipos", "Os ícones evocam o universo (castelo, faísca), sem copiar marcas registradas.", false],
    ];
    for (const [t, d, ok] of dos) {
        const c = await card(g, colWidth(4), t, d, { accent: ok ? "FAÇA" : "EVITE", titleStyle: "Subtitle/L" });
        bindStroke(c, ok ? "color/feedback/success" : "color/feedback/error", 1.5);
    }
    b = await section(content, "6.3", "Biblioteca", "Cada ícone é um componente (Icon/<nome>) e pode ser trocado em qualquer botão pela propriedade Icon.");
    const cats = [...new Set(ICONS.map((i) => i.cat))];
    for (const cat of cats) {
        b.appendChild(await text(cat, "Heading/H4", "color/text/primary"));
        g = grid(b, 16);
        for (const def of ICONS.filter((i) => i.cat === cat)) {
            const cell = stack(def.name, "VERTICAL", 12, [24, 16]);
            cell.counterAxisAlignItems = "CENTER";
            cell.resize(160, 10);
            cell.counterAxisSizingMode = "FIXED";
            bindFill(cell, "color/bg/surface");
            bindStroke(cell, "color/border/subtle", 1);
            cell.cornerRadius = 16;
            const comp = iconComps.find((c) => c.name === `Icon/${def.name}`);
            if (comp)
                cell.appendChild(comp);
            cell.appendChild(await text(def.name, "Caption", "color/text/muted"));
            g.appendChild(cell);
        }
    }
}
// ---------------------------------------------------------------- Components
async function pageComponents(page, build, artComps) {
    const { content } = await board(page, "06", "Components", "Components", "Peças reutilizáveis com variantes, propriedades e protótipo. Tudo ligado às variáveis: troque o modo e o sistema inteiro acompanha.");
    const blocks = [
        ["7.1", "Button", [C.Button]],
        ["7.2", "Icon Button · Chip · Badge", [C.IconButton, C.Chip, C.Badge]],
        ["7.3", "Input", [C.Input]],
        ["7.4", "Navegação global", [C.NavLink, C.Header]],
        ["7.5", "Media Card (filmes e animações)", [C.MediaCard]],
        ["7.6", "Experience Card (parques e experiências)", [C.ExperienceCard]],
        ["7.7", "Franchise Tile (destaques de franquias)", [C.FranchiseTile]],
        ["7.8", "Section Header · Footer", [C.SectionHeader, C.Footer]],
        ["7.9", "Feedback e carregamento", [C.Toast, C.SparkleLoader]],
    ];
    for (const [idx, title, nodes] of blocks) {
        const b = await section(content, idx, title, nodes.map((n) => n.description).filter(Boolean).join("\n\n"));
        for (const n of nodes) {
            if (!n)
                continue;
            const wrap = stack(`${n.name} wrap`, "VERTICAL", 12);
            wrap.appendChild(await text(n.name, "Label", "color/text/muted"));
            wrap.appendChild(n);
            b.appendChild(wrap);
        }
    }
    const doc = await section(content, "7.10", "Documentação", `${C.ChapterHeader.description} O componente principal (1600 px) fica ao lado deste quadro, à direita.`);
    doc.appendChild(await text("Doc/Chapter Header: à direita do quadro", "Label", "color/text/muted"));
    placeOnPage(page, C.ChapterHeader, BOARD_W + 160, 0);
    const b = await section(content, "7.11", "Arte conceitual (Art/…)", "Composições abstratas por franquia, usadas pela propriedade Art dos cartões. Cor, luz e forma da história; nenhum personagem ou logotipo.");
    const g = grid(b, 16);
    for (const a of artComps) {
        const cell = stack(a.name, "VERTICAL", 8);
        cell.appendChild(a);
        cell.appendChild(await text(a.name, "Caption", "color/text/muted"));
        g.appendChild(cell);
    }
    build.remove();
}
// ---------------------------------------------------------------- Motion
function curveSvg(x1, y1, x2, y2, color) {
    const S = 200;
    const P = (x, y) => `${x * S} ${S - y * S}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" fill="none"><rect x=".5" y=".5" width="${S - 1}" height="${S - 1}" rx="12" stroke="#CFC8B6" stroke-opacity=".6"/><path d="M0 ${S}L${S} 0" stroke="#CFC8B6" stroke-dasharray="4 4"/><path d="M${P(0, 0)}C${P(x1, y1)} ${P(x2, y2)} ${P(1, 1)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/><circle cx="${x1 * S}" cy="${S - y1 * S}" r="5" fill="${color}"/><circle cx="${x2 * S}" cy="${S - y2 * S}" r="5" fill="${color}"/></svg>`;
}
async function pageMotion(page) {
    const { root, content } = await board(page, "07", "Motion", "Motion", "Movimento com intenção: a herança dos princípios de animação da Disney, traduzida para interfaces rápidas e acolhedoras.");
    let b = await section(content, "8.1", "Princípios", "Os animadores Frank Thomas e Ollie Johnston registraram os 12 princípios da animação Disney em “The Illusion of Life” (1981). Seis deles guiam o movimento da interface.");
    let g = grid(b);
    const principles = [
        ["Antecipação e resposta", "Todo toque responde em até 100 ms; o botão afunda antes de agir."],
        ["Slow in, slow out", "Nada começa ou para de repente: entradas desaceleram (ease-out), deslocamentos aceleram e desaceleram."],
        ["Arcos", "Elementos decorativos seguem trajetórias curvas, como uma varinha, nunca linhas duras."],
        ["Encenação", "Um foco por vez: o movimento aponta para a ação mais importante da tela."],
        ["Ação secundária", "O brilho dourado complementa a ação principal, sem competir com ela."],
        ["Apelo, com moderação", "Encanto em momentos raros (celebração, primeira visita); rapidez no uso diário."],
    ];
    for (const [t, d] of principles)
        await card(g, colWidth(3), t, d, { titleStyle: "Subtitle/L" });
    b = await section(content, "8.2", "Duração", "Tokens da coleção DS · Motion. Interface do dia a dia fica abaixo de 300 ms; o tempo cinematográfico é reservado ao hero e às celebrações.");
    for (const [name, ms, use] of MOTION) {
        const r = stack(name, "HORIZONTAL", 24);
        r.counterAxisAlignItems = "CENTER";
        r.appendChild(await text(name, "Label", "color/text/primary", 200));
        r.appendChild(await text(`${ms} ms`, "Body/S", "color/text/muted", 80));
        r.appendChild(rect("Bar", ms, 16, [linear(0, [["#2350E0", 0], ["#D4A23F", 1]])], 8));
        r.appendChild(await text(use, "Body/S", "color/text/secondary", 420));
        b.appendChild(r);
    }
    b = await section(content, "8.3", "Easing", "Três curvas com nome de história. Use as curvas personalizadas: as padrões do navegador são fracas demais.");
    g = grid(b);
    const curves = [
        ["Pixie · ease-out", "cubic-bezier(0.23, 1, 0.32, 1)", 0.23, 1, 0.32, 1, "#2350E0", "Entradas, saídas e respostas a toque. Começa rápido: a interface parece atenta."],
        ["Curtain · ease-in-out", "cubic-bezier(0.77, 0, 0.175, 1)", 0.77, 0, 0.175, 1, "#D4A23F", "Algo que se move na tela: troca de página, abas, carrossel. Como uma cortina de teatro."],
        ["Glow · linear", "linear", 0, 0, 1, 1, "#E2557A", "Só para movimento contínuo: brilho que pulsa, carregamento. Nunca para entradas."],
    ];
    for (const [t, css, x1, y1, x2, y2, color, d] of curves) {
        const c = await card(g, colWidth(3), t, d, { titleStyle: "Heading/H4" });
        const v = figma.createNodeFromSvg(curveSvg(x1, y1, x2, y2, color));
        v.name = "Curve";
        v.fills = [];
        c.insertChild(0, v);
        c.appendChild(await text(css, "Caption", "color/text/brand"));
    }
    await card(b, CONTENT_W, "Spring · Gentle", "Para gestos interrompíveis (arrastar um carrossel, folha inferior no mobile): mola suave do Figma (Gentle), sem quique exagerado. Em código: spring com duração 0,5 s e bounce 0,2.", { titleStyle: "Subtitle/L" });
    b = await section(content, "8.4", "Comportamentos");
    const tb = stack("Behaviors", "VERTICAL", 0);
    bindFill(tb, "color/bg/surface");
    bindStroke(tb, "color/border/subtle", 1);
    tb.cornerRadius = 24;
    tb.clipsContent = true;
    b.appendChild(tb);
    tb.layoutSizingHorizontal = "FILL";
    const rowsB = [
        ["Tipo", "Duração", "Easing", "Comportamento"],
        ["Transições de página", "500 ms", "Curtain", "Conteúdo novo entra 24 px de baixo com fade; o antigo sai em 200 ms."],
        ["Animações de entrada", "500 ms", "Pixie", "Seções sobem 24 px com fade, em cascata de 60 ms entre itens. Uma vez só, não a cada rolagem."],
        ["Efeitos de brilho", "1,6 s (loop)", "Glow", "Faísca dourada pulsa na opacidade (de 0,4 a 1). Só decorativo; nunca em texto ou ação."],
        ["Microinterações", "100 a 200 ms", "Pixie", "Hover em 200 ms; pressionar em 100 ms (escala 0,97); foco instantâneo com anel dourado."],
        ["Feedback visual", "500 / 200 ms", "Pixie", "Toast entra subindo 48 px e sai mais rápido do que entrou. Erros não balançam: aparecem perto do campo."],
        ["Movimentos decorativos", "2 a 4 s", "Glow", "Estrelas cintilam devagar; parallax leve no hero. Tudo desligado em “reduzir movimento”."],
    ];
    for (const [i, r] of rowsB.entries()) {
        const row = stack(r[0], "HORIZONTAL", 24, [16, 32]);
        if (i === 0)
            bindFill(row, "color/bg/elevated");
        const widths = [280, 160, 160, 700];
        for (const [j, cell] of r.entries())
            row.appendChild(await text(cell, i === 0 ? "Overline" : j === 0 ? "Label" : "Body/S", i === 0 ? "color/text/muted" : j === 0 ? "color/text/primary" : "color/text/secondary", widths[j]));
        tb.appendChild(row);
        row.layoutSizingHorizontal = "FILL";
    }
    await card(b, CONTENT_W, "Menos movimento", "Com “reduzir movimento” ativo no sistema: mantenha fades de opacidade (ajudam a entender a mudança), remova deslocamentos, escalas, parallax e loops. O carregamento vira só o texto “Preparando a magia…”.", { accent: "ACESSIBILIDADE", titleStyle: "Subtitle/L" });
    b = await section(content, "8.5", "Protótipos", "Abra o frame “Motion · Playground” no modo Apresentação (Present): botões, chips e cartões respondem ao hover e ao toque; o toast e o carregador rodam sozinhos. O par “Transição A/B” demonstra a troca de página.");
    // Playground (frame de topo, para o modo Apresentação)
    const pg = stack("Motion · Playground", "VERTICAL", 48, 80);
    pg.resize(1440, 10);
    pg.counterAxisSizingMode = "FIXED";
    bindFill(pg, "color/bg/canvas");
    pg.appendChild(await text("Playground de movimento", "Heading/H1", "color/text/primary"));
    pg.appendChild(await text("Passe o mouse e clique. Tudo aqui usa as curvas e durações do sistema.", "Body/L", "color/text/secondary"));
    const r1 = stack("Buttons", "HORIZONTAL", 24);
    r1.appendChild(buttonInst("Primary", "Assistir trailer", "Default", true, "play"));
    r1.appendChild(buttonInst("Magic", "Garantir ingressos", "Default", true, "ticket"));
    r1.appendChild(buttonInst("Secondary", "Minha lista", "Default", true, "heart"));
    r1.appendChild(buttonInst("Ghost", "Ver tudo"));
    for (const l of ["Aventura", "Musical", "Família"])
        r1.appendChild(chip(l));
    pg.appendChild(r1);
    const r2 = stack("Cards", "HORIZONTAL", 32);
    const mc = C.MediaCard.findChild((n) => n.name === "State=Default").createInstance();
    setProps(mc, C.MediaCard, { Title: "Toy Story 4", Meta: "Pixar Animation Studios · 2019", Art: ART.toystory.id });
    r2.appendChild(mc);
    const ft = C.FranchiseTile.findChild((n) => n.name === "State=Default").createInstance();
    setProps(ft, C.FranchiseTile, { Name: "Frozen", Caption: "Walt Disney Animation Studios · 2013", Art: ART.frozen.id });
    r2.appendChild(ft);
    const side = stack("Live", "VERTICAL", 32);
    side.appendChild(C.Toast.findChild((n) => n.name === "State=Hidden").createInstance());
    side.appendChild(C.SparkleLoader.findChild((n) => n.name === "Frame=1").createInstance());
    side.appendChild(await text("Preparando a magia…", "Body/S", "color/text/muted"));
    r2.appendChild(side);
    pg.appendChild(r2);
    placeOnPage(page, pg, BOARD_W + 160, 0);
    // Transição de página A → B (Smart Animate com Curtain, 500 ms)
    const mk = async (name, detail) => {
        const f = frame(name, { clipsContent: true });
        f.resize(720, 480);
        f.fills = [linear(90, [["#060B1E", 0], ["#1B2E6B", 1]])];
        const a = archFrame("Hero arch", detail ? 360 : 200, detail ? 440 : 260, [linear(90, [["#3D6BFF", 0], ["#7A5AE6", 1]])]);
        a.name = "Hero arch";
        f.appendChild(a);
        a.x = detail ? 320 : 480;
        a.y = detail ? 20 : 120;
        const t = await textRaw(detail ? "Walt Disney World" : "Experiências", "Heading/H2", "#FBFAF6", 300);
        t.name = "Title";
        f.appendChild(t);
        t.x = 48;
        t.y = detail ? 300 : 160;
        const s = await textRaw(detail ? "Toque em voltar para fechar a cortina." : "Toque no arco para abrir o destino.", "Body/M", "#FBFAF6", 300, 0.7);
        s.name = "Hint";
        f.appendChild(s);
        s.x = 48;
        s.y = t.y + t.height + 12;
        return f;
    };
    const A = await mk("Transição A · Lista", false);
    const B = await mk("Transição B · Destino", true);
    placeOnPage(page, A, BOARD_W + 160, pg.height + 120);
    placeOnPage(page, B, BOARD_W + 160 + 720 + 80, pg.height + 120);
    await A.setReactionsAsync([{ trigger: { type: "ON_CLICK" }, actions: [{ type: "NODE", destinationId: B.id, navigation: "NAVIGATE", transition: { type: "SMART_ANIMATE", easing: EASE_IN_OUT, duration: 0.5 }, preserveScrollPosition: false }] }]);
    await B.setReactionsAsync([{ trigger: { type: "ON_CLICK" }, actions: [{ type: "NODE", destinationId: A.id, navigation: "NAVIGATE", transition: { type: "SMART_ANIMATE", easing: EASE_OUT, duration: 0.3 }, preserveScrollPosition: false }] }]);
    page.flowStartingPoints = [
        { nodeId: pg.id, name: "Motion · Playground" },
        { nodeId: A.id, name: "Transição de página" },
    ];
    return root;
}
/* =====================================================================
   Página 9: Application. Home institucional da Disney (desktop 1440 e
   mobile 390 em modo escuro), montada só com instâncias do sistema.
   ===================================================================== */
function inst(set, variant) {
    if (set.type === "COMPONENT_SET")
        return set.findChild((n) => n.name === variant).createInstance();
    return set.createInstance();
}
async function heroDesktop() {
    const W = 1440;
    const H = 760;
    const f = frame("Hero", { clipsContent: true });
    f.resize(W, H);
    f.fills = [linear(90, [["#060B1E", 0], ["#0B1434", 0.55], ["#1B2E6B", 1]])];
    starfield(f, W, H, 260, 5);
    const glow = ellipse("Glow", 900, [radial([["#3D6BFF", 0, 0.4], ["#3D6BFF", 1, 0]])]);
    f.appendChild(glow);
    glow.x = 760;
    glow.y = -120;
    // Janela em arco: a assinatura de forma do sistema, com a arte "castle".
    const win = archFrame("Arch window", 520, 640, []);
    win.strokes = [solid("#D4A23F", 0.7)];
    win.strokeWeight = 2;
    const a = ART.castle.createInstance();
    a.resize(520, 693);
    win.appendChild(a);
    a.y = -40;
    f.appendChild(win);
    win.x = W - 80 - 520;
    win.y = H - 640;
    for (const [x, y, s] of [[W - 640, 140, 28], [W - 110, 300, 18], [W - 700, 560, 14]]) {
        const sp = sparkleNode(s, "#E6BE63");
        f.appendChild(sp);
        sp.x = x;
        sp.y = y;
    }
    const col = stack("Copy", "VERTICAL", 32);
    const t = await textRaw("Onde a magia\nvira realidade", "Display/XL", "#FBFAF6", 700);
    col.appendChild(t);
    col.appendChild(await textRaw("Há mais de cem anos transformamos histórias em lugares, músicas e memórias. Escolha por onde começar a sua.", "Body/L", "#FBFAF6", 560, 0.8));
    const btns = stack("Actions", "HORIZONTAL", 16);
    btns.appendChild(buttonInst("Magic", "Planejar minha visita", "Default", true, "calendar"));
    btns.appendChild(buttonInst("Primary", "Assistir trailer", "Default", true, "play"));
    col.appendChild(btns);
    const stats = stack("Stats", "HORIZONTAL", 48);
    for (const [v, l] of [["1923", "nossa primeira história"], ["12", "parques em 6 resorts"], ["3", "continentes com parques"]]) {
        const s = stack(l, "VERTICAL", 2);
        s.appendChild(await textRaw(v, "Heading/H3", "#E6BE63"));
        s.appendChild(await textRaw(l, "Caption", "#FBFAF6", undefined, 0.7));
        stats.appendChild(s);
    }
    col.appendChild(stats);
    f.appendChild(col);
    col.x = 80;
    col.y = 140;
    return f;
}
async function homeDesktop(page) {
    const home = stack("Home · Desktop 1440", "VERTICAL", 0);
    home.resize(1440, 10);
    home.counterAxisSizingMode = "FIXED";
    bindFill(home, "color/bg/canvas");
    home.layoutGrids = [{ pattern: "COLUMNS", alignment: "STRETCH", count: 12, gutterSize: 24, offset: 80, visible: false, color: rgba("#E2557A", 0.1) }];
    const header = inst(C.Header, "Size=Desktop");
    home.appendChild(header);
    home.appendChild(await heroDesktop());
    // Em cartaz
    const s1 = stack("Em cartaz", "VERTICAL", 40, [128, 80, 64, 80]);
    home.appendChild(s1);
    s1.layoutSizingHorizontal = "FILL";
    const sh1 = inst(C.SectionHeader);
    setProps(sh1, C.SectionHeader, { Title: "Em cartaz no universo Disney", Lead: "Clássicos e estreias para assistir juntos, de Walt Disney Animation Studios a Pixar e Marvel Studios." });
    s1.appendChild(sh1);
    sh1.layoutSizingHorizontal = "FILL";
    const filters = stack("Filters", "HORIZONTAL", 12);
    filters.appendChild(chip("Tudo", true));
    for (const l of ["Animação", "Aventura", "Musical", "Super-heróis", "Galáxia distante"])
        filters.appendChild(chip(l));
    s1.appendChild(filters);
    const row = stack("Cards", "HORIZONTAL", 0);
    row.primaryAxisAlignItems = "SPACE_BETWEEN";
    s1.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
    const films = [
        ["Frozen II", "Walt Disney Animation Studios · 2019", "frozen", true],
        ["O Rei Leão", "Walt Disney Animation Studios · 1994", "lionking", false],
        ["Toy Story 4", "Pixar Animation Studios · 2019", "toystory", false],
        ["Moana", "Walt Disney Animation Studios · 2016", "moana", false],
    ];
    for (const [t, m, a, badge] of films) {
        const c = inst(C.MediaCard, "State=Default");
        setProps(c, C.MediaCard, { Title: t, Meta: m, Art: ART[a].id, "Show badge": badge });
        row.appendChild(c);
    }
    // Franquias (faixa em modo escuro: as mesmas variáveis, outro modo)
    const s2 = stack("Franquias", "VERTICAL", 40, [128, 80, 128, 80]);
    home.appendChild(s2);
    s2.layoutSizingHorizontal = "FILL";
    bindFill(s2, "color/bg/canvas");
    if (COLOR_COLLECTION)
        s2.setExplicitVariableModeForCollection(COLOR_COLLECTION, COLOR_MODES.dark);
    const sh2 = inst(C.SectionHeader);
    setProps(sh2, C.SectionHeader, { Title: "Mundos que cabem em uma só marca", Lead: "Cada franquia tem seu clima; a Disney é o fio que liga todas elas." });
    s2.appendChild(sh2);
    sh2.layoutSizingHorizontal = "FILL";
    const tiles = [
        ["Mickey e Amigos", "Desde 1928", "mickey"],
        ["Frozen", "Walt Disney Animation Studios · 2013", "frozen"],
        ["O Rei Leão", "Walt Disney Animation Studios · 1994", "lionking"],
        ["Toy Story", "Pixar Animation Studios · 1995", "toystory"],
        ["Moana", "Walt Disney Animation Studios · 2016", "moana"],
        ["Marvel", "Marvel Studios · no cinema desde 2008", "marvel"],
        ["Star Wars", "Lucasfilm · desde 1977", "starwars"],
        ["Pixar", "Pixar Animation Studios · desde 1986", "pixar"],
    ];
    const tg = stack("Tiles", "HORIZONTAL", 32);
    tg.layoutWrap = "WRAP";
    tg.counterAxisSpacing = 32;
    s2.appendChild(tg);
    tg.layoutSizingHorizontal = "FILL";
    for (const [n, c, a] of tiles) {
        const t = inst(C.FranchiseTile, "State=Default");
        setProps(t, C.FranchiseTile, { Name: n, Caption: c, Art: ART[a].id });
        tg.appendChild(t);
    }
    // Experiências e parques
    const s3 = stack("Experiências", "VERTICAL", 40, [128, 80, 128, 80]);
    home.appendChild(s3);
    s3.layoutSizingHorizontal = "FILL";
    const sh3 = inst(C.SectionHeader);
    setProps(sh3, C.SectionHeader, { Title: "Histórias que você visita", Lead: "Parques, resorts e cruzeiros onde a tela vira lugar." });
    s3.appendChild(sh3);
    sh3.layoutSizingHorizontal = "FILL";
    const er = stack("Cards", "HORIZONTAL", 64);
    s3.appendChild(er);
    const exps = [
        ["Walt Disney World Resort", "Orlando, Flórida · EUA", "Quatro parques, noites de fogos e histórias que você atravessa a pé.", "parks"],
        ["Disneyland Paris", "Marne-la-Vallée · França", "O conto de fadas europeu, a meia hora de Paris.", "paris"],
        ["Disney Cruise Line", "Bahamas e Caribe", "Navios com teatro, personagens e ilhas tropicais no roteiro.", "cruise"],
    ];
    for (const [t, l, d, a] of exps) {
        const c = inst(C.ExperienceCard);
        setProps(c, C.ExperienceCard, { Title: t, Location: l, Description: d, Art: ART[a].id });
        er.appendChild(c);
    }
    // Nossa história
    const s4 = stack("Nossa história", "VERTICAL", 48, [96, 80]);
    bindFill(s4, "color/bg/elevated");
    home.appendChild(s4);
    s4.layoutSizingHorizontal = "FILL";
    s4.appendChild(await text("Cem anos de histórias", "Heading/H2", "color/text/primary"));
    const tl = stack("Timeline", "HORIZONTAL", 0);
    tl.primaryAxisAlignItems = "SPACE_BETWEEN";
    s4.appendChild(tl);
    tl.layoutSizingHorizontal = "FILL";
    for (const [y, d] of [["1923", "Nasce o estúdio dos irmãos Disney"], ["1928", "Mickey estreia com som sincronizado"], ["1937", "Primeiro longa de animação do estúdio"], ["1955", "A Disneyland abre as portas"], ["2019", "Chega o Disney+"]]) {
        const it = stack(y, "VERTICAL", 8);
        it.appendChild(await text(y, "Heading/H1", "color/text/gold"));
        it.appendChild(await text(d, "Body/S", "color/text/secondary", 200));
        tl.appendChild(it);
    }
    s4.appendChild(buttonInst("Secondary", "Conheça nossa história", "Default", true, "arrow-right"));
    // Newsletter
    const s5 = stack("Newsletter", "HORIZONTAL", 64, [96, 80]);
    s5.counterAxisAlignItems = "CENTER";
    home.appendChild(s5);
    s5.layoutSizingHorizontal = "FILL";
    const nl = stack("Copy", "VERTICAL", 12);
    nl.appendChild(await text("Receba a magia no seu e-mail", "Heading/H3", "color/text/primary"));
    nl.appendChild(await text("Estreias, aberturas de parque e novidades para a família, uma vez por mês.", "Body/M", "color/text/secondary", 520));
    s5.appendChild(nl);
    const ni = inst(C.Input, "State=Default");
    setProps(ni, C.Input, { Label: "Seu melhor e-mail", Value: "nome@email.com", Helper: "Sem spam. Você sai quando quiser." });
    s5.appendChild(ni);
    s5.appendChild(buttonInst("Magic", "Quero receber", "Default", true, "sparkle"));
    const footer = inst(C.Footer);
    home.appendChild(footer);
    placeOnPage(page, home, 0, 0);
    return home;
}
async function homeMobile(page, x) {
    const m = stack("Home · Mobile 390 (modo escuro)", "VERTICAL", 0);
    m.resize(390, 10);
    m.counterAxisSizingMode = "FIXED";
    bindFill(m, "color/bg/canvas");
    m.clipsContent = true;
    if (COLOR_COLLECTION)
        m.setExplicitVariableModeForCollection(COLOR_COLLECTION, COLOR_MODES.dark);
    m.layoutGrids = [{ pattern: "COLUMNS", alignment: "STRETCH", count: 4, gutterSize: 16, offset: 24, visible: false, color: rgba("#E2557A", 0.1) }];
    m.appendChild(inst(C.Header, "Size=Mobile"));
    const hero = stack("Hero", "VERTICAL", 24, [32, 24, 48, 24]);
    hero.fills = [linear(90, [["#060B1E", 0], ["#1B2E6B", 1]])];
    hero.clipsContent = true;
    m.appendChild(hero);
    hero.layoutSizingHorizontal = "FILL";
    starfield(hero, 390, 700, 90, 9);
    const win = archFrame("Arch window", 342, 300, []);
    win.strokes = [solid("#D4A23F", 0.7)];
    win.strokeWeight = 1.5;
    const a = ART.castle.createInstance();
    a.resize(342, 456);
    win.appendChild(a);
    a.y = -100;
    hero.appendChild(win);
    hero.appendChild(await textRaw("Onde a magia vira realidade", "Heading/H1", "#FBFAF6", 342));
    hero.appendChild(await textRaw("Escolha uma história e comece por onde quiser.", "Body/M", "#FBFAF6", 342, 0.8));
    const b1 = buttonInst("Magic", "Planejar minha visita", "Default", true, "calendar");
    hero.appendChild(b1);
    b1.layoutSizingHorizontal = "FILL";
    const b2 = buttonInst("Primary", "Assistir trailer", "Default", true, "play");
    hero.appendChild(b2);
    b2.layoutSizingHorizontal = "FILL";
    const s1 = stack("Em cartaz", "VERTICAL", 24, [64, 24, 32, 24]);
    m.appendChild(s1);
    s1.layoutSizingHorizontal = "FILL";
    s1.appendChild(await text("Em cartaz", "Heading/H3", "color/text/primary"));
    const ch = stack("Filters", "HORIZONTAL", 8);
    ch.appendChild(chip("Tudo", true));
    ch.appendChild(chip("Animação"));
    ch.appendChild(chip("Aventura"));
    s1.appendChild(ch);
    const sc = stack("Carousel", "HORIZONTAL", 16);
    sc.clipsContent = false;
    for (const [t, me, ak] of [["Frozen II", "Disney Animation · 2019", "frozen"], ["Toy Story 4", "Pixar · 2019", "toystory"]]) {
        const c = inst(C.MediaCard, "State=Default");
        setProps(c, C.MediaCard, { Title: t, Meta: me, Art: ART[ak].id, "Show badge": false });
        sc.appendChild(c);
    }
    s1.appendChild(sc);
    const s2 = stack("Experiências", "VERTICAL", 24, [32, 24, 64, 24]);
    m.appendChild(s2);
    s2.layoutSizingHorizontal = "FILL";
    s2.appendChild(await text("Histórias que você visita", "Heading/H3", "color/text/primary"));
    const ec = inst(C.ExperienceCard);
    setProps(ec, C.ExperienceCard, { Title: "Tokyo Disney Resort", Location: "Urayasu, Chiba · Japão", Description: "Dois parques à beira da baía de Tóquio.", Art: ART.tokyo.id });
    s2.appendChild(ec);
    ec.layoutSizingHorizontal = "FILL";
    const foot = stack("Footer", "VERTICAL", 12, [40, 24]);
    bindFill(foot, "color/bg/brand");
    m.appendChild(foot);
    foot.layoutSizingHorizontal = "FILL";
    foot.appendChild(await wordmark(0.9));
    foot.appendChild(await textRaw("Conceito acadêmico · sem afiliação com The Walt Disney Company.", "Caption", "#FBFAF6", 342, 0.55));
    placeOnPage(page, m, x, 0);
    return m;
}
async function pageApplication(page) {
    const d = await homeDesktop(page);
    const m = await homeMobile(page, d.width + 160);
    const note = stack("Nota", "VERTICAL", 12, 40);
    note.resize(520, 10);
    note.counterAxisSizingMode = "FIXED";
    bindFill(note, "color/bg/surface");
    bindStroke(note, "color/border/subtle", 1);
    note.cornerRadius = 24;
    note.appendChild(await text("Aplicação prática", "Heading/H3", "color/text/primary"));
    note.appendChild(await text("Home institucional montada só com instâncias da biblioteca. A faixa de franquias e a versão mobile usam o modo Dark das mesmas variáveis. Grids de 12 e 4 colunas estão no frame (Shift+G para mostrar). Abra no modo Apresentação para testar hover nos botões, chips e cartões.", "Body/M", "color/text/secondary", 440));
    placeOnPage(page, note, m.x + m.width + 120, 0);
    page.flowStartingPoints = [
        { nodeId: d.id, name: "Home · Desktop" },
        { nodeId: m.id, name: "Home · Mobile" },
    ];
}
/* =====================================================================
   Orquestrador. Ordem: tokens → ícones → arte → componentes → páginas.
   Pode rodar de novo: recria as páginas que ele mesmo criou e atualiza
   variáveis e estilos pelo nome (não duplica).
   ===================================================================== */
const PAGE_NAMES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function preparePages() {
    const old = figma.root.children.filter((p) => p.getPluginData(MARK) === "1");
    const pages = {};
    // Arquivo novo: a "Page 1" vazia vira a Cover.
    const first = figma.root.children[0];
    await first.loadAsync();
    const reuseFirst = old.length === 0 && first.children.length === 0 && first.getPluginData(MARK) !== "1";
    for (const [i, name] of PAGE_NAMES.entries()) {
        let p;
        if (i === 0 && reuseFirst) {
            p = first;
            p.name = name;
        }
        else {
            p = figma.createPage();
            p.name = name;
        }
        mark(p);
        pages[name] = p;
    }
    // Remove as páginas de uma execução anterior (só as marcadas por este plugin).
    if (old.length) {
        await figma.setCurrentPageAsync(pages.Cover);
        for (const p of old)
            if (!Object.values(pages).includes(p))
                p.remove();
    }
    // Garante a ordem pedida no arquivo.
    PAGE_NAMES.forEach((n, i) => figma.root.insertChild(i, pages[n]));
    for (const p of Object.values(pages))
        await p.loadAsync();
    return pages;
}
async function main() {
    progress("✨ Preparando a magia: fontes e páginas…");
    await initFonts();
    const pages = await preparePages();
    await step("Variables", buildVariables);
    await step("Text styles", buildTextStyles);
    await step("Effect styles", buildEffectStyles);
    progress("Tokens prontos. Desenhando ícones…");
    // Área de construção temporária (os componentes depois vão para as páginas de documentação).
    const iconHolder = frame("Icon build area");
    pages.Iconography.appendChild(iconHolder);
    let iconComps = [];
    await step("Icons", () => {
        iconComps = buildIconComponents();
        for (const c of iconComps)
            iconHolder.appendChild(c);
    });
    const build = stack("Build area", "VERTICAL", 80, 80);
    pages.Components.appendChild(build);
    build.x = -4000;
    let artComps = [];
    await step("Art components", () => {
        artComps = buildArtComponents(build);
    });
    progress("Construindo componentes…");
    await step("Button", async () => void (await buildButton(build)));
    await step("Icon Button", async () => void (await buildIconButton(build)));
    await step("Chip", async () => void (await buildChip(build)));
    await step("Badge", async () => void (await buildBadge(build)));
    await step("Input", async () => void (await buildInput(build)));
    await step("Nav Link", async () => void (await buildNavLink(build)));
    await step("Header", async () => void (await buildHeader(build)));
    await step("Media Card", async () => void (await buildMediaCard(build)));
    await step("Experience Card", async () => void (await buildExperienceCard(build)));
    await step("Franchise Tile", async () => void (await buildFranchiseTile(build)));
    await step("Section Header", async () => void (await buildSectionHeader(build)));
    await step("Footer", async () => void (await buildFooter(build)));
    await step("Toast", async () => void (await buildToast(build)));
    await step("Sparkle Loader", async () => void (await buildSparkleLoader(build)));
    await step("Chapter Header", async () => void (await buildChapterHeader(build)));
    progress("Montando as páginas de estratégia…");
    await step("Page · Cover", () => pageCover(pages.Cover));
    await step("Page · Brand Strategy", () => pageStrategy(pages["Brand Strategy"]));
    await step("Page · Persona", () => pagePersona(pages.Persona));
    await step("Page · Voice & Tone", () => pageVoice(pages["Voice & Tone"]));
    progress("Montando foundations, ícones e componentes…");
    await step("Page · Foundations", () => pageFoundations(pages.Foundations));
    await step("Page · Iconography", async () => {
        await pageIconography(pages.Iconography, iconComps);
        if (iconHolder.children.length === 0)
            iconHolder.remove();
    });
    await step("Page · Components", () => pageComponents(pages.Components, build, artComps));
    progress("Motion e aplicação…");
    await step("Page · Motion", async () => void (await pageMotion(pages.Motion)));
    await step("Page · Application", () => pageApplication(pages.Application));
    // Relatório honesto de qualquer falha, na própria capa.
    if (ERRORS.length) {
        await step("Error report", async () => {
            const r = stack("⚠ Relatório de construção", "VERTICAL", 8, 40);
            r.resize(900, 10);
            r.counterAxisSizingMode = "FIXED";
            r.fills = [solid("#FFF4F4")];
            r.cornerRadius = 24;
            r.appendChild(await textRaw(`${ERRORS.length} etapa(s) com erro. O restante foi construído.`, "Subtitle/L", "#C93B55", 820));
            for (const e of ERRORS)
                r.appendChild(await textRaw(e, "Body/S", "#4D4A40", 820));
            placeOnPage(pages.Cover, r, 0, 1200);
        });
    }
    await figma.setCurrentPageAsync(pages.Cover);
    figma.viewport.scrollAndZoomIntoView(pages.Cover.children);
    const msg = ERRORS.length ? `Design System construído com ${ERRORS.length} aviso(s): veja o relatório na Cover.` : "✨ Design System construído: 9 páginas, variáveis, estilos e componentes.";
    figma.closePlugin(msg);
}
main().catch((e) => {
    figma.closePlugin(`Falha inesperada: ${e instanceof Error ? e.message : String(e)}`);
});
