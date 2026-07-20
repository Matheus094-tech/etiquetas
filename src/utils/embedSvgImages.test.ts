import { afterEach, describe, expect, it, vi } from "vitest";
import { embedSvgImages } from "./embedSvgImages";

function parseSvg(markup: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  return doc.documentElement as unknown as SVGSVGElement;
}

describe("embedSvgImages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("replaces local image hrefs with data URLs, fetching each unique href only once", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob([`fake-bytes-for-${url}`], { type: "image/png" })),
      } as unknown as Response)
    );
    vi.stubGlobal("fetch", fetchMock);

    const svg = parseSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 600">
        <image href="/assets/template/etiqueta-base-40x12mm.png" />
        <image href="/assets/brand/logo-ms.png" />
        <image href="/assets/brand/logo-ms.png" />
      </svg>
    `);

    const embedded = await embedSvgImages(svg);
    const hrefs = Array.from(embedded.querySelectorAll("image")).map((image) => image.getAttribute("href"));

    expect(hrefs).toHaveLength(3);
    for (const href of hrefs) {
      expect(href).toMatch(/^data:/);
    }
    // the repeated logo href is only fetched once
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(embedded).not.toBe(svg);
  });

  it("leaves hrefs that are already data URLs untouched", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const svg = parseSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 600">
        <image href="data:image/png;base64,AAAA" />
      </svg>
    `);

    const embedded = await embedSvgImages(svg);
    const href = embedded.querySelector("image")?.getAttribute("href");

    expect(href).toBe("data:image/png;base64,AAAA");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
