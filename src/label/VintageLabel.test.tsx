import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VintageLabel } from "./VintageLabel";

function renderLabel(name: string, weight: string, description = "") {
  const result = render(
    <VintageLabel name={name} description={description} weight={weight} illustration="auto" />
  );
  return result.container;
}

describe("VintageLabel print-safe physical dimensions", () => {
  it("keeps 40mm x 12mm, the official viewBox and proportional composition", () => {
    const container = renderLabel("Frango", "700");
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "40mm");
    expect(svg).toHaveAttribute("height", "12mm");
    expect(svg).toHaveAttribute("viewBox", "0 0 2000 600");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
  });

  it("emphasizes 700g at about 82% of the name's font size", () => {
    renderLabel("Frango", "700");
    const name = screen.getByTestId("label-name");
    const quantity = screen.getByTestId("label-quantity");
    expect(name).toHaveTextContent("FRANGO");
    expect(quantity).toHaveTextContent("700g");
    const ratio = Number(quantity.getAttribute("font-size")) / Number(name.getAttribute("font-size"));
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(0.85);
  });

  it("does not show a dangling quote and uses the correct chicken illustration", () => {
    renderLabel("Frango’", "700");
    expect(screen.getByTestId("label-name")).toHaveTextContent("FRANGO");
    expect(screen.getByTestId("label-quantity")).toHaveTextContent("700g");
    expect(screen.getByTestId("label-illustration")).toHaveAttribute(
      "href", "/assets/illustrations/frango.svg"
    );
  });

  it.each([
    ["SAL", "100", "100g", "sal.svg"],
    ["CARNE MOÍDA", "1kg", "1kg", "carne-moida.png"],
    ["PEITO DE FRANGO", "1,5kg", "1,5kg", "frango.svg"],
    ["LEITE CONDENSADO", "500ml", "500ml", "leite.svg"],
    ["CAFÉ", "2L", "2L", "cafe.svg"],
  ])("renders %s with a readable dynamic quantity and matching art", (name, amount, visible, art) => {
    const container = renderLabel(name, amount);
    expect(screen.getByTestId("label-quantity")).toHaveTextContent(visible);
    expect(screen.getByTestId("label-illustration").getAttribute("href")).toContain(art);
    expect(container.querySelectorAll('[data-testid="label-name"]').length).toBeLessThanOrEqual(2);
  });

  it("preserves an optional description separately from the quantity", () => {
    renderLabel("Patinho", "690", "moído");
    expect(screen.getByTestId("label-description")).toHaveTextContent("MOÍDO");
    expect(screen.getByTestId("label-quantity")).toHaveTextContent("690g");
  });
});
