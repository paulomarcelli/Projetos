// Simulador mínimo da Plugin API do Figma para rodar dist/code.js fora do Figma.
// Imita as regras que mais derrubam plugins: fonte carregada antes de mexer em texto,
// FILL/HUG só em contexto de auto layout, propriedades de componente com chave válida,
// filhos de instância imutáveis, IDs de destino existentes nas reações.
const vm = require("vm");
const fs = require("fs");
const path = require("path");

let nextId = 1;
const ALL = new Map();
const loaded = new Set();
const log = { notes: [], closed: null, warnings: [] };
const fk = (f) => `${f.family}::${f.style}`;

const FONTS = [];
for (const fam of ["Fraunces", "Manrope", "Inter", "Playfair Display"])
  for (const st of ["Light", "Regular", "Medium", "SemiBold", "Semi Bold", "Bold", "ExtraBold", "Italic", "Light Italic", "SemiBold Italic"])
    if (!(fam === "Inter" && st === "SemiBold") && !(fam !== "Inter" && st === "Semi Bold")) FONTS.push({ fontName: { family: fam, style: st } });

function err(msg) { throw new Error(msg); }
function isInsideInstance(n) { let p = n.parent; while (p) { if (p.type === "INSTANCE") return true; p = p.parent; } return false; }
function ownerComponent(n) { let p = n; while (p) { if (p.type === "COMPONENT" || p.type === "COMPONENT_SET") return p; p = p.parent; } return null; }

class Node {
  constructor(type) {
    this.id = `${nextId++}:1`; this.type = type; this.name = type; this.parent = null; this._pd = {};
    this.x = 0; this.y = 0; this.width = 100; this.height = 100; this.visible = true; this.opacity = 1; this.locked = false;
    this.fills = []; this.strokes = []; this.effects = []; this.strokeWeight = 1; this.constraints = { horizontal: "MIN", vertical: "MIN" };
    this._layoutSizingHorizontal = "FIXED"; this._layoutSizingVertical = "FIXED"; this._lp = "AUTO"; this._refs = {};
    ALL.set(this.id, this);
  }
  setPluginData(k, v) { this._pd[k] = v; } getPluginData(k) { return this._pd[k] || ""; }
  resize(w, h) { if (!(w > 0) || !(h > 0)) err(`resize: dimensões inválidas ${w}x${h} em ${this.name}`); this.width = w; this.height = h; }
  rescale(k) { if (!(k > 0)) err("rescale inválido"); this.width *= k; this.height *= k; }
  remove() { if (isInsideInstance(this)) err(`Não é possível remover filho de instância: ${this.name}`); if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; ALL.delete(this.id); }
  get layoutSizingHorizontal() { return this._layoutSizingHorizontal; }
  set layoutSizingHorizontal(v) { this._checkSizing(v, "H"); this._layoutSizingHorizontal = v; }
  get layoutSizingVertical() { return this._layoutSizingVertical; }
  set layoutSizingVertical(v) { this._checkSizing(v, "V"); this._layoutSizingVertical = v; }
  _checkSizing(v, axis) {
    const p = this.parent;
    const inAL = p && p.layoutMode && p.layoutMode !== "NONE" && this._lp !== "ABSOLUTE";
    if (v === "FILL" && !inAL) err(`FILL can only be set on children of auto-layout frames (${this.name})`);
    if (v === "HUG" && !(this.layoutMode && this.layoutMode !== "NONE") && this.type !== "TEXT") err(`HUG inválido em ${this.name}`);
    if (v === "HUG" && this.type === "TEXT" && !inAL) err(`HUG em texto fora de auto layout (${this.name})`);
  }
  get layoutPositioning() { return this._lp; }
  set layoutPositioning(v) { if (v === "ABSOLUTE" && !(this.parent && this.parent.layoutMode && this.parent.layoutMode !== "NONE")) err(`ABSOLUTE exige pai com auto layout (${this.name})`); this._lp = v; }
  set componentPropertyReferences(refs) {
    const owner = ownerComponent(this);
    if (!owner) err(`componentPropertyReferences fora de componente (${this.name})`);
    const defsOwner = owner.type === "COMPONENT" && owner.parent && owner.parent.type === "COMPONENT_SET" ? owner.parent : owner;
    for (const [field, key] of Object.entries(refs)) {
      const d = defsOwner._defs[key];
      if (!d) err(`Propriedade ${key} não existe em ${defsOwner.name}`);
      if (field === "characters" && (this.type !== "TEXT" || d.type !== "TEXT")) err(`characters ref inválida em ${this.name}`);
      if (field === "mainComponent" && (this.type !== "INSTANCE" || d.type !== "INSTANCE_SWAP")) err(`mainComponent ref inválida em ${this.name}`);
      if (field === "visible" && d.type !== "BOOLEAN") err(`visible ref inválida em ${this.name}`);
    }
    this._refs = refs;
  }
  get componentPropertyReferences() { return this._refs; }
  setBoundVariable(field, v) { if (!v || !VARS.has(v.id)) err(`setBoundVariable: variável inválida para ${field} em ${this.name}`); }
  async setEffectStyleIdAsync(id) { if (!STYLES.has(id)) err("effect style inexistente"); }
  async setTextStyleIdAsync(id) { if (this.type !== "TEXT") err("textStyle em não-texto"); const s = STYLES.get(id); if (!s) err("text style inexistente"); if (!loaded.has(fk(s.fontName))) err(`Fonte do estilo não carregada: ${fk(s.fontName)}`); }
  setExplicitVariableModeForCollection(coll, modeId) { if (!coll.modes.some((m) => m.modeId === modeId)) err("modo inexistente"); }
  async setReactionsAsync(rs) { for (const r of rs) for (const a of r.actions) if (a.destinationId && !ALL.has(a.destinationId)) err(`Destino de reação inexistente ${a.destinationId}`); this.reactions = rs; }
  async loadAsync() {}
}

