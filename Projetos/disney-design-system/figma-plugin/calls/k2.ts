(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  const out: object[] = [];
  {
await restore();
  const comp = await pg("Components");
  const build = comp.findOne((n) => n.name === "Build area") as FrameNode;
  await step("Button", async () => void (await buildButton(build)));
  await step("Icon Button", async () => void (await buildIconButton(build)));
  await step("Chip", async () => void (await buildChip(build)));
  await step("Badge", async () => void (await buildBadge(build)));
  await step("Input", async () => void (await buildInput(build)));
  await step("Nav Link", async () => void (await buildNavLink(build)));
  out.push({ built: Object.keys(C) });
  }
  {
await restore();
  const comp = await pg("Components");
  const build = comp.findOne((n) => n.name === "Build area") as FrameNode;
  await step("Header", async () => void (await buildHeader(build)));
  await step("Media Card", async () => void (await buildMediaCard(build)));
  await step("Experience Card", async () => void (await buildExperienceCard(build)));
  await step("Franchise Tile", async () => void (await buildFranchiseTile(build)));
  await step("Section Header", async () => void (await buildSectionHeader(build)));
  await step("Footer", async () => void (await buildFooter(build)));
  await step("Toast", async () => void (await buildToast(build)));
  await step("Sparkle Loader", async () => void (await buildSparkleLoader(build)));
  await step("Chapter Header", async () => void (await buildChapterHeader(build)));
  out.push({ built: Object.keys(C) });
  }
  return done({ steps: out });
};
