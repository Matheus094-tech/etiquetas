import { describe, expect, it } from "vitest";
import { fitText } from "./fitText";

const options = {
  maxWidth: 400,
  maxFontSize: 120,
  minFontSize: 40,
  fontFamily: "serif",
};

describe("fitText", () => {
  it("keeps a short name in one line", () => {
    expect(fitText("SAL", options).lines).toEqual(["SAL"]);
  });

  it("splits when a two-line composition is physically more legible", () => {
    const result = fitText("LEITE CONDENSADO", { ...options, maxTwoLineFontSize: 100 });
    expect(result.lines.join(" ")).toBe("LEITE CONDENSADO");
    expect(result.lines.length).toBeLessThanOrEqual(2);
  });

  it("never returns a clipped long unbroken name at the preferred minimum", () => {
    const result = fitText("SUPERCALIFRAGILISTICAMENTE", { ...options, allowWrap: false });
    expect(result.lines).toEqual(["SUPERCALIFRAGILISTICAMENTE"]);
    expect(result.fontSize).toBeLessThan(options.minFontSize);
  });

  it("supports nonwrapped quantities", () => {
    expect(fitText("1,5kg", { ...options, allowWrap: false }).lines).toEqual(["1,5kg"]);
  });

  it("handles empty input", () => {
    expect(fitText("", options)).toEqual({ lines: [""], fontSize: 120 });
  });
});
