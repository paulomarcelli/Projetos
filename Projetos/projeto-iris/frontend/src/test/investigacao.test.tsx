import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { PaginaDaInvestigacao, ResultadoInvestigacao } from "../pages/ResultadoInvestigacao";
import { INVESTIGACAO_EXEMPLO } from "../previa/investigacao-exemplo";

describe("resultado de investigação", () => {
  it("fora da prévia, todo endereço leva ao estado vazio (não há motor)", () => {
    render(
      <MemoryRouter initialEntries={["/app/investigacoes/exemplo-flavio-2026"]}>
        <Routes>
          <Route path="/app/investigacoes/:id" element={<PaginaDaInvestigacao />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Investigação não encontrada")).toBeInTheDocument();
  });

  it("marca a simulação, numera as fontes e troca a trajetória exibida", async () => {
    render(
      <MemoryRouter>
        <ResultadoInvestigacao r={INVESTIGACAO_EXEMPLO} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Contrafactual: este caminho não aconteceu")).toBeInTheDocument();
    expect(screen.getAllByText("Simulação ilustrativa, elaborada manualmente").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Fonte 1:/ }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Trajetória A: Pragmatismo alinhado/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /^B: / })[0]);
    expect(screen.getByText(/Trajetória B: Alinhamento hemisférico/)).toBeInTheDocument();
    // nenhuma porcentagem atribuída às trajetórias
    for (const t of INVESTIGACAO_EXEMPLO.trajetorias) expect(t.resumo).not.toMatch(/%/);
  });
});
