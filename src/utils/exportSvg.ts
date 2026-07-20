import { triggerDownload } from "./download";
import { embedSvgImages } from "./embedSvgImages";

/** Serializes a live SVG element into a standalone, self-contained XML string. */
export function serializeSvgElement(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("xmlns:xlink")) {
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }
  const serialized = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`;
}

/**
 * Downloads the label as a standalone SVG file. The template, logo and
 * illustration are referenced as local `<image>` files in the live preview,
 * so they're embedded as data URLs first — the downloaded file opens
 * correctly on its own, with no connection to the site required.
 */
export async function downloadSvg(svg: SVGSVGElement, filename: string): Promise<void> {
  const embedded = await embedSvgImages(svg);
  const svgString = serializeSvgElement(embedded);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}
