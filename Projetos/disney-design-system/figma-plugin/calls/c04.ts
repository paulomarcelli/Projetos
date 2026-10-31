(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
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
  return done({ built: Object.keys(C) });
};
