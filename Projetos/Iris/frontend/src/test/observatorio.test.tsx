import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { entradaDaPrevia } from "../app/entradaDaPrevia";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles/globais.css"), "utf-8");
import { Observatorio, PaginaObservatorio } from "../pages/Observatorio/PaginaObservatorio";
import { EditorDeDocumento, PaginaDocumentos, registroComoTexto } from "../pages/Documentos/PaginaDocumentos";
import { CICLO_EXEMPLO, DOCUMENTO_EXEMPLO, HOJE_DO_EXEMPLO } from "../previa/observatorio-exemplo";

const em = (no: React.ReactNode) => render(<MemoryRouter>{no}</MemoryRouter>);

describe("observatório", () => {
  it("fora da prévia, sem servidor: estado vazio honesto, com o que vai aparecer e uma ação", () => {
    em(<PaginaObservatorio />);
    expect(screen.getByText("O Observatório aparece quando houver um ciclo")).toBeInTheDocument();
    expect(screen.getByText(/servidor de ciclos e turmas ainda não existe/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver as investigações" })).toHaveAttribute("href", "/app/investigacoes");
  });

  it("ciclo em fichas, linha do semestre, entregas com a versão do cenário e o resumo de IA, marcados como exemplo", async () => {
    em(<Observatorio ciclo={CICLO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    expect(screen.getByText("Dados de exemplo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026.2 · Comércio exterior" })).toHaveAttribute("aria-pressed", "true");
    // hoje 22/11; o próximo prazo é o dos policy briefs, 28/11
    expect(screen.getByText(/hoje 22\/11 · 6 dias para policy briefs/)).toBeInTheDocument();
    const entregas = screen.getByRole("region", { name: "Entregas do ciclo" });
    expect(within(entregas).getAllByRole("listitem")).toHaveLength(4);
    expect(entregas).toHaveTextContent("parte do cenário B, v3");
    expect(screen.getByText("1 de 4 entregue")).toBeInTheDocument();
    // o cenário C passou da data de revisão
    expect(screen.getByText(/v2 · próxima: revisão atrasada/)).toBeInTheDocument();
    expect(screen.getByText(/2 registros · 1 revisado · 1 aguardando revisão humana/)).toBeInTheDocument();
    // outro ciclo, sem dados de exemplo: diz isso
    await userEvent.setup().click(screen.getByRole("button", { name: "2025.2 · Avaliação de cenários" }));
    expect(screen.getByText(/O exemplo só traz o ciclo 2026.2/)).toBeInTheDocument();
  });
});

describe("editor de documento", () => {
  it("fora da prévia, a lista diz que o servidor de documentos ainda não existe", () => {
    em(<PaginaDocumentos />);
    expect(screen.getByText("Os documentos aparecem aqui")).toBeInTheDocument();
  });

  it("folha clara, texto sugerido pela IA marcado e as três decisões; aceitar atualiza o registro de IA", async () => {
    const u = userEvent.setup();
    em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    const folha = screen.getByRole("article", { name: "Folha do documento" });
    expect(folha).toHaveClass("folha");
    expect(within(folha).getByText(/Sugerido pela IA · aguardando revisão/)).toBeInTheDocument();
    expect(screen.getByText("1 de 2 revisados")).toBeInTheDocument();
    expect(screen.getByText("2 de 3 conferidas")).toBeInTheDocument();
    expect(screen.getByText("Fonte não conferida no texto")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Aceitar e marcar como revisado" }));
    expect(within(folha).queryByText(/Sugerido pela IA/)).not.toBeInTheDocument();
    expect(screen.getByText("2 de 2 revisados")).toBeInTheDocument();
  });

  it("descartar tira o trecho; editar deixa mudar o texto antes de aceitar", async () => {
    const u = userEvent.setup();
    const { unmount } = em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    await u.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.queryByText(/escalada tarifária entre EUA e China se mantiver contida/)).not.toBeInTheDocument();
    unmount();
    em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    await u.click(screen.getByRole("button", { name: "Editar" }));
    const campo = screen.getByLabelText("Editar o trecho sugerido");
    await u.clear(campo);
    await u.type(campo, "Texto revisto pela equipe");
    await u.click(screen.getByRole("button", { name: "Salvar e marcar como revisado" }));
    expect(screen.getByText(/Texto revisto pela equipe/)).toBeInTheDocument();
  });

  it("o tipo do documento troca pelas fichas; o registro exportado leva o uso de IA e as fontes", async () => {
    em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Boletim de conjuntura" }));
    expect(screen.getByRole("button", { name: "Boletim de conjuntura" })).toHaveAttribute("aria-pressed", "true");
    const texto = registroComoTexto(DOCUMENTO_EXEMPLO);
    expect(texto).toContain("Aguardando revisão humana");
    expect(texto).toContain("Revisado por Equipe 3 em 12/11/2026");
    expect(texto).toContain("[7] Leilão de terminais");
    expect(texto).toContain("Não conferida no texto.");
  });
});

describe("revisão da Sabrina (22/11): foco, anúncio, fontes, decisão única, download e hash", () => {
  it("M1: editar leva o foco ao campo; aceitar leva ao título (não há outro sugerido) e anuncia a decisão", async () => {
    const u = userEvent.setup();
    em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    await u.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Editar o trecho sugerido")).toHaveFocus();
    await u.click(screen.getByRole("button", { name: "Salvar e marcar como revisado" }));
    expect(screen.getByRole("heading", { level: 2, name: DOCUMENTO_EXEMPLO.titulo })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Trecho aceito e registrado como revisado");
  });

  it("M1 e B2: descartar move o foco, anuncia e deixa o registro num estado só", async () => {
    const u = userEvent.setup();
    em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    await u.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.getByRole("heading", { level: 2, name: DOCUMENTO_EXEMPLO.titulo })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Trecho descartado");
    const registro = screen.getByRole("article", { name: "Uso de IA: Redigir parágrafo sobre o cenário B" });
    expect(registro).toHaveTextContent("Revisado por Equipe 3 em 22/11/2026 · descartado");
    expect(registro.textContent).not.toMatch(/não revisad|Aguardando/);
  });

  it("M2: toda fonte citada (no texto, nos registros e no .md) existe na lista; o .md da prévia começa marcado como exemplo", () => {
    const lista = new Set(DOCUMENTO_EXEMPLO.fontes.map((f) => f.numero));
    const citadas = [...DOCUMENTO_EXEMPLO.secoes.flatMap((s) => s.trechos.flatMap((t) => t.citacoes)), ...DOCUMENTO_EXEMPLO.registros.flatMap((r) => r.fontes)];
    for (const n of citadas) expect(lista.has(n)).toBe(true);
    const md = registroComoTexto(DOCUMENTO_EXEMPLO, true);
    expect(md.startsWith("> Dados de exemplo")).toBe(true);
    for (const m of md.matchAll(/\[(\d+)\]/g)) expect(lista.has(Number(m[1]))).toBe(true);
    expect(registroComoTexto(DOCUMENTO_EXEMPLO)).not.toContain("Dados de exemplo");
  });

  it("B3: o object URL do download só é revogado depois, não no mesmo tick", async () => {
    const criar = vi.fn(() => "blob:teste");
    const revogar = vi.fn();
    Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar });
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    em(<EditorDeDocumento inicial={DOCUMENTO_EXEMPLO} hoje={HOJE_DO_EXEMPLO} />);
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Exportar registro de IA e fontes" }));
    expect(clique).toHaveBeenCalled();
    expect(revogar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revogar).toHaveBeenCalledWith("blob:teste");
    vi.useRealTimers();
    clique.mockRestore();
  });

  it("B4: as âncoras da landing não abrem o app na prévia; o app usa #app-…", () => {
    expect(entradaDaPrevia("#observatorio")).toBe("/");
    expect(entradaDaPrevia("#app-observatorio")).toBe("/app/observatorio");
    expect(entradaDaPrevia("#app-documento")).toBe("/app/documentos/brasil-entre-tarifas");
  });

  it("B1: a regra de reduzir movimento vem depois das revelações do leque", () => {
    const ultimaRevelacao = Math.max(css.lastIndexOf("animation-name: leque-revelar-vertical"), css.lastIndexOf("animation: leque-revelar "));
    const ultimaReducao = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
    expect(ultimaReducao).toBeGreaterThan(ultimaRevelacao);
    expect(css.slice(ultimaReducao)).toMatch(/\.leque-futuros\[data-vertical\]:not\(\[data-compacto\]\)[\s\S]*animation: none/);
  });
});
