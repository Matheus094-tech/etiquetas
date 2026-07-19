import { describe, expect, it } from "vitest";
import { detectIllustrationFromName, selectIllustration } from "./selectIllustration";

describe("detectIllustrationFromName", () => {
  it("detects vegetables from keywords", () => {
    expect(detectIllustrationFromName("Legumes")).toBe("vegetables");
    expect(detectIllustrationFromName("Verdura")).toBe("vegetables");
  });

  it("detects ground beef from keywords, accents included", () => {
    expect(detectIllustrationFromName("Patinho")).toBe("ground-beef");
    expect(detectIllustrationFromName("Carne moída")).toBe("ground-beef");
    expect(detectIllustrationFromName("Carne moida")).toBe("ground-beef");
  });

  it("prefers potato-beef when both potato and beef keywords are present", () => {
    expect(detectIllustrationFromName("Batata/Patinho")).toBe("potato-beef");
    expect(detectIllustrationFromName("Batata com carne")).toBe("potato-beef");
  });

  it("detects chicken, rice and beans", () => {
    expect(detectIllustrationFromName("Frango")).toBe("chicken");
    expect(detectIllustrationFromName("Arroz")).toBe("rice");
    expect(detectIllustrationFromName("Feijão")).toBe("beans");
    expect(detectIllustrationFromName("Feijao")).toBe("beans");
  });

  it("falls back to none when nothing matches", () => {
    expect(detectIllustrationFromName("Macarrão")).toBe("none");
  });

  it("treats empty names as no match", () => {
    expect(detectIllustrationFromName("")).toBe("none");
  });
});

describe("selectIllustration", () => {
  it("uses automatic detection when manual selection is 'auto'", () => {
    expect(selectIllustration("Legumes", "auto")).toBe("vegetables");
  });

  it("lets a manual selection override automatic detection", () => {
    expect(selectIllustration("Legumes", "chicken")).toBe("chicken");
    expect(selectIllustration("Patinho", "none")).toBe("none");
  });
});
