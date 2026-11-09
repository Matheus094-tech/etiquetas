import { describe, expect, it } from "vitest";
import { cleanLabelName } from "./cleanLabelName";

describe("cleanLabelName", () => {
  it("removes only an unmatched trailing typographic quote", () => {
    expect(cleanLabelName(" FRANGO’ ")).toBe("FRANGO");
  });

  it("preserves internal legitimate apostrophes and normal text", () => {
    expect(cleanLabelName("D’ÁVILA")).toBe("D’ÁVILA");
    expect(cleanLabelName("D'ÁVILA")).toBe("D'ÁVILA");
    expect(cleanLabelName("O'BRIEN")).toBe("O'BRIEN");
    expect(cleanLabelName("FRANGO")).toBe("FRANGO");
  });

  it("never silently strips ordinary trailing apostrophes", () => {
    expect(cleanLabelName("D'")).toBe("D'");
  });
});
