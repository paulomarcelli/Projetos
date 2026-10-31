/* =====================================================================
   Orquestrador. Ordem: tokens → ícones → arte → componentes → páginas.
   Pode rodar de novo: recria as páginas que ele mesmo criou e atualiza
   variáveis e estilos pelo nome (não duplica).
   ===================================================================== */

const PAGE_NAMES = ["Cover", "Brand Strategy", "Persona", "Voice & Tone", "Foundations", "Iconography", "Components", "Motion", "Application"];

async function preparePages(): Promise<Record<string, PageNode>> {
  const old = figma.root.children.filter((p) => p.getPluginData(MARK) === "1");
  const pages: Record<string, PageNode> = {};
  // Arquivo novo: a "Page 1" vazia vira a Cover.
  const first = figma.root.children[0];
  await first.loadAsync();
  const reuseFirst = old.length === 0 && first.children.length === 0 && first.getPluginData(MARK) !== "1";
  for (const [i, name] of PAGE_NAMES.entries()) {
    let p: PageNode;
    if (i === 0 && reuseFirst) {
      p = first;
      p.name = name;
    } else {
      p = figma.createPage();
      p.name = name;
    }
    mark(p);
    pages[name] = p;
  }
  // Remove as páginas de uma execução anterior (só as marcadas por este plugin).
  if (old.length) {
    await figma.setCurrentPageAsync(pages.Cover);
    for (const p of old) if (!Object.values(pages).includes(p)) p.remove();
  }
  // Garante a ordem pedida no arquivo.
  PAGE_NAMES.forEach((n, i) => figma.root.insertChild(i, pages[n]));
  for (const p of Object.values(pages)) await p.loadAsync();
  return pages;
}

/** resize() trava a altura de molduras com auto layout; aqui elas voltam a abraçar o conteúdo
    quando ele não cabe (de dentro para fora, para os pais recalcularem depois dos filhos). */
function hugOverflow(page: PageNode) {
  const depth = (n: BaseNode) => { let d = 0; let p = n.parent; while (p) { d++; p = p.parent; } return d; };
  const inInstance = (n: BaseNode) => { let p = n.parent; while (p) { if (p.type === "INSTANCE") return true; p = p.parent; } return false; };
  const frames = page.findAll((n) => (n.type === "FRAME" || n.type === "COMPONENT") && (n as FrameNode).layoutMode !== "NONE" && !inInstance(n)) as FrameNode[];
  frames.sort((a, b) => depth(b) - depth(a));
  for (const f of frames) {
    const vertical = f.layoutMode === "VERTICAL";
    if ((vertical ? f.primaryAxisSizingMode : f.counterAxisSizingMode) !== "FIXED" || f.layoutSizingVertical === "FILL") continue;
    const kids = f.children.filter((c) => c.visible && !("layoutPositioning" in c && c.layoutPositioning === "ABSOLUTE"));
    if (!kids.length) continue;
    const need = f.layoutWrap === "WRAP" ? Infinity : vertical
      ? f.paddingTop + f.paddingBottom + kids.reduce((s, c) => s + c.height, 0) + f.itemSpacing * (kids.length - 1)
      : f.paddingTop + f.paddingBottom + Math.max(...kids.map((c) => c.height));
    if (need <= f.height + 0.5) continue;
    if (vertical) f.primaryAxisSizingMode = "AUTO"; else f.counterAxisSizingMode = "AUTO";
  }
}

async function main() {
  progress("✨ Preparando a magia: fontes e páginas…");
  await initFonts();
  const pages = await preparePages();

  await step("Variables", buildVariables);
  await step("Text styles", buildTextStyles);
  await step("Effect styles", buildEffectStyles);
  progress("Tokens prontos. Desenhando ícones…");

  // Área de construção temporária (os componentes depois vão para as páginas de documentação).
  const iconHolder = frame("Icon build area");
  pages.Iconography.appendChild(iconHolder);
  let iconComps: ComponentNode[] = [];
  await step("Icons", () => {
    iconComps = buildIconComponents();
    for (const c of iconComps) iconHolder.appendChild(c);
  });

  const build = stack("Build area", "VERTICAL", 80, 80);
  pages.Components.appendChild(build);
  build.x = -4000;
  let artComps: ComponentNode[] = [];
  await step("Art components", () => {
    artComps = buildArtComponents(build);
  });
  progress("Construindo componentes…");
  await step("Button", async () => void (await buildButton(build)));
  await step("Icon Button", async () => void (await buildIconButton(build)));
  await step("Chip", async () => void (await buildChip(build)));
  await step("Badge", async () => void (await buildBadge(build)));
  await step("Input", async () => void (await buildInput(build)));
  await step("Nav Link", async () => void (await buildNavLink(build)));
  await step("Header", async () => void (await buildHeader(build)));
  await step("Media Card", async () => void (await buildMediaCard(build)));
  await step("Experience Card", async () => void (await buildExperienceCard(build)));
  await step("Franchise Tile", async () => void (await buildFranchiseTile(build)));
  await step("Section Header", async () => void (await buildSectionHeader(build)));
  await step("Footer", async () => void (await buildFooter(build)));
  await step("Toast", async () => void (await buildToast(build)));
  await step("Sparkle Loader", async () => void (await buildSparkleLoader(build)));
  await step("Chapter Header", async () => void (await buildChapterHeader(build)));

  progress("Montando as páginas de estratégia…");
  await step("Page · Cover", () => pageCover(pages.Cover));
  await step("Page · Brand Strategy", () => pageStrategy(pages["Brand Strategy"]));
  await step("Page · Persona", () => pagePersona(pages.Persona));
  await step("Page · Voice & Tone", () => pageVoice(pages["Voice & Tone"]));
  progress("Montando foundations, ícones e componentes…");
  await step("Page · Foundations", () => pageFoundations(pages.Foundations));
  await step("Page · Iconography", async () => {
    await pageIconography(pages.Iconography, iconComps);
    if (iconHolder.children.length === 0) iconHolder.remove();
  });
  await step("Page · Components", () => pageComponents(pages.Components, build, artComps));
  progress("Motion e aplicação…");
  await step("Page · Motion", async () => void (await pageMotion(pages.Motion)));
  await step("Page · Application", () => pageApplication(pages.Application));

  for (const p of Object.values(pages)) await step(`Hug · ${p.name}`, () => hugOverflow(p));

  // Relatório honesto de qualquer falha, na própria capa.
  if (ERRORS.length) {
    await step("Error report", async () => {
      const r = stack("⚠ Relatório de construção", "VERTICAL", 8, 40);
      r.resize(900, 10);
      r.counterAxisSizingMode = "FIXED";
      r.fills = [solid("#FFF4F4")];
      r.cornerRadius = 24;
      r.appendChild(await textRaw(`${ERRORS.length} etapa(s) com erro. O restante foi construído.`, "Subtitle/L", "#C93B55", 820));
      for (const e of ERRORS) r.appendChild(await textRaw(e, "Body/S", "#4D4A40", 820));
      placeOnPage(pages.Cover, r, 0, 1200);
    });
  }

  await figma.setCurrentPageAsync(pages.Cover);
  figma.viewport.scrollAndZoomIntoView(pages.Cover.children);
  const msg = ERRORS.length ? `Design System construído com ${ERRORS.length} aviso(s): veja o relatório na Cover.` : "✨ Design System construído: 9 páginas, variáveis, estilos e componentes.";
  figma.closePlugin(msg);
}

main().catch((e) => {
  figma.closePlugin(`Falha inesperada: ${e instanceof Error ? e.message : String(e)}`);
});
