(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  await restore();
  await step("Page · Cover", async () => void (await pageCover(await pg("Cover"))));
  await step("Page · Brand Strategy", async () => void (await pageStrategy(await pg("Brand Strategy"))));
  return done();
};
