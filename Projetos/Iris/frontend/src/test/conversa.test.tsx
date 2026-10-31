import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../app/App";
import { ProvedorDeNotificacoes } from "../app/provedores/ProvedorDeNotificacoes";
import { detectarIntencao, montarComplemento, SUGESTOES } from "../components/analysis/conversa/complementos";
import { Complemento } from "../components/analysis/conversa/Complemento";
import { Diagnostico } from "../components/analysis/conversa/resposta/Diagnostico";
import { Dinamicas } from "../components/analysis/conversa/resposta/Dinamicas";
import { Monitoramento } from "../components/analysis/conversa/resposta/Monitoramento";
import { Prospectiva } from "../components/analysis/conversa/resposta/Prospectiva";
import { ProvedorDoResultado } from "../components/analysis/investigacao/contexto";
import { montarDiagnostico, montarDinamicas } from "../components/analysis/investigacao/estrutura";
import { INVESTIGACAO_EXEMPLO as r } from "../previa/investigacao-exemplo";

afterEach(() => window.localStorage.clear());

describe("perguntas complementares", () => {
  it("reconhece o que a pessoa quer aprofundar", () => {
    for (const s of SUGESTOES) expect(detectarIntencao(s.texto)).toBe(s.intencao);
    expect(detectarIntencao("E a Rússia, entra nisso?")).toBe("livre");
  });

  it("monta cada complemento só com campos do resultado", () => {
    const brasil = montarComplemento(r, "brasil");
    expect(brasil.intencao === "brasil" && brasil.ator?.id).toBe("brasil");
    const indicadores = montarComplemento(r, "indicadores");
    expect(indicadores.intencao === "indicadores" && indicadores.sinais).toEqual(r.sinais);
    const historia = montarComplemento(r, "historia");
    expect(historia.intencao === "historia" && historia.eventos.every((e) => e.categoria === "observado")).toBe(true);
  });
});

