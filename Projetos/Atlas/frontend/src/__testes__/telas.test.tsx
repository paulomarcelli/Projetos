import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Resultado as R } from "../api/tipos";
import { Comparar } from "../paginas/Comparar";
import { Execucao } from "../paginas/Execucao";
import { Historico } from "../paginas/Historico";
import { NovaSimulacao } from "../paginas/NovaSimulacao";
import { Resultado } from "../paginas/Resultado";
import casos from "../teste/fixtures/casos.json";
import comparacao from "../teste/fixtures/comparacao.json";
import eventos from "../teste/fixtures/eventos.json";
import resultado from "../teste/fixtures/resultado-demo.json";
import { mockFetch, renderEm } from "../teste/util";

const RES = resultado as unknown as R;
const resumo = (id: string, titulo: string) => ({ id, criada_em: "2026-10-25T10:00:00+00:00", status: "concluida", caso_id: "eua-china-tarifas", titulo, horizonte_meses: 12, modo: { ia: "demo", busca: "demo", demonstrativo: true }, confianca: "baixo", base_id: null });

describe("Nova simulação", () => {
  it("monta os controles do caso e envia a configuração completa", async () => {
    const chamadas = mockFetch([
      { caminho: /\/api\/casos$/, resposta: casos },
      { metodo: "POST", caminho: /\/api\/simulacoes$/, resposta: { id: "abc123", status: "pendente" }, status: 202 },
    ]);
    const u = userEvent.setup();
    renderEm("/nova?caso=eua-china-tarifas", "/nova", <NovaSimulacao />, [{ caminho: "/simulacoes/:id/execucao", elemento: <p>tela de execução</p> }]);
    const tarifa = await screen.findByLabelText(/tarifa/i, { selector: "input" });
    expect(screen.getByText(/Análise condicional, não previsão/)).toBeInTheDocument();
    const maximo = casos.find((c) => c.id === "eua-china-tarifas")!.variaveis.find((v) => v.id === "tarifa")!.maximo;
    fireEvent.change(tarifa, { target: { value: String(maximo) } });
    await u.click(screen.getByRole("radio", { name: "24 meses" }));
    await u.type(screen.getByLabelText("Nova premissa"), "Sem recessão global{Enter}");
    await u.click(screen.getByRole("button", { name: "Executar simulação" }));
    await screen.findByText("tela de execução");
    const post = chamadas.find((c) => c.metodo === "POST")!;
    const corpo = post.corpo as { caso_id: string; valores: Record<string, number>; horizonte_meses: number; premissas_extra: string[] };
    const caso = casos.find((c) => c.id === "eua-china-tarifas")!;
    expect(corpo.caso_id).toBe("eua-china-tarifas");
    expect(Object.keys(corpo.valores).sort()).toEqual(caso.variaveis.map((v) => v.id).sort());
    expect(corpo.valores.tarifa).toBe(caso.variaveis.find((v) => v.id === "tarifa")!.maximo);
    expect(corpo.horizonte_meses).toBe(24);
    expect(corpo.premissas_extra).toEqual(["Sem recessão global"]);
  });

  it("caso personalizado exige descrição mínima", async () => {
    mockFetch([
      { caminho: /\/api\/casos$/, resposta: casos },
      { caminho: /\/api\/casos\/personalizado$/, resposta: { ...casos[0], id: "personalizado", personalizado: true, atores: [] } },
    ]);
    const u = userEvent.setup();
    renderEm("/nova?caso=personalizado", "/nova", <NovaSimulacao />);
    const botao = await screen.findByRole("button", { name: "Executar simulação" });
    expect(botao).toBeDisabled();
    await u.type(screen.getByLabelText(/Situação/), "Disputa entre dois países por rotas marítimas no Ártico.");
    expect(botao).toBeEnabled();
  });

  it("mostra a mensagem do servidor quando a validação falha", async () => {
    mockFetch([
      { caminho: /\/api\/casos$/, resposta: casos },
      { metodo: "POST", caminho: /\/api\/simulacoes$/, resposta: { detail: "Limite diário de 40 simulações com IA atingido (protege a cota gratuita)." }, status: 429 },
    ]);
    const u = userEvent.setup();
    renderEm("/nova?caso=sancoes-russia", "/nova", <NovaSimulacao />);
    await u.click(await screen.findByRole("button", { name: "Executar simulação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Limite diário de 40");
  });
});

describe("Resultado", () => {
  it("separa fatos, interpretações, premissas e hipóteses e identifica o modo demonstrativo", async () => {
    mockFetch([{ caminho: /\/api\/simulacoes\/x1$/, resposta: RES }]);
    renderEm("/simulacoes/x1", "/simulacoes/:id", <Resultado />);
    expect(await screen.findByRole("heading", { level: 1, name: RES.caso.titulo })).toBeInTheDocument();
    expect(screen.getAllByText("Modo demonstrativo").length).toBeGreaterThan(0);
    expect(screen.getByText(/MODO DEMONSTRATIVO/)).toBeInTheDocument();
    expect(screen.getByText(/Análise condicional, não previsão/)).toBeInTheDocument();
    expect(screen.queryAllByText("Fato verificado", { selector: "span" })).toHaveLength(0); // demo nunca produz fatos
    expect(screen.getAllByText("Hipótese").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Premissa").length).toBeGreaterThan(0);
    expect(screen.getByText("Nenhuma fonte coletada.")).toBeInTheDocument();
    const abas = screen.getAllByRole("tab");
    expect(abas.map((a) => a.textContent)).toEqual([expect.stringContaining("Continuidade"), expect.stringContaining("Escalada"), expect.stringContaining("Desescalada")]);
    expect(screen.getByText(/Como os índices são calculados/)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /Matriz de probabilidade/ })).toBeInTheDocument();
  });

  it("troca o cenário exibido", async () => {
    mockFetch([{ caminho: /\/api\/simulacoes\/x1$/, resposta: RES }]);
    const u = userEvent.setup();
    renderEm("/simulacoes/x1", "/simulacoes/:id", <Resultado />);
    await u.click(await screen.findByRole("tab", { name: /Escalada/ }));
    const titulo = RES.analise!.cenarios.find((c) => c.tipo === "escalada")!.titulo;
    expect(within(screen.getByRole("tabpanel")).getByText(titulo)).toBeInTheDocument();
  });

  it("aguenta dados extremos (break-ui): títulos longos, listas vazias e sem análise", async () => {
    const longo = "Escalada-tarifária-sem-espaços-".repeat(12);
    const extremo: R = { ...RES, status: "falhou", analise: null, erro: "analyst: A cota diária do plano gratuito foi atingida.", caso: { ...RES.caso, titulo: longo }, verificacoes: [], avisos: [] };
    mockFetch([{ caminho: /\/api\/simulacoes\/x2$/, resposta: extremo }]);
    renderEm("/simulacoes/x2", "/simulacoes/:id", <Resultado />);
    expect(await screen.findByText("Sem análise")).toBeInTheDocument();
    expect(screen.getByText(/cota diária/)).toBeInTheDocument();
    expect(screen.getByText(/O Verifier não chegou a rodar/)).toBeInTheDocument();
  });

  it("mostra fontes reais com link seguro", async () => {
    const comFonte: R = { ...RES, modo: { ia: "gemini", busca: "tavily", demonstrativo: false }, evidencias: { ...RES.evidencias!, pesquisa_real: true, fontes: [{ id: "F1", titulo: "USTR anuncia tarifas", url: "https://ustr.gov/a", publicador: "ustr.gov", data_publicacao: null, data_consulta: "2026-10-25T00:00:00+00:00", trecho: "", consulta: "q", demonstrativa: false }, { id: "F2", titulo: "Link malicioso", url: "javascript:alert(1)", publicador: null, data_publicacao: null, data_consulta: "2026-10-25T00:00:00+00:00", trecho: "", consulta: "q", demonstrativa: false }] } };
    mockFetch([{ caminho: /\/api\/simulacoes\/x3$/, resposta: comFonte }]);
    renderEm("/simulacoes/x3", "/simulacoes/:id", <Resultado />);
    const link = await screen.findByRole("link", { name: "USTR anuncia tarifas" });
    expect(link).toHaveAttribute("href", "https://ustr.gov/a");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.queryByRole("link", { name: "Link malicioso" })).toBeNull();
    expect(screen.getAllByText(/data não informada/).length).toBe(2);
  });
});

