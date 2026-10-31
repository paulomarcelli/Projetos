(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  await restore();
  const comp = await pg("Components");
  const build = comp.findOne((n) => n.name === "Build area") as FrameNode;
  await step("Button", async () => void (await buildButton(build)));
  await step("Icon Button", async () => void (await buildIconButton(build)));
  await step("Chip", async () => void (await buildChip(build)));
  await step("Badge", async () => void (await buildBadge(build)));
  await step("Input", async () => void (await buildInput(build)));
  await step("Nav Link", async () => void (await buildNavLink(build)));
  return done({ built: Object.keys(C) });
};
