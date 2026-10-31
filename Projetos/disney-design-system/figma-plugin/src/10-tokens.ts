/* =====================================================================
   Tokens: Variables (Primitives, Color Light/Dark, Spacing, Radius, Motion),
   Text Styles e Effect Styles. Fonte única da verdade do sistema.
   ===================================================================== */

// ---------------------------------------------------------------- primitivas
// Azul da meia-noite (céu sobre o castelo), Azul Real (ação), Ouro (brilho/magia),
// Marfim (papel, pergaminho, luz quente) e Tinta (texto). Três acentos de história.
const PRIMITIVES: Record<string, string> = {
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

const PRIMITIVE_GROUPS: { title: string; role: string; keys: string[] }[] = [
  { title: "Midnight", role: "Primária institucional · céu, fundos de marca, títulos", keys: ["midnight/950", "midnight/900", "midnight/800", "midnight/700"] },
  { title: "Royal Blue", role: "Ação e navegação · botões, links, foco de interface", keys: ["royal/700", "royal/600", "royal/500", "royal/400", "royal/200", "royal/100"] },
  { title: "Enchanted Gold", role: "Destaque e magia · brilho, prêmios, CTA especial", keys: ["gold/700", "gold/600", "gold/500", "gold/400", "gold/200", "gold/100"] },
  { title: "Ivory", role: "Fundos e superfícies · papel, luz quente", keys: ["ivory/0", "ivory/50", "ivory/100", "ivory/200", "ivory/300"] },
  { title: "Ink", role: "Texto e neutros · leitura longa, metadados", keys: ["ink/400", "ink/500", "ink/600", "ink/800", "ink/900"] },
  { title: "Story Accents", role: "Cores complementares · categorias e ilustração", keys: ["rose/500", "teal/500", "violet/500"] },
  { title: "Feedback", role: "Estados do sistema · sucesso, atenção, erro", keys: ["success/600", "warning/600", "error/600"] },
];

// ---------------------------------------------------------------- semânticas (Light, Dark)
type Sem = { light: string; dark: string; scopes: VariableScope[]; desc: string };
const SEMANTIC: Record<string, Sem> = {
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
const SPACING: [string, number, string][] = [
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
const RADIUS: [string, number, string][] = [
  ["radius/0", 0, "Mídia sangrada, faixas"],
  ["radius/8", 8, "Tags, campos pequenos"],
  ["radius/16", 16, "Campos, cartões compactos"],
  ["radius/24", 24, "Cartões de conteúdo"],
  ["radius/32", 32, "Painéis, banners"],
  ["radius/full", 999, "Botões, chips, avatares"],
];
const MOTION: [string, number, string][] = [
  ["duration/instant", 100, "Pressionar, toggles"],
  ["duration/quick", 200, "Hover, foco, tooltips"],
  ["duration/standard", 300, "Menus, cartões, abas"],
  ["duration/expressive", 500, "Modais, entradas de seção"],
  ["duration/cinematic", 800, "Hero, abertura, celebração"],
];

// ---------------------------------------------------------------- tipografia
type TS = { name: string; kind: "display" | "ui"; weight: Weight; size: number; lh: number; ls: number; upper?: boolean; use: string };
const TYPE: TS[] = [
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
const VAR: Record<string, Variable> = {};
const TSTYLE: Record<string, TextStyle> = {};
const ESTYLE: Record<string, EffectStyle> = {};
let COLOR_COLLECTION: VariableCollection | null = null;
let COLOR_MODES = { light: "", dark: "" };

async function getOrCreateCollection(name: string): Promise<VariableCollection> {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  return all.find((c) => c.name === name) || figma.variables.createVariableCollection(name);
}
async function getOrCreateVariable(name: string, coll: VariableCollection, type: VariableResolvedDataType): Promise<Variable> {
  const all = await figma.variables.getLocalVariablesAsync(type);
  const hit = all.find((v) => v.name === name && v.variableCollectionId === coll.id);
  return hit || figma.variables.createVariable(name, coll, type);
}
const cssName = (n: string) => `var(--${n.replace(/\//g, "-")})`;

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
  if (!dark) dark = col.addMode("Dark");
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
  const defs: [string, Effect[], string][] = [
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
function bindFill(node: GeometryMixin & SceneNode, varName: string) {
  const v = VAR[varName];
  if (!v) throw new Error(`variável ausente: ${varName}`);
  node.fills = [figma.variables.setBoundVariableForPaint(solid("#000000"), "color", v)];
}
function bindStroke(node: GeometryMixin & SceneNode & MinimalStrokesMixin, varName: string, weight = 1) {
  const v = VAR[varName];
  if (!v) throw new Error(`variável ausente: ${varName}`);
  node.strokes = [figma.variables.setBoundVariableForPaint(solid("#000000"), "color", v)];
  node.strokeWeight = weight;
}
function bindRadius(node: FrameNode | ComponentNode | RectangleNode, varName: string) {
  const v = VAR[varName];
  for (const f of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"] as const) node.setBoundVariable(f, v);
}
function bindPadding(node: FrameNode | ComponentNode, x: string | null, y: string | null) {
  if (x) {
    node.setBoundVariable("paddingLeft", VAR[x]);
    node.setBoundVariable("paddingRight", VAR[x]);
  }
  if (y) {
    node.setBoundVariable("paddingTop", VAR[y]);
    node.setBoundVariable("paddingBottom", VAR[y]);
  }
}
function bindGap(node: FrameNode | ComponentNode, varName: string) {
  node.setBoundVariable("itemSpacing", VAR[varName]);
}

/** Texto com text style e cor por variável. width => quebra de linha com largura fixa. */
async function text(content: string, style: string, color: string, width?: number, align: "LEFT" | "CENTER" | "RIGHT" = "LEFT"): Promise<TextNode> {
  const def = TYPE.find((t) => t.name === style);
  if (!def) throw new Error(`text style ausente: ${style}`);
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
async function textRaw(content: string, style: string, hex: string, width?: number, opacity = 1): Promise<TextNode> {
  const def = TYPE.find((t) => t.name === style);
  if (!def) throw new Error(`text style ausente: ${style}`);
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