describe("Execução", () => {
  it("acompanha os eventos e mostra o estado de cada agente", async () => {
    const chamadas = mockFetch([
      { caminho: /\/eventos\?desde=0$/, resposta: eventos },
      { caminho: /\/eventos\?desde=\d+$/, resposta: [] },
      { caminho: /\/api\/simulacoes\/x1$/, resposta: { ...RES, status: "parcial", erro: null } },
    ]);
    renderEm("/simulacoes/x1/execucao", "/simulacoes/:id/execucao", <Execucao />);
    expect(await screen.findByText("Execução concluída com pendências")).toBeInTheDocument();
    expect(screen.getAllByText("Concluído")).toHaveLength(3);
    expect(screen.getByRole("list", { name: "Eventos da execução" }).children).toHaveLength(eventos.length);
    expect(chamadas[0].url).toContain("desde=0");
  });
});

describe("Histórico e comparação", () => {
  it("só habilita a comparação com duas simulações marcadas e confirma exclusão na própria tela", async () => {
    const chamadas = mockFetch([
      { caminho: /\/api\/simulacoes$/, resposta: [resumo("a1", "Tarifas EUA–China"), resumo("b2", "Tarifas EUA–China (revisão)"), resumo("c3", "Sanções")] },
      { metodo: "DELETE", caminho: /\/api\/simulacoes\/c3$/, resposta: null, status: 204 },
    ]);
    const u = userEvent.setup();
    renderEm("/historico", "/historico", <Historico />);
    const comparar = await screen.findByRole("button", { name: /Comparar/ });
    expect(comparar).toBeDisabled();
    await u.click(screen.getByLabelText(/Selecionar Tarifas EUA–China para/));
    await u.click(screen.getByLabelText(/Selecionar Tarifas EUA–China \(revisão\)/));
    expect(comparar).toBeEnabled();
    await u.click(screen.getByRole("button", { name: "Excluir Sanções" }));
    await u.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    await waitFor(() => expect(screen.queryByText("Sanções")).toBeNull());
    expect(chamadas.some((c) => c.metodo === "DELETE")).toBe(true);
  });

  it("compara simulações com o aviso de que não há causalidade demonstrada", async () => {
    mockFetch([
      { caminho: /\/api\/simulacoes$/, resposta: [resumo("a1", "A"), resumo("b2", "B")] },
      { caminho: /\/api\/comparar/, resposta: comparacao },
    ]);
    renderEm("/comparar?a=a1&b=b2", "/comparar", <Comparar />);
    expect(await screen.findByText(/não demonstra que uma mudança de variável/)).toBeInTheDocument();
    expect(screen.getByText("Conclusões que mudaram")).toBeInTheDocument();
    expect(screen.getByText("Propensão de escalada")).toBeInTheDocument();
  });
});
