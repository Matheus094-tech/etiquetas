import { describe, expect, it } from "vitest";
import { formatWeightForDisplay, formatWeightLabel, normalizeWeight } from "./normalizeWeight";

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

describe("formatWeightForDisplay", () => {
  it("leaves small weights untouched", () => {
    expect(formatWeightForDisplay("690g")).toBe("690g");
    expect(formatWeightForDisplay("475g")).toBe("475g");
  });

  it("adds a Brazilian thousands separator for weights at or above 1000", () => {
    expect(formatWeightForDisplay("1560g")).toBe("1.560g");
    expect(formatWeightForDisplay("1000g")).toBe("1.000g");
  });

  it("returns the input untouched when it has no leading digits", () => {
    expect(formatWeightForDisplay("")).toBe("");
  });
});
