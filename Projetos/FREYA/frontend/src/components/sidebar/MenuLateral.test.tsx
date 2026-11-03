import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorDePreferencias } from "../../contexts/Preferencias";
import { Estrutura } from "../layout/Estrutura";

function montar(rota = "/") {
  const roteador = createMemoryRouter(
    [
      {
        element: <Estrutura />,
        children: [
          { path: "/", element: <h1>Página inicial</h1> },
          { path: "/historico", element: <h1>Página do histórico</h1> },
          { path: "/guardados", element: <h1>Página dos guardados</h1> },
          { path: "/configuracoes", element: <h1>Página de configurações</h1> },
          { path: "/perfil", element: <h1>Página do perfil</h1> },
          { path: "/analises/nova", element: <h1>Página da nova análise</h1> },
        ],
      },
    ],
    { initialEntries: [rota] },
  );
  render(
    <ProvedorDePreferencias>
      <RouterProvider router={roteador} />
    </ProvedorDePreferencias>,
  );
  return roteador;
}

/** O menu fixo do desktop (o <aside>). */
const menuFixo = () => screen.getByRole("complementary", { name: "Menu lateral" });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

describe("MenuLateral", () => {
  it("tem a ação principal, os itens de navegação e o perfil, com os destinos certos", () => {
    montar();
    const menu = within(menuFixo());
    expect(menu.getByRole("link", { name: "Nova análise" })).toHaveAttribute("href", "/analises/nova");
    expect(menu.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(menu.getByRole("link", { name: "Histórico de análises" })).toHaveAttribute("href", "/historico");
    expect(menu.getByRole("link", { name: "Guardados" })).toHaveAttribute("href", "/guardados");
    expect(menu.getByRole("link", { name: "Configurações" })).toHaveAttribute("href", "/configuracoes");
    expect(menu.getByRole("link", { name: /Analista/ })).toHaveAttribute("href", "/perfil");
    expect(menu.getByRole("link", { name: /F\.R\.E\.Y\.A\. — ir para o início/ })).toHaveAttribute("href", "/");
  });

  it("mostra as iniciais do perfil no avatar", () => {
    localStorage.setItem("freya:preferencias", JSON.stringify({ perfil: { nome: "Wanda Maximoff", funcao: "Feiticeira" } }));
    montar();
    const perfil = within(menuFixo()).getByRole("link", { name: /Wanda Maximoff/ });
    expect(perfil).toHaveTextContent("WM");
    expect(perfil).toHaveTextContent("Feiticeira");
  });

  it("marca o item da rota atual com aria-current e troca ao navegar", async () => {
    const usuario = userEvent.setup();
    montar("/historico");
    const menu = within(menuFixo());
    expect(menu.getByRole("link", { name: "Histórico de análises" })).toHaveAttribute("aria-current", "page");
    expect(menu.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");

    await usuario.click(menu.getByRole("link", { name: "Guardados" }));
    expect(screen.getByRole("heading", { name: "Página dos guardados" })).toBeInTheDocument();
    expect(menu.getByRole("link", { name: "Guardados" })).toHaveAttribute("aria-current", "page");
    expect(menu.getByRole("link", { name: "Histórico de análises" })).not.toHaveAttribute("aria-current");
  });

  it("recolhe e expande, guardando a preferência", async () => {
    const usuario = userEvent.setup();
    montar();
    expect(menuFixo()).not.toHaveAttribute("data-recolhido");

    await usuario.click(within(menuFixo()).getByRole("button", { name: "Recolher menu" }));
    expect(menuFixo()).toHaveAttribute("data-recolhido");
    expect(JSON.parse(localStorage.getItem("freya:preferencias") ?? "{}").menuRecolhido).toBe(true);
    // recolhido: os links continuam com nome acessível (o rótulo visível some)
    expect(within(menuFixo()).getByRole("link", { name: "Guardados" })).toBeInTheDocument();
    const expandir = within(menuFixo()).getByRole("button", { name: "Expandir menu" });
    expect(expandir).toHaveAttribute("aria-expanded", "false");

    await usuario.click(expandir);
    expect(menuFixo()).not.toHaveAttribute("data-recolhido");
  });

  it("abre a gaveta no celular, prende o foco, fecha com Esc e devolve o foco", async () => {
    const usuario = userEvent.setup();
    montar();
    const abrir = screen.getByRole("button", { name: "Abrir menu" });
    expect(abrir).toHaveAttribute("aria-expanded", "false");

    await usuario.click(abrir);
    const gaveta = screen.getByRole("dialog", { name: "Menu" });
    expect(abrir).toHaveAttribute("aria-expanded", "true");
    expect(gaveta.closest(".fr-gaveta")).toHaveAttribute("data-aberta");
    expect(gaveta).toContainElement(document.activeElement as HTMLElement);

    // Tab no último foca o primeiro (foco preso)
    const focaveis = within(gaveta).getAllByRole("link").concat(within(gaveta).getAllByRole("button"));
    const ultimo = within(gaveta).getByRole("link", { name: /Analista/ });
    ultimo.focus();
    await usuario.tab();
    expect(gaveta).toContainElement(document.activeElement as HTMLElement);
    expect(focaveis.length).toBeGreaterThan(3);

    await usuario.keyboard("{Escape}");
    expect(gaveta.closest(".fr-gaveta")).not.toHaveAttribute("data-aberta");
    expect(abrir).toHaveFocus();
  });

  it("fecha a gaveta ao navegar por ela", async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(screen.getByRole("button", { name: "Abrir menu" }));
    const gaveta = screen.getByRole("dialog", { name: "Menu" });
    await usuario.click(within(gaveta).getByRole("link", { name: "Configurações" }));
    expect(screen.getByRole("heading", { name: "Página de configurações" })).toBeInTheDocument();
    expect(gaveta.closest(".fr-gaveta")).not.toHaveAttribute("data-aberta");
  });

  it("tem o atalho para pular ao conteúdo", () => {
    montar();
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveAttribute("href", "#conteudo");
    expect(document.getElementById("conteudo")?.tagName).toBe("MAIN");
  });
});
