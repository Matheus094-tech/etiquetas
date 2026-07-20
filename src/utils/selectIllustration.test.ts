import { describe, expect, it } from "vitest";
import { detectIllustrationFromName, selectIllustration } from "./selectIllustration";

describe("detectIllustrationFromName", () => {
  it("detects legumes from keywords", () => {
    expect(detectIllustrationFromName("Legumes")).toBe("legumes");
    expect(detectIllustrationFromName("Verdura")).toBe("legumes");
  });

  it("detects carne-moida from keywords, accents included", () => {
    expect(detectIllustrationFromName("Patinho")).toBe("carne-moida");
    expect(detectIllustrationFromName("Carne moída")).toBe("carne-moida");
    expect(detectIllustrationFromName("Carne moida")).toBe("carne-moida");
  });

  it("matches the batata/patinho phrase before the more general carne-com-batata rule", () => {
    expect(detectIllustrationFromName("Batata/Patinho")).toBe("batata-patinho");
    expect(detectIllustrationFromName("Batata patinho")).toBe("batata-patinho");
  });

  it("detects carne-com-batata when batata appears together with a beef term", () => {
    expect(detectIllustrationFromName("Carne com Batata")).toBe("carne-com-batata");
    expect(detectIllustrationFromName("Batata com carne")).toBe("carne-com-batata");
  });

  it("detects fruta-coloral from keywords", () => {
    expect(detectIllustrationFromName("Banana")).toBe("fruta-coloral");
    expect(detectIllustrationFromName("Coloral")).toBe("fruta-coloral");
    expect(detectIllustrationFromName("Maçã")).toBe("fruta-coloral");
  });

  it("considers the description when matching", () => {
    expect(detectIllustrationFromName("Bife", "carne bovina")).toBe("carne-moida");
    expect(detectIllustrationFromName("Prato do dia", "legumes variados")).toBe("legumes");
  });

  it("falls back to the default ornament when nothing matches", () => {
    expect(detectIllustrationFromName("Frango")).toBe("default");
    expect(detectIllustrationFromName("Arroz")).toBe("default");
    expect(detectIllustrationFromName("")).toBe("default");
  });
});

describe("selectIllustration", () => {
  it("uses automatic detection when manual selection is 'auto'", () => {
    expect(selectIllustration("Legumes", "", "auto")).toBe("legumes");
  });

  it("lets a manual selection override automatic detection", () => {
    expect(selectIllustration("Legumes", "", "carne-moida")).toBe("carne-moida");
    expect(selectIllustration("Patinho", "", "none")).toBe("none");
  });
});
