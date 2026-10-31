(globalThis as any).__MCP = true;
const PAGES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];
async function pg(n: string) { const p = pageByName(n); await p.loadAsync(); return p; }
const done = (extra: object = {}) => ({ errors: ERRORS, ...extra });
(globalThis as any).__run = async () => {
  await restore();
  await step("Page · Persona", async () => void (await pagePersona(await pg("Persona"))));
  await step("Page · Voice", async () => void (await pageVoice(await pg("Voice & Tone"))));
  return done();
};
