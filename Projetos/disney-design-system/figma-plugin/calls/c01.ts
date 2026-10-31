(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  await initFonts();
  const first = figma.root.children[0];
  if (!figma.root.children.some((p) => p.name === "Cover")) first.name = "Cover";
  for (const n of PAGES.slice(1)) if (!figma.root.children.some((p) => p.name === n)) figma.createPage().name = n;
  await step("Variables", buildVariables);
  await step("Text styles", buildTextStyles);
  await step("Effect styles", buildEffectStyles);
  return done({ pages: figma.root.children.map((p) => p.name), vars: Object.keys(VAR).length, styles: Object.keys(TSTYLE).length + Object.keys(ESTYLE).length });
};
