import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SECOES } from "../components/analysis";
import { tituloDaFonte } from "../components/analysis/Evidencias";
import * as servicos from "../services";
import type { Investigacao } from "../types/api";
import { fixtures, montar } from "./apoioDeTeste";

vi.mock("../services", async (original) => {
  const real = await original<typeof import("../services")>();
  return {
    ...real,
    acompanharInvestigacao: vi.fn(),
    obterGrafo: vi.fn(),
    obterEvidencia: vi.fn(),
    criarInvestigacao: vi.fn(),
    excluirInvestigacao: vi.fn(),
    guardarInvestigacao: vi.fn(),
    desguardarInvestigacao: vi.fn(),
    listarInvestigacoes: vi.fn(async () => []),
    obterSaude: vi.fn(async () => ({ status: "ok", motor: "modelo", modelo: null, grafo: "x", base: null })),
  };
});

const s = vi.mocked(servicos);

/** o acompanhamento entrega a investigação na hora (e guarda o retorno para "avançar" o estado) */
function entregar(inv: Investigacao) {
  let ao: ((i: Investigacao) => void) | null = null;
  s.acompanharInvestigacao.mockImplementation((_id, aoAtualizar) => {
    ao = aoAtualizar;
    queueMicrotask(() => aoAtualizar(inv));
    return { cancelar: vi.fn() };
  });
  return (i: Investigacao) => ao?.(i);
}

beforeEach(() => {
  localStorage.clear();
  s.obterGrafo.mockImplementation(async (id) => (id === "e94eec4fda3c" ? fixtures.grafoFora() : fixtures.grafo()));
});
afterEach(() => vi.clearAllMocks());

describe("A análise — em execução", () => {
  it("mostra as etapas ao vivo com os números de cada uma e não pede o grafo", async () => {
    const inv = fixtures.investigacao();
    const rodando: Investigacao = {
      ...inv,
      estado: "analisando",
      analise: null,
      grafo: null,
      etapas: [inv.etapas[0], { nome: "analise", inicio: inv.etapas[1].inicio, fim: null, resumo: {} }],
    };
    const avancar = entregar(rodando);
    montar(`/analises/${inv.id}`);

    expect(await screen.findByRole("heading", { name: "A F.R.E.Y.A. está investigando" })).toBeInTheDocument();
    expect(screen.getByText("Análise prospectiva em andamento")).toBeInTheDocument();
    expect(screen.getByText(/costuma levar cerca de um minuto/)).toBeInTheDocument();
    // a recuperação terminou e mostra o que devolveu
    expect(screen.getByText("8 trechos recuperados")).toBeInTheDocument();
    expect(screen.getByText("99 nós e 169 arestas")).toBeInTheDocument();
    expect(screen.getByText(/focais: Thor Thor Odinson, Loki/)).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Análise prospectiva");
    // excluir fica desligado enquanto roda; o grafo ainda não existe
    expect(screen.getByRole("button", { name: "Excluir" })).toBeDisabled();
    expect(s.obterGrafo).not.toHaveBeenCalled();

    // terminou: o acompanhamento entrega a concluída e a página troca para a análise
    avancar(inv);
    expect(await screen.findByRole("tab", { name: /Análise estruturada/ })).toBeInTheDocument();
    await waitFor(() => expect(s.obterGrafo).toHaveBeenCalledWith(inv.id, expect.anything()));
  });

  it("falhou: mostra o erro com honestidade e só cria outra se a pessoa pedir", async () => {
    const inv = fixtures.investigacao();
    entregar({ ...inv, estado: "falhou", analise: null, erro: "O motor de análise não respondeu (tempo esgotado).", etapas: [inv.etapas[0]] });
    s.criarInvestigacao.mockResolvedValue({ id: "novo123", estado: "pendente", acompanhar: "/investigacoes/novo123" });
    const { roteador } = montar(`/analises/${inv.id}`);
    expect(await screen.findByText("O motor de análise não respondeu (tempo esgotado).")).toBeInTheDocument();
    expect(s.criarInvestigacao).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo (nova análise)" }));
    expect(s.criarInvestigacao).toHaveBeenCalledWith(inv.questao, inv.horizonte);
    await waitFor(() => expect(roteador.state.location.pathname).toBe("/analises/novo123"));
  });
});

