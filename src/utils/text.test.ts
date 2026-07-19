import { describe, expect, it } from "vitest";
import { slugify, stripAccents } from "./text";

describe("stripAccents", () => {
  it("removes accents from vowels and consonants", () => {
    expect(stripAccents("moído")).toBe("moido");
    expect(stripAccents("feijão")).toBe("feijao");
    expect(stripAccents("legumes")).toBe("legumes");
  });

  it("preserves case", () => {
    expect(stripAccents("BATATA/PATINHO")).toBe("BATATA/PATINHO");
  });
});

describe("slugify", () => {
  it("lowercases and removes accents", () => {
    expect(slugify("Moído")).toBe("moido");
  });

  it("replaces slashes with hyphens instead of dropping them", () => {
    expect(slugify("Batata/Patinho")).toBe("batata-patinho");
  });

  it("collapses invalid characters into single hyphens and trims edges", () => {
    expect(slugify("  Frango & Legumes!! ")).toBe("frango-legumes");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("///")).toBe("");
  });
});
