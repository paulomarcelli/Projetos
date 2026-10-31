import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Epistemico } from "../components/ui/Epistemico";
import { InvestigacoesRecentes } from "../features/historico/components/ListaDeInvestigacoes";
import { ProvedorDeNotificacoes } from "../app/provedores/ProvedorDeNotificacoes";
import { NovaInvestigacao } from "../features/consulta/components/NovaInvestigacao";
import { AlternarTema, SeletorTamanhoTexto, SeletorTema } from "../components/ui/SeletorTema";
import { PainelBase } from "../features/base-cientifica/components/PainelBase";
import { SeloStatus } from "../features/base-cientifica/components/StatusDocumento";

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
    // Perguntas de partida: um clique preenche o campo (e então aparece a checagem da pergunta).
    await u.click(screen.getByRole("button", { name: /política externa brasileira/ }));
    expect(screen.getByText(/checagem simples por palavras/)).toBeInTheDocument();
    await u.click(screen.getByRole("radio", { name: "10 anos" }));
    // Escopo, dimensões e profundidade ficam recolhidos até o usuário pedir.
    expect(screen.queryByRole("button", { name: "Segurança" })).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Escopo e dimensões/ }));
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
    comApp(<PainelBase />);
    expect(await screen.findByText("Documentos no acervo")).toBeInTheDocument();
    expect(screen.getByText("GET /documents → total")).toBeInTheDocument();
    expect(screen.getByText("Com texto extraível").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Não identificado")).toBeInTheDocument();
  });

  it("acervo vazio mostra um estado vazio útil, sem zeros soltos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, limit: 1, offset: 0 }), { status: 200 })));
    comApp(<PainelBase />);
    expect(await screen.findByText("A base científica está vazia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir para a gestão do acervo/ })).toHaveAttribute("href", "/app/configuracoes/acervo");
  });

  it("API fora do ar mostra erro com opção de tentar de novo", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", f);
    comApp(<PainelBase />);
    expect(await screen.findByText("API indisponível")).toBeInTheDocument();
    const chamadas = f.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(f.mock.calls.length).toBeGreaterThan(chamadas));
  });
});

describe("tema de cor", () => {
  it("o seletor aplica o tema claro no documento, guarda a escolha e volta ao escuro", async () => {
    const u = userEvent.setup();
    render(<SeletorTema />);
    await u.click(screen.getByRole("radio", { name: "Claro" }));
    expect(document.documentElement.dataset.tema).toBe("claro");
    expect(window.localStorage.getItem("iris:tema")).toBe("claro");
    await u.click(screen.getByRole("radio", { name: "Escuro" }));
    expect(document.documentElement.dataset.tema).toBeUndefined();
    expect(screen.getByRole("radio", { name: "Escuro" })).toHaveAttribute("aria-checked", "true");
  });

  it("o botão do menu e o seletor das Configurações compartilham o mesmo estado", async () => {
    const u = userEvent.setup();
    render(
      <>
        <AlternarTema />
        <SeletorTema />
      </>,
    );
    await u.click(screen.getByRole("radio", { name: "Escuro" }));
    await u.click(screen.getByRole("button", { name: "Usar tema claro" }));
    // Sem recarregar, o seletor já mostra a escolha feita no outro controle.
    expect(screen.getByRole("radio", { name: "Claro" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Usar tema escuro" })).toBeInTheDocument();
  });
});

describe("tamanho do texto", () => {
  it("aplica na hora, guarda a escolha e funciona pelas setas do teclado", async () => {
    const u = userEvent.setup();
    render(<SeletorTamanhoTexto />);
    await u.click(screen.getByRole("radio", { name: /Confortável/ }));
    expect(document.documentElement.dataset.texto).toBe("confortavel");
    expect(window.localStorage.getItem("iris:texto")).toBe("confortavel");
    // Grupo de rádio: a seta move e aplica.
    await u.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: /Ampliada/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Ampliada/ })).toHaveFocus();
    expect(document.documentElement.dataset.texto).toBe("ampliada");
    await u.click(screen.getByRole("radio", { name: /Padrão/ }));
    expect(document.documentElement.dataset.texto).toBeUndefined();
  });
});
