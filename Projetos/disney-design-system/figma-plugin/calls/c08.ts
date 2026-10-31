(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  await restore();
  const ico = await pg("Iconography");
  const comp = await pg("Components");
  const holder = ico.findOne((n) => n.name === "Icon build area") as FrameNode;
  const build = comp.findOne((n) => n.name === "Build area") as FrameNode;
  const iconComps = holder.children.filter((n) => n.type === "COMPONENT") as ComponentNode[];
  const artComps = build.children.filter((n) => n.type === "COMPONENT" && n.name.startsWith("Art/")) as ComponentNode[];
  await step("Page · Iconography", async () => { await pageIconography(ico, iconComps); if (holder.children.length === 0) holder.remove(); });
  await step("Page · Components", async () => void (await pageComponents(comp, build, artComps)));
  return done();
};
