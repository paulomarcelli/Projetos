/* =====================================================================
   Componentes reutilizáveis. Tudo ligado às variáveis (cor, espaço, raio),
   com propriedades (TEXT, BOOLEAN, INSTANCE_SWAP), variantes e protótipo
   (hover/pressionar com Smart Animate nas curvas do sistema de movimento).
   ===================================================================== */

const EASE_OUT: Easing = { type: "CUSTOM_CUBIC_BEZIER", easingFunctionCubicBezier: { x1: 0.23, y1: 1, x2: 0.32, y2: 1 } };
const EASE_IN_OUT: Easing = { type: "CUSTOM_CUBIC_BEZIER", easingFunctionCubicBezier: { x1: 0.77, y1: 0, x2: 0.175, y2: 1 } };
const SPRING: Easing = { type: "GENTLE" };

const C: Record<string, ComponentNode | ComponentSetNode> = {};
const ART: Record<string, ComponentNode> = {};

function changeTo(trigger: Trigger, dest: SceneNode, ms: number, easing: Easing = EASE_OUT): Reaction {
  return { trigger, actions: [{ type: "NODE", destinationId: dest.id, navigation: "CHANGE_TO", transition: { type: "SMART_ANIMATE", easing, duration: ms / 1000 }, preserveScrollPosition: false }] };
}

