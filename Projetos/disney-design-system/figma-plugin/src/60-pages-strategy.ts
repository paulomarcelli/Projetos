/* =====================================================================
   Páginas 1–4: Cover, Brand Strategy, Persona, Voice & Tone.
   ===================================================================== */

async function pageCover(page: PageNode) {
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
  for (const [x, y, s] of [[W - 160 - 600, 230, 34], [W - 140, 420, 22], [W - 760, 820, 18]] as [number, number, number][]) {
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
  } catch (e) {
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

async function pageStrategy(page: PageNode) {
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
  for (const p of ["Filmes", "Séries", "Streaming", "Parques temáticos", "Cruzeiros", "Resorts", "Produtos de consumo", "Música", "Teatro", "Games", "Publicações", "Esportes ao vivo"]) chips.appendChild(chip(p));

  // 1.4 Diferenciais
  b = await section(content, "1.4", "Diferenciais da marca");
  g = grid(b);
  for (const [t, d] of DIFFERENTIATORS) await card(g, colWidth(3), t, d);

  // 1.5 Identidade e personalidade
  b = await section(content, "1.5", "Identidade e personalidade empresarial", "A Disney se comporta como o arquétipo do Mago: torna possível o que parecia sonho, sempre com calor humano.");
  g = grid(b);
  for (const [i, [t, d]] of PERSONALITY.entries()) {
    const c = await card(g, colWidth(5), t, d);
    if (i === 0) {
      bindFill(c, "color/bg/inverse");
      for (const n of c.findAll((x) => x.type === "TEXT") as TextNode[]) bindFill(n, "color/text/inverse");
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
  for (const [t, d] of POSITIONING.audiences) await card(aud, colWidth(4), t, d, { accent: "PÚBLICO-ALVO", titleStyle: "Subtitle/L" });
  const comp = grid(b);
  for (const [t, d] of POSITIONING.competitive) await card(comp, colWidth(3), t, d, { accent: "DIFERENCIAL COMPETITIVO", titleStyle: "Subtitle/L" });

  const perc = await card(b, CONTENT_W, "Percepção desejada", undefined, { accent: "COMO QUEREMOS SER LEMBRADOS" });
  const pr = grid(perc, 12);
  for (const p of POSITIONING.perception) pr.appendChild(chip(p, true));
  await card(b, CONTENT_W, "Posicionamento no mercado global", POSITIONING.market, { accent: "MERCADO" });

  // Fontes
  b = await section(content, "Fontes", "Referências", "Fatos históricos e números verificados nas fontes oficiais abaixo.");
  await bullets(b, SOURCES, CONTENT_W);
}

async function pagePersona(page: PageNode) {
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
  for (const i of P.interests) ig.appendChild(chip(i));
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
  for (const c of P.channels) cg.appendChild(chip(c));

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

async function pageVoice(page: PageNode) {
  const { content } = await board(page, "03", "Voice & Tone", "Voice & Tone", "Como a Disney fala: a mesma voz em todo lugar, com o tom certo para cada momento.");
  const V = VOICE;
  let b = await section(content, "4.1", "A voz da marca", V.intro);
  let g = grid(b);
  for (const [t, d] of V.traits) await card(g, colWidth(4), t, d, { titleStyle: "Heading/H4" });

  b = await section(content, "4.2", "Princípios de comunicação");
  g = grid(b);
  for (const [i, [t, d]] of V.principles.entries()) await card(g, colWidth(5), t, d, { accent: `PRINCÍPIO ${i + 1}`, titleStyle: "Subtitle/L" });

  b = await section(content, "4.3", "Vocabulário");
  g = grid(b);
  const use = await card(g, colWidth(2), "Palavras que usamos", undefined, { accent: "USE" });
  const ug = grid(use, 12);
  for (const w of V.vocabularyUse) ug.appendChild(chip(w, true));
  const avoid = await card(g, colWidth(2), "Palavras que evitamos", undefined, { accent: "EVITE" });
  const ag = grid(avoid, 12);
  for (const w of V.vocabularyAvoid) ag.appendChild(chip(w));

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
    for (const t of no.findAll((x) => x.type === "TEXT") as TextNode[]) if (t.characters === bad) t.textDecoration = "STRIKETHROUGH";
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
    } else {
      const okc = await card(row, 520, undefined, good, { accent: "USE" });
      bindStroke(okc, "color/feedback/success", 1.5);
      const noc = await card(row, 520, undefined, bad, { accent: "EVITE" });
      bindStroke(noc, "color/feedback/error", 1.5);
    }
  }
}
