(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  const out: object[] = [];
  {
await restore();
  await step("Page · Motion", async () => void (await pageMotion(await pg("Motion"))));
  out.push();
  }
  {
await restore();
  await step("Page · Application", async () => void (await pageApplication(await pg("Application"))));
  out.push();
  }
  return done({ steps: out });
};
