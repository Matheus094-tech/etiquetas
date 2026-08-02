import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VintageLabel } from "./VintageLabel";

describe("VintageLabel physical dimensions", () => {
  it("keeps the official 40mm x 12mm size and 2000x600 viewBox", () => {
    const { container } = render(
      <VintageLabel name="Feijão" description="cozido" weight="500" illustration="none" />
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("width", "40mm");
    expect(svg).toHaveAttribute("height", "12mm");
    expect(svg).toHaveAttribute("viewBox", "0 0 2000 600");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
  });
});