class Container extends Node {
  constructor(type) { super(type); this.children = []; this.layoutMode = "NONE"; this.itemSpacing = 0; this.paddingTop = this.paddingRight = this.paddingBottom = this.paddingLeft = 0; this.clipsContent = true; this.cornerRadius = 0; }
  appendChild(c) { this.insertChild(this.children.length, c); }
  insertChild(i, c) {
    if (this.type === "INSTANCE" || isInsideInstance(this)) err(`Não é possível adicionar filhos em instância (${this.name})`);
    if (c === this) err("ciclo");
    let p = this; while (p) { if (p === c) err("ciclo de hierarquia"); p = p.parent; }
    if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1);
    this.children.splice(i, 0, c); c.parent = this;
    if (c._layoutSizingHorizontal === "FILL" && !(this.layoutMode && this.layoutMode !== "NONE")) c._layoutSizingHorizontal = "FIXED";
  }
  findAll(fn = () => true) { const out = []; const walk = (n) => { for (const ch of n.children || []) { if (fn(ch)) out.push(ch); walk(ch); } }; walk(this); return out; }
  findOne(fn) { return this.findAll(fn)[0] || null; }
  findChild(fn) { return this.children.find(fn) || null; }
  set layoutWrap(v) { if (v === "WRAP" && this.layoutMode !== "HORIZONTAL") err(`WRAP só em auto layout horizontal (${this.name})`); this._wrap = v; }
  get layoutWrap() { return this._wrap || "NO_WRAP"; }
  set counterAxisAlignItems(v) { if (v === "BASELINE" && this.layoutMode !== "HORIZONTAL") err(`BASELINE só em horizontal (${this.name})`); this._caai = v; }
  get counterAxisAlignItems() { return this._caai || "MIN"; }
}

class Text extends Node {
  constructor() { super("TEXT"); this._font = { family: "Inter", style: "Regular" }; this._chars = ""; }
  _need(op) { if (!loaded.has(fk(this._font))) err(`Cannot ${op}: unloaded font "${fk(this._font)}"`); }
  get fontName() { return this._font; } set fontName(f) { if (!loaded.has(fk(f))) err(`fontName com fonte não carregada ${fk(f)}`); this._font = f; }
  get characters() { return this._chars; } set characters(v) { this._need("write characters"); this._chars = v; this.height = 20; }
  set fontSize(v) { this._need("set fontSize"); this._fs = v; } get fontSize() { return this._fs || 12; }
  set lineHeight(v) { this._need("set lineHeight"); if (typeof v !== "object") err("lineHeight precisa de {unit,value}"); }
  set letterSpacing(v) { this._need("set letterSpacing"); if (typeof v !== "object") err("letterSpacing precisa de {unit,value}"); }
  set textDecoration(v) { this._need("set textDecoration"); }
}

