/* =====================================================================
   Peças de documentação: o mesmo cabeçalho de capítulo (componente com
   propriedades) e a mesma grade de seções em todas as páginas.
   Quadro: 1600 de largura, conteúdo de 1440 (margem 80).
   ===================================================================== */

const BOARD_W = 1600;
const CONTENT_W = 1440;

async function buildChapterHeader(parent: FrameNode): Promise<ComponentNode> {
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
async function board(page: PageNode, num: string, tag: string, title: string, lead: string): Promise<{ root: FrameNode; content: FrameNode }> {
  const root = stack(`${num} · ${title}`, "VERTICAL", 0);
  root.resize(BOARD_W, 100);
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "FIXED";
  bindFill(root, "color/bg/canvas");
  root.clipsContent = true;
  const h = (C.ChapterHeader as ComponentNode).createInstance();
  const defs = (C.ChapterHeader as ComponentNode).componentPropertyDefinitions;
  const key = (p: string) => Object.keys(defs).find((k) => k.startsWith(p))!;
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
async function section(parent: FrameNode, index: string, title: string, note?: string): Promise<FrameNode> {
  const sec = stack(`${index} ${title}`, "VERTICAL", 40);
  bindGap(sec, "space/40");
  parent.appendChild(sec);
  sec.layoutSizingHorizontal = "FILL";
  const head = stack("Section head", "HORIZONTAL", 24);
  head.counterAxisAlignItems = "BASELINE";
  head.appendChild(await text(index, "Subtitle/L", "color/text/gold"));
  head.appendChild(await text(title, "Heading/H2", "color/text/primary"));
  sec.appendChild(head);
  if (note) sec.appendChild(await text(note, "Body/L", "color/text/secondary", 860));
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
function grid(parent: FrameNode, gap = 24): FrameNode {
  const g = stack("Grid", "HORIZONTAL", gap);
  g.layoutWrap = "WRAP";
  g.counterAxisSpacing = gap;
  parent.appendChild(g);
  g.layoutSizingHorizontal = "FILL";
  return g;
}

function colWidth(cols: number, gap = 24) {
  return Math.floor((CONTENT_W - gap * (cols - 1)) / cols);
}

/** Cartão de documentação (superfície, borda sutil, raio 24, padding 32). */
async function card(parent: FrameNode, w: number, title?: string, body?: string, opts: { titleStyle?: string; accent?: string } = {}): Promise<FrameNode> {
  const c = stack(title || "Card", "VERTICAL", 12, 32);
  bindPadding(c, "space/32", "space/32");
  bindFill(c, "color/bg/surface");
  bindStroke(c, "color/border/subtle", 1);
  bindRadius(c, "radius/24");
  c.resize(w, 100);
  c.counterAxisSizingMode = "FIXED";
  c.primaryAxisSizingMode = "AUTO";
  parent.appendChild(c);
  if (opts.accent) c.appendChild(await text(opts.accent, "Overline", "color/text/gold"));
  if (title) c.appendChild(await text(title, opts.titleStyle || "Heading/H4", "color/text/primary", w - 64));
  if (body) c.appendChild(await text(body, "Body/M", "color/text/secondary", w - 64));
  return c;
}

/** Lista com marcador de faísca. */
async function bullets(parent: FrameNode, items: string[], w: number, color = "color/text/secondary") {
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
function chip(label: string, selected = false): InstanceNode {
  const set = C.Chip as ComponentSetNode;
  const inst = (set.findChild((n) => n.name === (selected ? "State=Selected" : "State=Default")) as ComponentNode).createInstance();
  const k = Object.keys(set.componentPropertyDefinitions).find((x) => x.startsWith("Label"))!;
  inst.setProperties({ [k]: label });
  return inst;
}

function buttonInst(style: BtnStyle, label: string, state: BtnState = "Default", showIcon = true, iconName = "arrow-right"): InstanceNode {
  const set = C.Button as ComponentSetNode;
  const inst = (set.findChild((n) => n.name === `Style=${style}, State=${state}`) as ComponentNode).createInstance();
  const defs = set.componentPropertyDefinitions;
  const k = (p: string) => Object.keys(defs).find((x) => x.startsWith(p))!;
  inst.setProperties({ [k("Label")]: label, [k("Show icon")]: showIcon, [k("Icon")]: ICON[iconName].id });
  return inst;
}

function setProps(inst: InstanceNode, owner: ComponentNode | ComponentSetNode, values: Record<string, string | boolean>) {
  const defs = owner.componentPropertyDefinitions;
  const out: Record<string, string | boolean> = {};
  for (const [p, v] of Object.entries(values)) {
    const k = Object.keys(defs).find((x) => x === p || x.startsWith(p + "#"));
    if (k) out[k] = v;
  }
  inst.setProperties(out);
}
