/* =====================================================================
   Recupera do arquivo (pelo nome) o que etapas anteriores criaram:
   variáveis, estilos, ícones, artes e componentes. Usado quando a
   construção é feita em várias chamadas pela integração (MCP).
   ===================================================================== */

const C_NAMES: Record<string, string> = {
  Button: "Button", "Icon Button": "IconButton", Chip: "Chip", Badge: "Badge", Input: "Input", "Nav Link": "NavLink",
  Header: "Header", "Media Card": "MediaCard", "Experience Card": "ExperienceCard", "Franchise Tile": "FranchiseTile",
  "Section Header": "SectionHeader", Footer: "Footer", Toast: "Toast", "Sparkle Loader": "SparkleLoader", "Doc/Chapter Header": "ChapterHeader",
};

function pageByName(name: string): PageNode {
  const p = figma.root.children.find((x) => x.name === name);
  if (!p) throw new Error(`página ausente: ${name}`);
  return p;
}

async function restore() {
  await initFonts();
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  for (const v of vars) VAR[v.name] = v;
  const col = colls.find((c) => c.name === "DS · Color");
  if (col) {
    COLOR_COLLECTION = col;
    COLOR_MODES = { light: col.modes.find((m) => m.name === "Light")!.modeId, dark: col.modes.find((m) => m.name === "Dark")!.modeId };
  }
  for (const s of await figma.getLocalTextStylesAsync()) TSTYLE[s.name] = s;
  for (const s of await figma.getLocalEffectStylesAsync()) ESTYLE[s.name] = s;
  // Fontes dos text styles precisam estar carregadas para aplicar o estilo.
  for (const t of TYPE) await font(t.kind, t.weight);
  for (const pn of ["Iconography", "Components"]) {
    const p = figma.root.children.find((x) => x.name === pn);
    if (!p) continue;
    await p.loadAsync();
    for (const n of p.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] })) {
      if (n.type === "COMPONENT" && n.name.startsWith("Icon/")) ICON[n.name.slice(5)] = n;
      else if (n.type === "COMPONENT" && n.name.startsWith("Art/")) ART[n.name.slice(4)] = n;
      else if (C_NAMES[n.name] && !(n.type === "COMPONENT" && n.parent && n.parent.type === "COMPONENT_SET")) C[C_NAMES[n.name]] = n as ComponentNode | ComponentSetNode;
    }
  }
}
