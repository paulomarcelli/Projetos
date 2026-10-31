/* =====================================================================
   Iconografia: grade 24×24, área viva 20×20 (2px de respiro), traço 1,5px,
   pontas e junções arredondadas. Cada ícone vira um Component "Icon/<nome>",
   com o traço ligado à variável color/text/primary (troca no tema e na instância).
   ===================================================================== */

type IconDef = { name: string; cat: string; body: string };
const ICONS: IconDef[] = [
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

const ICON: Record<string, ComponentNode> = {};

function svgFor(body: string, color = "#0B1434", stroke = 1.5) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** Cria os componentes de ícone. Ficam na página Iconography (biblioteca). */
function buildIconComponents(): ComponentNode[] {
  const out: ComponentNode[] = [];
  for (const def of ICONS) {
    const node = figma.createNodeFromSvg(svgFor(def.body));
    const comp = figma.createComponent();
    comp.name = `Icon/${def.name}`;
    comp.resize(24, 24);
    comp.fills = [];
    comp.clipsContent = false;
    for (const child of [...node.children]) comp.appendChild(child);
    node.remove();
    // Traço por variável: herda o tema e pode ser trocado na instância.
    for (const v of comp.findAll((n) => "strokes" in n) as (VectorNode & SceneNode)[]) {
      if (v.strokes.length) bindStroke(v, "color/text/primary", 1.5);
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
function icon(name: string, size = 24, colorVar?: string): InstanceNode {
  const inst = ICON[name].createInstance();
  if (size !== 24) inst.rescale(size / 24);
  if (colorVar) {
    for (const v of inst.findAll((n) => "strokes" in n) as (VectorNode & SceneNode)[]) {
      if (v.strokes.length) bindStroke(v, colorVar, v.strokeWeight as number);
    }
  }
  return inst;
}