/** Distribui as variantes em grade (linhas × colunas) depois do combineAsVariants. */
function gridVariants(set: ComponentSetNode, cols: number, gapX = 32, gapY = 32, pad = 32) {
  const kids = set.children as ComponentNode[];
  const colW: number[] = [];
  const rowH: number[] = [];
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

function refText(comp: ComponentNode, layerName: string, key: string) {
  const t = comp.findOne((n) => n.type === "TEXT" && n.name === layerName) as TextNode | null;
  if (t) t.componentPropertyReferences = { characters: key };
}
function refNode(comp: ComponentNode, layerName: string, refs: { [k: string]: string }) {
  const n = comp.findOne((x) => x.name === layerName) as SceneNode | null;
  if (n) n.componentPropertyReferences = refs;
}

// ---------------------------------------------------------------- arte como componentes (para INSTANCE_SWAP)
function buildArtComponents(holder: FrameNode): ComponentNode[] {
  const keys: ArtKey[] = ["castle", "mickey", "frozen", "lionking", "toystory", "moana", "marvel", "starwars", "pixar", "parks", "cruise", "paris", "tokyo"];
  const out: ComponentNode[] = [];
  for (const k of keys) {
    const a = art(k, 300, 400);
    const comp = figma.createComponent();
    comp.name = `Art/${k}`;
    comp.resize(300, 400);
    comp.clipsContent = true;
    comp.fills = [];
    for (const ch of [...a.children]) comp.appendChild(ch);
    a.remove();
    // Escala junto com a instância: todos os descendentes acompanham o redimensionamento.
    for (const n of comp.findAll(() => true)) if ("constraints" in n) (n as ConstraintMixin).constraints = { horizontal: "SCALE", vertical: "SCALE" };
    for (const n of comp.findAll((x) => x.type === "FRAME")) (n as FrameNode).locked = false;
    comp.description = "Arte conceitual abstrata (cor, luz e forma da história). Não reproduz personagens nem logotipos. Troque pela propriedade Art dos cartões.";
    holder.appendChild(comp);
    mark(comp);
    ART[k] = comp;
    out.push(comp);
  }
  return out;
}

/** Instância de arte cobrindo w×h, recortada por um frame. */
function artSlot(name: string, w: number, h: number, key: ArtKey = "castle"): { slot: FrameNode; inst: InstanceNode } {
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

// ---------------------------------------------------------------- Button
type BtnStyle = "Primary" | "Secondary" | "Ghost" | "Magic";
type BtnState = "Default" | "Hover" | "Pressed" | "Focus" | "Disabled";

async function makeButton(style: BtnStyle, state: BtnState): Promise<ComponentNode> {
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

  const bg: Record<BtnStyle, Partial<Record<BtnState, string>>> = {
    Primary: { Default: "color/action/primary", Hover: "color/action/primary-hover", Pressed: "color/action/primary-pressed", Focus: "color/action/primary", Disabled: "color/action/disabled" },
    Secondary: { Hover: "color/action/subtle-hover", Pressed: "color/bg/elevated" },
    Ghost: { Hover: "color/action/subtle-hover", Pressed: "color/bg/elevated" },
    Magic: { Default: "color/action/magic", Hover: "color/action/magic-hover", Pressed: "color/action/magic-pressed", Focus: "color/action/magic", Disabled: "color/action/disabled" },
  };
  const fg: Record<BtnStyle, string> = { Primary: "color/text/on-action", Secondary: "color/text/primary", Ghost: "color/text/brand", Magic: "color/text/on-magic" };
  const bgVar = bg[style][state];
  if (bgVar) bindFill(b, bgVar);
  if (style === "Secondary") bindStroke(b, state === "Hover" ? "color/text/brand" : "color/border/strong", 1.5);
  if (state === "Focus") {
    bindStroke(b, "color/focus/ring", 3);
    b.strokeAlign = "OUTSIDE";
  }
  if (state === "Hover" && style === "Primary") await b.setEffectStyleIdAsync(ESTYLE["Glow/Royal"].id);
  if (state === "Hover" && style === "Magic") await b.setEffectStyleIdAsync(ESTYLE["Glow/Gold"].id);

  const color = state === "Disabled" ? "color/text/disabled" : fg[style];
  const label = await text("Planejar visita", "Button/L", color);
  label.name = "Label";
  b.appendChild(label);
  const ic = icon("arrow-right", 20, color);
  ic.name = "Icon";
  b.appendChild(ic);
  return b;
}

async function buildButton(parent: FrameNode): Promise<ComponentSetNode> {
  const styles: BtnStyle[] = ["Primary", "Secondary", "Ghost", "Magic"];
  const states: BtnState[] = ["Default", "Hover", "Pressed", "Focus", "Disabled"];
  const comps: ComponentNode[] = [];
  for (const s of styles) for (const st of states) {
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
    preferredValues: ["arrow-right", "ticket", "calendar", "play", "sparkle", "map-pin"].map((n) => ({ type: "COMPONENT" as const, key: ICON[n].key })),
  });
  for (const c of set.children as ComponentNode[]) {
    refText(c, "Label", kLabel);
    refNode(c, "Icon", { visible: kShow, mainComponent: kIcon });
  }
  // Protótipo: Default → Hover (200ms) e → Pressed (100ms); Hover → Pressed.
  for (const s of styles) {
    const find = (st: BtnState) => set.findChild((n) => n.name === `Style=${s}, State=${st}`) as ComponentNode;
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
async function buildIconButton(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
  for (const style of ["Solid", "Outline", "Glass"]) for (const state of ["Default", "Hover"]) {
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
    } else if (style === "Outline") {
      c.fills = state === "Hover" ? [] : [];
      if (state === "Hover") bindFill(c, "color/action/subtle-hover");
      bindStroke(c, "color/border/strong", 1.5);
    } else {
      // Glass: para uso sobre o fundo de marca (hero, cabeçalho)
      c.fills = [solid("#FFFFFF", state === "Hover" ? 0.2 : 0.1)];
      c.strokes = [solid("#FFFFFF", 0.24)];
      c.strokeWeight = 1;
    }
    const ic = style === "Glass" ? icon("search", 20) : icon("search", 20, color);
    if (style === "Glass") for (const v of ic.findAll((n) => "strokes" in n) as (VectorNode & SceneNode)[]) if (v.strokes.length) v.strokes = [solid("#FBFAF6")];
    ic.name = "Icon";
    c.appendChild(ic);
    parent.appendChild(c);
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, parent);
  set.name = "Icon Button";
  gridVariants(set, 2, 24, 24, 24);
  const kIcon = set.addComponentProperty("Icon", "INSTANCE_SWAP", ICON["search"].id);
  for (const c of set.children as ComponentNode[]) refNode(c, "Icon", { mainComponent: kIcon });
  for (const style of ["Solid", "Outline", "Glass"]) {
    const d = set.findChild((n) => n.name === `Style=${style}, State=Default`) as ComponentNode;
    const h = set.findChild((n) => n.name === `Style=${style}, State=Hover`) as ComponentNode;
    await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, h, 200)]);
  }
  set.description = "Botão só com ícone, 48×48 (alvo de toque ≥ 44). Sempre com nome acessível (ex.: “Buscar”). Glass é para uso sobre o fundo de marca.";
  mark(set);
  C.IconButton = set;
  return set;
}

// ---------------------------------------------------------------- Chip
async function buildChip(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
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
    } else {
      if (state === "Hover") bindFill(c, "color/action/subtle-hover");
      else c.fills = [];
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
  for (const c of set.children as ComponentNode[]) {
    refText(c, "Label", k);
    refNode(c, "Icon", { visible: kShow });
  }
  const d = set.findChild((n) => n.name === "State=Default") as ComponentNode;
  await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover") as ComponentNode, 200), changeTo({ type: "ON_CLICK" }, set.findChild((n) => n.name === "State=Selected") as ComponentNode, 300, EASE_IN_OUT)]);
  set.description = "Filtros de categoria (Aventura, Musical, Família…). Selecionado inverte a superfície; o brilho dourado aparece só no estado selecionado.";
  mark(set);
  C.Chip = set;
  return set;
}

