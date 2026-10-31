(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  await restore();
  const ico = await pg("Iconography");
  const comp = await pg("Components");
  const holder = frame("Icon build area");
  ico.appendChild(holder);
  holder.x = -2000;
  await step("Icons", () => { for (const c of buildIconComponents()) holder.appendChild(c); });
  const build = stack("Build area", "VERTICAL", 80, 80);
  comp.appendChild(build);
  build.x = -4000;
  await step("Art", () => { buildArtComponents(build); });
  return done({ icons: holder.children.length, art: build.children.length });
};
