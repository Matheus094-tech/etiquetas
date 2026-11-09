import { describe, expect, it } from "vitest";
import { PNG_EXPORT_PRESETS } from "./exportPng";

describe("thermal PNG sizes", () => {
  it("derives 203, 300 and 600 DPI pixel sizes from the same 40x12mm label", () => {
    expect(PNG_EXPORT_PRESETS).toEqual([
      { dpi: 203, width: 320, height: 96 },
      { dpi: 300, width: 472, height: 142 },
      { dpi: 600, width: 945, height: 283 },
    ]);
  });
});
