import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("símbolo tem nome acessível e as três estrelas", () => {
    const { container } = render(<Logo />);
    expect(screen.getByRole("img", { name: "F.R.E.Y.A." })).toBeInTheDocument();
    expect(container.querySelectorAll("path")).toHaveLength(3);
  });

  it("completa mostra a palavra e mantém um único nome acessível", () => {
    render(<Logo variante="completa" />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "F.R.E.Y.A." })).toHaveTextContent("F.R.E.Y.A.");
  });

  it("decorativa (titulo vazio) sai da árvore de acessibilidade", () => {
    render(<Logo titulo="" />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("mantém a proporção do original", () => {
    const { container } = render(<Logo tamanho={100} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 686 659");
    expect(Number(svg.getAttribute("width"))).toBeCloseTo(104.1, 1);
  });
});
