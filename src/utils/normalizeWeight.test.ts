import { describe, expect, it } from "vitest";
import { formatWeightForDisplay, formatWeightLabel, normalizeWeight } from "./normalizeWeight";

describe("normalizeWeight and backward compatibility", () => {
  it.each([
    ["690", "690"],
    ["690g", "690"],
    ["690G", "690"],
    [" 690 g ", "690"],
    ["0690", "690"],
    ["1.5", "1.5"],
    ["1,5", "1.5"],
    ["1,5kg", "1.5kg"],
    ["500ml", "500ml"],
    ["2L", "2L"],
    ["100g", "100"],
    ["", ""],
    ["g", ""],
    ["abc", ""],
    ["50xyz", ""],
  ])("normalizes %s as %s", (input, expected) => {
    expect(normalizeWeight(input)).toBe(expected);
  });
});

describe("formatting for print", () => {
  it.each([
    ["690", "690g"],
    ["690 g", "690g"],
    ["100g", "100g"],
    ["1.5kg", "1,5kg"],
    ["1,5kg", "1,5kg"],
    ["500ml", "500ml"],
    ["2L", "2L"],
    ["", ""],
  ])("formats %s as %s", (input, expected) => {
    expect(formatWeightLabel(input)).toBe(expected);
  });

  it("uses Brazilian thousands grouping only on whole values", () => {
    expect(formatWeightForDisplay("690g")).toBe("690g");
    expect(formatWeightForDisplay("1560g")).toBe("1.560g");
    expect(formatWeightForDisplay("1000g")).toBe("1.000g");
    expect(formatWeightForDisplay("1,5kg")).toBe("1,5kg");
    expect(formatWeightForDisplay("")).toBe("");
  });
});