class Component extends Container {
  constructor(type = "COMPONENT") { super(type); this._defs = {}; this.key = `key-${this.id}`; this.description = ""; this._n = 1; }
  addComponentProperty(name, type, def, opts) {
    if (this.type === "COMPONENT" && this.parent && this.parent.type === "COMPONENT_SET") err(`addComponentProperty em variante (${this.name})`);
    if (type === "INSTANCE_SWAP" && !(ALL.get(def) && ALL.get(def).type === "COMPONENT")) err(`INSTANCE_SWAP default inválido em ${this.name}`);
    const key = type === "VARIANT" ? name : `${name}#${this._n++}:0`;
    this._defs[key] = { type, defaultValue: def, opts };
    return key;
  }
  get componentPropertyDefinitions() {
    if (this.type === "COMPONENT" && this.parent && this.parent.type === "COMPONENT_SET") err(`componentPropertyDefinitions lido de variante (${this.name})`);
    const out = { ...this._defs };
    if (this.type === "COMPONENT_SET") for (const c of this.children) for (const part of c.name.split(", ")) { const [k] = part.split("="); out[k] = { type: "VARIANT" }; }
    return out;
  }
  createInstance() {
    if (this.type !== "COMPONENT") err("createInstance só em COMPONENT");
    const inst = cloneTree(this, true);
    inst.mainComponent = this;
    return inst;
  }
}

function cloneTree(src, asInstance) {
  const n = asInstance ? new Container("INSTANCE") : new (src.constructor)(src.type);
  for (const k of ["name", "width", "height", "fills", "strokes", "opacity", "visible", "_font", "_chars", "layoutMode"]) if (k in src) n[k] = src[k];
  if (src.children) for (const ch of src.children) { const c = cloneTree(ch, ch.type === "INSTANCE"); if (ch.type === "INSTANCE") c.mainComponent = ch.mainComponent; c.parent = n; n.children.push(c); }
  if (asInstance) {
    n.setProperties = (props) => {
      const main = n.mainComponent; const owner = main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : main;
      const defs = owner.componentPropertyDefinitions;
      for (const [k, v] of Object.entries(props)) {
        if (!defs[k]) err(`setProperties: chave inexistente "${k}" em ${owner.name}`);
        if (defs[k].type === "INSTANCE_SWAP" && !(ALL.get(v) && ALL.get(v).type === "COMPONENT")) err(`setProperties: INSTANCE_SWAP inválido em ${owner.name}`);
        if (defs[k].type === "BOOLEAN" && typeof v !== "boolean") err(`BOOLEAN inválido ${k}`);
      }
    };
    n.swapComponent = () => {};
  }
  return n;
}

const VARS = new Map(); const COLLS = []; const STYLES = new Map();
function parseSvg(svg) {
  const w = +(svg.match(/width="([\d.]+)"/) || [0, 24])[1]; const h = +(svg.match(/height="([\d.]+)"/) || [0, 24])[1];
  const f = new Container("FRAME"); f.name = "svg"; f.width = w; f.height = h;
  const stroke = /stroke="/.test(svg);
  const els = svg.match(/<(path|rect|circle|ellipse|line)\b/g) || [];
  for (let i = 0; i < els.length; i++) { const v = new Node("VECTOR"); v.strokes = stroke ? [{ type: "SOLID" }] : []; v.fills = stroke ? [] : [{ type: "SOLID" }]; f.appendChild(v); }
  return f;
}

const page0 = new Container("PAGE"); page0.name = "Page 1"; page0.flowStartingPoints = [];
const root = { children: [page0], insertChild(i, p) { const j = this.children.indexOf(p); if (j >= 0) this.children.splice(j, 1); this.children.splice(i, 0, p); } };
page0.remove = function () { root.children.splice(root.children.indexOf(this), 1); };