describe("resposta da Iris", () => {
  const comResultado = (ui: React.ReactNode) => render(<ProvedorDoResultado r={r}>{ui}</ProvedorDoResultado>);

  it("diagnóstico: responde à pergunta e diz o que acontece, o problema central, por que importa e as implicações", () => {
    comResultado(<Diagnostico />);
    expect(screen.getByRole("heading", { name: "Diagnóstico estratégico" })).toBeInTheDocument();
    expect(screen.getByText(r.sintese)).toBeInTheDocument();
    for (const t of ["O que está acontecendo", "Problema estratégico central", "Por que importa", "Implicações para o futuro"]) expect(screen.getByText(t)).toBeInTheDocument();
  });

  it("dinâmicas: narrativa única, sem seções separadas de atores ou fatores", () => {
    comResultado(<Dinamicas />);
    expect(screen.getByRole("heading", { name: "Dinâmicas geopolíticas" })).toBeInTheDocument();
    for (const t of ["Atores e interesses", "Atores estratégicos", "Fatores em jogo", "Fatores determinantes"]) expect(screen.queryByRole("heading", { name: t })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("estrutura montada só com campos do resultado, sem trocar o tipo epistêmico de nenhuma afirmação", () => {
    const d = montarDiagnostico(r);
    const principal = r.incertezas.find((i) => i.id === r.principalIncerteza)!;
    expect(d.relevancia).toEqual(principal.porQue);
    // as implicações vêm das evidências e são leituras do analista (inferência), com a evidência de origem
    for (const a of d.implicacoes) {
      expect(a.tipo).toBe("inferencia");
      expect(r.evidencias.find((e) => e.id === a.evidencias![0])?.implicacao).toBe(a.texto);
    }
    // nas dinâmicas, cada afirmação de característica, relação ou estado atual mantém o tipo com que foi declarada
    const todas = montarDinamicas(r).flatMap((p) => p.afirmacoes);
    for (const rel of r.relacoes.filter((x) => x.presente)) {
      const achada = todas.find((a) => a.texto.endsWith(rel.presente!.texto));
      if (achada) expect(achada.tipo).toBe(rel.presente!.tipo);
    }
  });

  it("cenários: o núcleo, com um painel por futuro e tudo o que cada um precisa, sem probabilidade inventada", async () => {
    const u = userEvent.setup();
    comResultado(<Prospectiva gerando={false} aoVerNoMapa={() => {}} />);
    expect(screen.getByText(/não previsões/)).toBeInTheDocument();
    const abas = screen.getAllByRole("tab");
    expect(abas).toHaveLength(r.cenarios.length);
    expect(abas[0]).toHaveAttribute("aria-selected", "true");
    for (const t of ["Premissas", "Condições para se materializar", "O que favorece", "O que dificulta", "Riscos e incertezas", "O que obrigaria a rever este cenário"])
      expect(screen.getByRole("heading", { name: t })).toBeInTheDocument();
    expect(screen.getByText("Probabilidade").parentElement).toHaveTextContent(/não há método nem dados/);
    await u.click(abas[2]);
    expect(abas[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("article", { name: new RegExp(r.cenarios[2].nome) })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comparação das trajetórias" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Premissas e variáveis críticas" })).toBeInTheDocument();
  });

  it("enquanto os cenários são gerados, mostra o lugar deles, sem conteúdo inventado", () => {
    comResultado(<Prospectiva gerando aoVerNoMapa={() => {}} />);
    expect(screen.getByText("Construindo os cenários prospectivos")).toBeInTheDocument();
    expect(screen.queryByText(r.cenarios[0].nome)).not.toBeInTheDocument();
  });

  it("monitoramento: cada sinal diz qual cenário fortalece ou enfraquece e por quê", () => {
    comResultado(<Monitoramento />);
    expect(screen.getByRole("heading", { name: "Indicadores e monitoramento" })).toBeInTheDocument();
    const s = r.sinais[0];
    expect(screen.getByText(s.sinal)).toBeInTheDocument();
    expect(screen.getByText(s.leitura)).toBeInTheDocument();
    expect(screen.getAllByText(/fortalece|enfraquece/).length).toBeGreaterThan(0);
    expect(screen.getByText(/A revisão automática depende do motor/)).toBeInTheDocument();
  });

  it("pergunta complementar fora do que o resultado cobre: diz que não foi processada", () => {
    comResultado(<Complemento intencao="livre" />);
    expect(screen.getByText(/Esta pergunta não foi processada/)).toBeInTheDocument();
  });
});

function Local() {
  return <p data-testid="local">{useLocation().pathname}</p>;
}

describe("conversa sem motor de investigação (build normal)", () => {
  it("a pergunta abre uma conversa, a Iris diz que não pode responder e oferece guardar como rascunho", async () => {
    const u = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <ProvedorDeNotificacoes>
          <App />
          <Local />
        </ProvedorDeNotificacoes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Entenda o presente/ })).toBeInTheDocument();
    await u.type(screen.getByRole("textbox", { name: "Pergunte à Iris" }), "Como a guerra na Ucrânia afeta a segurança alimentar global?{Enter}");

    expect(screen.getByTestId("local")).toHaveTextContent(/^\/app\/conversas\//);
    expect(await screen.findByRole("heading", { name: /guerra na Ucrânia/ })).toBeInTheDocument();
    expect(await screen.findByText(/motor de investigação não está disponível/)).toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: "Guardar como rascunho" }));
    expect(screen.getByRole("link", { name: /Rascunho salvo/ })).toHaveAttribute("href", expect.stringContaining("/app/investigacoes?rascunho="));

    const menu = screen.getAllByRole("complementary", { name: "Menu lateral" })[0];
    expect(within(menu).getAllByRole("button", { name: /guerra na Ucrânia/ }).length).toBeGreaterThan(0);
  });

  it("conversa nova: sem perguntas prontas, e o horizonte escolhido embaixo do campo vai com a conversa", async () => {
    const u = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <ProvedorDeNotificacoes>
          <App />
          <Local />
        </ProvedorDeNotificacoes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Para começar")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Definir horizonte/ })).not.toBeInTheDocument();
    const grupo = screen.getByRole("group", { name: "Horizonte da análise" });
    expect(within(grupo).getByRole("radio", { name: "5 anos" })).toBeChecked();
    await u.click(within(grupo).getByRole("radio", { name: "10 anos" }));
    expect(within(grupo).getByText(`de ${new Date().getFullYear()} até ${new Date().getFullYear() + 10}`)).toBeInTheDocument();
    await u.type(screen.getByRole("textbox", { name: "Pergunte à Iris" }), "Como a OTAN pode afetar a ordem regional?{Enter}");
    expect(await screen.findByText("horizonte de 10 anos")).toBeInTheDocument();
    const salvas = JSON.parse(window.localStorage.getItem("iris:conversas:v1") ?? "[]");
    expect(salvas[0]).toMatchObject({ horizonte: 10 });
    // na pergunta seguinte o horizonte já está definido: o seletor some
    expect(screen.queryByRole("group", { name: "Horizonte da análise" })).not.toBeInTheDocument();
  });

  it("a pergunta trazida da landing (?pergunta=) entra no campo, sem ser enviada", () => {
    render(
      <MemoryRouter initialEntries={["/app?pergunta=Como%20a%20OTAN%20pode%20afetar%20a%20ordem%20regional%3F"]}>
        <ProvedorDeNotificacoes>
          <App />
          <Local />
        </ProvedorDeNotificacoes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("textbox", { name: "Pergunte à Iris" })).toHaveValue("Como a OTAN pode afetar a ordem regional?");
    expect(screen.getByTestId("local")).toHaveTextContent(/^\/app$/);
  });
});