describe("A análise — concluída", () => {
  it("as 9 seções na ordem, com selos epistêmicos", async () => {
    const inv = fixtures.investigacao();
    entregar(inv);
    montar(`/analises/${inv.id}`);
    await screen.findByRole("tab", { name: /Análise estruturada/ });
    const painel = screen.getByRole("tabpanel");
    const titulos = within(painel)
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(titulos).toEqual(SECOES.map((x) => x.titulo));
    const nav = screen.getByRole("navigation", { name: "Seções da análise" });
    expect(within(nav).getAllByRole("link")).toHaveLength(9);

    // cada afirmação tem selo: contexto do Thor/Loki tem os três tipos na análise
    expect(within(painel).getAllByText("Confirmado").length).toBeGreaterThan(5);
    expect(within(painel).getAllByText("Inferência").length).toBeGreaterThan(3);
    expect(within(painel).getAllByText("Hipótese").length).toBeGreaterThan(3);
    // atores com o rótulo do grafo, não o id
    await waitFor(() => expect(within(painel).getByRole("heading", { level: 3, name: "Thor" })).toBeInTheDocument());
    // limitações e validação
    expect(within(painel).getByText(/O dossiê não confirma nenhum reencontro/)).toBeInTheDocument();
    expect(within(painel).getByText("Todas as afirmações passaram pela validação sem ajustes.")).toBeInTheDocument();
    // não é um assunto fora do domínio
    expect(screen.queryByText("Pouca sustentação nas fontes")).not.toBeInTheDocument();
  });

  it("chip de evidência abre a gaveta com o texto literal e a fonte, sem sair da página", async () => {
    const inv = fixtures.investigacao();
    entregar(inv);
    const { roteador } = montar(`/analises/${inv.id}`);
    await screen.findByRole("tab", { name: /Análise estruturada/ });
    const chip = screen.getAllByRole("button", { name: /^Evidência E156/ })[0];
    await userEvent.click(chip);
    const gaveta = await screen.findByRole("dialog", { name: "Evidência E156" });
    const ev = inv.evidencias.E156;
    expect(within(within(gaveta).getByRole("region", { name: "Fonte" })).getByText(tituloDaFonte(ev.fonte))).toBeInTheDocument();
    expect(within(gaveta).getByText((_, el) => el?.tagName === "BLOCKQUOTE" && el.textContent === ev.texto)).toBeInTheDocument();
    const link = within(gaveta).getByRole("link", { name: /abre em outra aba/ });
    expect(link).toHaveAttribute("href", ev.fonte.url);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    expect(within(gaveta).getByText(/Fonte oficial|Wiki de fãs|Enciclopédia/)).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe(`/analises/${inv.id}`);
    await userEvent.click(within(gaveta).getByRole("button", { name: "Fechar evidência" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Evidência E156" })).not.toBeInTheDocument());
  });

  it("cenário: aprofundar mostra premissas, desenvolvimento, consequências e sinais; ver no grafo destaca", async () => {
    const inv = fixtures.investigacao();
    entregar(inv);
    const { roteador } = montar(`/analises/${inv.id}`);
    await screen.findByRole("tab", { name: /Análise estruturada/ });
    const c1 = document.querySelector('[data-cenario="C1"]') as HTMLElement;
    expect(within(c1).getByRole("heading", { name: "Luto sem reencontro demonstrado" })).toBeInTheDocument();
    expect(within(c1).queryByText("Premissas")).not.toBeInTheDocument();
    const aprofundar = within(c1).getByRole("button", { name: "Aprofundar" });
    await userEvent.click(aprofundar);
    expect(aprofundar).toHaveAttribute("aria-expanded", "true");
    for (const t of ["Premissas", "Desenvolvimento", "Consequências", "Sinais a observar"]) expect(within(c1).getByRole("heading", { name: new RegExp(`^${t}`) })).toBeInTheDocument();
    expect(within(c1).getByText(inv.analise!.cenarios[0].premissas[0].texto)).toBeInTheDocument();

    await waitFor(() => expect(within(c1).getByRole("button", { name: "Ver no grafo" })).toBeInTheDocument());
    await userEvent.click(within(c1).getByRole("button", { name: "Ver no grafo" }));
    await waitFor(() => expect(roteador.state.location.search).toBe("?aba=grafo"));
    expect(await screen.findByText("Cenário C1: Luto sem reencontro demonstrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /C1\s*Luto sem reencontro/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("guardar é otimista e volta atrás se a API recusar; excluir pede confirmação", async () => {
    const inv = fixtures.investigacao();
    entregar(inv);
    s.guardarInvestigacao.mockRejectedValueOnce(new servicos.ErroDaApi("indisponivel", "fora"));
    s.excluirInvestigacao.mockResolvedValue(undefined);
    const { roteador } = montar(`/analises/${inv.id}`);
    const guardar = await screen.findByRole("button", { name: "Guardar" });
    await userEvent.click(guardar);
    expect(await screen.findByText(/Não consegui guardar: a API não respondeu/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("aria-pressed", "false");

    s.guardarInvestigacao.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("button", { name: "Remover dos guardados" })).toHaveAttribute("aria-pressed", "true");
    expect(s.guardarInvestigacao).toHaveBeenCalledWith(inv.id);

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const dialogo = await screen.findByRole("alertdialog", { name: "Excluir esta análise?" });
    expect(s.excluirInvestigacao).not.toHaveBeenCalled();
    await userEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));
    expect(s.excluirInvestigacao).toHaveBeenCalledWith(inv.id);
    await waitFor(() => expect(roteador.state.location.pathname).toBe("/historico"));
  });

  it("fora do domínio (China/Taiwan): aviso calmo derivado dos dados e grafo vazio explicado", async () => {
    const inv = fixtures.investigacaoFora();
    entregar(inv);
    const { roteador } = montar(`/analises/${inv.id}`);
    const aviso = await screen.findByRole("complementary", { name: "Pouca sustentação nas fontes" });
    expect(within(aviso).getByText(/A base da F\.R\.E\.Y\.A\. cobre o MCU; esta questão tem pouca sustentação nas fontes/)).toBeInTheDocument();
    expect(within(aviso).getByText(/o grafo tem uma entidade e nenhuma relação/)).toBeInTheDocument();
    expect(within(aviso).getByText(/só 8 trechos foram recuperados/)).toBeInTheDocument();
    // as 6 limitações e a validação com rebaixadas/removidas
    const painel = screen.getByRole("tabpanel");
    expect(within(painel).getByRole("heading", { name: /^Limitações/ })).toHaveTextContent("6");
    expect(within(painel).getByText("Rebaixadas").nextElementSibling).toHaveTextContent("15");
    expect(within(painel).getByText("Removidas").nextElementSibling).toHaveTextContent("2");

    await userEvent.click(screen.getByRole("tab", { name: /Grafo/ }));
    expect(roteador.state.location.search).toBe("?aba=grafo");
    expect(await screen.findByText("Sem relações para explorar")).toBeInTheDocument();
    expect(screen.getByText(/ligando China a outras entidades do MCU/)).toBeInTheDocument();
  });

  it("análise inexistente: mensagem própria, sem quebrar", async () => {
    s.acompanharInvestigacao.mockImplementation((_id, _ao, aoErro) => {
      queueMicrotask(() => aoErro?.(new servicos.ErroDaApi("nao_encontrado", "investigação não encontrada", 404)));
      return { cancelar: vi.fn() };
    });
    montar("/analises/naoexiste");
    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("Análise não encontrada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o histórico" })).toBeInTheDocument();
  });
});
