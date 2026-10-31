/* =====================================================================
   Páginas 5–8: Foundations, Iconography, Components, Motion.
   ===================================================================== */

async function swatch(parent: FrameNode, key: string, w = 200) {
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
async function themePreview(mode: "Light" | "Dark"): Promise<FrameNode> {
  const f = stack(`Preview · ${mode}`, "VERTICAL", 24, 40);
  f.resize(colWidth(2), 10);
  f.counterAxisSizingMode = "FIXED";
  bindFill(f, "color/bg/canvas");
  bindStroke(f, "color/border/subtle", 1);
  f.cornerRadius = 32;
  if (COLOR_COLLECTION) f.setExplicitVariableModeForCollection(COLOR_COLLECTION, mode === "Light" ? COLOR_MODES.light : COLOR_MODES.dark);
  f.appendChild(await text(`Modo ${mode === "Light" ? "claro" : "escuro"}`, "Overline", "color/text/gold"));
  f.appendChild(await text("Histórias para viver juntos", "Heading/H3", "color/text/primary"));
  f.appendChild(await text("As mesmas variáveis semânticas trocam de valor; os componentes não mudam.", "Body/M", "color/text/secondary", colWidth(2) - 80));
  const row = stack("Row", "HORIZONTAL", 24);
  const mc = ((C.MediaCard as ComponentSetNode).findChild((n) => n.name === "State=Default") as ComponentNode).createInstance();
  setProps(mc, C.MediaCard, { Title: "Moana", Meta: "Walt Disney Animation Studios · 2016", Art: ART.moana.id });
  row.appendChild(mc);
  const right = stack("Actions", "VERTICAL", 16);
  right.appendChild(buttonInst("Primary", "Assistir agora", "Default", true, "play"));
  right.appendChild(buttonInst("Secondary", "Minha lista", "Default", true, "heart"));
  right.appendChild(chip("Aventura", true));
  right.appendChild(chip("Musical"));
  const inp = ((C.Input as ComponentSetNode).findChild((n) => n.name === "State=Focus") as ComponentNode).createInstance();
  right.appendChild(inp);
  row.appendChild(right);
  f.appendChild(row);
  return f;
}

async function pageFoundations(page: PageNode) {
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
    for (const k of g.keys) await swatch(sw, k, 216);
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
  for (const [t, w] of [["Token", 360], ["Light", 240], ["Dark", 240], ["Uso", 440]] as [string, number][]) headRow.appendChild(await text(t, "Overline", "color/text/muted", w));
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
  for (const style of ["Primary", "Magic", "Secondary"] as BtnStyle[]) {
    const row = stack(style, "HORIZONTAL", 24);
    row.counterAxisAlignItems = "CENTER";
    for (const state of ["Default", "Hover", "Pressed", "Focus", "Disabled"] as BtnState[]) {
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
  ] as [string, "display" | "ui", string, string][]) {
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
    const def = TYPE.find((x) => x.name === t.name)!;
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
    if (val === 0) continue;
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
  const rules: [string, string][] = [
    ["Padding", "Botões 24/16 · campos 16 · chips 16/8 · cartões 24 (padrão), 32 (destaque), 16 (compacto)"],
    ["Margens", "Desktop 80 · tablet 40 · mobile 24, sempre a partir da borda da tela"],
    ["Entre componentes", "8 entre itens relacionados · 16 dentro de um grupo · 24 a 32 entre grupos"],
    ["Entre seções", "128 no desktop · 96 no tablet · 64 no mobile"],
    ["Interno dos cartões", "Entre imagem e texto 16 · entre título e descrição 8 · antes da ação 16 a 24"],
  ];
  for (const [t, d] of rules) await card(g, colWidth(5), t, d, { titleStyle: "Subtitle/L" });

  // ------------------------------------------------ Grid
  b = await section(content, "5.4", "Grid", "Colunas, margens e gutters por breakpoint. Largura máxima de conteúdo: 1280 px, centralizada no desktop.");
  const specs: [string, number, number, number, number, number, string][] = [
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
    bindStroke(sq as unknown as FrameNode, "color/border/strong", 1);
    bindRadius(sq, name);
    col.appendChild(sq);
    col.appendChild(await text(name, "Label", "color/text/primary"));
    col.appendChild(await text(`${val === 999 ? "pílula" : val + " px"} · ${use}`, "Caption", "color/text/muted", 200));
    radii.appendChild(col);
  }
  g = grid(b);
  const shapeCard = async (title: string, desc: string, build: (holder: FrameNode) => Promise<void> | void) => {
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
    for (const [s, x, y, o] of [[72, stageW / 2 - 36, 90, 1], [32, stageW / 2 + 60, 60, 0.8], [20, stageW / 2 - 90, 170, 0.6]] as [number, number, number, number][]) {
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
async function pageIconography(page: PageNode, iconComps: ComponentNode[]) {
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
  for (const cv of ["color/text/primary", "color/text/brand", "color/text/gold", "color/text/muted"]) colors.appendChild(icon("star", 32, cv));
  specs.appendChild(colors);
  row.appendChild(specs);

  b = await section(content, "6.2", "Regras de uso");
  let g = grid(b);
  const dos: [string, string, boolean][] = [
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
      if (comp) cell.appendChild(comp);
      cell.appendChild(await text(def.name, "Caption", "color/text/muted"));
      g.appendChild(cell);
    }
  }
}

// ---------------------------------------------------------------- Components
async function pageComponents(page: PageNode, build: FrameNode, artComps: ComponentNode[]) {
  const { content } = await board(page, "06", "Components", "Components", "Peças reutilizáveis com variantes, propriedades e protótipo. Tudo ligado às variáveis: troque o modo e o sistema inteiro acompanha.");
  const blocks: [string, string, (ComponentNode | ComponentSetNode)[]][] = [
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
      if (!n) continue;
      const wrap = stack(`${n.name} wrap`, "VERTICAL", 12);
      wrap.appendChild(await text(n.name, "Label", "color/text/muted"));
      wrap.appendChild(n);
      b.appendChild(wrap);
    }
  }
  const doc = await section(content, "7.10", "Documentação", `${(C.ChapterHeader as ComponentNode).description} O componente principal (1600 px) fica ao lado deste quadro, à direita.`);
  doc.appendChild(await text("Doc/Chapter Header: à direita do quadro", "Label", "color/text/muted"));
  placeOnPage(page, C.ChapterHeader as ComponentNode, BOARD_W + 160, 0);
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
function curveSvg(x1: number, y1: number, x2: number, y2: number, color: string) {
  const S = 200;
  const P = (x: number, y: number) => `${x * S} ${S - y * S}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" fill="none"><rect x=".5" y=".5" width="${S - 1}" height="${S - 1}" rx="12" stroke="#CFC8B6" stroke-opacity=".6"/><path d="M0 ${S}L${S} 0" stroke="#CFC8B6" stroke-dasharray="4 4"/><path d="M${P(0, 0)}C${P(x1, y1)} ${P(x2, y2)} ${P(1, 1)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/><circle cx="${x1 * S}" cy="${S - y1 * S}" r="5" fill="${color}"/><circle cx="${x2 * S}" cy="${S - y2 * S}" r="5" fill="${color}"/></svg>`;
}

async function pageMotion(page: PageNode) {
  const { root, content } = await board(page, "07", "Motion", "Motion", "Movimento com intenção: a herança dos princípios de animação da Disney, traduzida para interfaces rápidas e acolhedoras.");
  let b = await section(content, "8.1", "Princípios", "Os animadores Frank Thomas e Ollie Johnston registraram os 12 princípios da animação Disney em “The Illusion of Life” (1981). Seis deles guiam o movimento da interface.");
  let g = grid(b);
  const principles: [string, string][] = [
    ["Antecipação e resposta", "Todo toque responde em até 100 ms; o botão afunda antes de agir."],
    ["Slow in, slow out", "Nada começa ou para de repente: entradas desaceleram (ease-out), deslocamentos aceleram e desaceleram."],
    ["Arcos", "Elementos decorativos seguem trajetórias curvas, como uma varinha, nunca linhas duras."],
    ["Encenação", "Um foco por vez: o movimento aponta para a ação mais importante da tela."],
    ["Ação secundária", "O brilho dourado complementa a ação principal, sem competir com ela."],
    ["Apelo, com moderação", "Encanto em momentos raros (celebração, primeira visita); rapidez no uso diário."],
  ];
  for (const [t, d] of principles) await card(g, colWidth(3), t, d, { titleStyle: "Subtitle/L" });

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
  const curves: [string, string, number, number, number, number, string, string][] = [
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
  const rowsB: [string, string, string, string][] = [
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
    if (i === 0) bindFill(row, "color/bg/elevated");
    const widths = [280, 160, 160, 700];
    for (const [j, cell] of r.entries()) row.appendChild(await text(cell, i === 0 ? "Overline" : j === 0 ? "Label" : "Body/S", i === 0 ? "color/text/muted" : j === 0 ? "color/text/primary" : "color/text/secondary", widths[j]));
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
  for (const l of ["Aventura", "Musical", "Família"]) r1.appendChild(chip(l));
  pg.appendChild(r1);
  const r2 = stack("Cards", "HORIZONTAL", 32);
  const mc = ((C.MediaCard as ComponentSetNode).findChild((n) => n.name === "State=Default") as ComponentNode).createInstance();
  setProps(mc, C.MediaCard, { Title: "Toy Story 4", Meta: "Pixar Animation Studios · 2019", Art: ART.toystory.id });
  r2.appendChild(mc);
  const ft = ((C.FranchiseTile as ComponentSetNode).findChild((n) => n.name === "State=Default") as ComponentNode).createInstance();
  setProps(ft, C.FranchiseTile, { Name: "Frozen", Caption: "Walt Disney Animation Studios · 2013", Art: ART.frozen.id });
  r2.appendChild(ft);
  const side = stack("Live", "VERTICAL", 32);
  side.appendChild(((C.Toast as ComponentSetNode).findChild((n) => n.name === "State=Hidden") as ComponentNode).createInstance());
  side.appendChild(((C.SparkleLoader as ComponentSetNode).findChild((n) => n.name === "Frame=1") as ComponentNode).createInstance());
  side.appendChild(await text("Preparando a magia…", "Body/S", "color/text/muted"));
  r2.appendChild(side);
  pg.appendChild(r2);
  placeOnPage(page, pg, BOARD_W + 160, 0);

  // Transição de página A → B (Smart Animate com Curtain, 500 ms)
  const mk = async (name: string, detail: boolean) => {
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
