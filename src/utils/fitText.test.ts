import { describe, expect, it } from "vitest";
import { fitText } from "./fitText";

const options = {
  maxWidth: 400,
  maxFontSize: 120,
  minFontSize: 40,
  fontFamily: "serif",
};

describe("fitText", () => {
  it("keeps a short word on a single line at the largest size that fits", () => {
    const result = fitText("LEGUMES", options);
    expect(result.lines).toEqual(["LEGUMES"]);
    expect(result.fontSize).toBeGreaterThanOrEqual(options.minFontSize);
  });

  it("breaks a long two-word name into two lines when it can't fit on one", () => {
    const result = fitText("BATATA/PATINHO", options);
    expect(result.lines.length).toBeGreaterThanOrEqual(1);
    expect(result.lines.join("")).toContain("BATATA");
    expect(result.lines.join("")).toContain("PATINHO");
  });

  it("returns an empty single line for empty input instead of throwing", () => {
    const result = fitText("", options);
    expect(result.lines).toEqual([""]);
  });
});
