import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import { ProvedorDeNotificacoes } from "../app/provedores/ProvedorDeNotificacoes";
import { PaginaCriarConta } from "../pages/Autenticacao/PaginaCriarConta";
import { PaginaEntrar } from "../pages/Autenticacao/PaginaEntrar";
import { LayoutConta } from "../pages/Autenticacao/LayoutConta";
import { PaginaRecuperarSenha } from "../pages/Autenticacao/PaginaRecuperarSenha";
import { PaginaRedefinirSenha } from "../pages/Autenticacao/PaginaRedefinirSenha";
import { PaginaLanding } from "../pages/Landing/PaginaLanding";

function Local() {
  return <span data-testid="local">{useLocation().pathname}</span>;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, limit: 20, offset: 0 }), { status: 200 })));
});

/** Monta a moldura de conta com as quatro telas, como no App (rotas aninhadas). */
function conta(caminho: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route element={<LayoutConta />}>
          <Route path="/entrar" element={<PaginaEntrar />} />
          <Route path="/criar-conta" element={<PaginaCriarConta />} />
          <Route path="/recuperar-senha" element={<PaginaRecuperarSenha />} />
          <Route path="/redefinir-senha" element={<PaginaRedefinirSenha />} />
        </Route>
        <Route path="*" element={<Local />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** A tela de entrar é uma página inteira (fora da moldura de conta), como no App. */
function entrar() {
  return render(
    <MemoryRouter initialEntries={["/entrar"]}>
      <Routes>
        <Route path="/entrar" element={<PaginaEntrar />} />
        <Route element={<LayoutConta />}>
          <Route path="/criar-conta" element={<PaginaCriarConta />} />
          <Route path="/recuperar-senha" element={<PaginaRecuperarSenha />} />
        </Route>
        <Route path="*" element={<Local />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("tela de entrada", () => {
  it("tem o formulário de verdade: rótulos, nomes, obrigatórios, o olho e nada de Google", async () => {
    const u = userEvent.setup();
    entrar();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Boas-vindas");
    const email = screen.getByLabelText("E-mail");
    const senha = screen.getByLabelText("Senha");
    expect(email).toHaveAttribute("name", "email");
    expect(email).toBeRequired();
    expect(senha).toHaveAttribute("name", "password");
    expect(senha).toHaveAttribute("autocomplete", "current-password");
    await u.type(senha, "segredo");
    await u.click(screen.getByRole("button", { name: "Mostrar a senha" }));
    expect(senha).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Esconder a senha" })).toBeInTheDocument();
    // A Iris não tem login com Google: o botão e o "Ou continue com" não aparecem.
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Ou continue com")).not.toBeInTheDocument();
  });

  it("e-mail fora do formato: avisa e não envia", async () => {
    const u = userEvent.setup();
    entrar();
    await u.type(screen.getByLabelText("E-mail"), "pesquisa@instituicao");
    await u.type(screen.getByLabelText("Senha"), "segredo");
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/e-mail válido/);
    expect(screen.queryByText("Login ainda não disponível")).not.toBeInTheDocument();
  });

  it("não finge autenticar: explica e oferece o acesso aberto", async () => {
    const u = userEvent.setup();
    entrar();
    await u.type(screen.getByLabelText("E-mail"), "pesquisa@instituicao.org");
    await u.type(screen.getByLabelText("Senha"), "segredo");
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Login ainda não disponível")).toBeInTheDocument();
    expect(screen.getByText(/nenhuma senha foi verificada/)).toBeInTheDocument();
    // O aviso fecha (no celular ele cobre o pé do formulário) e volta a cada envio.
    await u.click(screen.getByRole("button", { name: "Fechar o aviso" }));
    expect(screen.queryByText("Login ainda não disponível")).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    await u.click(await screen.findByRole("button", { name: /Continuar para a plataforma/ }));
    expect(screen.getByTestId("local")).toHaveTextContent("/app");
  });

  it("leva à recuperação de senha e à criação de conta", async () => {
    const u = userEvent.setup();
    entrar();
    await u.click(screen.getByRole("link", { name: "Esqueci a senha" }));
    expect(await screen.findByRole("heading", { name: "Recuperar a senha" })).toBeInTheDocument();
    cleanup();
    entrar();
    await u.click(screen.getByRole("link", { name: "Criar conta" }));
    expect(await screen.findByRole("heading", { name: "Crie a sua conta" })).toBeInTheDocument();
  });
});

describe("criar conta", () => {
  it("valida cada campo, mostra as regras da senha e não finge criar a conta", async () => {
    const u = userEvent.setup();
    conta("/criar-conta");
    await u.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getByLabelText("Nome")).toHaveFocus();
    expect(screen.getByText("Digite o seu nome.")).toBeInTheDocument();
    expect(screen.getByText("As duas senhas precisam ser iguais.")).toBeInTheDocument();

    await u.type(screen.getByLabelText("Nome"), "Ana Pesquisadora");
    await u.type(screen.getByLabelText("E-mail"), "ana@instituicao.org");
    await u.type(screen.getByLabelText("Senha"), "curta");
    expect(screen.getByText(/Pelo menos 10 caracteres/)).toHaveTextContent("(pendente)");
    await u.clear(screen.getByLabelText("Senha"));
    await u.type(screen.getByLabelText("Senha"), "relacoes2026");
    expect(screen.getByText(/Pelo menos 10 caracteres/)).toHaveTextContent("(cumprida)");
    await u.type(screen.getByLabelText("Confirmar senha"), "relacoes2026");
    await u.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("Cadastro ainda não disponível")).toBeInTheDocument();
    expect(screen.getByText(/nenhuma conta foi criada/)).toBeInTheDocument();
    expect(screen.queryByText(/Confirme o seu e-mail|Conta criada/)).not.toBeInTheDocument();
  });
});

describe("recuperar e redefinir senha", () => {
  it("recuperação não simula o envio de e-mail", async () => {
    const u = userEvent.setup();
    conta("/recuperar-senha");
    await u.type(screen.getByLabelText("E-mail"), "ana@instituicao.org");
    await u.click(screen.getByRole("button", { name: /Enviar link/ }));
    expect(await screen.findByText(/nenhuma mensagem foi enviada/)).toBeInTheDocument();
    expect(screen.queryByText(/Verifique o seu e-mail/)).not.toBeInTheDocument();
  });

  it("sem token, a redefinição explica o link incompleto e não mostra o formulário", () => {
    conta("/redefinir-senha");
    expect(screen.getByRole("heading", { name: "Link inválido ou incompleto" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedir um novo link" })).toHaveAttribute("href", "/recuperar-senha");
  });

  it("com token, pede a nova senha e não declara a troca sem o servidor", async () => {
    const u = userEvent.setup();
    conta("/redefinir-senha?token=abc");
    await u.type(screen.getByLabelText("Nova senha"), "relacoes2026");
    await u.type(screen.getByLabelText("Confirmar a nova senha"), "relacoes2026");
    await u.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByText(/a senha não foi alterada/)).toBeInTheDocument();
    expect(screen.queryByText("Senha alterada")).not.toBeInTheDocument();
  });
});

describe("landing", () => {
  const landing = () =>
    render(
      <MemoryRouter>
        <PaginaLanding />
      </MemoryRouter>,
    );

  it("título, campo de pergunta no centro e os dois caminhos: começar e entrar", () => {
    landing();
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Entenda o presente. Explore os futuros.");
    expect(screen.getAllByLabelText(/Escreva uma pergunta/).length).toBeGreaterThan(0);
    for (const l of screen.getAllByRole("link", { name: /Começar/ })) expect(l).toHaveAttribute("href", "/app");
    expect(screen.getAllByRole("link", { name: "Entrar" })[0]).toHaveAttribute("href", "/entrar");
  });

  it("estado real do projeto e nenhum número de marketing nem link para página que não existe", () => {
    const { container } = landing();
    expect(screen.getAllByText("Disponível")).toHaveLength(1);
    expect(screen.getAllByText("Próxima fase")).toHaveLength(1);
    expect(screen.getAllByText("Planejada")).toHaveLength(4);
    expect(screen.getByText(/o motor de investigação é a próxima fase/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\d+\s?%|\+\s?\d{2,}/);
    expect(screen.queryByRole("link", { name: /privacidade|termos|contato/i })).not.toBeInTheDocument();
  });

  it("a demonstração é ilustração: cenários A, B e C sem probabilidade e nenhum caso real", () => {
    landing();
    expect(screen.getByText("Ilustração da interface")).toBeInTheDocument();
    for (const id of ["A", "B", "C"]) expect(screen.getByText(`Cenário ${id}`)).toBeInTheDocument();
    expect(screen.getAllByText("Sem probabilidade")).toHaveLength(3);
    expect(screen.queryByText(/Flávio|Bolsonaro/)).not.toBeInTheDocument();
  });

  it("a pergunta escrita vai para a plataforma; os atalhos preenchem o campo", async () => {
    const u = userEvent.setup();
    landing();
    const campo = screen.getAllByLabelText(/Escreva uma pergunta/)[0];
    await u.type(campo, "Como a OTAN pode afetar a ordem regional?");
    expect(screen.getAllByRole("link", { name: "Investigar esta pergunta na Iris" })[0]).toHaveAttribute(
      "href",
      "/app?pergunta=Como%20a%20OTAN%20pode%20afetar%20a%20ordem%20regional%3F",
    );
    await u.click(screen.getAllByRole("button", { name: "Mercosul e UE" })[1]);
    expect(screen.getAllByLabelText(/Escreva uma pergunta/)[1]).toHaveValue("O acordo Mercosul–União Europeia muda o peso da América do Sul na economia mundial?");
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
    const menu = screen.getAllByRole("complementary", { name: "Menu lateral" })[0];
    expect(menu).not.toHaveTextContent("Documentos");
    expect(await screen.findByRole("link", { name: /Abrir a gestão do acervo/ })).toHaveAttribute("href", "/app/configuracoes/acervo");
  });

  it("não há busca: nem no topo, nem no menu, nem pelo ⌘K", async () => {
    const u = userEvent.setup();
    em("/app/configuracoes");
    const menu = (await screen.findAllByRole("complementary", { name: "Menu lateral" }))[0];
    expect(within(screen.getByRole("banner")).queryByRole("button", { name: /Buscar/ })).not.toBeInTheDocument();
    expect(within(menu).queryByRole("button", { name: /Buscar/ })).not.toBeInTheDocument();
    await u.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("dialog", { name: "Busca" })).not.toBeInTheDocument();
  });

  it("Histórico de análises sempre no menu; Recentes aparece com o primeiro item, e um rascunho salvo abre direto", async () => {
    const u = userEvent.setup();
    em("/app/configuracoes");
    const menu = screen.getAllByRole("complementary", { name: "Menu lateral" })[0];
    expect(within(menu).getByRole("button", { name: "Histórico de análises" })).toBeInTheDocument();
    expect(within(menu).queryByText("Recentes")).not.toBeInTheDocument();
    // Um rascunho salvo (aqui, como se fosse em outra aba) entra na lista sem recarregar.
    window.localStorage.setItem(
      "iris:rascunhos:v1",
      JSON.stringify([
        { id: "r1", pergunta: "Como a disputa por terras raras muda o comércio entre Europa e China?", horizonte: 5, regioes: [], dimensoes: ["economia"], profundidade: "padrao", criadoEm: "2026-10-01T10:00:00Z", atualizadoEm: "2026-10-02T10:00:00Z" },
      ]),
    );
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "iris:rascunhos:v1" }));
    });
    expect(within(menu).getByText("Recentes")).toBeInTheDocument();
    const item = within(menu).getByRole("button", { name: /terras raras/ });
    expect(item).toHaveTextContent(/rascunho/);
    await u.click(item);
    expect(screen.getByTestId("local")).toHaveTextContent("/app/investigacoes");
    window.localStorage.clear();
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

describe("menu lateral", () => {
  function app(caminho: string) {
    return render(
      <MemoryRouter initialEntries={[caminho]}>
        <ProvedorDeNotificacoes>
          <App />
          <Local />
        </ProvedorDeNotificacoes>
      </MemoryRouter>,
    );
  }

  it("navega pelos itens, marca a página atual e tem os atalhos ⌘K e ⌘,", async () => {
    const u = userEvent.setup();
    app("/app/favoritos");
    const menu = (await screen.findAllByRole("complementary", { name: "Menu lateral" }))[0];
    expect(within(menu).getByRole("button", { name: "Fontes salvas" })).toHaveAttribute("aria-current", "page");
    await u.click(within(menu).getByRole("button", { name: "Base científica" }));
    expect(screen.getByTestId("local")).toHaveTextContent("/app/base-cientifica");
    expect(within(menu).getByRole("button", { name: /Configurações/ })).toHaveAttribute("aria-keyshortcuts", "Meta+, Control+,");
    await u.keyboard("{Control>},{/Control}");
    expect(screen.getByTestId("local")).toHaveTextContent("/app/configuracoes");
  });

  it("recolhe e abre de novo, e guarda a escolha", async () => {
    const u = userEvent.setup();
    app("/app/favoritos");
    const menu = (await screen.findAllByRole("complementary", { name: "Menu lateral" }))[0];
    await u.click(screen.getByRole("button", { name: "Recolher o menu lateral" }));
    expect(menu).not.toHaveAttribute("data-open");
    expect(JSON.parse(window.localStorage.getItem("iris:menu")!)).toMatchObject({ recolhido: true });
    await u.click(screen.getByRole("button", { name: "Abrir o menu lateral" }));
    expect(menu).toHaveAttribute("data-open");
    window.localStorage.clear();
  });
});
