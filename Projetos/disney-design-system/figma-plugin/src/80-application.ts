/* =====================================================================
   Página 9: Application. Home institucional da Disney (desktop 1440 e
   mobile 390 em modo escuro), montada só com instâncias do sistema.
   ===================================================================== */

function inst(set: ComponentNode | ComponentSetNode, variant?: string): InstanceNode {
  if (set.type === "COMPONENT_SET") return (set.findChild((n) => n.name === variant) as ComponentNode).createInstance();
  return set.createInstance();
}

async function heroDesktop(): Promise<FrameNode> {
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
  for (const [x, y, s] of [[W - 640, 140, 28], [W - 110, 300, 18], [W - 700, 560, 14]] as [number, number, number][]) {
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

async function homeDesktop(page: PageNode): Promise<FrameNode> {
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
  for (const l of ["Animação", "Aventura", "Musical", "Super-heróis", "Galáxia distante"]) filters.appendChild(chip(l));
  s1.appendChild(filters);
  const row = stack("Cards", "HORIZONTAL", 0);
  row.primaryAxisAlignItems = "SPACE_BETWEEN";
  s1.appendChild(row);
  row.layoutSizingHorizontal = "FILL";
  const films: [string, string, ArtKey, boolean][] = [
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
  if (COLOR_COLLECTION) s2.setExplicitVariableModeForCollection(COLOR_COLLECTION, COLOR_MODES.dark);
  const sh2 = inst(C.SectionHeader);
  setProps(sh2, C.SectionHeader, { Title: "Mundos que cabem em uma só marca", Lead: "Cada franquia tem seu clima; a Disney é o fio que liga todas elas." });
  s2.appendChild(sh2);
  sh2.layoutSizingHorizontal = "FILL";
  const tiles: [string, string, ArtKey][] = [
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
  const exps: [string, string, string, ArtKey][] = [
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

async function homeMobile(page: PageNode, x: number): Promise<FrameNode> {
  const m = stack("Home · Mobile 390 (modo escuro)", "VERTICAL", 0);
  m.resize(390, 10);
  m.counterAxisSizingMode = "FIXED";
  bindFill(m, "color/bg/canvas");
  m.clipsContent = true;
  if (COLOR_COLLECTION) m.setExplicitVariableModeForCollection(COLOR_COLLECTION, COLOR_MODES.dark);
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
  for (const [t, me, ak] of [["Frozen II", "Disney Animation · 2019", "frozen"], ["Toy Story 4", "Pixar · 2019", "toystory"]] as [string, string, ArtKey][]) {
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

async function pageApplication(page: PageNode) {
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