const figma = {
  root, editorType: "figma",
  notify: (m) => log.notes.push(m),
  closePlugin: (m) => { log.closed = m; },
  listAvailableFontsAsync: async () => FONTS,
  loadFontAsync: async (f) => { if (!FONTS.some((x) => fk(x.fontName) === fk(f))) err(`fonte indisponível ${fk(f)}`); loaded.add(fk(f)); },
  createFrame: () => new Container("FRAME"),
  createComponent: () => new Component("COMPONENT"),
  createRectangle: () => new Node("RECTANGLE"),
  createEllipse: () => new Node("ELLIPSE"),
  createText: () => new Text(),
  createPage: () => { const p = new Container("PAGE"); p.flowStartingPoints = []; p.remove = function () { root.children.splice(root.children.indexOf(this), 1); }; root.children.push(p); return p; },
  createNodeFromSvg: (svg) => { if (!/^<svg/.test(svg.trim())) err("SVG inválido"); return parseSvg(svg); },
  combineAsVariants: (nodes, parent) => {
    if (!nodes.length) err("combineAsVariants sem nós");
    const names = new Set();
    for (const n of nodes) { if (n.type !== "COMPONENT") err("combineAsVariants exige COMPONENT"); if (!/=/.test(n.name)) err(`nome de variante inválido: ${n.name}`); if (names.has(n.name)) err(`variante duplicada ${n.name}`); names.add(n.name); }
    const set = new Component("COMPONENT_SET");
    parent.appendChild(set);
    for (const n of nodes) set.appendChild(n);
    return set;
  },
  setCurrentPageAsync: async (p) => { if (!root.children.includes(p)) err("página inexistente"); },
  setFileThumbnailNodeAsync: async () => {},
  viewport: { scrollAndZoomIntoView: () => {} },
  getLocalTextStylesAsync: async () => [...STYLES.values()].filter((s) => s.type === "TEXT"),
  getLocalEffectStylesAsync: async () => [...STYLES.values()].filter((s) => s.type === "EFFECT"),
  createTextStyle: () => { const s = { id: `S:${nextId++}`, type: "TEXT", name: "", _font: null, set fontName(f) { if (!loaded.has(fk(f))) err(`TextStyle.fontName não carregada ${fk(f)}`); this._font = f; }, get fontName() { return this._font; } }; STYLES.set(s.id, s); return s; },
  createEffectStyle: () => { const s = { id: `S:${nextId++}`, type: "EFFECT", name: "" }; STYLES.set(s.id, s); return s; },
  variables: {
    createVariableCollection: (name) => { const c = { id: `VC:${nextId++}`, name, modes: [{ modeId: `M:${nextId++}`, name: "Mode 1" }], renameMode(id, n) { const m = this.modes.find((x) => x.modeId === id); if (!m) err("renameMode inválido"); m.name = n; }, addMode(n) { const id = `M:${nextId++}`; this.modes.push({ modeId: id, name: n }); return id; } }; COLLS.push(c); return c; },
    createVariable: (name, coll, type) => { const v = { id: `V:${nextId++}`, name, variableCollectionId: coll.id, resolvedType: type, scopes: ["ALL_SCOPES"], key: `vk${nextId}`, _vals: {}, setValueForMode(m, val) { if (!coll.modes.some((x) => x.modeId === m)) err(`modo inválido para ${name}`); if (val && val.type === "VARIABLE_ALIAS" && !VARS.has(val.id)) err("alias inválido"); this._vals[m] = val; }, setVariableCodeSyntax(p, s) { if (p === "WEB" && !/^var\(--/.test(s)) err("WEB sem var()"); } }; VARS.set(v.id, v); return v; },
    getLocalVariableCollectionsAsync: async () => COLLS,
    getLocalVariablesAsync: async (t) => [...VARS.values()].filter((v) => !t || v.resolvedType === t),
    setBoundVariableForPaint: (p, f, v) => { if (!VARS.has(v.id)) err("variável inválida"); if (v.resolvedType !== "COLOR") err(`variável ${v.name} não é COLOR`); return { ...p, boundVariables: { color: { type: "VARIABLE_ALIAS", id: v.id } } }; },
  },
};

const code = fs.readFileSync(process.env.MOCK_CODE || path.join(__dirname, "../dist/code.js"), "utf8");
const ctx = vm.createContext({ figma, console, setTimeout, Math, JSON, Promise, Object, Array, String, Number, Error, Set, Map, parseInt, isNaN });
vm.runInContext(code, ctx);

(async function wait() {
  for (let i = 0; i < 600 && !log.closed; i++) await new Promise((r) => setTimeout(r, 10));
  const errs = vm.runInContext("ERRORS", ctx);
  const pages = root.children.map((p) => `${p.name}(${p.children.length})`);
  const count = (t) => [...ALL.values()].filter((n) => n.type === t).length;
  console.log("closePlugin:", log.closed);
  console.log("páginas:", pages.join(", "));
  console.log("componentes:", count("COMPONENT"), "sets:", count("COMPONENT_SET"), "instâncias:", count("INSTANCE"), "textos:", count("TEXT"));
  console.log("variáveis:", VARS.size, "coleções:", COLLS.map((c) => `${c.name}[${c.modes.map((m) => m.name)}]`).join(" | "));
  console.log("estilos:", STYLES.size);
  console.log("ERROS:", errs.length ? "\n - " + errs.join("\n - ") : "nenhum");
  process.exit(errs.length || !log.closed ? 1 : 0);
})();
