import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { ProvedorDeNotificacoes } from "../components/Notificacoes";
import { Entrar } from "../pages/Entrar";
import { Landing } from "../pages/Landing";

function Local() {
  return <span data-testid="local">{useLocation().pathname}</span>;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, limit: 20, offset: 0 }), { status: 200 })));
});

describe("tela de entrada", () => {
  function montar() {
    return render(
      <MemoryRouter initialEntries={["/entrar"]}>
        <Routes>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="*" element={<Local />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("valida e-mail e senha com mensagens anunciadas", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    const alertas = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alertas).toEqual(expect.arrayContaining([expect.stringMatching(/e-mail válido/), expect.stringMatching(/sua senha/)]));
    expect(screen.getByLabelText("E-mail")).toHaveFocus();
  });

  it("não finge autenticar: explica e oferece o acesso aberto", async () => {
    const u = userEvent.setup();
    montar();
    await u.type(screen.getByLabelText("E-mail"), "pesquisa@instituicao.org");
    await u.type(screen.getByLabelText("Senha"), "segredo");
    await u.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByText("Login ainda não disponível")).toBeInTheDocument();
    expect(screen.getByText(/nenhuma senha foi verificada/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Continuar para a plataforma/ }));
    expect(screen.getByTestId("local")).toHaveTextContent("/app");
  });
});

describe("landing", () => {
  it("mostra o método com o estado real de cada etapa e nenhum número de marketing", () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/poder no presente/);
    expect(screen.getAllByText("Disponível")).toHaveLength(1);
    expect(screen.getAllByText("Próxima fase")).toHaveLength(1);
    expect(screen.getAllByText("Planejada")).toHaveLength(4);
    // Sem estatísticas inventadas (ex.: "+500 analistas", "98%").
    expect(container.textContent).not.toMatch(/\d+\s?%|\+\s?\d{2,}/);
    expect(screen.getAllByRole("link", { name: /Entrar/ })[0]).toHaveAttribute("href", "/entrar");
  });
});

describe("rotas", () => {
  function em(caminho: string) {
    return render(
      <MemoryRouter initialEntries={[caminho]}>
        <ProvedorDeNotificacoes>
          <App />
          <Local />
        </ProvedorDeNotificacoes>
      </MemoryRouter>,
    );
  }

  it("Documentos saiu do menu; gestão do acervo fica em Configurações", async () => {
    em("/app/configuracoes");
    const menu = screen.getAllByRole("navigation", { name: "Módulos" })[0];
    expect(menu).not.toHaveTextContent("Documentos");
    expect(await screen.findByRole("link", { name: /Abrir a gestão do acervo/ })).toHaveAttribute("href", "/app/configuracoes/acervo");
  });

  it("a plataforma não tem barra de busca", async () => {
    em("/app/configuracoes");
    await screen.findAllByRole("navigation", { name: "Módulos" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Buscar/)).not.toBeInTheDocument();
  });

  it("endereços antigos de documentos são redirecionados", () => {
    em("/documentos/abc");
    expect(screen.getByTestId("local")).toHaveTextContent("/app/base-cientifica/abc");
  });

  it("endereço desconhecido fora da plataforma volta à landing", () => {
    em("/qualquer-coisa");
    expect(screen.getByTestId("local")).toHaveTextContent(/^\/$/);
  });
});
