import { describe, expect, it } from "vitest";
import { formatWeightLabel, normalizeWeight } from "./normalizeWeight";

describe("normalizeWeight", () => {
  it("keeps a plain numeric string untouched", () => {
    expect(normalizeWeight("690")).toBe("690");
  });

  it("strips a pasted unit suffix", () => {
    expect(normalizeWeight("690g")).toBe("690");
    expect(normalizeWeight("690G")).toBe("690");
  });

  it("strips whitespace between the number and the unit", () => {
    expect(normalizeWeight(" 690 g ")).toBe("690");
  });

  it("removes leading zeros", () => {
    expect(normalizeWeight("0690")).toBe("690");
  });

  it("handles decimal weights using either separator", () => {
    expect(normalizeWeight("1.5")).toBe("1.5");
    expect(normalizeWeight("1,5")).toBe("1.5");
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeWeight("")).toBe("");
  });

  it("returns an empty string when no digits are present", () => {
    expect(normalizeWeight("g")).toBe("");
    expect(normalizeWeight("abc")).toBe("");
  });
});

describe("formatWeightLabel", () => {
  it("appends the unit to a valid weight", () => {
    expect(formatWeightLabel("690")).toBe("690g");
  });

  it("normalizes before formatting", () => {
    expect(formatWeightLabel("690 g")).toBe("690g");
  });

  it("returns an empty string for empty input", () => {
    expect(formatWeightLabel("")).toBe("");
  });
});