// ---------------------------------------------------------------- Badge
async function buildBadge(parent: FrameNode): Promise<ComponentSetNode> {
  const tones: [string, string, string, string][] = [
    ["Gold", "#FBF3DC", "#8A6418", "Novo"],
    ["Royal", "#E6EDFF", "#1A3FB0", "Em cartaz"],
    ["Neutral", "#F4F1E8", "#4D4A40", "Em breve"],
    ["Rose", "#FCE4EB", "#9E2449", "Ao vivo"],
  ];
  const comps: ComponentNode[] = [];
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
  for (const c of set.children as ComponentNode[]) refText(c, "Label", k);
  set.description = "Rótulo curto de status do conteúdo (máx. 2 palavras). Cores com contraste ≥ 4,5:1 nos dois temas (tons fixos, legíveis sobre arte).";
  mark(set);
  C.Badge = set;
  return set;
}

// ---------------------------------------------------------------- Input
async function buildInput(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
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
    if (state === "Focus") field.effects = [{ type: "DROP_SHADOW", color: rgba("#D4A23F", 0.35), offset: { x: 0, y: 0 }, radius: 0, spread: 4, visible: true, blendMode: "NORMAL" }];
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
  for (const c of set.children as ComponentNode[]) {
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
async function buildNavLink(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
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
  for (const c of set.children as ComponentNode[]) refText(c, "Label", k);
  const d = set.findChild((n) => n.name === "State=Default") as ComponentNode;
  await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover") as ComponentNode, 200)]);
  set.description = "Item da navegação global, sobre o fundo de marca. Ativo: texto dourado + indicador de 16×2.";
  mark(set);
  C.NavLink = set;
  return set;
}

// ---------------------------------------------------------------- Wordmark conceitual
async function wordmark(scale = 1, hex = "#FBFAF6"): Promise<FrameNode> {
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
async function buildHeader(parent: FrameNode): Promise<ComponentSetNode> {
  const btnSet = C.Button as ComponentSetNode;
  const navSet = C.NavLink as ComponentSetNode;
  const ibSet = C.IconButton as ComponentSetNode;
  const variant = (set: ComponentSetNode, name: string) => set.findChild((n) => n.name === name) as ComponentNode;

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
    inst.setProperties({ [Object.keys(navSet.componentPropertyDefinitions).find((k) => k.startsWith("Label"))!]: label });
    nav.appendChild(inst);
  }
  desk.appendChild(nav);
  const right = stack("Actions", "HORIZONTAL", 16);
  right.counterAxisAlignItems = "CENTER";
  bindGap(right, "space/16");
  for (const ic of ["search", "user"]) {
    const ib = variant(ibSet, "Style=Glass, State=Default").createInstance();
    const key = Object.keys(ibSet.componentPropertyDefinitions).find((k) => k.startsWith("Icon"))!;
    ib.setProperties({ [key]: ICON[ic].id });
    right.appendChild(ib);
  }
  const cta = variant(btnSet, "Style=Magic, State=Default").createInstance();
  const defs = btnSet.componentPropertyDefinitions;
  cta.setProperties({ [Object.keys(defs).find((k) => k.startsWith("Label"))!]: "Planejar visita", [Object.keys(defs).find((k) => k.startsWith("Show icon"))!]: false });
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
    const key = Object.keys(ibSet.componentPropertyDefinitions).find((k) => k.startsWith("Icon"))!;
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
async function buildMediaCard(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
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
    if (state === "Hover") await slot.setEffectStyleIdAsync(ESTYLE["Elevation/2"].id);
    const badge = (C.Badge as ComponentSetNode).findChild((n) => n.name === "Tone=Royal") as ComponentNode;
    const bi = badge.createInstance();
    bi.name = "Badge";
    slot.appendChild(bi);
    bi.x = 16;
    bi.y = 16;
    const play = rect("Play scrim", 264, 352, [linear(90, [["#060B1E", 0, 0], ["#060B1E", 1, state === "Hover" ? 0.55 : 0]])]);
    slot.appendChild(play);
    play.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
    const pi = icon("play", 48);
    for (const v of pi.findAll((n) => "strokes" in n) as (VectorNode & SceneNode)[]) if (v.strokes.length) v.strokes = [solid("#FBFAF6")];
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
  for (const c of set.children as ComponentNode[]) {
    refText(c, "Title", kT);
    refText(c, "Meta", kM);
    refNode(c, "Badge", { visible: kB });
    refNode(c, "Art", { mainComponent: kA });
  }
  const d = set.findChild((n) => n.name === "State=Default") as ComponentNode;
  await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover") as ComponentNode, 300)]);
  set.description = "Cartão de filme/animação, pôster 3:4 com raio 24. Hover: sobe 8px, sombra Elevation/2 e o botão de play aparece (300ms ease-out). Arte trocável pela propriedade Art.";
  mark(set);
  C.MediaCard = set;
  return set;
}

// ---------------------------------------------------------------- Experience Card (parques e experiências)
async function buildExperienceCard(parent: FrameNode): Promise<ComponentNode> {
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
  const btn = ((C.Button as ComponentSetNode).findChild((n) => n.name === "Style=Ghost, State=Default") as ComponentNode).createInstance();
  const defs = (C.Button as ComponentSetNode).componentPropertyDefinitions;
  btn.setProperties({ [Object.keys(defs).find((k) => k.startsWith("Label"))!]: "Explorar destino" });
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
async function buildFranchiseTile(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
  for (const state of ["Default", "Hover"]) {
    const c = figma.createComponent();
    c.name = `State=${state}`;
    c.resize(296, 400);
    c.clipsContent = true;
    bindRadius(c, "radius/32");
    c.fills = [];
    if (state === "Hover") await c.setEffectStyleIdAsync(ESTYLE["Glow/Gold"].id);
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
  for (const c of set.children as ComponentNode[]) {
    refText(c, "Name", kN);
    refText(c, "Caption", kC);
    refNode(c, "Art", { mainComponent: kA });
  }
  const d = set.findChild((n) => n.name === "State=Default") as ComponentNode;
  await d.setReactionsAsync([changeTo({ type: "ON_HOVER" }, set.findChild((n) => n.name === "State=Hover") as ComponentNode, 300)]);
  set.description = "Destaque de franquia. A Disney é protagonista: a franquia entra só como clima de cor (arte abstrata) + nome. Hover: brilho dourado e faísca.";
  mark(set);
  C.FranchiseTile = set;
  return set;
}

// ---------------------------------------------------------------- Section Header
async function buildSectionHeader(parent: FrameNode): Promise<ComponentNode> {
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
  const btn = ((C.Button as ComponentSetNode).findChild((n) => n.name === "Style=Ghost, State=Default") as ComponentNode).createInstance();
  const defs = (C.Button as ComponentSetNode).componentPropertyDefinitions;
  btn.setProperties({ [Object.keys(defs).find((k) => k.startsWith("Label"))!]: "Ver tudo" });
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
async function buildFooter(parent: FrameNode): Promise<ComponentNode> {
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
  const cols: [string, string[]][] = [
    ["Assistir", ["Filmes", "Séries", "Disney+", "Música"]],
    ["Viver", ["Parques", "Cruzeiros", "Resorts", "Eventos"]],
    ["Levar para casa", ["Produtos", "Livros", "Games", "Colecionáveis"]],
    ["A empresa", ["Nossa história", "Imprensa", "Carreiras", "Investidores"]],
  ];
  for (const [h, items] of cols) {
    const col = stack(h, "VERTICAL", 12);
    col.appendChild(await textRaw(h, "Overline", "#E6BE63"));
    for (const it of items) col.appendChild(await textRaw(it, "Body/S", "#FBFAF6", undefined, 0.8));
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
async function buildToast(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
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
  const hidden = set.findChild((n) => n.name === "State=Hidden") as ComponentNode;
  const visible = set.findChild((n) => n.name === "State=Visible") as ComponentNode;
  await hidden.setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.8 }, visible, 500)]);
  await visible.setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 2.4 }, hidden, 200)]);
  set.description = "Feedback de sucesso. Entrada 500ms ease-out subindo 48px; saída 200ms (mais rápida que a entrada). No protótipo, repete em loop para demonstração.";
  mark(set);
  C.Toast = set;
  return set;
}

async function buildSparkleLoader(parent: FrameNode): Promise<ComponentSetNode> {
  const comps: ComponentNode[] = [];
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
  const fr = (i: number) => set.findChild((n) => n.name === `Frame=${i}`) as ComponentNode;
  await fr(1).setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.25 }, fr(2), 300, EASE_IN_OUT)]);
  await fr(2).setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.25 }, fr(3), 300, EASE_IN_OUT)]);
  await fr(3).setReactionsAsync([changeTo({ type: "AFTER_TIMEOUT", timeout: 0.25 }, fr(1), 300, EASE_IN_OUT)]);
  set.description = "Carregamento decorativo: a faísca percorre três posições em loop (300ms ease-in-out). Com “reduzir movimento”, mostrar só o texto “Preparando a magia…”.";
  mark(set);
  C.SparkleLoader = set;
  return set;
}
