import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Abas, AreaTexto, AvisoDeErro, Botao, BotaoIcone, CampoTexto, Carregando, Dialogo, EstadoVazio, GrupoSegmentado, Interruptor, SeloConfiabilidade, SeloEpistemico } from ".";

describe("GrupoSegmentado", () => {
  function Teste({ aoMudar = vi.fn() }: { aoMudar?: (v: string) => void }) {
    const [valor, setValor] = useState("claro");
    return (
      <GrupoSegmentado
        rotulo="Tema"
        valor={valor}
        aoMudar={(v) => {
          setValor(v);
          aoMudar(v);
        }}
        opcoes={[
          { valor: "claro", rotulo: "Claro" },
          { valor: "escuro", rotulo: "Escuro" },
          { valor: "sistema", rotulo: "Sistema" },
        ]}
      />
    );
  }

  it("tem semântica de radiogroup com foco itinerante", () => {
    render(<Teste />);
    expect(screen.getByRole("radiogroup", { name: "Tema" })).toBeInTheDocument();
    const claro = screen.getByRole("radio", { name: "Claro" });
    expect(claro).toHaveAttribute("aria-checked", "true");
    expect(claro).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Escuro" })).toHaveAttribute("tabindex", "-1");
  });

  it("setas mudam a seleção e o foco, dando a volta; Home e End vão às pontas", async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Teste aoMudar={aoMudar} />);
    await usuario.tab();
    expect(screen.getByRole("radio", { name: "Claro" })).toHaveFocus();

    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Escuro" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Escuro" })).toHaveAttribute("aria-checked", "true");
    expect(aoMudar).toHaveBeenLastCalledWith("escuro");

    await usuario.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Claro" })).toHaveAttribute("aria-checked", "true");

    await usuario.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Sistema" })).toHaveFocus();

    await usuario.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Claro" })).toHaveAttribute("aria-checked", "true");
    await usuario.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Sistema" })).toHaveAttribute("aria-checked", "true");
  });

  it("clique seleciona", async () => {
    const usuario = userEvent.setup();
    render(<Teste />);
    await usuario.click(screen.getByRole("radio", { name: "Sistema" }));
    expect(screen.getByRole("radio", { name: "Sistema" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("Dialogo", () => {
  function Teste({ aoExcluir = vi.fn() }: { aoExcluir?: () => void }) {
    const [aberto, setAberto] = useState(false);
    return (
      <>
        <button onClick={() => setAberto(true)}>Excluir análise</button>
        <Dialogo
          aberto={aberto}
          aoFechar={() => setAberto(false)}
          tipo="alerta"
          titulo="Excluir análise?"
          descricao="A análise sai do histórico deste navegador."
          acoes={
            <>
              <Botao data-autofoco onClick={() => setAberto(false)}>
                Cancelar
              </Botao>
              <Botao variante="perigo" onClick={aoExcluir}>
                Excluir
              </Botao>
            </>
          }
        />
      </>
    );
  }

  it("abre com o foco no Cancelar, fecha com Esc e devolve o foco a quem abriu", async () => {
    const usuario = userEvent.setup();
    render(<Teste />);
    const abrir = screen.getByRole("button", { name: "Excluir análise" });
    await usuario.click(abrir);

    const dialogo = screen.getByRole("alertdialog", { name: "Excluir análise?" });
    expect(dialogo).toHaveAccessibleDescription("A análise sai do histórico deste navegador.");
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await usuario.keyboard("{Escape}");
    expect(dialogo).not.toHaveAttribute("open");
    expect(abrir).toHaveFocus();
  });

  it("executa a ação de confirmar", async () => {
    const usuario = userEvent.setup();
    const aoExcluir = vi.fn();
    render(<Teste aoExcluir={aoExcluir} />);
    await usuario.click(screen.getByRole("button", { name: "Excluir análise" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir" }));
    expect(aoExcluir).toHaveBeenCalledTimes(1);
  });
});

describe("Abas", () => {
  it("tablist com foco itinerante e painel ligado à aba", async () => {
    const usuario = userEvent.setup();
    render(
      <Abas
        rotulo="Seções da análise"
        abas={[
          { id: "cenarios", rotulo: "Cenários", conteudo: <p>Lista de cenários</p> },
          { id: "grafo", rotulo: "Grafo", conteudo: <p>O grafo</p> },
          { id: "evidencias", rotulo: "Evidências", contagem: 12, conteudo: <p>As evidências</p> },
        ]}
      />,
    );
    const cenarios = screen.getByRole("tab", { name: "Cenários" });
    expect(cenarios).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Cenários" })).toHaveTextContent("Lista de cenários");

    await usuario.click(cenarios);
    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Grafo" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Grafo" })).toHaveTextContent("O grafo");
    await usuario.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Evidências/ })).toHaveAttribute("aria-selected", "true");
    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Cenários" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Selos", () => {
  it("mostram os rótulos em português, com ícone e tipo", () => {
    render(
      <>
        <SeloEpistemico tipo="confirmado" />
        <SeloEpistemico tipo="inferencia" />
        <SeloEpistemico tipo="hipotese" />
        <SeloConfiabilidade confiabilidade="oficial" />
        <SeloConfiabilidade confiabilidade="enciclopedia" />
        <SeloConfiabilidade confiabilidade="wiki_fas" />
        <SeloConfiabilidade confiabilidade="blog" />
      </>,
    );
    for (const t of ["Confirmado", "Inferência", "Hipótese", "Fonte oficial", "Enciclopédia", "Wiki de fãs", "Fonte não classificada"]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });

  it("compacto vira imagem com nome acessível", () => {
    render(<SeloEpistemico tipo="hipotese" compacto />);
    expect(screen.getByRole("img", { name: "Hipótese" })).toBeInTheDocument();
  });
});

describe("Campos e botões", () => {
  it("CampoTexto liga rótulo, dica e erro", () => {
    const { rerender } = render(<CampoTexto rotulo="Nome" dica="Como aparece no menu" />);
    const campo = screen.getByRole("textbox", { name: "Nome" });
    expect(campo).toHaveAccessibleDescription("Como aparece no menu");
    rerender(<CampoTexto rotulo="Nome" dica="Como aparece no menu" erro="Informe um nome" />);
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Informe um nome");
  });

  it("AreaTexto tem rótulo", () => {
    render(<AreaTexto rotulo="Questão prospectiva" />);
    expect(screen.getByRole("textbox", { name: "Questão prospectiva" })).toBeInTheDocument();
  });

  it("Botao carregando fica ocupado e desabilitado", () => {
    render(<Botao carregando>Analisar</Botao>);
    const b = screen.getByRole("button", { name: /Analisar/ });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("aria-busy", "true");
  });

  it("BotaoIcone usa o rótulo como nome acessível", () => {
    render(
      <BotaoIcone rotulo="Guardar análise" pressionado={false}>
        <svg />
      </BotaoIcone>,
    );
    expect(screen.getByRole("button", { name: "Guardar análise" })).toHaveAttribute("aria-pressed", "false");
  });

  it("Interruptor alterna com role=switch", async () => {
    const usuario = userEvent.setup();
    function T() {
      const [v, setV] = useState(false);
      return <Interruptor rotulo="Reduzir movimento" marcado={v} aoMudar={setV} />;
    }
    render(<T />);
    const s = screen.getByRole("switch", { name: "Reduzir movimento" });
    expect(s).toHaveAttribute("aria-checked", "false");
    await usuario.click(s);
    expect(s).toHaveAttribute("aria-checked", "true");
  });
});

describe("Estados", () => {
  it("Carregando anuncia com role=status", () => {
    render(<Carregando rotulo="Buscando evidências…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando evidências…");
  });

  it("AvisoDeErro tem role=alert e tenta de novo", async () => {
    const usuario = userEvent.setup();
    const tentar = vi.fn();
    render(<AvisoDeErro titulo="API indisponível" texto="Confira se o backend está rodando." aoTentarNovamente={tentar} />);
    expect(screen.getByRole("alert")).toHaveTextContent("API indisponível");
    await usuario.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(tentar).toHaveBeenCalled();
  });

  it("EstadoVazio mostra título, texto e ação", () => {
    render(<EstadoVazio titulo="Nenhuma análise guardada" texto="Guarde uma análise para vê-la aqui." acao={<button>Ver histórico</button>} />);
    expect(screen.getByText("Nenhuma análise guardada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver histórico" })).toBeInTheDocument();
  });
});
