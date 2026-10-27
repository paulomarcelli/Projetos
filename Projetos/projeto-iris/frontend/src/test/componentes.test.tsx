import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Epistemico } from "../components/Epistemico";
import { InvestigacoesRecentes } from "../components/Investigacoes";
import { ProvedorDeNotificacoes } from "../components/Notificacoes";
import { NovaInvestigacao } from "../components/NovaInvestigacao";
import { ResumoBase } from "../components/ResumoBase";
import { SeloStatus } from "../components/StatusDocumento";

function comApp(no: ReactNode) {
  return render(
    <MemoryRouter>
      <ProvedorDeNotificacoes>{no}</ProvedorDeNotificacoes>
    </MemoryRouter>,
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("linguagem epistêmica", () => {
  it("mostra rótulo em texto (não só cor) e explica o tipo", () => {
    render(<Epistemico tipo="hipotese" />);
    const el = screen.getByText("Hipótese");
    expect(el.closest("span[title]")?.getAttribute("title")).toMatch(/Proposição a investigar/);
  });

  it("estado do documento tem texto acessível", () => {
    render(<SeloStatus status="failed" />);
    expect(screen.getByText("Falhou")).toBeInTheDocument();
  });
});

describe("nova investigação", () => {
  it("recusa pergunta curta, com erro junto do formulário", async () => {
    const u = userEvent.setup();
    comApp(<NovaInvestigacao />);
    await u.type(screen.getByLabelText(/Qual questão internacional/), "Brasil?");
    await u.click(screen.getByRole("button", { name: /Salvar rascunho/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(/pelo menos 15 caracteres/);
    expect(window.localStorage.getItem("iris:rascunhos:v1")).toBeNull();
  });

  it("salva a pergunta e a configuração como rascunho local e lista o rascunho", async () => {
    const u = userEvent.setup();
    comApp(
      <>
        <NovaInvestigacao />
        <InvestigacoesRecentes />
      </>,
    );
    await u.click(screen.getByRole("button", { name: "Usar a pergunta de exemplo" }));
    await u.click(screen.getByRole("radio", { name: "10 anos" }));
    await u.click(screen.getByRole("button", { name: "Segurança" }));
    await u.click(await screen.findByRole("button", { name: "América do Sul" }));
    await u.click(screen.getByRole("button", { name: /Salvar rascunho/ }));

    const salvos = JSON.parse(window.localStorage.getItem("iris:rascunhos:v1") ?? "[]");
    expect(salvos).toHaveLength(1);
    expect(salvos[0]).toMatchObject({ horizonte: 10, regioes: ["america-sul"], dimensoes: ["diplomacia", "economia", "seguranca"], profundidade: "padrao" });
    expect(await screen.findByText("Rascunho · não processado")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma investigação processada")).toBeInTheDocument();
    expect(await screen.findByText(/Rascunho de investigação salvo/)).toBeInTheDocument();
  });

  it("deixa claro que o motor de investigação ainda não existe", () => {
    comApp(<NovaInvestigacao />);
    expect(screen.getAllByText(/motor de investigação ainda não existe/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Iniciar investigação/ })).toBeNull();
  });
});

describe("base científica", () => {
  it("mostra só números reais da API, com a origem de cada um", async () => {
    const itens = [
      { id: "1", status: "completed", language: "pt", text_extractable: true, created_at: new Date().toISOString() },
      { id: "2", status: "completed", language: null, text_extractable: false, created_at: new Date().toISOString() },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const status = new URL(url, "http://x").searchParams.get("status");
        const total = status === "completed" ? 2 : status ? 0 : 2;
        return new Response(JSON.stringify({ items: status ? [] : itens, total, limit: 100, offset: 0 }), { status: 200 });
      }),
    );
    comApp(<ResumoBase />);
    expect(await screen.findByText("Documentos no acervo")).toBeInTheDocument();
    expect(screen.getByText("GET /documents → total")).toBeInTheDocument();
    expect(screen.getByText("Com texto extraível").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Não identificado")).toBeInTheDocument();
    expect(screen.getByText(/Cobertura temática não calculável/)).toBeInTheDocument();
  });

  it("acervo vazio mostra um estado vazio útil, sem zeros soltos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, limit: 1, offset: 0 }), { status: 200 })));
    comApp(<ResumoBase />);
    expect(await screen.findByText("A base científica está vazia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Enviar o primeiro PDF/ })).toHaveAttribute("href", "/documentos");
  });

  it("API fora do ar mostra erro com opção de tentar de novo", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", f);
    comApp(<ResumoBase />);
    expect(await screen.findByText("API indisponível")).toBeInTheDocument();
    const chamadas = f.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(f.mock.calls.length).toBeGreaterThan(chamadas));
  });
});
