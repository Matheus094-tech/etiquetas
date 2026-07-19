import { describe, expect, it } from "vitest";
import type { LabelData } from "../label/label.types";
import { createFilename } from "./createFilename";

const baseData: LabelData = {
  name: "Patinho",
  description: "moído",
  weight: "690",
  illustration: "auto",
};

describe("createFilename", () => {
  it("builds a slugified filename with the requested extension", () => {
    expect(createFilename(baseData, "png")).toBe("etiqueta-patinho-moido-690g.png");
  });

  it("supports the svg extension", () => {
    expect(createFilename(baseData, "svg")).toBe("etiqueta-patinho-moido-690g.svg");
  });

  it("omits the description segment when it is empty", () => {
    const data: LabelData = { ...baseData, description: "" };
    expect(createFilename(data, "png")).toBe("etiqueta-patinho-690g.png");
  });

  it("replaces slashes in the name instead of producing extra path segments", () => {
    const data: LabelData = { ...baseData, name: "Batata/Patinho", description: "", weight: "560" };
    expect(createFilename(data, "png")).toBe("etiqueta-batata-patinho-560g.png");
  });

  it("removes accents from the name and description", () => {
    const data: LabelData = { ...baseData, name: "Feijão", description: "cozido" };
    expect(createFilename(data, "png")).toBe("etiqueta-feijao-cozido-690g.png");
  });

  it("falls back to a generic base name when every field is empty", () => {
    const data: LabelData = { name: "", description: "", weight: "", illustration: "auto" };
    expect(createFilename(data, "png")).toBe("etiqueta.png");
  });
});
