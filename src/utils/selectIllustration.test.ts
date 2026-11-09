import { describe, expect, it } from "vitest";
import { detectIllustrationFromName, selectIllustration } from "./selectIllustration";

describe("automatic food illustrations", () => {
  it.each([
    ["Frango", "frango"],
    ["Peito de frango", "frango"],
    ["FRANGO’", "frango"],
    ["Carne bovina", "carne-bovina"],
    ["Bife", "carne-bovina"],
    ["Carne moída", "carne-moida"],
    ["Patinho", "carne-moida"],
    ["Batata/Patinho", "batata-patinho"],
    ["Carne com batata", "carne-com-batata"],
    ["Arroz", "arroz"],
    ["Feijão", "feijao"],
    ["Café", "cafe"],
    ["Açúcar", "acucar"],
    ["Macarrão", "macarrao"],
    ["Sal", "sal"],
    ["Leite condensado", "leite"],
    ["Legumes", "legumes"],
    ["Banana", "fruta-coloral"],
  ] as const)("maps %s to %s", (name, expected) => {
    expect(detectIllustrationFromName(name)).toBe(expected);
  });

  it("does not treat a substring as a keyword", () => {
    expect(detectIllustrationFromName("Salsicha")).toBe("default");
    expect(detectIllustrationFromName("Cafeteira")).toBe("default");
  });

  it("only consults the description if the name has no matching product", () => {
    expect(detectIllustrationFromName("Peito de frango", "com batata")).toBe("frango");
    expect(detectIllustrationFromName("Prato do dia", "legumes variados")).toBe("legumes");
    expect(detectIllustrationFromName("Bife", "carne bovina")).toBe("carne-bovina");
  });

  it("uses the neutral fallback for unmapped products", () => {
    expect(detectIllustrationFromName("")).toBe("default");
    expect(detectIllustrationFromName("Produto sem categoria")).toBe("default");
  });

  it("honors manual selection and none", () => {
    expect(selectIllustration("Frango", "", "auto")).toBe("frango");
    expect(selectIllustration("Frango", "", "arroz")).toBe("arroz");
    expect(selectIllustration("Frango", "", "none")).toBe("none");
  });
});
